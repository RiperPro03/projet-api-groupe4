# Découpage corrigé des fonctionnalités par services - Projet Breezy

## Objectif du document

Ce document regroupe les fonctionnalités du projet **Breezy** par services à développer.  
L’objectif est de permettre aux membres de l’équipe de savoir clairement quelles tâches sont associées à chaque service.

---

## 1. Découpage général corrigé des services

| Service | Rôle principal | Fonctionnalités associées |
|---|---|---|
| `auth-service` | Gestion de l’inscription, de la connexion, de la sécurité et des tokens | Fx1, Fx2 |
| `user-service` | Gestion des profils utilisateurs, informations publiques et préférences | Fx10, Fx22, Fx23 |
| `post-service` | Gestion des publications, affichage des posts utilisateur, tags et médias | Fx3, Fx4, Fx11, Fx12, Fx18, Fx19 |
| `feed-service` | Construction du fil d’actualité chronologique | Fx5 |
| `interaction-service` | Gestion des likes, commentaires et réponses | Fx6, Fx7, Fx8 |
| `follow-service` | Gestion des abonnements entre utilisateurs | Fx9 |
| `search-service` | Recherche de contenu via les tags | Fx13 |
| `notification-service` | Gestion des notifications utilisateur | Fx14, Fx15, Fx16 |
| `message-service` | Gestion des messages privés | Fx17 |
| `moderation-service` | Gestion des signalements et sanctions | Fx20, Fx21 |
| `frontend` | Interface utilisateur React, affichage, navigation, thème et langue | Fx22, Fx23 + toutes les fonctionnalités visibles côté utilisateur |
| `api-gateway` | Point d’entrée unique vers les services | Routage, sécurité, vérification JWT |

> Remarque importante : il est préférable de séparer `auth-service` et `user-service`.  
> Le `auth-service` gère l’identité et la sécurité.  
> Le `user-service` gère les données du profil et les préférences utilisateur.

> Fx22 et Fx23 sont principalement des fonctionnalités du `frontend`.  
> Si la langue ou le thème doivent être sauvegardés par utilisateur, le `frontend` communique avec le `user-service` pour enregistrer ces préférences.

---

## 2. Tableau corrigé des fonctionnalités regroupées par service

| Service | Fonctionnalité | Description |
|---|---|---|
| `auth-service` | Fx1 | Création de comptes utilisateurs avec validation |
| `auth-service` | Fx2 | Authentification sécurisée |
| `user-service` | Fx10 | Profil utilisateur avec nom, biographie courte et photo de profil |
| `user-service` | Fx22 | Sauvegarde éventuelle de la langue préférée de l’utilisateur |
| `user-service` | Fx23 | Sauvegarde éventuelle du thème préféré de l’utilisateur |
| `post-service` | Fx3 | Publication de messages courts, par exemple limités à 280 caractères |
| `post-service` | Fx4 | Affichage des messages sur le profil utilisateur |
| `post-service` | Fx11 | Liste des messages publiés par l’utilisateur sur son profil |
| `post-service` | Fx12 | Ajout de tags aux messages |
| `post-service` | Fx18 | Ajout d’images aux messages |
| `post-service` | Fx19 | Ajout de vidéos aux messages |
| `feed-service` | Fx5 | Flux chronologique des messages des utilisateurs suivis |
| `interaction-service` | Fx6 | Liker un post, un commentaire ou une réponse |
| `interaction-service` | Fx7 | Répondre à un post sous forme de commentaire |
| `interaction-service` | Fx8 | Répondre à un commentaire sur un post |
| `follow-service` | Fx9 | Suivre ou être suivi par d’autres utilisateurs |
| `search-service` | Fx13 | Recherche de posts via des tags |
| `notification-service` | Fx14 | Notifications pour les mentions |
| `notification-service` | Fx15 | Notifications pour les likes |
| `notification-service` | Fx16 | Notifications pour les nouveaux followers |
| `message-service` | Fx17 | Système de messages privés entre utilisateurs |
| `moderation-service` | Fx20 | Signalement de contenu inapproprié |
| `moderation-service` | Fx21 | Suspension ou bannissement des utilisateurs |
| `frontend` | Fx22 | Interface multi-langues |
| `frontend` | Fx23 | Thème personnalisé |

---

## 3. Tâches détaillées par service

### 3.1 `auth-service`

Ce service gère l’identité, l’inscription, la connexion et la sécurité des utilisateurs.

**Fonctionnalités concernées :**

- Fx1 : Création de comptes utilisateurs avec validation
- Fx2 : Authentification sécurisée

**Tâches à développer :**

- Créer l’inscription utilisateur
- Vérifier les champs obligatoires
- Vérifier l’unicité de l’email ou du nom d’utilisateur
- Hasher les mots de passe
- Créer la connexion utilisateur
- Générer un token JWT
- Générer éventuellement un refresh token
- Vérifier un token JWT
- Créer la déconnexion utilisateur
- Gérer éventuellement la réinitialisation du mot de passe

---

### 3.2 `user-service`

Ce service gère les profils utilisateurs, les informations publiques et les préférences.

**Fonctionnalités concernées :**

- Fx10 : Profil utilisateur avec nom, biographie courte et photo de profil
- Fx22 : Sauvegarde éventuelle de la langue préférée
- Fx23 : Sauvegarde éventuelle du thème préféré

**Tâches à développer :**

- Créer la récupération du profil utilisateur
- Créer la modification du profil utilisateur
- Gérer le pseudo ou le nom affiché
- Gérer la biographie courte
- Gérer la photo de profil
- Afficher les informations publiques d’un utilisateur
- Sauvegarder la langue préférée de l’utilisateur
- Sauvegarder le thème préféré de l’utilisateur
- Prévoir un statut utilisateur : actif, suspendu ou banni
- Fournir les informations utilisateur aux autres services si nécessaire

---

### 3.3 `post-service`

Ce service gère les publications, les tags et les contenus médias.

**Fonctionnalités concernées :**

- Fx3 : Publication de messages courts
- Fx4 : Affichage des messages sur le profil
- Fx11 : Liste des messages publiés par l’utilisateur
- Fx12 : Ajout de tags aux messages
- Fx18 : Ajout d’images aux messages
- Fx19 : Ajout de vidéos aux messages

**Tâches à développer :**

- Créer un post
- Limiter le contenu du post à 280 caractères
- Modifier un post
- Supprimer un post
- Afficher les posts d’un utilisateur
- Trier les posts du plus récent au plus ancien
- Ajouter des tags à un post
- Supprimer des tags d’un post
- Gérer l’ajout d’images
- Gérer l’ajout de vidéos
- Vérifier les formats autorisés
- Vérifier la taille maximale des fichiers

---

### 3.4 `feed-service`

Ce service gère le fil d’actualité de l’utilisateur.

**Fonctionnalité concernée :**

- Fx5 : Flux chronologique des messages des utilisateurs suivis

**Tâches à développer :**

- Récupérer la liste des utilisateurs suivis depuis le `follow-service`
- Récupérer les posts des utilisateurs suivis depuis le `post-service`
- Trier les posts par date de publication
- Afficher le fil d’actualité
- Ajouter une pagination
- Prévoir un endpoint de type `GET /feed`

---

### 3.5 `interaction-service`

Ce service gère les interactions autour des posts.

**Fonctionnalités concernées :**

- Fx6 : Liker un post, un commentaire ou une réponse
- Fx7 : Répondre à un post sous forme de commentaire
- Fx8 : Répondre à un commentaire sur un post

**Tâches à développer :**

- Ajouter un like sur un post, un commentaire ou une réponse
- Retirer un like sur un post, un commentaire ou une réponse
- Compter le nombre de likes (post, commentaire, réponse)
- Empêcher un utilisateur de liker deux fois la même cible
- Créer un commentaire sur un post
- Modifier un commentaire
- Supprimer un commentaire
- Créer une réponse à un commentaire
- Afficher les commentaires d’un post
- Afficher les réponses aux commentaires

> Les notifications de likes (Fx15) sont gérées par le `notification-service`, pas par l’`interaction-service`.

---

### 3.6 `follow-service`

Ce service gère les relations sociales entre utilisateurs.

**Fonctionnalité concernée :**

- Fx9 : Suivre ou être suivi par d’autres utilisateurs

**Tâches à développer :**

- Suivre un utilisateur
- Ne plus suivre un utilisateur
- Afficher la liste des abonnements
- Afficher la liste des abonnés
- Empêcher un utilisateur de se suivre lui-même
- Vérifier éventuellement que l’utilisateur suivi existe via le `user-service`
- Envoyer un événement vers le `notification-service` lorsqu’un utilisateur est suivi

---

### 3.7 `search-service`

Ce service permet de rechercher des publications.

**Fonctionnalité concernée :**

- Fx13 : Recherche de posts via des tags

**Tâches à développer :**

- Rechercher les posts par tag
- Afficher les résultats de recherche
- Prévoir un endpoint de type `GET /search/posts?tag=nom_du_tag`
- Gérer le cas où aucun résultat n’est trouvé

> Pour une première version simple, ce service peut être intégré au `post-service`.

---

### 3.8 `notification-service`

Ce service gère les notifications envoyées aux utilisateurs.

**Fonctionnalités concernées :**

- Fx14 : Notifications pour les mentions
- Fx15 : Notifications pour les likes
- Fx16 : Notifications pour les nouveaux followers

**Tâches à développer :**

- Créer une notification lorsqu’un utilisateur est mentionné
- Créer une notification lorsqu’un post est liké
- Créer une notification lorsqu’un utilisateur gagne un follower
- Afficher les notifications d’un utilisateur
- Marquer une notification comme lue
- Supprimer une notification

---

### 3.9 `message-service`

Ce service gère les messages privés entre utilisateurs.

**Fonctionnalité concernée :**

- Fx17 : Système de messages privés entre utilisateurs

**Tâches à développer :**

- Créer une conversation entre deux utilisateurs
- Envoyer un message privé
- Afficher les conversations de l’utilisateur
- Afficher les messages d’une conversation
- Marquer les messages comme lus
- Sécuriser l’accès aux conversations

---

### 3.10 `moderation-service`

Ce service gère la sécurité communautaire de la plateforme.

**Fonctionnalités concernées :**

- Fx20 : Signalement de contenu inapproprié
- Fx21 : Suspension ou bannissement des utilisateurs

**Tâches à développer :**

- Signaler un post
- Signaler un commentaire
- Lister les signalements côté modérateur
- Marquer un signalement comme traité
- Suspendre un utilisateur
- Bannir un utilisateur
- Empêcher un utilisateur suspendu ou banni de publier
- Empêcher un utilisateur suspendu ou banni de liker ou commenter

> Le `moderation-service` peut communiquer avec le `user-service` pour modifier le statut d’un utilisateur : actif, suspendu ou banni.

---

### 3.11 `frontend`

Ce service correspond à l’interface React utilisée par les utilisateurs.

**Fonctionnalités concernées :**

- Fx22 : Interface multi-langues
- Fx23 : Thème personnalisé
- Toutes les fonctionnalités visibles côté utilisateur

**Tâches à développer :**

- Créer les pages React
- Créer la navigation entre les pages
- Consommer les APIs des microservices
- Gérer l’état de connexion côté client
- Afficher les messages, profils, notifications, recherches et conversations
- Ajouter le changement de langue
- Ajouter le changement de thème
- Sauvegarder les préférences localement ou via le `user-service`

---

## 4. Répartition possible entre les membres de l’équipe

| Membre | Service principal | Fonctionnalités |
|---|---|---|
| Membre 1 | Authentification et profils | Fx1, Fx2, Fx10 |
| Membre 2 | Posts, tags et médias | Fx3, Fx4, Fx11, Fx12, Fx18, Fx19 |
| Membre 3 | Feed et interactions | Fx5, Fx6, Fx7, Fx8 |
| Membre 4 | Social, notifications et messagerie | Fx9, Fx14, Fx15, Fx16, Fx17 |
| Membre 5 | Recherche, modération et interface | Fx13, Fx20, Fx21, Fx22, Fx23 |

---

## 5. Priorité de développement

### Version obligatoire minimale

| Priorité | Fonctionnalités | Service concerné |
|---|---|---|
| 1 | Fx1, Fx2 | `auth-service` |
| 2 | Fx10 | `user-service` |
| 3 | Fx3, Fx4, Fx11 | `post-service` |
| 4 | Fx9 | `follow-service` |
| 5 | Fx5 | `feed-service` |
| 6 | Fx6, Fx7, Fx8 | `interaction-service` |

### Version optionnelle

| Priorité | Fonctionnalités | Service concerné |
|---|---|---|
| 7 | Fx12, Fx13 | `post-service` / `search-service` |
| 8 | Fx14, Fx15, Fx16 | `notification-service` |
| 9 | Fx17 | `message-service` |
| 10 | Fx18, Fx19 | `post-service` |
| 11 | Fx20, Fx21 | `moderation-service` |
| 12 | Fx22, Fx23 | `frontend` + éventuellement `user-service` pour sauvegarder les préférences |

---

## 6. Recommandation pour le projet

Pour un projet étudiant, il est conseillé de ne pas créer trop de microservices dès le début.  
Une version réaliste peut regrouper les services ainsi :

| Service simplifié | Contenu |
|---|---|
| `auth-service` | Inscription, connexion, tokens et sécurité |
| `user-service` | Profils, préférences, statut utilisateur |
| `post-service` | Posts, tags, images, vidéos et recherche simple |
| `social-service` | Follow et fil d’actualité |
| `interaction-service` | Likes, commentaires et réponses |
| `notification-service` | Notifications |
| `message-service` | Messages privés |
| `moderation-service` | Signalements et sanctions |
| `api-gateway` | Routage vers les services |
| `frontend` | Interface React, thème et langue |

Cette organisation permet de répartir clairement le travail dans l’équipe tout en gardant une architecture compréhensible.

