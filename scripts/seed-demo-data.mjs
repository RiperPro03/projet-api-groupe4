import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const requireFromAuthService = createRequire(
  path.join(rootDir, "services/auth-service/package.json"),
);

const bcrypt = requireFromAuthService("bcrypt");
const { Pool } = requireFromAuthService("pg");

const seedFile = path.resolve(
  rootDir,
  process.env.SEED_DATA_FILE ?? "demo-seed-data.json",
);
const apiBaseUrl = trimTrailingSlash(
  process.env.SEED_API_URL ?? "http://localhost:8080/api",
);
const authDatabaseUrl =
  process.env.AUTH_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://auth_user:auth_password@localhost:5433/auth_db?schema=public";
const userDatabaseUrl =
  process.env.USER_DATABASE_URL ??
  "postgresql://user_user:user_password@localhost:5434/user_db?schema=public";
const saltRounds = Number.parseInt(process.env.SEED_SALT_ROUNDS ?? "10", 10);

const authPool = new Pool({ connectionString: authDatabaseUrl });
const userPool = new Pool({ connectionString: userDatabaseUrl });

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function assertString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  return value.trim();
}

function assertRole(value, userKey) {
  if (!["ADMIN", "MODERATOR", "USER"].includes(value)) {
    throw new Error(`Invalid role for user ${userKey}: ${value}`);
  }

  return value;
}

function uniqueByKey(items, entityName) {
  const map = new Map();

  for (const item of items ?? []) {
    const key = assertString(item.key, `${entityName}.key`);
    if (map.has(key)) {
      throw new Error(`Duplicate ${entityName} key: ${key}`);
    }
    map.set(key, item);
  }

  return map;
}

async function loadSeedData() {
  const raw = await readFile(seedFile, "utf8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data.users) || data.users.length === 0) {
    throw new Error("demo-seed-data.json must contain at least one user");
  }

  return data;
}

async function getErrorMessage(response) {
  const fallback = `${response.status} ${response.statusText}`.trim();

  try {
    const payload = await response.json();
    return typeof payload.message === "string" ? payload.message : fallback;
  } catch {
    return fallback;
  }
}

async function requestJson(pathname, options = {}) {
  const response = await fetch(`${apiBaseUrl}${pathname}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `${options.method ?? "GET"} ${pathname} failed: ${await getErrorMessage(response)}`,
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function upsertAuthUser(user, defaultPassword) {
  const key = assertString(user.key, "user.key");
  const email = assertString(user.email, `user ${key}.email`).toLowerCase();
  const role = assertRole(user.role ?? "USER", key);
  const password = user.password ?? defaultPassword;

  if (typeof password !== "string" || password.length === 0) {
    throw new Error(`Password missing for user ${key}`);
  }

  const passwordHash = await bcrypt.hash(password, saltRounds);
  const result = await authPool.query(
    `
    INSERT INTO users (id, email, "passwordHash", "updatedAt")
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (email)
    DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "updatedAt" = NOW()
    RETURNING id, email
    `,
    [randomUUID(), email, passwordHash],
  );
  const savedUser = result.rows[0];

  await authPool.query(
    `
    UPDATE refresh_tokens
    SET "revokedAt" = NOW()
    WHERE "userId" = $1 AND "revokedAt" IS NULL
    `,
    [savedUser.id],
  );

  await userPool.query(
    `
    INSERT INTO users_state (id_user, role, statuts)
    VALUES ($1, $2::"Role", 'ACTIVE'::"Statuts")
    ON CONFLICT (id_user)
    DO UPDATE SET role = EXCLUDED.role, statuts = EXCLUDED.statuts
    `,
    [savedUser.id, role],
  );

  return {
    key,
    id: savedUser.id,
    email: savedUser.email,
    password,
    role,
    profile: user.profile ?? {},
  };
}

async function loginUser(user) {
  const payload = await requestJson("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: user.email,
      password: user.password,
    }),
  });
  const accessToken = payload?.data?.accessToken;

  if (typeof accessToken !== "string" || accessToken.trim() === "") {
    throw new Error(`Login response missing access token for ${user.email}`);
  }

  return accessToken;
}

function authHeaders(user) {
  return { Authorization: `Bearer ${user.accessToken}` };
}

async function upsertProfile(user) {
  const profile = user.profile ?? {};
  const username = assertString(profile.username, `profile ${user.key}.username`);
  const body = {
    username,
    nickname: profile.nickname ?? "",
    bio: profile.bio ?? profile.bibliography ?? "",
    url_photo: profile.url_photo ?? "",
  };

  const updateResponse = await fetch(
    `${apiBaseUrl}/profiles/${encodeURIComponent(user.id)}`,
    {
      method: "PUT",
      headers: {
        ...authHeaders(user),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (updateResponse.ok) {
    return;
  }

  if (updateResponse.status !== 404) {
    throw new Error(
      `Profile update failed for ${user.email}: ${await getErrorMessage(updateResponse)}`,
    );
  }

  await requestJson("/profiles", {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify({
      id_user: user.id,
      ...body,
    }),
  });
}

function withDemoTags(post) {
  const key = assertString(post.key, "post.key");
  const tags = Array.isArray(post.tags) ? post.tags : [];
  return Array.from(new Set(["demo-seed", `demo:${key}`, ...tags]));
}

async function findExistingPost(author, post) {
  const payload = await requestJson(
    `/posts?authorId=${encodeURIComponent(author.id)}&limit=50`,
    {
      headers: authHeaders(author),
    },
  );
  const marker = `demo:${post.key}`;
  const posts = payload?.data?.posts ?? [];

  return posts.find(
    (candidate) =>
      Array.isArray(candidate.tags) && candidate.tags.includes(marker),
  );
}

async function upsertPost(post, usersByKey) {
  const authorKey = assertString(post.author, `post ${post.key}.author`);
  const author = usersByKey.get(authorKey);

  if (!author) {
    throw new Error(`Unknown post author key: ${authorKey}`);
  }

  const body = {
    authorId: author.id,
    content: assertString(post.content, `post ${post.key}.content`),
    tags: withDemoTags(post),
    media: Array.isArray(post.media) ? post.media : [],
  };
  const existingPost = await findExistingPost(author, post);

  if (existingPost?.id) {
    const payload = await requestJson(`/posts/${encodeURIComponent(existingPost.id)}`, {
      method: "PATCH",
      headers: authHeaders(author),
      body: JSON.stringify(body),
    });

    return payload?.data?.post ?? existingPost;
  }

  const payload = await requestJson("/posts", {
    method: "POST",
    headers: authHeaders(author),
    body: JSON.stringify(body),
  });

  return payload?.data?.post;
}

async function hasPostLike(user, postId) {
  const payload = await requestJson(
    `/posts/likes/status?userId=${encodeURIComponent(user.id)}&postId=${encodeURIComponent(postId)}`,
    { headers: authHeaders(user) },
  );

  return payload?.isLiked === true;
}

async function createPostLike(like, usersByKey, postsByKey) {
  const user = usersByKey.get(assertString(like.user, "postLike.user"));
  const post = postsByKey.get(assertString(like.post, "postLike.post"));

  if (!user || !post?.id) {
    throw new Error(`Invalid post like: ${JSON.stringify(like)}`);
  }

  if (await hasPostLike(user, post.id)) {
    return;
  }

  await requestJson("/posts/likes", {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify({
      userId: user.id,
      postId: post.id,
    }),
  });
}

async function listCommentsForPost(viewer, postId) {
  const payload = await requestJson(
    `/comments?postId=${encodeURIComponent(postId)}`,
    { headers: authHeaders(viewer) },
  );

  return payload?.data?.comments ?? [];
}

function findExistingComment(comments, authorId, content, parentCommentId) {
  return comments.find(
    (comment) =>
      comment.authorId === authorId &&
      comment.content === content &&
      (comment.parentCommentId ?? null) === (parentCommentId ?? null),
  );
}

async function upsertComment(comment, usersByKey, postsByKey, commentsByKey) {
  const author = usersByKey.get(assertString(comment.author, "comment.author"));
  const post = postsByKey.get(assertString(comment.post, "comment.post"));

  if (!author || !post?.id) {
    throw new Error(`Invalid comment: ${JSON.stringify(comment)}`);
  }

  const parentCommentId = comment.parent
    ? commentsByKey.get(comment.parent)?.id
    : null;

  if (comment.parent && !parentCommentId) {
    throw new Error(`Unknown parent comment key: ${comment.parent}`);
  }

  const content = assertString(comment.content, `comment ${comment.key}.content`);
  const existingComments = await listCommentsForPost(author, post.id);
  const existingComment = findExistingComment(
    existingComments,
    author.id,
    content,
    parentCommentId,
  );

  if (existingComment?.id) {
    return existingComment;
  }

  const payload = await requestJson("/comments", {
    method: "POST",
    headers: authHeaders(author),
    body: JSON.stringify({
      postId: post.id,
      authorId: author.id,
      content,
      parentCommentId,
    }),
  });

  return payload?.data?.comment;
}

async function hasCommentLike(user, commentId) {
  const payload = await requestJson(
    `/comments/likes/status?userId=${encodeURIComponent(user.id)}&commentId=${encodeURIComponent(commentId)}`,
    { headers: authHeaders(user) },
  );

  return payload?.isLiked === true;
}

async function createCommentLike(like, usersByKey, commentsByKey) {
  const user = usersByKey.get(assertString(like.user, "commentLike.user"));
  const comment = commentsByKey.get(assertString(like.comment, "commentLike.comment"));

  if (!user || !comment?.id || !comment?.postId) {
    throw new Error(`Invalid comment like: ${JSON.stringify(like)}`);
  }

  if (await hasCommentLike(user, comment.id)) {
    return;
  }

  await requestJson("/comments/likes", {
    method: "POST",
    headers: authHeaders(user),
    body: JSON.stringify({
      userId: user.id,
      commentId: comment.id,
      postId: comment.postId,
    }),
  });
}

async function main() {
  const data = await loadSeedData();
  const usersByKey = new Map();
  const postsByKey = new Map();
  const commentsByKey = new Map();

  uniqueByKey(data.users, "user");
  uniqueByKey(data.posts ?? [], "post");
  uniqueByKey(data.interactions?.comments ?? [], "comment");

  for (const userData of data.users) {
    const user = await upsertAuthUser(userData, data.defaultPassword);
    user.accessToken = await loginUser(user);
    await upsertProfile(user);
    usersByKey.set(user.key, user);
  }

  for (const postData of data.posts ?? []) {
    const post = await upsertPost(postData, usersByKey);
    postsByKey.set(postData.key, post);
  }

  for (const like of data.interactions?.postLikes ?? []) {
    await createPostLike(like, usersByKey, postsByKey);
  }

  for (const commentData of data.interactions?.comments ?? []) {
    const comment = await upsertComment(
      commentData,
      usersByKey,
      postsByKey,
      commentsByKey,
    );
    commentsByKey.set(commentData.key, comment);
  }

  for (const like of data.interactions?.commentLikes ?? []) {
    await createCommentLike(like, usersByKey, commentsByKey);
  }

  console.log("Demo seed completed:");
  console.log(`- users: ${usersByKey.size}`);
  console.log(`- posts: ${postsByKey.size}`);
  console.log(`- comments: ${commentsByKey.size}`);
  console.log(`- data file: ${path.relative(rootDir, seedFile)}`);
}

main()
  .catch((error) => {
    console.error("Demo seed failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([authPool.end(), userPool.end()]);
  });
