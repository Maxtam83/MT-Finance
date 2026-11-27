# MT Finance

Application web de gestion de finances personnelles et de patrimoine : interface complète sur ordinateur, PWA synthétique sur mobile.

**Lot 1 (socle) :** base de données, chiffrement AES-256-GCM, authentification sur liste blanche, administration des accès, compte joint à double validation et dissoluble par chacun, protections de sécurité et manifeste PWA. La création de comptes n'existe pas encore ; les sections Règles & Tags, Import et Investissements sont des pages d'attente.

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
- Un compte **GitHub** ou **Google**, pour créer l'accès de connexion

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

### 3. Créer l'accès de connexion de développement

Configurez au moins l'un des deux fournisseurs. Laissez vides les variables de celui que vous n'utilisez pas.

#### GitHub

Sur GitHub : **Settings → Developer settings → OAuth Apps → New OAuth App**.

| Champ | Valeur |
|---|---|
| Homepage URL | `http://localhost:3000` |
| Authorization callback URL | `http://localhost:3000/api/auth/callback/github` |

Copiez le *Client ID* dans `GITHUB_CLIENT_ID`, puis générez un *client secret* pour `GITHUB_CLIENT_SECRET`.

#### Google

Dans la console Google Cloud, ouvrez [Google Auth Platform → Clients](https://console.developers.google.com/auth/clients).

1. Créez un client de type **Web application** (« Application Web »).
2. Dans **Authorized redirect URIs** (« URI de redirection autorisés »), ajoutez exactement :

   ```text
   http://localhost:3000/api/auth/callback/google
   ```

   Ne la placez pas dans **Authorized JavaScript origins** (« Origines JavaScript autorisées ») : l'application n'en a pas besoin.
3. Copiez l'identifiant dans `GOOGLE_CLIENT_ID` et le secret dans `GOOGLE_CLIENT_SECRET`. Google n'affiche le secret qu'à la création du client.
4. Redémarrez `npm run dev` après avoir modifié `.env`.

Selon Google, un changement de ces réglages peut mettre **de 5 minutes à quelques heures** à s'appliquer. L'application ne demande que l'adresse email et le profil : dans ce cas, un projet au statut « Testing » n'impose pas de déclarer des utilisateurs de test.

### 4. Définir l'administrateur

`ADMIN_EMAIL` doit être l'adresse que le fournisseur transmet à l'application. Avec **GitHub** :

- si votre profil GitHub affiche un **email public**, c'est celui-là ;
- sinon, c'est votre **email principal**.

Avec **Google**, c'est l'adresse du compte Google utilisé pour vous connecter. Dans tous les cas, l'adresse doit être vérifiée chez le fournisseur.

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

1. Connectez-vous avec GitHub ou Google : le compte `ADMIN_EMAIL` reçoit le rôle `ADMIN`.
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
  lib/                  env, crypto, prisma, auth/, joint-accounts/, security/, validations/
  proxy.ts              politique de sécurité du contenu des pages
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

### Logo et animation d'ouverture

| Élément | Fichier |
|---|---|
| Logo dans l'application | `src/components/atoms/brand-mark.tsx` (SVG intégré) |
| Favicon | `src/app/icon.svg` |
| Icône Apple et icônes de la PWA | `src/app/apple-icon.png`, `public/icons/` |

Les icônes PNG montrent le logo sur le fond sombre `#06090d`. Après un changement de logo, remplacez **tous** ces fichiers. La version « maskable » doit garder une marge, car les téléphones en rognent les bords.

À l'ouverture, `SplashScreen` anime le logo pendant 2 secondes : le « M » monte, le « T » se trace, puis l'écran s'efface (styles dans `src/app/globals.css`). L'animation :

- se joue à chaque chargement complet (ouverture, actualisation, retour après connexion), mais pas en changeant de page dans l'application ;
- fonctionne en CSS seul, sans bloquer les clics ;
- est désactivée si le système demande de **réduire les animations**.

## Sécurité

### Accès

- **Inscription fermée :** seuls `ADMIN_EMAIL` et les adresses de `AllowedEmail` peuvent créer un compte. L'email doit être vérifié par le fournisseur.
- La liste blanche est revérifiée **à chaque nouvelle session** (OAuth ou passkey) et **à chaque requête protégée**. Retirer une adresse ferme ses sessions et annule ses demandes de compte joint.
- Chaque page et Server Action protégée appelle `requireAuth()` ou `requireAdmin()` (`src/lib/auth/guards.ts`). Un layout ou le masquage d'un lien ne suffisent pas.
- L'administrateur gère uniquement la liste blanche : il n'a aucun pouvoir sur les comptes ni sur leur partage.
- Les jetons OAuth sont chiffrés en base avec une clé liée à `BETTER_AUTH_SECRET`.
- En-têtes HTTP : `X-Frame-Options`, `X-Content-Type-Options` et `Referrer-Policy` (`next.config.ts`), complétés par une [politique de sécurité du contenu](#politique-de-sécurité-du-contenu).

### Compte joint

Un compte ne devient joint qu'avec **la validation des deux personnes**, chacune depuis sa propre session :

1. le propriétaire envoie une demande depuis **Comptes** : adresse de l'autre personne, référent des tags et accord explicite ;
2. la personne invitée voit le nom et le type du compte, l'auteur et le référent, puis accepte ou refuse.

Ensuite, **chacun peut mettre fin au partage seul** : la personne invitée quitte le compte, ou le propriétaire arrête le partage. Une pastille sur **Comptes** signale les demandes reçues.

| Risque | Protection |
|---|---|
| Découvrir qui utilise l'application | Réponse identique que l'adresse soit inscrite ou non |
| Agir sur la demande d'une autre personne | Chaque requête filtre sur l'identité tirée de la session |
| Partager le compte d'autrui | Envoi réservé au propriétaire ; même message si le compte n'existe pas |
| Accepter une vieille demande | Expiration après 7 jours ; annulation par son auteur |
| Valider deux fois, ou à plusieurs | Demande consommée dans une transaction ; deux membres au maximum |
| Situation modifiée entre l'envoi et la validation | Liste blanche et propriété revérifiées à la validation |
| Voir les tags privés de l'autre personne | À la validation, les tags de la personne non référente sont détachés des opérations, après avertissement des deux personnes |
| Ne plus pouvoir retirer son accord | Départ ou arrêt du partage à tout moment, avec effet immédiat |

Un compte joint utilise les tags d'une seule personne, le **référent** (`Account.tagOwnerId`), choisi dans la demande. Les droits de chacun sur les tags seront appliqués avec le lot « Règles & Tags ».

**À la fin du partage,** la personne invitée perd l'accès et le compte redevient personnel. Ses tags sont détachés des opérations du compte et ses règles limitées à ce compte sont supprimées. Les tags eux-mêmes, les opérations et les autres règles sont conservés. Les tags détachés, à l'activation comme à la fin du partage, ne sont pas rétablis.

### Limite de débit

En production, Better-Auth limite les appels à `/api/auth/*` (par exemple 3 demandes de connexion par 10 secondes et par adresse IP). Les compteurs sont enregistrés en base (table `RateLimit`) : ils sont **communs à toutes les instances** du serveur.

- L'adresse IP vient de l'en-tête `x-forwarded-for` transmis par l'hébergeur. Si vous ajoutez un proxy devant Vercel (un CDN par exemple), configurez `advanced.ipAddress.trustedProxies`. Sinon, tous les visiteurs risquent de partager le même compteur.
- La table contient des adresses IP. Les lignes périmées sont purgées quand une période de comptage se renouvelle.
- Cette limite ne concerne pas les Server Actions de l'application, réservées aux personnes connectées.

### Politique de sécurité du contenu

`src/proxy.ts` pose sur chaque page une CSP avec un jeton différent à chaque requête (`src/lib/security/csp.ts`). En production, seuls les scripts porteurs de ce jeton, et ceux qu'ils chargent, s'exécutent. Les ressources d'autres origines, les objets intégrés et l'affichage dans un cadre sont refusés. L'API a une politique entièrement fermée.

- Toutes les pages sont rendues à chaque requête, car le jeton change à chaque fois.
- En production, la seule insertion en ligne autorisée concerne les attributs `style`, nécessaires à des composants d'interface.
- En développement, la politique est assouplie pour le rechargement à chaud.
- Pour ajouter un script externe, transmettez-lui le jeton (en-tête `x-nonce`) ; pour un autre service, ajoutez son origine à la directive concernée. N'autorisez pas `unsafe-inline` pour les scripts.

### Chiffrement

`src/lib/crypto.ts` fournit `encrypt`, `decrypt` (format `ivHex:authTagHex:cipherTextHex`) et `hashImportId` (HMAC-SHA256 avec une sous-clé dérivée de `ENCRYPTION_KEY`). Les champs marqués `[CHIFFRÉ AES-256]` dans le schéma ne sont pas chiffrés automatiquement : le code qui les écrit doit appeler `encrypt`.

> **Sauvegardez `ENCRYPTION_KEY`.** Si elle est perdue ou changée, les données chiffrées sont définitivement illisibles. La rotation de clé n'est pas prévue.

### Risques connus, à traiter

| Risque | Pourquoi il reste | Ce qui le limite ou le traiterait |
|---|---|---|
| La personne qui détient `ENCRYPTION_KEY` et l'accès à la base peut tout déchiffrer | Le serveur chiffre avec une clé unique ; y remédier demanderait de refondre le chiffrement | Limiter qui détient ces secrets ; des clés par utilisateur demanderaient une autre conception |
| La personne invitée à un compte joint n'est pas notifiée par email | Choix actuel : aucun service d'envoi d'email | Pastille sur « Comptes » et alerte sur l'accueil ; prévenir la personne directement |
| Sur un compte joint, une règle ou une saisie pourrait poser un tag privé de la personne non référente | Les règles et la saisie des tags n'existent pas encore | **Au lot « Règles & Tags » :** n'appliquer que les règles du référent et refuser tout tag qui ne lui appartient pas |
| La limite de débit n'arrête pas un afflux massif de requêtes, qui consomme aussi le quota de la base | L'application ne peut agir qu'après avoir reçu la requête | En complément, au déploiement, une règle du pare-feu Vercel sur `/api/auth/*` |

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
| Erreur `redirect_uri_mismatch` (Google) ou `redirect_uri` (GitHub) | L'adresse déclarée chez le fournisseur n'est pas **exactement** `<BETTER_AUTH_URL>/api/auth/callback/google` (ou `/github`) : `http` ou `https`, port, casse et barre finale compris. Chez Google, vérifiez qu'elle est dans **Authorized redirect URIs** du client dont l'identifiant figure dans `.env`, puis patientez : le changement n'est pas toujours immédiat |
| L'administrateur est refusé | `ADMIN_EMAIL` diffère de l'adresse transmise par le fournisseur (voir l'étape 4) |
| Erreur `429` à la connexion | Limite de débit en production : attendez quelques secondes |
| Impossible d'ajouter une passkey | La session est trop ancienne : reconnectez-vous |
| Erreur `no such table` après une mise à jour | Lancez `npm run db:setup` |
| Un script ou un style ajouté reste sans effet et la console cite `Content Security Policy` | La ressource ne respecte pas la [politique de sécurité du contenu](#politique-de-sécurité-du-contenu) |

## Dépendances à surveiller

- **ESLint 9** n'est plus maintenu, mais des plugins de `eslint-config-next` ne déclarent pas encore ESLint 10.
- **TypeScript 6** : `typescript-eslint` n'accepte pas encore TypeScript 7.
- **`effect`** est forcé en 3.22.5 (`overrides` dans `package.json`) : la version imposée par le CLI Prisma 7.10.1 est signalée comme vulnérable par `npm audit`. Retirez ce forçage quand Prisma aura mis à jour sa dépendance.
- **`@libsql/client`** reste en 0.17, version exigée par `@prisma/adapter-libsql` 7.10.1.
- **`jsdom` 29** et **`eslint-plugin-jsdoc` 62** : les versions plus récentes exigent Node.js 24.15 au minimum.
