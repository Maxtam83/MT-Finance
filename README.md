# MT Finance

Application web de gestion de finances personnelles et de patrimoine : interface complète sur ordinateur, PWA synthétique sur mobile. Cible de production : `finance.maxime-tamarin.fr`.

**Lot 1 (socle) :** base de données, chiffrement AES-256-GCM, authentification sur liste blanche, administration des accès, compte joint à double validation et manifeste PWA. La création de comptes n'existe pas encore ; les sections Règles & Tags, Import et Investissements sont des pages d'attente.

- Mise en production : [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md)
- Sécurité et risques connus : [Sécurité](#sécurité)
- Règles pour contribuer : [Conventions de développement](#conventions-de-développement)

## Stack

| Domaine | Choix |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript 6 strict |
| Interface | Tailwind CSS 4, shadcn/ui (Base UI), Atomic Design, thèmes sombre et clair |
| Données | Prisma 7, SQLite en local, Turso (libSQL) en production |
| Authentification | Better-Auth : GitHub, Google (facultatif), passkeys |
| Validation | Zod 4 (variables d'environnement et Server Actions) |
| Qualité | Vitest, Testing Library, ESLint |

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

### Après une mise à jour du code

Relancez `npm install` puis `npm run db:setup` : les nouvelles migrations sont appliquées à votre base locale sans effacer ses données.

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
| `npm run lint` | ESLint, dont les règles de commentaires et de découpage atomique |
| `npm test` | Tous les tests, avec une couverture obligatoire de 100 % |
| `npm run test:watch` | Tests relancés à chaque modification |
| `npm run db:setup` | Applique les migrations à la base locale et génère le client |
| `npm run db:migrate` | Crée une migration après une modification du schéma |
| `npm run db:generate` | Régénère le client Prisma |
| `npm run db:studio` | Explore la base locale |
| `npm run db:deploy:turso:check` | Liste les migrations en attente sur Turso |
| `npm run db:deploy:turso` | Applique les migrations sur Turso |
| `npm run key:generate` | Génère un secret aléatoire de 32 octets |

## Tests

| Dossier | Contenu |
|---|---|
| `tests/unit/` | Logique pure, chiffrement, validation, configuration |
| `tests/integration/` | Authentification, contrôles d'accès, Server Actions, compte joint, migrations, sur des bases SQLite jetables |
| `tests/ui/` | Composants, gabarits et pages (Testing Library, jsdom) |

Les réponses de GitHub sont simulées : aucun test n'appelle un service externe et aucun identifiant réel n'est nécessaire. Le rapport détaillé est écrit dans `coverage/`.

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
prisma/                 schéma et migrations SQL
scripts/
  db-deploy.ts          point d'entrée de l'envoi vers Turso
  lib/migrations.ts     logique d'application des migrations
src/
  app/                  pages : (auth)/login, (app)/ protégée, API d'authentification, manifeste
  actions/              Server Actions
  components/           atoms/, molecules/, organisms/, templates/
  hooks/                hooks React
  providers/            fournisseurs de contexte (thème)
  lib/                  env, crypto, prisma, auth/, joint-accounts/, validations/
  instrumentation.ts    validation de l'environnement au démarrage
tests/                  unit/, integration/, ui/, helpers/
docs/                   documentation de mise en production
```

## Interface

### Découpage atomique

| Couche | Rôle | Peut importer |
|---|---|---|
| `atoms/` | Éléments de base (dont les composants shadcn/ui) | des atomes |
| `molecules/` | Petits assemblages à une seule fonction | atomes, molécules |
| `organisms/` | Sections complètes | atomes, molécules, organismes |
| `templates/` | Structure d'une page | toutes les couches précédentes |

Les pages de `src/app/` lisent les données et composent organismes et gabarits. ESLint bloque tout import vers une couche supérieure. `components.json` place les nouveaux composants shadcn dans `atoms/`.

### Design system

Il reprend l'identité de [maxime-tamarin.fr](https://maxime-tamarin.fr) ; tous les réglages sont dans `src/app/globals.css`.

| Élément | Valeur |
|---|---|
| Fond et surface (sombre) | `#06090d`, `#0c1218` |
| Accents | bleu `#0476fb` / `#1085ec`, ardoise `#37555f` |
| Police | Inter, hébergée avec l'application |
| Style | panneaux en verre (`glass`), halos, boutons en pilule, titres très gras, dégradé (`text-gradient`) |

Le thème **sombre** est celui du site et s'affiche par défaut. Le thème **clair** en est dérivé : le site n'en propose pas, et le bleu y est assombri pour rester lisible.

## Sécurité

### Accès

- **Inscription fermée :** seuls `ADMIN_EMAIL` et les adresses de `AllowedEmail` peuvent créer un compte. L'email doit être vérifié par le fournisseur.
- La liste blanche est revérifiée **à chaque nouvelle session** (OAuth ou passkey) et **à chaque requête protégée**. Retirer une adresse ferme ses sessions et annule ses demandes de compte joint.
- Chaque page et Server Action protégée appelle `requireAuth()` ou `requireAdmin()` (`src/lib/auth/guards.ts`). Un layout ou le masquage d'un lien ne suffisent pas.
- L'administrateur gère uniquement la liste blanche : il n'a aucun pouvoir sur les comptes ni sur leur partage.
- Les jetons OAuth sont chiffrés en base avec une clé liée à `BETTER_AUTH_SECRET`.
- En-têtes HTTP : `X-Frame-Options`, `X-Content-Type-Options` et `Referrer-Policy` (`next.config.ts`).

### Compte joint

Un compte ne devient joint qu'avec **la validation des deux personnes**, chacune depuis sa propre session :

1. le propriétaire envoie une demande depuis **Comptes** : adresse de l'autre personne, référent des tags et accord explicite ;
2. la personne invitée voit le nom et le type du compte, l'auteur et le référent, puis accepte ou refuse.

| Risque | Protection |
|---|---|
| Découvrir qui utilise l'application | Réponse identique que l'adresse soit inscrite ou non |
| Agir sur la demande d'une autre personne | Chaque requête filtre sur l'identité tirée de la session |
| Partager le compte d'autrui | Envoi réservé au propriétaire ; même message si le compte n'existe pas |
| Accepter une vieille demande | Expiration après 7 jours ; annulation par son auteur |
| Valider deux fois, ou à plusieurs | Demande consommée dans une transaction ; deux membres au maximum |
| Situation modifiée entre l'envoi et la validation | Liste blanche et propriété revérifiées à la validation |

Un compte joint utilise les tags d'une seule personne, le **référent** (`Account.tagOwnerId`), choisi dans la demande. Les droits de chacun sur les tags seront appliqués avec le lot « Règles & Tags ».

### Chiffrement

`src/lib/crypto.ts` fournit `encrypt`, `decrypt` (format `ivHex:authTagHex:cipherTextHex`) et `hashImportId` (HMAC-SHA256 avec une sous-clé dérivée de `ENCRYPTION_KEY`). Les champs marqués `[CHIFFRÉ AES-256]` dans le schéma ne sont pas chiffrés automatiquement : le code qui les écrit doit appeler `encrypt`.

> **Sauvegardez `ENCRYPTION_KEY`.** Si elle est perdue ou changée, les données chiffrées sont définitivement illisibles. La rotation de clé n'est pas prévue.

### Risques connus, à traiter

| Risque | Ce qu'il faudrait faire |
|---|---|
| **Un compte joint ne peut pas encore être dissous** : l'accord ne peut pas être retiré | Permettre à la personne invitée de quitter le compte, et au propriétaire de retirer le partage, chacun sans l'accord de l'autre ; à faire avant d'enregistrer de vraies opérations |
| **Tags privés exposés** si le référent choisi est la personne invitée alors que l'historique porte déjà les tags du propriétaire | Dans le lot des tags : détacher ces tags avant d'activer le partage, après avoir prévenu les deux personnes |
| La personne invitée n'est pas notifiée par email | L'alerte du Dashboard suffit tant que les personnes sont prévenues de vive voix ; sinon ajouter une notification sans détail financier |
| Aucune politique de sécurité du contenu (CSP) | Ajouter une CSP avec nonce avant la mise en production avec de vraies données |
| La limite de débit de Better-Auth est en mémoire, non partagée entre les instances Vercel | Utiliser un stockage partagé, ou une règle du pare-feu Vercel sur `/api/auth/*` |
| La personne qui détient `ENCRYPTION_KEY` et l'accès à la base peut tout déchiffrer | Limiter qui détient ces secrets ; un chiffrement par utilisateur demanderait une autre conception |

### Dépôt public

Ne versionnez jamais de secret, de base de données ni de relevé bancaire. `.gitignore` exclut `.env*` (sauf `.env.example`), les bases locales, `data/` et les fichiers `*.csv`, `*.ofx`, `*.qfx`, `*.qif`, `*.xls`, `*.xlsx`.

## Conventions de développement

- **Commentaires en français.** Chaque fonction nommée a une description (`/** … */`), vérifiée par ESLint.
- **Découpage atomique** de l'interface, vérifié par ESLint.
- **Couverture de test complète :** tout changement vient avec ses tests ; `npm test` échoue sous 100 %.
- **Sécurité :** pour chaque évolution, identifier les risques et noter comment les limiter.
- **Documentation :** garder ce README et la documentation de mise en production à jour.
- **Commits** au format [Conventional Commits](https://www.conventionalcommits.org/fr/) (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`…) : un titre court, puis une description qui liste chaque point réalisé.

```text
feat(comptes): titre court

- Premier point réalisé
- Deuxième point réalisé
```

Avant de pousser :

```powershell
npm run typecheck
```

```powershell
npm run lint
```

```powershell
npm test
```

## Dépannage

| Symptôme | Cause probable |
|---|---|
| `Variables d'environnement invalides` | `.env` incomplet : le message nomme chaque variable en cause |
| GitHub signale une erreur de `redirect_uri` | L'URL de callback ne correspond pas à `BETTER_AUTH_URL` |
| L'administrateur est refusé | `ADMIN_EMAIL` diffère de l'adresse transmise par GitHub (voir l'étape 4) |
| Erreur `429` à la connexion | Limite de débit en production : attendez quelques secondes |
| Impossible d'ajouter une passkey | La session est trop ancienne : reconnectez-vous |
| Erreur `no such table` après une mise à jour | Lancez `npm run db:setup` |

## Dépendances à surveiller

- **ESLint 9** n'est plus maintenu, mais des plugins de `eslint-config-next` ne déclarent pas encore ESLint 10.
- **TypeScript 6** : `typescript-eslint` n'accepte pas encore TypeScript 7.
- **`effect`** est forcé en 3.22.5 (`overrides` dans `package.json`) : la version imposée par le CLI Prisma 7.10.1 est signalée comme vulnérable par `npm audit`. Retirez ce forçage quand Prisma aura mis à jour sa dépendance.
- **`@libsql/client`** reste en 0.17, version exigée par `@prisma/adapter-libsql` 7.10.1.
- **`jsdom` 29** et **`eslint-plugin-jsdoc` 62** : les versions plus récentes exigent Node.js 24.15 au minimum.
