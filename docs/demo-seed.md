# Seed de demo

Ce seed lit le fichier editable `demo-seed-data.json`, puis cree ou met a jour:

- les comptes dans `auth-service`
- les roles dans `user-service`
- les profils dans `profile-service`
- les posts dans `post-service`
- les likes et commentaires dans `interaction-service`

## Commande

```bash
pnpm run seed:demo
```

Les bases Postgres doivent etre demarrees et migrees avant d'executer la commande. L'API gateway, `profile-service`, `post-service` et `interaction-service` doivent aussi etre accessibles.

## Donnees editables

Les donnees sont dans `demo-seed-data.json` a la racine du repo.

- `users`: comptes, roles et profils
- `posts`: posts de demo, avec une cle auteur qui reference `users[*].key`
- `interactions.postLikes`: likes sur les posts
- `interactions.comments`: commentaires et reponses
- `interactions.commentLikes`: likes sur les commentaires

## Comptes par defaut

| Role | Email | Mot de passe |
| --- | --- | --- |
| Admin | `admin@breezy.local` | `BreezyDemo2026!` |
| Moderateur | `moderator@breezy.local` | `BreezyDemo2026!` |
| User | `lea.martin@breezy.local` | `BreezyDemo2026!` |
| User | `noah.benali@breezy.local` | `BreezyDemo2026!` |
| User | `ines.dupont@breezy.local` | `BreezyDemo2026!` |
| User | `hugo.moreau@breezy.local` | `BreezyDemo2026!` |
| User | `sara.bernard@breezy.local` | `BreezyDemo2026!` |

## Profils par defaut

| Email | Username | Nickname |
| --- | --- | --- |
| `admin@breezy.local` | `breezy_admin` | `Admin Breezy` |
| `moderator@breezy.local` | `breezy_modo` | `Moderateur Breezy` |
| `lea.martin@breezy.local` | `lea_martin` | `Lea Martin` |
| `noah.benali@breezy.local` | `noah_benali` | `Noah Benali` |
| `ines.dupont@breezy.local` | `ines_dupont` | `Ines Dupont` |
| `hugo.moreau@breezy.local` | `hugo_moreau` | `Hugo Moreau` |
| `sara.bernard@breezy.local` | `sara_bernard` | `Sara Bernard` |

Le script est idempotent pour les utilisateurs, profils, roles, posts de demo et likes. Pour les commentaires, il evite les doublons en retrouvant un commentaire existant avec le meme post, auteur, parent et contenu.

## Variables utiles

```bash
SEED_DATA_FILE=demo-seed-data.json
SEED_API_URL=http://localhost:8080/api
AUTH_DATABASE_URL=postgresql://auth_user:auth_password@localhost:5433/auth_db?schema=public
USER_DATABASE_URL=postgresql://user_user:user_password@localhost:5434/user_db?schema=public
SEED_SALT_ROUNDS=10
```
