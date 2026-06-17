Crée les composants front pour afficher des posts et commentaires dans mon projet Next.js App Router + TypeScript + Mantine.

Contexte important :

* Il y a 2 services différents :

  * `post-service` pour les posts ;
  * `comment-service` pour les commentaires.
* En BDD, il y a une collection `post` et une collection `comment`.
* Un commentaire contient au minimum `id_post`.
* Un commentaire peut répondre :

  * directement à un post ;
  * ou à un autre commentaire.
* Donc prévoir dans le type `Comment` un champ optionnel `parentCommentId`.
* Si `parentCommentId` est vide/null, le commentaire est sous le post.
* Si `parentCommentId` existe, le commentaire est une réponse à un autre commentaire.
* Côté UI, un post et un commentaire se ressemblent beaucoup, donc créer un composant de rendu réutilisable.

Objectif :

* Design réseau social moderne type Twitter/X ou Instagram.
* Données simulées avec mocks pour l’instant.
* Ne pas utiliser `dangerouslySetInnerHTML`.
* Ne pas utiliser `createContext/useContext` pour cette version.
* Utiliser `AnimatedList` pour animer l’arrivée des nouveaux posts/commentaires :

```ts
import { AnimatedList } from "@/components/ui/animated-list";
```

Structure à créer :

```txt
src/
├── components/
│   ├── feed/
│   │   ├── FeedList.tsx
│   │   └── ContentCard.tsx
│   ├── posts/
│   │   ├── PostList.tsx
│   │   └── PostDetail.tsx
│   ├── comments/
│   │   ├── CommentList.tsx
│   │   ├── CommentThread.tsx
│   │   └── CommentComposer.tsx
│   └── profile/
│       └── ProfileActivityTabs.tsx
├── hooks/
│   ├── usePostList.ts
│   └── useCommentList.ts
├── lib/
│   ├── mock-posts.ts
│   └── mock-comments.ts
└── types/
    ├── post.ts
    └── comment.ts
```

Créer `src/types/post.ts` :

```ts
export type Author = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
};

export type MediaType = "image" | "video";

export type Media = {
  id: string;
  type: MediaType;
  url: string;
  alt?: string;
};

export type Post = {
  id: string;
  author: Author;
  content: string;
  media: Media[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
};
```

Créer `src/types/comment.ts` :

```ts
import type { Author, Media } from "./post";

export type Comment = {
  id: string;
  id_post: string;
  parentCommentId?: string | null;
  author: Author;
  content: string;
  media: Media[];
  likesCount: number;
  repliesCount: number;
  createdAt: string;
};
```

les count seront à alimenté plus tard au donnée à partir des service et commentsCount, repliesCount sera à faire un count dessus pour avoir la donnée

Créer un composant générique `ContentCard.tsx` utilisé par les posts et les commentaires.

Props attendues :

```ts
type ContentCardProps = {
  type: "post" | "comment";
  author: Author;
  content: string;
  media?: Media[];
  createdAt: string;
  likesCount: number;
  commentsCount?: number;
  repliesCount?: number;
  sharesCount?: number;
  isReply?: boolean;
};
```

`ContentCard` doit afficher :

* avatar ;
* nom ;
* username ;
* date ;
* texte ;
* liens cliquables sécurisés ;
* images/vidéos ;
* actions like/commentaire/partage ;
* design proche Twitter/X ou Instagram ;
* responsive.

Créer une logique `LinkifiedText` :

* détecte les URLs ;
* transforme les URLs en `<Anchor>` Mantine ;
* ajoute :

```tsx
target="_blank"
rel="noopener noreferrer nofollow ugc"
```

Créer une logique `MediaGrid` :

* 1 média = pleine largeur ;
* plusieurs médias = grille 2 colonnes ;
* image avec Mantine `<Image>` ;
* vidéo avec `<video controls>`.

Créer `PostList.tsx` :

* affiche une liste de posts ;
* utilise `AnimatedList` ;
* reçoit :

  * `fetchPosts: () => Promise<Post[]>`;
  * `fetchUpdatedPosts?: () => Promise<Post[]>`;
* bouton “Recharger” pour simuler un nouvel appel API.
* Au refresh, comparer par `id` et ajouter uniquement les nouveaux posts en haut sans remplacer toute la liste.

Créer `CommentList.tsx` :

* affiche les commentaires d’un post ou d’un utilisateur ;
* reçoit :

  * `fetchComments: () => Promise<Comment[]>`;
* utilise `ContentCard` avec `type="comment"`.

Créer `CommentThread.tsx` :

* reçoit une liste de commentaires ;
* organise les commentaires par hiérarchie :

  * commentaires avec `parentCommentId = null` au premier niveau ;
  * réponses sous le commentaire parent ;
* afficher les réponses avec un léger décalage à gauche ;
* limiter la profondeur visuelle si nécessaire.

Créer les mocks :

* `fetchMockFollowedUsersPosts()`
* `fetchMockFollowedUsersPostsWithNewItems()`
* `fetchMockUserPosts(userId)`
* `fetchMockPostComments(postId)`
* `fetchMockUserComments(userId)`
* `fetchMockCommentReplies(commentId)`

Créer `ProfileActivityTabs.tsx` :

* onglet “Posts” : affiche les posts d’un utilisateur via `PostList`.
* onglet “Commentaires” : affiche les commentaires écrits par cet utilisateur via `CommentList`.

Exemples d’usage attendus :

Accueil :

```tsx
<PostList
  fetchPosts={fetchMockFollowedUsersPosts}
  fetchUpdatedPosts={fetchMockFollowedUsersPostsWithNewItems}
/>
```

Profil :

```tsx
<ProfileActivityTabs userId="user-1" />
```

Détail d’un post :

```tsx
<PostDetail postId="post-1" />
<CommentThread comments={comments} />
```

Contraintes :

* Code complet.
* TypeScript propre.
* Mantine pour le design.
* Compatible Next.js App Router.
* `"use client"` uniquement sur les composants interactifs.
* Pas de HTML injecté.
* Les mocks doivent être faciles à remplacer plus tard par Axios :

  * posts via `post-service`;
  * commentaires via `comment-service`.
