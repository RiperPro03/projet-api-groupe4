# Decoupage des fonctionnalites par services - Breezy

Ce document decrit le decoupage fonctionnel actuel du projet Breezy. Il remplace l'ancien decoupage previsionnel qui listait des services separes comme `feed-service`, `search-service`, `message-service` et `moderation-service`.

Documents lies:

- [architecture.md](architecture.md)
- [breezy_bdd_services.md](breezy_bdd_services.md)
- [api-index.md](api-index.md)

## 1. Vue globale

| Brique | Role principal | Fonctionnalites couvertes |
| --- | --- | --- |
| `frontend` | Interface utilisateur Next.js | Navigation, auth UI, feed, profils, admin, notifications, chat, theme, i18n |
| `api-gateway` | Point d'entree HTTP | Routage, auth, RBAC, aggregation, enrichissement |
| `auth-service` | Identite et tokens | Inscription, connexion, refresh, logout, verification JWT |
| `user-service` | Etat utilisateur et moderation | Roles, statuts, signalements |
| `profile-service` | Profils publics | Username, nickname, bio, avatar, recherche profils |
| `post-service` | Publications | Posts, tags, medias references, feed brut, soft delete |
| `interaction-service` | Interactions | Likes, commentaires, reponses, compteurs |
| `follow-service` | Graphe social | Follow, unfollow, followers, following |
| `media-service` | Uploads | URL presignees MinIO, metadata, suppression de fichiers |
| `notification-service` | Notifications | Mentions, likes, follows, lu/non lu |
| `chat-service` | Temps reel | Presence, messages prives Socket.IO |
| `nginx` | Entree publique | `/`, `/api`, `/chat/socket.io`, `/minio` |
| `nginx-internal` | Routage interne | Dispatch gateway -> services |

## 2. Fonctionnalites par domaine

| Fonctionnalite | Etat actuel | Service principal | Services associes |
| --- | --- | --- | --- |
| Creation de compte | Implemente | `auth-service` | `api-gateway`, `profile-service`, `user-service` |
| Connexion et session | Implemente | `auth-service` | `api-gateway`, `frontend` |
| Verification JWT | Implemente | `auth-service` | `api-gateway`, `chat-service` |
| Roles utilisateur | Implemente | `user-service` | `api-gateway` |
| Suspension utilisateur | Implemente via `statuts` | `user-service` | `api-gateway` |
| Profil public | Implemente | `profile-service` | `media-service` pour avatar |
| Recherche de profils | Implemente | `profile-service` | `frontend` |
| Creation de post | Implemente | `post-service` | `media-service`, `notification-service` pour mentions |
| Liste des posts d'un profil | Implemente | `post-service` | `api-gateway`, `profile-service`, `interaction-service` |
| Feed | Implemente sans service dedie | `api-gateway` | `follow-service`, `post-service`, `profile-service`, `interaction-service` |
| Tags | Implemente | `post-service` | `api-gateway` |
| Recherche par tag | Implemente | `post-service` | `frontend` |
| Upload image/video | Implemente | `media-service` | MinIO, `post-service`, `profile-service` |
| Likes de posts | Implemente | `interaction-service` | `notification-service` |
| Likes de commentaires | Implemente | `interaction-service` | `notification-service` |
| Commentaires | Implemente | `interaction-service` | `api-gateway`, `profile-service` |
| Reponses | Implemente comme commentaires enfants | `interaction-service` | `api-gateway` |
| Follow / unfollow | Implemente | `follow-service` | `notification-service` |
| Notifications | Implemente | `notification-service` | `frontend` |
| Signalements | Implemente | `user-service` | `api-gateway`, `frontend` admin |
| Chat prive | Implemente temps reel non persistant | `chat-service` | `frontend`, `auth-service` |
| Multi-langues | Implemente cote frontend | `frontend` | dictionnaires locaux |
| Theme | Implemente cote frontend | `frontend` | UI locale |

## 3. Detail par service

### 3.1 frontend

Dossier: `apps/frontend`

Responsabilites:

- pages de login/register;
- shell applicatif et navigation;
- feed, posts, commentaires;
- profils publics et edition du profil;
- admin users/reports;
- notifications;
- chat;
- i18n cote interface;
- theme cote interface;
- appels API via `/api`.

Le frontend ne contacte pas directement les microservices. Il passe par l'API gateway via `NEXT_PUBLIC_API_URL`, avec `/api` par defaut.

### 3.2 api-gateway

Dossier: `apps/api-gateway`

Responsabilites:

- exposer l'API publique;
- verifier le token avec `auth-service`;
- lire le role courant avec `user-service`;
- appliquer les regles RBAC;
- verifier l'ownership sur les routes sensibles;
- forwarder vers les services;
- agreger les donnees pour `/me`, les posts et les commentaires;
- coordonner l'inscription complete.

Routes principales:

| Route publique | Domaine |
| --- | --- |
| `/auth/*` | Authentification |
| `/me` | Utilisateur courant agrege |
| `/users/*` | Etat utilisateur, signalements |
| `/profiles/*` | Profils |
| `/posts/*` | Posts, feed, tags |
| `/posts/likes/*` | Likes de posts |
| `/comments/*` | Commentaires |
| `/comments/likes/*` | Likes de commentaires |
| `/follows/*` | Follows |
| `/media/*` | Medias |
| `/notifications/*` | Notifications |

### 3.3 auth-service

Dossier: `services/auth-service`

Responsabilites:

- creer un utilisateur auth avec email et mot de passe hashe;
- connecter un utilisateur;
- generer access token et refresh token;
- stocker les refresh tokens hashes;
- verifier un access token;
- rafraichir une session;
- revoquer un refresh token;
- changer un mot de passe.

Fonctionnalites couvertes:

- inscription;
- connexion;
- securite de session;
- verification d'identite pour la gateway et le chat.

Ce service ne gere pas le profil public ni le role applicatif.

### 3.4 user-service

Dossier: `services/user-service`

Responsabilites:

- stocker `role` et `statuts` pour chaque utilisateur;
- fournir le role courant a la gateway;
- lister les utilisateurs par role;
- mettre a jour role/statut;
- stocker et exposer les signalements de contenu.

Fonctionnalites couvertes:

- moderation utilisateur;
- suspension via `statuts = INACTIVE`;
- signalement de posts, commentaires ou utilisateurs.

Ce service ne gere pas le profil public complet. Cette responsabilite est portee par `profile-service`.

### 3.5 profile-service

Dossier: `services/profile-service`

Responsabilites:

- creer un profil public apres inscription;
- lire un profil par `id_user`;
- lire un profil par `username`;
- rechercher des profils par username;
- modifier username, nickname, bio, avatar;
- supprimer un profil.

Fonctionnalites couvertes:

- profil utilisateur;
- recherche utilisateur;
- affichage des auteurs dans le feed et les commentaires.

### 3.6 post-service

Dossier: `services/post-service`

Responsabilites:

- creer un post;
- valider un contenu de 280 caracteres maximum;
- stocker les tags;
- extraire/fusionner les hashtags;
- stocker les references de medias;
- lister les posts d'un auteur;
- lister tous les posts;
- lister les posts d'une liste d'auteurs pour le feed;
- rechercher par tag;
- lire un post par id;
- modifier un post;
- soft delete un post;
- demander le nettoyage des interactions du post supprime.

Fonctionnalites couvertes:

- publication;
- posts de profil;
- tags;
- recherche par tag;
- medias attaches aux posts;
- base du feed.

### 3.7 interaction-service

Dossier: `services/interaction-service`

Responsabilites:

- ajouter/retirer un like sur un post;
- compter les likes d'un post;
- lister les derniers likers;
- verifier le statut like d'un ou plusieurs posts;
- ajouter/retirer un like sur un commentaire;
- compter les likes d'un commentaire;
- verifier le statut like d'un ou plusieurs commentaires;
- creer un commentaire;
- creer une reponse via `parentCommentId`;
- lister les commentaires d'un post;
- lister les commentaires d'un auteur;
- lister les reponses d'un commentaire;
- soft delete un commentaire;
- nettoyer toutes les interactions d'un post.

Fonctionnalites couvertes:

- likes;
- commentaires;
- reponses;
- compteurs d'interaction.

Note: les routes `/replies/likes` sont declarees cote gateway mais ne disposent pas encore d'un handler specifique dans le service actuel. Les reponses sont traitees comme des commentaires enfants.

### 3.8 follow-service

Dossier: `services/follow-service`

Responsabilites:

- suivre un utilisateur;
- ne plus suivre un utilisateur;
- lister les utilisateurs suivis;
- lister les abonnes;
- interdire le self-follow;
- empecher les doublons;
- declencher une notification de follow.

Fonctionnalites couvertes:

- graphe social;
- source de donnees pour le feed.

### 3.9 media-service

Dossier: `services/media-service`

Responsabilites:

- valider les demandes d'upload;
- generer des URL presignees MinIO;
- stocker les metadonnees media;
- retourner les metadonnees d'un objet;
- supprimer le fichier MinIO et ses metadonnees.

Fonctionnalites couvertes:

- image de profil;
- medias de posts;
- medias de commentaires ou general, selon usage;
- exposition des fichiers via MinIO.

Flux:

```txt
frontend -> /api/media/presigned-url
media-service -> MinIO + media_db
frontend -> PUT direct uploadUrl
frontend -> reference publicUrl dans profil/post
```

### 3.10 notification-service

Dossier: `services/notification-service`

Responsabilites:

- creer une notification `like`, `mention` ou `follow`;
- lister les notifications par destinataire;
- compter les notifications non lues;
- marquer une notification comme lue;
- marquer toutes les notifications d'un destinataire comme lues;
- supprimer une notification.

Fonctionnalites couvertes:

- notifications de mentions;
- notifications de likes;
- notifications de nouveaux followers;
- inbox notification cote frontend.

### 3.11 chat-service

Dossier: `services/chat-service`

Responsabilites:

- verifier la session Socket.IO avec `auth-service`;
- maintenir la presence en memoire;
- emettre `presence:online` et `presence:offline`;
- envoyer des messages prives temps reel;
- retourner un ack d'envoi avec `delivered`.

Fonctionnalites couvertes:

- messagerie privee temps reel;
- statut en ligne.

Limite actuelle: les messages ne sont pas persistants cote serveur.

## 4. Services non dedies dans l'etat actuel

| Service prevu avant | Etat actuel | Raison |
| --- | --- | --- |
| `feed-service` | Remplace par l'aggregation gateway | Le feed combine follows, posts, profils et interactions sans stockage dedie. |
| `search-service` | Integre aux services existants | Tags dans `post-service`, profils dans `profile-service`. |
| `message-service` | Remplace par `chat-service` | Le chat est temps reel via Socket.IO, sans API REST message dediee. |
| `moderation-service` | Regroupe dans `user-service` + gateway | Signalements dans `user-service`, droits dans `api-gateway`. |

## 5. Flux fonctionnels importants

### 5.1 Inscription complete

```txt
POST /api/auth/register
  -> api-gateway
  -> auth-service cree le compte
  -> profile-service cree le profil public
  -> user-service cree role USER / statuts ACTIVE
```

### 5.2 Connexion

```txt
POST /api/auth/login
  -> auth-service verifie email/password
  -> api-gateway recupere l'etat utilisateur
  -> si statuts INACTIVE: refus 403
  -> sinon: tokens retournes au frontend
```

### 5.3 Feed

```txt
GET /api/posts/feed
  -> api-gateway lit userId courant
  -> follow-service retourne followingIds
  -> post-service retourne les posts de userId + followingIds
  -> profile-service enrichit les auteurs
  -> interaction-service ajoute likes/commentaires
```

### 5.4 Creation de post avec media

```txt
POST /api/media/presigned-url
  -> media-service cree objectKey + metadata
  -> frontend upload directement vers MinIO
POST /api/posts
  -> post-service stocke content, tags et references media
```

### 5.5 Like et notification

```txt
POST /api/posts/likes
  -> interaction-service cree le like
  -> interaction-service appelle notification-service
```

### 5.6 Follow et notification

```txt
POST /api/follows
  -> follow-service cree la relation
  -> follow-service appelle notification-service
```

### 5.7 Chat

```txt
Socket.IO /chat/socket.io
  -> chat-service verifie le token
  -> presence en memoire
  -> private-message envoye au destinataire s'il est connecte
```

## 6. Priorites de maintenance

| Priorite | Sujet | Pourquoi |
| --- | --- | --- |
| 1 | Garder `api-*.md` alignes avec les routes | Eviter les contrats front/back faux |
| 2 | Harmoniser les formats de reponse | Certains services retournent `status/data`, d'autres `{ error }` ou tableaux directs |
| 3 | Nettoyer les restes historiques | Exemple: script racine `dev:feed` |
| 4 | Renforcer l'ownership notifications | Eviter qu'un utilisateur lise les notifications d'un autre via `recipientId` |
| 5 | Persister le chat si necessaire | Le chat actuel est temps reel mais non durable |
| 6 | Ajouter Redis si chat replique | Presence Socket.IO en memoire incompatible avec plusieurs replicas |

## 7. Repartition possible du travail

| Axe | Services concernes | Exemples de taches |
| --- | --- | --- |
| Auth et securite | `auth-service`, `api-gateway`, `user-service` | JWT, refresh, RBAC, statut compte |
| Profils et utilisateurs | `profile-service`, `user-service`, `frontend` | Profil, recherche, admin users |
| Contenu | `post-service`, `media-service`, `frontend` | Posts, tags, upload, detail post |
| Social | `follow-service`, `interaction-service` | Follows, likes, commentaires |
| Notifications | `notification-service`, services emetteurs | Mentions, likes, follows, inbox |
| Chat | `chat-service`, `frontend` | Presence, messages, UX conversations |
| Infra | Nginx, Docker, CI/CD | Routage, replicas, TLS, env |

## 8. Synthese

Le decoupage actuel est plus concret que le decoupage initial:

- `auth-service` gere l'identite;
- `user-service` gere roles, statuts et signalements;
- `profile-service` gere les profils publics;
- `post-service` gere les posts et la recherche par tag;
- `interaction-service` gere likes/commentaires/reponses;
- `follow-service` gere le graphe social;
- `media-service` gere MinIO;
- `notification-service` gere les notifications;
- `chat-service` gere la messagerie temps reel;
- `api-gateway` assemble le feed, l'utilisateur courant et les vues enrichies.

