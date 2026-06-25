# Breezy

Breezy est une application de reseau social en microservices: comptes, profils, posts courts, feed, follows, likes, commentaires, notifications, medias et chat temps reel.

Le projet est organise en monorepo avec un frontend Next.js, une API gateway Express, plusieurs services metier Express, Nginx, PostgreSQL, MongoDB et MinIO.

## Documentation

| Document | Contenu |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | Architecture globale, Nginx, gateway, services, Docker |
| [docs/decoupage_services_breezy.md](docs/decoupage_services_breezy.md) | Decoupage fonctionnel par service |
| [docs/breezy_bdd_services.md](docs/breezy_bdd_services.md) | Bases de donnees, collections, tables, volumes |
| [docs/api-index.md](docs/api-index.md) | Index de la documentation API |
| [docs/api-auth.md](docs/api-auth.md) | Authentification et session |
| [docs/api-users.md](docs/api-users.md) | Roles, statuts et signalements |
| [docs/api-profiles.md](docs/api-profiles.md) | Profils publics |
| [docs/api-posts.md](docs/api-posts.md) | Posts, feed, tags |
| [docs/api-interactions.md](docs/api-interactions.md) | Likes, commentaires, reponses |
| [docs/api-follows.md](docs/api-follows.md) | Follows |
| [docs/api-media.md](docs/api-media.md) | Uploads MinIO et medias |
| [docs/api-notifications.md](docs/api-notifications.md) | Notifications |
| [docs/api-chat.md](docs/api-chat.md) | Chat Socket.IO |
| [docs/demo-seed.md](docs/demo-seed.md) | Jeu de donnees de demo |

Collection Postman: [docs/postman/api-gateway.postman_collection.json](docs/postman/api-gateway.postman_collection.json)

## Stack

- Frontend: Next.js, React, Mantine, Redux Toolkit, Socket.IO client
- API gateway: Express
- Services: Express, TypeScript
- Temps reel: Socket.IO
- SQL: PostgreSQL + Prisma
- NoSQL: MongoDB + Mongoose
- Fichiers: MinIO compatible S3
- Infra: Docker Compose, Docker Swarm, Nginx public, Nginx interne
- Package manager: pnpm 11

## Architecture rapide

```txt
Navigateur
  |
  v
Nginx public : http://localhost:8080 en dev
  |-- /                 -> frontend
  |-- /api/*            -> api-gateway
  |-- /chat/socket.io/* -> chat-service
  |-- /minio/*          -> MinIO

api-gateway
  |
  v
nginx-internal
  |-- auth-service
  |-- user-service
  |-- profile-service
  |-- post-service
  |-- follow-service
  |-- interaction-service
  |-- media-service
  |-- notification-service
```

## Services

| Service | Port interne | Role |
| --- | --- | --- |
| `frontend` | `4000` | Interface web |
| `api-gateway` | `3000` | Entree API, auth, RBAC, aggregation |
| `auth-service` | `3001` | Comptes, JWT, refresh tokens |
| `user-service` | `3002` | Roles, statuts, signalements |
| `post-service` | `3003` | Posts, tags, feed brut |
| `follow-service` | `3004` | Abonnements |
| `media-service` | `3005` | URL presignees MinIO, metadonnees |
| `profile-service` | `3006` | Profils publics |
| `interaction-service` | `3007` | Likes, commentaires, reponses |
| `notification-service` | `3008` | Notifications |
| `chat-service` | `3009` | Presence et messages prives temps reel |

## Prerequis

Pour utiliser le projet en local:

- Docker Desktop ou Docker Engine avec Docker Compose
- Node.js 24 recommande pour les services, Node.js 22+ acceptable pour le frontend
- pnpm 11

Avec Corepack:

```bash
corepack enable
corepack prepare pnpm@11.5.0 --activate
```

## Deploiement local dev avec Docker

Cette methode est la plus simple pour lancer tout le site.

### 1. Cloner et installer

```bash
git clone <url-du-repo>
cd projet-api-groupe4
pnpm install
```

### 2. Creer les fichiers `.env` locaux

Les fichiers `.env` ne sont pas versionnes. Copiez les exemples.

Bash:

```bash
cp apps/api-gateway/.env.example apps/api-gateway/.env
for file in services/*/.env.example; do cp "$file" "${file%.example}"; done
```

PowerShell:

```powershell
Copy-Item apps/api-gateway/.env.example apps/api-gateway/.env -Force
Get-ChildItem services -Directory | ForEach-Object {
  $example = Join-Path $_.FullName ".env.example"
  $target = Join-Path $_.FullName ".env"
  if (Test-Path $example) { Copy-Item $example $target -Force }
}
```

Pour un lancement Docker complet, les valeurs par defaut du `docker-compose.yml` suffisent dans la majorite des cas.

### 3. Demarrer les bases et MinIO

```bash
docker compose up -d auth-postgres user-postgres follow-postgres profile-mongodb post-mongodb interaction-mongodb notification-mongodb media-mongodb minio
```

### 4. Appliquer les migrations Prisma

Les services PostgreSQL ont besoin de leurs tables avant utilisation.

```bash
docker compose build auth-service user-service follow-service
docker compose run --rm auth-service pnpm exec prisma migrate deploy
docker compose run --rm user-service pnpm exec prisma migrate deploy
docker compose run --rm follow-service pnpm exec prisma migrate deploy
```

### 5. Lancer toute l'application

```bash
docker compose up -d --build
```

Verifier les conteneurs:

```bash
docker compose ps
```

Logs utiles:

```bash
docker compose logs -f nginx api-gateway frontend
```

### 6. Ouvrir le site

| Ressource | URL |
| --- | --- |
| Site web | `http://localhost:8080` |
| API gateway | `http://localhost:8080/api` |
| Healthcheck public | `http://localhost:8080/health` |
| Chat health | `http://localhost:8080/chat/health` |
| MinIO API publique | `http://localhost:8080/minio` |
| Console MinIO | `http://localhost:9001` |

Identifiants MinIO dev:

```txt
minioadmin / minioadmin
```

### 7. Ajouter des donnees de demo

Quand les services sont demarres et les migrations appliquees:

```bash
pnpm run seed:demo
```

Comptes de demo:

| Role | Email | Mot de passe |
| --- | --- | --- |
| Admin | `admin@breezy.local` | `BreezyDemo2026!` |
| Moderateur | `moderator@breezy.local` | `BreezyDemo2026!` |
| User | `lea.martin@breezy.local` | `BreezyDemo2026!` |
| User | `noah.benali@breezy.local` | `BreezyDemo2026!` |
| User | `ines.dupont@breezy.local` | `BreezyDemo2026!` |

Plus de details: [docs/demo-seed.md](docs/demo-seed.md)

### 8. Arreter le dev

```bash
docker compose down
```

Pour supprimer aussi les volumes de donnees:

```bash
docker compose down -v
```

## Developpement hors Docker

Le mode Docker complet reste recommande. Pour travailler sur un service precis:

1. Lancez au minimum ses bases avec Docker.
2. Adaptez son `.env` pour utiliser `localhost`.
3. Lancez le service avec pnpm.

Exemples:

```bash
pnpm --filter api-gateway dev
pnpm --filter frontend dev
pnpm --filter auth-service dev
```

Attention: certains `.env.example` sont orientes Docker et utilisent des hosts comme `user-postgres` ou `nginx-internal`. Pour un lancement direct depuis l'hote, remplacez ces hosts par `localhost` et les ports exposes dans `docker-compose.yml`.

## Commandes utiles

| Commande | Description |
| --- | --- |
| `pnpm install` | Installer les dependances |
| `pnpm run build` | Build TypeScript/Next de tous les packages |
| `pnpm run seed:demo` | Ajouter les donnees de demo |
| `pnpm --filter <service> dev` | Lancer un service en watch |
| `pnpm --filter <service> test` | Lancer les tests d'un service |
| `pnpm --filter <service> test:coverage` | Tests avec couverture |
| `docker compose up -d --build` | Lancer tout le stack dev |
| `docker compose logs -f <service>` | Suivre les logs |

## Deploiement production

Le fichier [docker-compose.prod.yml](docker-compose.prod.yml) est prevu pour un deploiement Docker Swarm avec images prebuild, replicas applicatifs, services stateful en singleton et Nginx TLS.

### 1. Prerequis serveur

- Un serveur Linux avec Docker
- Un nom de domaine qui pointe vers le serveur
- Ports ouverts: `80` et le port HTTPS choisi, par defaut `8443`
- Acces a un registry Docker, par defaut GHCR
- Certificats TLS Let's Encrypt disponibles dans `/etc/letsencrypt`

Par defaut, la config prod utilise le domaine `riperpro-playhub.duckdns.org`. Pour votre domaine, remplacez ce domaine dans:

- [infra/nginx/nginx.prod.conf](infra/nginx/nginx.prod.conf)
- `.env.prod`

Si vous voulez utiliser le port HTTPS standard `443` au lieu de `8443`, mettez `PUBLIC_HTTPS_PORT=443` et adaptez aussi la redirection HTTP dans `infra/nginx/nginx.prod.conf`.

### 2. Construire et publier les images

Le workflow GitHub actuel lance les builds/tests, mais ne publie pas les images Docker. Vous pouvez les construire et pousser manuellement.

Bash:

```bash
export IMAGE_REGISTRY=ghcr.io/<owner>/<repo>
export IMAGE_TAG=v1.0.0

for app in api-gateway frontend; do
  docker build -t "$IMAGE_REGISTRY/$app:$IMAGE_TAG" "./apps/$app"
  docker push "$IMAGE_REGISTRY/$app:$IMAGE_TAG"
done

for service in auth-service user-service follow-service profile-service post-service interaction-service notification-service media-service chat-service; do
  docker build -t "$IMAGE_REGISTRY/$service:$IMAGE_TAG" "./services/$service"
  docker push "$IMAGE_REGISTRY/$service:$IMAGE_TAG"
done
```

Connectez-vous au registry avant:

```bash
docker login ghcr.io
```

### 3. Preparer les variables de prod

Sur le serveur:

```bash
cp .env.prod.example .env.prod
```

Editez `.env.prod`:

```env
IMAGE_REGISTRY=ghcr.io/<owner>/<repo>
IMAGE_TAG=v1.0.0
APP_REPLICAS=3
PUBLIC_HTTP_PORT=80
PUBLIC_HTTPS_PORT=8443
CORS_ORIGIN=https://votre-domaine.example:8443
NEXT_PUBLIC_API_URL=/api
MINIO_PUBLIC_URL=https://votre-domaine.example:8443/minio
JWT_ACCESS_SECRET=change_this_long_random_value
JWT_REFRESH_SECRET=change_this_other_long_random_value
MINIO_ROOT_USER=change_this_user
MINIO_ROOT_PASSWORD=change_this_password
```

Generez des secrets forts:

```bash
openssl rand -hex 32
```

### 4. Installer les certificats TLS

Si les certificats n'existent pas encore:

```bash
sudo apt-get update
sudo apt-get install -y certbot
sudo certbot certonly --standalone -d votre-domaine.example
```

Les chemins attendus par Nginx sont:

```txt
/etc/letsencrypt/live/<domaine>/fullchain.pem
/etc/letsencrypt/live/<domaine>/privkey.pem
```

Ils doivent correspondre au domaine configure dans `infra/nginx/nginx.prod.conf`.

### 5. Initialiser Docker Swarm

```bash
docker swarm init
```

Si Swarm est deja initialise, cette commande n'est pas necessaire.

### 6. Charger les variables et deployer

Bash:

```bash
set -a
source .env.prod
set +a

docker stack deploy -c docker-compose.prod.yml breezy
```

Verifier:

```bash
docker stack services breezy
docker stack ps breezy
```

### 7. Appliquer les migrations en prod

Appliquez les migrations Prisma apres le premier deploiement ou apres une mise a jour de schema.

Exemple avec des conteneurs one-shot sur le reseau Swarm:

```bash
docker run --rm --network breezy_breezy-network \
  -e DATABASE_URL="postgresql://$AUTH_POSTGRES_USER:$AUTH_POSTGRES_PASSWORD@auth-postgres:5432/$AUTH_POSTGRES_DB?schema=public" \
  "$IMAGE_REGISTRY/auth-service:$IMAGE_TAG" pnpm exec prisma migrate deploy

docker run --rm --network breezy_breezy-network \
  -e DATABASE_URL="postgresql://$USER_POSTGRES_USER:$USER_POSTGRES_PASSWORD@user-postgres:5432/$USER_POSTGRES_DB?schema=public" \
  "$IMAGE_REGISTRY/user-service:$IMAGE_TAG" pnpm exec prisma migrate deploy

docker run --rm --network breezy_breezy-network \
  -e DATABASE_URL="postgresql://$FOLLOW_POSTGRES_USER:$FOLLOW_POSTGRES_PASSWORD@follow-postgres:5432/$FOLLOW_POSTGRES_DB?schema=public" \
  "$IMAGE_REGISTRY/follow-service:$IMAGE_TAG" pnpm exec prisma migrate deploy
```

Les services peuvent redemarrer automatiquement pendant que les tables n'existent pas encore. Une fois les migrations passees, verifiez l'etat du stack.

### 8. Ouvrir le site en prod

Avec la config par defaut:

```txt
https://votre-domaine.example:8443
```

Healthchecks:

```txt
https://votre-domaine.example:8443/health
https://votre-domaine.example:8443/api/health
https://votre-domaine.example:8443/chat/health
```

### 9. Mettre a jour une version prod

1. Construire et pousser les nouvelles images avec un nouveau `IMAGE_TAG`.
2. Modifier `.env.prod`.
3. Redployer:

```bash
set -a
source .env.prod
set +a
docker stack deploy -c docker-compose.prod.yml breezy
```

4. Relancer les migrations Prisma si necessaire.

### 10. Arreter la prod

```bash
docker stack rm breezy
```

Les volumes Docker persistent. Supprimez-les seulement si vous voulez perdre les donnees.

## Depannage

### La page web ne charge pas

```bash
docker compose ps
docker compose logs -f nginx frontend api-gateway
```

Verifiez `http://localhost:8080/health`.

### Erreurs 500 apres demarrage

Les migrations PostgreSQL sont peut-etre manquantes:

```bash
docker compose run --rm auth-service pnpm exec prisma migrate deploy
docker compose run --rm user-service pnpm exec prisma migrate deploy
docker compose run --rm follow-service pnpm exec prisma migrate deploy
```

### Erreurs 401 partout

Verifiez que `auth-service`, `user-service`, `api-gateway` et `nginx-internal` sont demarres. La gateway verifie le token dans `auth-service`, puis lit le role dans `user-service`.

### Upload media impossible

Verifiez:

- `media-service`
- `media-mongodb`
- `minio`
- `MINIO_PUBLIC_URL`
- `http://localhost:9001` en dev

### Chat indisponible

Verifiez:

- `chat-service`
- `AUTH_VERIFY_URL`
- le chemin `/chat/socket.io`
- les cookies `accessToken`

### Reset complet local

```bash
docker compose down -v
docker compose up -d --build
```

Puis relancez les migrations et le seed demo.

## Notes importantes

- Le chat actuel est temps reel mais ne persiste pas les messages cote serveur.
- Le feed n'est pas un service separe: il est agrege par l'API gateway.
- Les fichiers uploades sont stockes dans MinIO, pas dans MongoDB.
- Les formats de reponse historiques ne sont pas encore tous homogenes; les details sont dans les docs API.
