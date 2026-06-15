import type { Comment } from "@/types/comment";

export const mockComments: Comment[] = [
  {
    id: "comment-1",
    id_post: "post-1",
    parentCommentId: null,
    author: {
      id: "user-2",
      name: "Noah Martin",
      username: "noahm",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=faces",
    },
    content: "Le spacing est beaucoup plus lisible. Vous prevoyez aussi une version mobile ?",
    media: [],
    likesCount: 19,
    repliesCount: 2,
    createdAt: "2026-06-15T09:00:00.000Z",
  },
  {
    id: "comment-2",
    id_post: "post-1",
    parentCommentId: "comment-1",
    author: {
      id: "user-1",
      name: "Amina Diallo",
      username: "amina",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces",
    },
    content: "Oui, le responsive est dans la prochaine passe.",
    media: [],
    likesCount: 8,
    repliesCount: 1,
    createdAt: "2026-06-15T09:05:00.000Z",
  },
  {
    id: "comment-3",
    id_post: "post-1",
    parentCommentId: "comment-2",
    author: {
      id: "user-3",
      name: "Lina Chen",
      username: "linac",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces",
    },
    content: "Je peux aider a verifier les breakpoints.",
    media: [],
    likesCount: 5,
    repliesCount: 0,
    createdAt: "2026-06-15T09:09:00.000Z",
  },
  {
    id: "comment-4",
    id_post: "post-1",
    parentCommentId: null,
    author: {
      id: "user-3",
      name: "Lina Chen",
      username: "linac",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces",
    },
    content: "J'aime bien le parti pris proche feed social. Lien utile: https://mantine.dev",
    media: [],
    likesCount: 23,
    repliesCount: 0,
    createdAt: "2026-06-15T09:25:00.000Z",
  },
  {
    id: "comment-5",
    id_post: "post-2",
    parentCommentId: null,
    author: {
      id: "user-1",
      name: "Amina Diallo",
      username: "amina",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&h=160&fit=crop&crop=faces",
    },
    content: "Exactement, les mocks gardent la meme signature que les futurs appels Axios.",
    media: [],
    likesCount: 11,
    repliesCount: 0,
    createdAt: "2026-06-14T18:32:00.000Z",
  },
];

const delay = async <T>(data: T, ms = 250): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(data), ms);
  });

export async function fetchMockPostComments(postId: string): Promise<Comment[]> {
  return delay(mockComments.filter((comment) => comment.id_post === postId));
}

export async function fetchMockUserComments(userId: string): Promise<Comment[]> {
  return delay(mockComments.filter((comment) => comment.author.id === userId));
}

export async function fetchMockCommentReplies(
  commentId: string
): Promise<Comment[]> {
  return delay(
    mockComments.filter((comment) => comment.parentCommentId === commentId)
  );
}
