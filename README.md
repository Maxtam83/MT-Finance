# MT Finance

Application web de gestion de finances personnelles et de patrimoine : interface complète sur ordinateur, PWA synthétique sur mobile. Cible de production : `finance.maxime-tamarin.fr`.

**Lot 1 (socle) :** base de données, chiffrement AES-256-GCM, authentification sur liste blanche, page d'administration et manifeste PWA. Les sections Comptes, Règles & Tags, Import et Investissements sont des pages d'attente.

Mise en production : [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

## Stack

| Domaine | Choix |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript 6 strict |
| Interface | Tailwind CSS 4, shadcn/ui (Base UI), thème clair et sombre |
| Données | Prisma 7, SQLite en local, Turso (libSQL) en production |
| Authentification | Better-Auth : GitHub, Google (facultatif), passkeys |
| Validation | Zod 4 (variables d'environnement et Server Actions) |

## Prérequis

- **Node.js 24.x** et npm ([nodejs.org](https://nodejs.org))
- **git**
- Un compte **GitHub**, pour créer l'application de connexion

Aucun serveur de base de données n'est à installer : en local, la base est le fichier `dev.db`.

## Initialiser le projet

Les commandes sont écrites pour PowerShell.

### 1. Récupérer le code et les dépendances

```powershell
git clone https://github.com/Maxtam83/MT-Finance.git
```

```powershell
cd MT-Finance
```

```powershell
npm install
```

`npm install` génère aussi le client Prisma.

### 2. Créer le fichier `.env`

```powershell
Copy-Item .env.example .env
```

Générez **deux** valeurs différentes, pour `ENCRYPTION_KEY` et `BETTER_AUTH_SECRET`, en lançant deux fois :

```powershell
npm run key:generate
```

### 3. Créer l'application OAuth GitHub de développement

Sur GitHub : **Settings → Developer settings → OAuth Apps → New OAuth App**.

| Champ | Valeur |
|---|---|
| Homepage URL | `http://localhost:3000` |
| Authorization callback URL | `http://localhost:3000/api/auth/callback/github` |

Copiez le *Client ID* dans `GITHUB_CLIENT_ID`, puis générez un *client secret* pour `GITHUB_CLIENT_SECRET`.

### 4. Définir l'administrateur

`ADMIN_EMAIL` doit être l'adresse que GitHub transmet à l'application :

- si votre profil GitHub affiche un **email public**, c'est celui-là ;
- sinon, c'est votre **email principal**.

Dans les deux cas, l'adresse doit être vérifiée chez GitHub.

### 5. Créer la base locale et lancer l'application

```powershell
npm run db:setup
```

```powershell
npm run dev
```

Ouvrez <http://localhost:3000>. Utilisez bien `localhost` (et non `127.0.0.1` ou une adresse IP) : la connexion et les passkeys sont liées à `BETTER_AUTH_URL`. Si vous changez de port, adaptez cette variable et l'application GitHub.

### Premier accès

1. Connectez-vous avec GitHub : le compte `ADMIN_EMAIL` reçoit le rôle `ADMIN`.
2. Dans **Administration**, autorisez les adresses des autres personnes.
3. Sur le **Dashboard**, ajoutez si vous le souhaitez une passkey pour les connexions suivantes.

## Variables d'environnement

Elles sont validées au démarrage : l'application refuse de démarrer si une valeur manque ou est mal formée.

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | oui | `file:./dev.db` en local, `libsql://…` en production |
| `DATABASE_AUTH_TOKEN` | si base distante | Token Turso |
| `ENCRYPTION_KEY` | oui | 64 caractères hexadécimaux (clé AES-256) |
| `ADMIN_EMAIL` | oui | Email de l'unique administrateur |
| `BETTER_AUTH_SECRET` | oui | 32 caractères au minimum |
| `BETTER_AUTH_URL` | oui | URL publique, en `https` hors machine locale |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | au moins un fournisseur | Connexion GitHub |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | facultatif | Connexion Google (URI de redirection : `<BETTER_AUTH_URL>/api/auth/callback/google`) |

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` puis `npm run start` | Version de production en local |
| `npm run typecheck` | Génère les types de routes puis lance `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Tests du chiffrement et de la validation d'environnement |
| `npm run db:setup` | Applique les migrations à la base locale et génère le client |
| `npm run db:migrate` | Crée une migration après une modification du schéma |
| `npm run db:generate` | Régénère le client Prisma |
| `npm run db:studio` | Explore la base locale |
| `npm run db:deploy:turso:check` | Liste les migrations en attente sur Turso |
| `npm run db:deploy:turso` | Applique les migrations sur Turso |
| `npm run key:generate` | Génère un secret aléatoire de 32 octets |

## Base de données

La base locale (`dev.db`) **n'est jamais versionnée** : `.gitignore` exclut les fichiers `*.db`, `*.sqlite` et leurs fichiers annexes. Seuls le schéma et les migrations SQL le sont.

Pour modifier le schéma :

1. Modifiez `prisma/schema.prisma`.
2. Créez la migration, puis régénérez le client :

   ```powershell
   npm run db:migrate
   ```

   ```powershell
   npm run db:generate
   ```

3. Relisez le SQL créé dans `prisma/migrations/`, puis commitez-le avec le schéma.
4. Pour la production, suivez la section « Mettre à jour » de la [documentation de mise en production](docs/DEPLOIEMENT.md#8-mettre-à-jour).

Ne modifiez jamais une migration déjà appliquée : créez-en une nouvelle. Le CLI Prisma ne travaille que sur la base locale (voir `prisma.config.ts`).

Pour repartir d'une base vide, arrêtez le serveur, supprimez `dev.db` (**les données locales sont perdues**), puis relancez `npm run db:setup`.

## Structure

```text
prisma/               schéma et migrations SQL
scripts/db-deploy.ts  envoi des migrations vers Turso
src/
  app/                pages : (auth)/login, (app)/ protégée, API d'authentification, manifeste
  actions/            Server Actions
  components/         ui/ (shadcn), layout/, auth/, admin/
  lib/                env, crypto, prisma, auth/, validations/
  instrumentation.ts  validation de l'environnement au démarrage
tests/                tests `node:test`
docs/                 documentation de mise en production
```

## Sécurité

### Accès

- **Inscription fermée :** seuls `ADMIN_EMAIL` et les adresses de `AllowedEmail` peuvent créer un compte. L'email doit être vérifié par le fournisseur.
- La liste blanche est revérifiée **à chaque nouvelle session** (OAuth ou passkey) et **à chaque requête protégée**. Retirer une adresse dans l'administration ferme aussi ses sessions.
- Chaque page et Server Action protégée appelle `requireAuth()` ou `requireAdmin()` (`src/lib/auth/guards.ts`). Un layout ou le masquage d'un lien ne suffisent pas : **appliquez cette règle à tout nouveau code.**
- Les jetons OAuth sont chiffrés en base avec une clé liée à `BETTER_AUTH_SECRET`.
- En-têtes HTTP : `X-Frame-Options`, `X-Content-Type-Options` et `Referrer-Policy` (`next.config.ts`).
- En production, Better-Auth limite le débit (par exemple 3 demandes de connexion par 10 secondes). Ce compteur est en mémoire : sur Vercel, il n'est pas partagé entre les instances.

### Chiffrement

`src/lib/crypto.ts` fournit `encrypt`, `decrypt` (format `ivHex:authTagHex:cipherTextHex`) et `hashImportId` (HMAC-SHA256 avec une sous-clé dérivée de `ENCRYPTION_KEY`). Les champs marqués `[CHIFFRÉ AES-256]` dans le schéma ne sont pas chiffrés automatiquement : le code qui les écrit doit appeler `encrypt`.

> **Sauvegardez `ENCRYPTION_KEY`.** Si elle est perdue ou changée, les données chiffrées sont définitivement illisibles. La rotation de clé n'est pas prévue.

### Limites de l'accès à l'aveugle

La liaison d'un compte joint ne lit que des identifiants et ne renvoie qu'une confirmation. Cette protection est **applicative** :

- l'administrateur peut aussi se lier lui-même à un compte **s'il en connaît l'identifiant**, et il en devient alors membre ;
- la personne qui détient `ENCRYPTION_KEY` et l'accès à la base peut techniquement tout déchiffrer.

### Compte joint et tags

Un compte partagé utilise les tags d'une seule personne, le **référent** (`Account.tagOwnerId`). Il est choisi lors de la première liaison d'un membre. Le modifier n'est pas encore prévu, et les droits de chacun sur les tags seront appliqués avec le lot « Règles & Tags ».

### Dépôt public

Ne versionnez jamais de secret, de base de données ni de relevé bancaire. `.gitignore` exclut `.env*` (sauf `.env.example`), les bases locales, `data/` et les fichiers `*.csv`, `*.ofx`, `*.qfx`, `*.qif`, `*.xls`, `*.xlsx`.

## Dépannage

| Symptôme | Cause probable |
|---|---|
| `Variables d'environnement invalides` | `.env` incomplet : le message nomme chaque variable en cause |
| GitHub signale une erreur de `redirect_uri` | L'URL de callback ne correspond pas à `BETTER_AUTH_URL` |
| L'administrateur est refusé | `ADMIN_EMAIL` diffère de l'adresse transmise par GitHub (voir l'étape 4) |
| Erreur `429` à la connexion | Limite de débit : attendez quelques secondes |
| Impossible d'ajouter une passkey | La session est trop ancienne : reconnectez-vous |

## Dépendances à surveiller

- **ESLint 9** n'est plus maintenu, mais des plugins de `eslint-config-next` ne déclarent pas encore ESLint 10.
- **TypeScript 6** : `typescript-eslint` n'accepte pas encore TypeScript 7.
- **`effect`** est forcé en 3.22.5 (`overrides` dans `package.json`) : la version imposée par le CLI Prisma 7.10.1 est signalée comme vulnérable par `npm audit`. Retirez ce forçage quand Prisma aura mis à jour sa dépendance.
- **`@libsql/client`** reste en 0.17, version exigée par `@prisma/adapter-libsql` 7.10.1.
