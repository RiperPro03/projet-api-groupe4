import type { Post } from "@/types/post";
import type { PostPage, PostPageParams } from "@/hooks/usePostList";

const authors = {
  user1: {
    id: "user-1",
    name: "Amina Diallo",
    username: "amina",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces",
  },
  user2: {
    id: "user-2",
    name: "Noah Martin",
    username: "noahm",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces",
  },
  user3: {
    id: "user-3",
    name: "Lina Chen",
    username: "linac",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces",
  },
};

export const mockPosts: Post[] = [
  {
    id: "post-1",
    author: authors.user1,
    content: "On vient de publier une nouvelle maquette pour Breezyl. Vos retours sont bienvenus https://breezyl.dev",
    media: [
      {
        id: "media-1",
        type: "image",
        url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=800&fit=crop",
        alt: "Interface d'application ouverte sur un ordinateur portable",
      },
    ],
    likesCount: 128,
    commentsCount: 4,
    createdAt: "2026-06-15T08:30:00.000Z",
  },
  {
    id: "post-2",
    author: authors.user2,
    content: "Petit rappel: un bon fil social commence par des composants simples, testables et faciles a remplacer par de vrais services.",
    media: [],
    likesCount: 73,
    commentsCount: 2,
    createdAt: "2026-06-14T18:15:00.000Z",
  },
  {
    id: "post-3",
    author: authors.user3,
    content: "Deux variations visuelles pour les cards, laquelle garde le mieux le rythme du feed ?",
    media: [
      {
        id: "media-2",
        type: "image",
        url: "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=900&h=900&fit=crop",
        alt: "Tableau de design UI avec palettes et wireframes",
      },
      {
        id: "media-3",
        type: "image",
        url: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=900&h=900&fit=crop",
        alt: "Ecran de conception d'interface utilisateur",
      },
    ],
    likesCount: 95,
    commentsCount: 3,
    createdAt: "2026-06-13T11:40:00.000Z",
  },
];

const newMockPosts: Post[] = [
  {
    id: "post-4",
    author: authors.user2,
    content: "Nouveau test de refresh: ce post doit apparaitre en haut sans ecraser le feed existant.",
    media: [],
    likesCount: 12,
    commentsCount: 0,
    createdAt: "2026-06-15T10:10:00.000Z",
  },
];

const generatedMockPosts: Post[] = Array.from({ length: 24 }, (_, index) => {
  const authorList = [authors.user1, authors.user2, authors.user3];
  const postNumber = index + 5;
  const createdAt = new Date(Date.UTC(2026, 5, 12, 20 - index, 30, 0));

  return {
    id: `post-${postNumber}`,
    author: authorList[index % authorList.length],
    content: `Post de test numero ${postNumber}. Il sert a verifier le chargement progressif du feed par petits lots.`,
    media: [],
    likesCount: 20 + index,
    commentsCount: index % 4,
    createdAt: createdAt.toISOString(),
  };
});

const allMockPosts = [...mockPosts, ...generatedMockPosts].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);

const allMockPostsWithNewItems = [...newMockPosts, ...allMockPosts].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);

const delay = async <T>(data: T, ms = 250): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(data), ms);
  });

function paginatePosts(posts: Post[], { limit, cursor }: PostPageParams): PostPage {
  const startIndex = cursor
    ? posts.findIndex((post) => post.id === cursor) + 1
    : 0;
  const safeStartIndex = startIndex > 0 ? startIndex : 0;
  const items = posts.slice(safeStartIndex, safeStartIndex + limit);
  const lastItem = items.at(-1);
  const nextCursor = lastItem?.id ?? null;
  const hasMore = safeStartIndex + items.length < posts.length;

  return {
    items,
    nextCursor: hasMore ? nextCursor : null,
    hasMore,
  };
}

export async function fetchMockFollowedUsersPosts(
  params: PostPageParams
): Promise<PostPage> {
  return delay(paginatePosts(allMockPosts, params));
}

export async function fetchMockFollowedUsersPostsWithNewItems(
  params: PostPageParams
): Promise<PostPage> {
  return delay(paginatePosts(allMockPostsWithNewItems, params));
}

export async function fetchMockUserPosts(
  userId: string,
  params: PostPageParams
): Promise<PostPage> {
  return delay(
    paginatePosts(
      allMockPosts.filter((post) => post.author.id === userId),
      params
    )
  );
}

export async function fetchMockPostById(postId: string): Promise<Post | null> {
  return delay(
    allMockPostsWithNewItems.find((post) => post.id === postId) ?? null
  );
}
