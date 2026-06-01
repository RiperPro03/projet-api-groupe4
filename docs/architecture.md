# Architecture du projet Breezy

## 1. Présentation générale

Breezy est une application de réseau social léger inspirée de Twitter/X.
L’objectif est de permettre aux utilisateurs de créer un compte, publier des messages courts, interagir avec d’autres utilisateurs, suivre des profils et consulter un fil d’actualité chronologique.

Le projet est organisé selon une architecture en microservices afin de séparer les responsabilités métier et faciliter le travail en équipe. Chaque service possède un rôle précis et communique avec les autres services via des API REST.

L’application repose sur un monorepo contenant le front-end, l’API Gateway, les microservices, les packages partagés, la documentation et l’infrastructure Docker.

---

## 2. Objectifs de l’architecture

L’architecture choisie doit permettre de :

* séparer clairement les responsabilités entre les services ;
* faciliter le développement en équipe sur un seul dépôt Git ;
* rendre le projet plus maintenable ;
* permettre une évolution progressive vers de nouvelles fonctionnalités ;
* simplifier le déploiement avec Docker ;
* centraliser les appels du front-end via une API Gateway ;
* sécuriser les échanges avec une authentification JWT.

---

## 3. Vue globale de l’architecture

Le front-end communique uniquement avec l’API Gateway.
L’API Gateway reçoit les requêtes HTTP, vérifie si nécessaire le JWT, puis redirige la requête vers le microservice concerné.

Schéma logique :

```txt
Utilisateur
    |
    v
Frontend React / Next.js
    |
    v
API Gateway
    |
    +--> Auth Service
    +--> User Service
    +--> Post Service
    +--> Follow Service
    +--> Feed Service
```

Chaque microservice possède sa propre logique métier.
Selon les besoins du projet, chaque service peut également posséder sa propre base de données.

---

## 4. Organisation du monorepo

Le projet est organisé de la manière suivante :

```txt
breezy/
│
├── apps/
│   ├── frontend/
│   └── api-gateway/
│
├── services/
│   ├── auth-service/
│   ├── user-service/
│   ├── post-service/
│   ├── follow-service/
│   └── feed-service/
│
├── packages/
│   ├── shared-types/
│   ├── shared-utils/
│   └── shared-config/
│
├── infra/
│   ├── docker/
│   ├── nginx/
│   └── databases/
│
├── docs/
│   ├── architecture.md
│   ├── api-routes.md
│   ├── database.md
│   ├── git-workflow.md
│   └── conventions.md
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

---

## 5. Rôle des dossiers principaux

### 5.1 apps/

Le dossier `apps/` contient les applications principales du projet.

```txt
apps/
├── frontend/
└── api-gateway/
```

### frontend/

Le dossier `frontend/` contient l’interface utilisateur de l’application.

Technologies prévues :

* React.js ;
* Next.js ;
* Tailwind CSS ;
* Axios ;
* stockage du JWT côté client ;
* interface responsive et mobile-first.

Le front-end ne communique pas directement avec les microservices.
Toutes les requêtes passent par l’API Gateway.

### api-gateway/

Le dossier `api-gateway/` contient le point d’entrée unique de l’API.

Son rôle est de :

* recevoir les requêtes du front-end ;
* rediriger les requêtes vers le bon microservice ;
* gérer les middlewares communs ;
* vérifier le JWT sur les routes protégées ;
* centraliser la gestion CORS ;
* gérer certaines erreurs globales ;
* limiter l’exposition directe des microservices.

Exemple de routage :

```txt
/api/auth      -> auth-service
/api/users     -> user-service
/api/posts     -> post-service
/api/follows   -> follow-service
/api/feed      -> feed-service
```

---

## 6. Rôle des microservices

### 6.1 Auth Service

Le `auth-service` gère l’authentification et la sécurité des comptes.

Responsabilités principales :

* création de compte ;
* connexion ;
* génération des JWT ;
* validation des identifiants ;
* vérification du mot de passe ;
* gestion éventuelle du refresh token ;
* validation du compte utilisateur.

Fonctionnalités liées :

* Fx1 : création de comptes utilisateurs ;
* Fx2 : authentification sécurisée.

Routes possibles :

```txt
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
```

---

### 6.2 User Service

Le `user-service` gère les informations de base des utilisateurs et leur profil public.

Responsabilités principales :

* récupération des informations utilisateur ;
* modification du profil ;
* gestion du nom, de la biographie et de la photo de profil ;
* affichage du profil utilisateur ;
* liste des messages publiés par un utilisateur, en coordination avec le post-service.

Fonctionnalités liées :

* Fx10 : profil utilisateur avec informations de base ;
* Fx11 : liste des messages publiés par l’utilisateur sur le profil.

Routes possibles :

```txt
GET    /users/:id
PATCH  /users/:id
GET    /users/:id/profile
```

---

### 6.3 Post Service

Le `post-service` gère les publications, les commentaires et les likes.

Responsabilités principales :

* création de posts courts ;
* modification et suppression de posts ;
* affichage des posts d’un utilisateur ;
* ajout de commentaires ;
* réponse à un commentaire ;
* ajout et retrait de likes.

Fonctionnalités liées :

* Fx3 : publication de messages courts ;
* Fx4 : affichage des messages sur le profil ;
* Fx6 : liker un post ;
* Fx7 : répondre à un post sous forme de commentaire ;
* Fx8 : répondre à un commentaire sur un post.

Routes possibles :

```txt
POST   /posts
GET    /posts/:id
PATCH  /posts/:id
DELETE /posts/:id

POST   /posts/:id/likes
DELETE /posts/:id/likes

POST   /posts/:id/comments
POST   /comments/:id/replies
```

---

### 6.4 Follow Service

Le `follow-service` gère les relations d’abonnement entre utilisateurs.

Responsabilités principales :

* suivre un utilisateur ;
* ne plus suivre un utilisateur ;
* afficher les abonnements ;
* afficher les abonnés ;
* fournir les utilisateurs suivis au feed-service.

Fonctionnalités liées :

* Fx9 : suivre ou être suivi par d’autres utilisateurs.

Routes possibles :

```txt
POST   /follows/:userId
DELETE /follows/:userId
GET    /follows/:userId/followers
GET    /follows/:userId/following
```

---

### 6.5 Feed Service

Le `feed-service` gère le fil d’actualité de l’utilisateur.

Responsabilités principales :

* récupérer la liste des utilisateurs suivis ;
* récupérer les posts récents de ces utilisateurs ;
* trier les posts par ordre chronologique ;
* retourner un flux d’actualité personnalisé.

Fonctionnalités liées :

* Fx5 : flux chronologique des messages des utilisateurs suivis.

Routes possibles :

```txt
GET /feed
```

Le feed-service peut communiquer avec :

* le follow-service pour connaître les utilisateurs suivis ;
* le post-service pour récupérer les messages publiés.

---

## 7. Services optionnels futurs

Certaines fonctionnalités secondaires pourront être ajoutées plus tard avec de nouveaux services.

Services possibles :

```txt
notification-service
message-service
media-service
moderation-service
search-service
```

### notification-service

Pour gérer :

* les notifications de mentions ;
* les notifications de likes ;
* les notifications de nouveaux followers.

Fonctionnalités liées :

* Fx14 ;
* Fx15 ;
* Fx16.

### message-service

Pour gérer les messages privés entre utilisateurs.

Fonctionnalité liée :

* Fx17.

### media-service

Pour gérer l’ajout d’images et de vidéos aux messages.

Fonctionnalités liées :

* Fx18 ;
* Fx19.

### moderation-service

Pour gérer le signalement, la suspension et le bannissement.

Fonctionnalités liées :

* Fx20 ;
* Fx21.

### search-service

Pour gérer la recherche par tags ou par mots-clés.

Fonctionnalités liées :

* Fx12 ;
* Fx13.

---

## 8. Communication entre les services

La communication principale se fait en HTTP via des API REST.

Exemple :

```txt
Frontend
  -> API Gateway
    -> Post Service
```

Pour certaines actions, un service peut appeler un autre service.

Exemple pour le fil d’actualité :

```txt
Feed Service
  -> Follow Service : récupérer les utilisateurs suivis
  -> Post Service   : récupérer les posts des utilisateurs suivis
```

Dans une première version du projet, la communication REST est suffisante.

Dans une version plus avancée, il serait possible d’ajouter une communication asynchrone avec une file de messages comme RabbitMQ ou Kafka, notamment pour les notifications.

---

## 9. Gestion de l’authentification

L’authentification repose sur des JWT.

Processus simplifié :

```txt
1. L’utilisateur se connecte depuis le frontend.
2. Le frontend envoie les identifiants à l’API Gateway.
3. L’API Gateway transmet la requête à auth-service.
4. Auth-service vérifie les identifiants.
5. Auth-service génère un JWT.
6. Le frontend stocke le JWT.
7. Les requêtes suivantes contiennent le JWT dans le header Authorization.
```

Exemple de header :

```txt
Authorization: Bearer <token>
```

L’API Gateway peut vérifier la validité du token avant de transmettre la requête au service concerné.

---

## 10. Gestion des bases de données

Le projet peut utiliser plusieurs bases de données selon les besoins des services.

Exemple possible :

```txt
auth-service    -> PostgreSQL
user-service    -> PostgreSQL
post-service    -> MongoDB
follow-service  -> PostgreSQL
feed-service    -> pas forcément de base dédiée au début
```

Choix possibles :

* PostgreSQL pour les données relationnelles ;
* MongoDB pour les contenus plus flexibles comme les posts et les commentaires.

Chaque microservice doit idéalement être responsable de ses propres données.
Un service ne doit pas accéder directement à la base de données d’un autre service.

---

## 11. Sécurité

Les règles de sécurité principales sont :

* utiliser JWT pour les routes protégées ;
* vérifier les droits de l’utilisateur côté back-end ;
* ne jamais faire confiance uniquement au front-end ;
* protéger les routes sensibles ;
* gérer correctement les erreurs ;
* éviter d’exposer les détails techniques dans les réponses d’erreur ;
* configurer CORS proprement ;
* stocker les secrets dans des variables d’environnement ;
* ne jamais versionner les fichiers `.env`.

---

## 12. Docker et environnement de développement

Chaque application ou service peut être lancé dans un conteneur Docker.

Le fichier `docker-compose.yml` permet de démarrer l’ensemble du projet en local :

```txt
frontend
api-gateway
auth-service
user-service
post-service
follow-service
feed-service
postgres
mongodb
```

Objectifs de Docker :

* simplifier l’installation du projet ;
* éviter les différences d’environnement entre les membres de l’équipe ;
* lancer facilement tous les services ;
* préparer le projet à un futur déploiement.

---

## 13. Packages partagés

Le dossier `packages/` contient du code commun utilisé par plusieurs applications ou services.

```txt
packages/
├── shared-types/
├── shared-utils/
└── shared-config/
```

### shared-types

Contient les types TypeScript partagés :

```txt
User
Post
Comment
Follow
AuthPayload
```

### shared-utils

Contient les fonctions utilitaires communes :

```txt
formatResponse()
handleError()
logger()
```

### shared-config

Contient certaines configurations communes :

```txt
cors
jwt
env
```

Attention : les packages partagés doivent rester simples.
Ils ne doivent pas contenir trop de logique métier afin d’éviter de créer un couplage trop fort entre les services.

---

## 14. Convention de nommage

Les dossiers des services utilisent le format kebab-case :

```txt
auth-service
user-service
post-service
follow-service
feed-service
```

Les fichiers TypeScript peuvent suivre cette convention :

```txt
auth.controller.ts
auth.service.ts
auth.routes.ts
user.model.ts
error.middleware.ts
```

Les routes API doivent rester simples et cohérentes :

```txt
/api/auth
/api/users
/api/posts
/api/follows
/api/feed
```

---

## 15. Répartition possible du travail en équipe

Exemple de répartition :

```txt
Membre 1 -> frontend
Membre 2 -> auth-service + user-service
Membre 3 -> post-service
Membre 4 -> follow-service + feed-service
Membre 5 -> api-gateway + Docker
```

Chaque membre peut travailler sur un service précis tout en respectant les contrats d’API définis dans la documentation.

---

## 16. Évolution progressive du projet

L’architecture doit rester progressive.

Version minimale recommandée :

```txt
frontend
api-gateway
auth-service
user-service
post-service
follow-service
feed-service
```

Fonctionnalités à développer en premier :

```txt
1. Création de compte
2. Connexion JWT
3. Profil utilisateur
4. Création de post
5. Liste des posts sur le profil
6. Follow / unfollow
7. Fil d’actualité
8. Likes
9. Commentaires
```

Fonctionnalités à ajouter plus tard :

```txt
1. Notifications
2. Messages privés
3. Images et vidéos
4. Modération
5. Recherche par tags
6. Thème personnalisé
7. Multilingue
```

---

## 17. Conclusion

Cette architecture permet de structurer Breezy de manière claire et évolutive.
Le choix d’un monorepo facilite le travail en équipe tout en conservant une séparation logique entre les applications, les microservices, les packages partagés et l’infrastructure.

L’API Gateway sert de point d’entrée unique pour le front-end et permet de centraliser une partie de la sécurité et du routage.

Les microservices permettent de séparer les responsabilités métier et de faire évoluer progressivement le projet sans rendre le code trop complexe dès le départ.
