# Mise en production : Vercel + Turso

Objectif : publier l'application sur `https://<domaine>`.

Dans ce document, `<domaine>` désigne le nom de domaine de production, qui n'est volontairement pas écrit dans le dépôt. Remplacez-le par le vôtre.

> **État de cette procédure :** elle n'a pas encore été exécutée sur un vrai projet Vercel ni sur une vraie base Turso. L'application et le script de migration ont été testés en local seulement. Les libellés des tableaux de bord peuvent différer : corrigez ce document lors du premier déploiement.

> **Avant d'enregistrer de vraies données financières,** lisez les [risques connus](../README.md#risques-connus-à-traiter).

## Prérequis

- Le code sur GitHub (`Maxtam83/MT-Finance`)
- Un compte [Vercel](https://vercel.com) et un compte [Turso](https://turso.tech)
- L'accès à la zone DNS de votre domaine
- Le projet installé en local (voir le [README](../README.md))

Le CLI Turso n'est pas nécessaire.

## 1. Créer la base Turso

1. Dans le tableau de bord Turso, créez une base, de préférence dans une région européenne.
2. Copiez son URL (`libsql://…`).
3. Créez un token d'accès avec droits de **lecture et d'écriture**.

## 2. Envoyer le schéma

À la racine du projet, créez un fichier `.env.turso` (ignoré par git) :

```dotenv
DATABASE_URL="libsql://<base>-<organisation>.turso.io"
DATABASE_AUTH_TOKEN="<token>"
```

Contrôlez d'abord ce qui sera exécuté (aucune modification) :

```powershell
npm run db:deploy:turso:check
```

Vérifiez l'adresse affichée après « Base cible », puis appliquez :

```powershell
npm run db:deploy:turso
```

Sur une base neuve, trois migrations sont attendues : `…_init`, `…_joint_account_requests` puis `…_rate_limit`.

Le script joue les migrations manquantes dans l'ordre, chacune dans une transaction, et les note dans la table `_app_migrations`. Il s'arrête à la première erreur et refuse toute migration modifiée après son application. Les migrations ne sont **jamais** lancées automatiquement par Vercel.

Après le premier envoi, exécutez `PRAGMA foreign_keys;` dans la console SQL de Turso. La valeur attendue est `1` : les suppressions en cascade du schéma en dépendent. Si vous obtenez `0`, réglez ce point avant d'enregistrer des données réelles.

## 3. Préparer les secrets de production

Générez de **nouvelles** valeurs, différentes de celles du développement :

```powershell
npm run key:generate
```

- `ENCRYPTION_KEY` : enregistrez-la tout de suite dans un gestionnaire de mots de passe. **Sans elle, les données chiffrées sont perdues.**
- `BETTER_AUTH_SECRET` : lancez la commande une seconde fois.

## 4. Créer l'application OAuth de production

Configurez au moins un fournisseur. Dans les deux cas, créez une application **réservée à la production** : elle ne doit jamais accepter d'adresse `localhost`.

### GitHub

Une application OAuth GitHub n'accepte qu'une URL de callback : créez-en une **seconde**.

| Champ | Valeur |
|---|---|
| Homepage URL | `https://<domaine>` |
| Authorization callback URL | `https://<domaine>/api/auth/callback/github` |

### Google

Suivez les étapes Google du [README](../README.md#google) en créant un second client **Web application**, avec cette seule adresse dans **Authorized redirect URIs** :

```text
https://<domaine>/api/auth/callback/google
```

## 5. Créer le projet Vercel

1. **Add New → Project**, puis importez `MT-Finance`.
2. Conservez le préréglage **Next.js** et les commandes par défaut.
3. Vérifiez que la version de Node.js est **24.x** (`engines` dans `package.json`).
4. Ajoutez les variables suivantes, pour l'environnement **Production uniquement** :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL `libsql://…` de l'étape 1 |
| `DATABASE_AUTH_TOKEN` | Token de l'étape 1 |
| `ENCRYPTION_KEY` | Clé de production |
| `ADMIN_EMAIL` | Email administrateur (voir le README, étape 4) |
| `BETTER_AUTH_SECRET` | Secret de production |
| `BETTER_AUTH_URL` | `https://<domaine>` |
| `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET` | Application GitHub de production, si vous utilisez GitHub |
| `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` | Client Google de production, si vous utilisez Google |

5. Choisissez pour les fonctions une région proche de celle de la base Turso (réglages du projet, section des fonctions).
6. Déployez.

`prisma generate` est lancé par le script `postinstall`.

**Pare-feu (conseillé) :** si votre offre le permet, ajoutez dans le pare-feu Vercel une règle de limitation sur `/api/auth/*`. Elle complète la limite de débit de l'application en bloquant les afflux de requêtes avant qu'ils ne consomment le quota de la base.

**N'ajoutez pas de proxy ou de CDN devant Vercel** sans configurer `advanced.ipAddress.trustedProxies` : la limite de débit ne saurait plus distinguer les visiteurs.

**Déploiements de prévisualisation :** ne leur donnez jamais la base ni la clé de production. Sans variables propres, leur build échoue à la validation de l'environnement. La connexion OAuth n'y fonctionnerait de toute façon pas avec l'URL de production.

## 6. Brancher le domaine

1. Dans le projet Vercel, **Settings → Domains**, ajoutez `<domaine>`.
2. Chez votre hébergeur DNS, créez l'enregistrement demandé par Vercel (pour un sous-domaine, un `CNAME` portant son nom) avec **la valeur affichée par Vercel**.
3. Attendez que Vercel valide le domaine et le certificat HTTPS.

## 7. Vérifier la mise en ligne

- [ ] `/login` s'affiche en HTTPS.
- [ ] La connexion avec le compte administrateur affiche le rôle `ADMIN`.
- [ ] Un compte absent de la liste blanche est refusé avec un message clair.
- [ ] Après retrait d'une adresse dans l'administration, la personne est déconnectée.
- [ ] L'administration ne propose aucune action sur les comptes.
- [ ] La personne invitée peut quitter un compte joint et le propriétaire peut arrêter le partage (à vérifier quand la création de comptes existera).
- [ ] La console du navigateur ne signale aucune erreur `Content Security Policy`, y compris après la connexion.
- [ ] Quatre demandes de connexion en moins de 10 secondes : la quatrième est refusée (`429`).
- [ ] Les journaux Vercel ne contiennent pas le message `could not determine a client IP`. S'il apparaît, tous les visiteurs partagent le même compteur : corrigez avant d'ouvrir l'accès.
- [ ] Une demande de compte joint n'ouvre aucun accès avant la validation de la personne invitée (à vérifier quand la création de comptes existera).
- [ ] La police et les thèmes sombre et clair s'affichent correctement.
- [ ] Une passkey peut être ajoutée puis utilisée pour se connecter. **Ce parcours n'a pas encore été testé avec un véritable appareil.**
- [ ] L'application s'installe sur mobile et s'ouvre sans la barre du navigateur.
- [ ] L'icône installée montre le logo en entier, et l'animation d'ouverture se joue puis disparaît. **Ni l'icône installée ni l'animation n'ont encore été essayées sur un téléphone.**
- [ ] Les en-têtes de sécurité sont présents, dont `Content-Security-Policy` avec un jeton qui change à chaque appel :

Remplacez la valeur de la première commande par votre domaine :

```powershell
$domaine = "votre-domaine.exemple"
```

```powershell
(Invoke-WebRequest -Uri "https://$domaine/login" -Method Head -UseBasicParsing).Headers
```

Une passkey est liée à son domaine : celles créées sur `localhost` ne fonctionnent pas en production, et un changement de domaine oblige à les recréer.

## 8. Mettre à jour

### Sans changement de schéma

Lancez les contrôles, puis poussez sur `main` : Vercel déploie automatiquement.

```powershell
npm run typecheck
```

```powershell
npm run lint
```

```powershell
npm test
```

### Avec une migration

Faites-le dans cet ordre :

1. **Sauvegardez la base** (vérifiez les options de sauvegarde et de restauration de votre offre Turso).
2. `npm run db:deploy:turso:check`
3. `npm run db:deploy:turso`
4. Poussez le code sur `main`.

Entre les étapes 3 et 4, l'ancien code tourne sur le nouveau schéma. Une migration doit donc rester compatible avec lui. Pour supprimer ou renommer une colonne, procédez en deux livraisons : ajoutez d'abord la nouvelle forme et déployez le code qui l'utilise, puis supprimez l'ancienne.

**Relisez le SQL** de toute migration contenant `DROP TABLE`, `DROP COLUMN` ou `RedefineTables` avant de l'envoyer.

## 9. Revenir en arrière

- **Code :** dans Vercel, remettez en production le déploiement précédent.
- **Base :** il n'existe pas de migration inverse automatique. Créez une migration corrective ou restaurez la sauvegarde. Testez la restauration **avant** d'avoir des données importantes.

## 10. Gérer les secrets

| Secret | Si vous le changez |
|---|---|
| `ENCRYPTION_KEY` | **Ne pas changer :** les données chiffrées et les empreintes d'import deviennent inutilisables |
| `BETTER_AUTH_SECRET` | Tout le monde doit se reconnecter ; les jetons OAuth enregistrés ne sont plus lisibles |
| `DATABASE_AUTH_TOKEN` | Mettez à jour Vercel et `.env.turso`, puis redéployez |
| Secret OAuth | Mettez à jour Vercel, puis redéployez |

Après usage, vous pouvez supprimer `.env.turso` de votre poste.

## En cas de problème

| Symptôme | À vérifier |
|---|---|
| Build : `Variables d'environnement invalides` | Variables de l'environnement concerné dans Vercel |
| Erreur `no such table` | Les migrations n'ont pas été envoyées (étape 2) |
| Erreur de `redirect_uri` | `BETTER_AUTH_URL` et callback de l'application OAuth de production |
| Connexion impossible sur une URL `*.vercel.app` | Utilisez le domaine défini dans `BETTER_AUTH_URL` |
| Le script signale une migration modifiée | Restaurez le fichier d'origine et créez une nouvelle migration |
