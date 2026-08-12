# Galaxy Sinks™

Reconstruction complète du site `galaxysink.netlify.app` : le frontend (HTML/CSS/JS)
a été récupéré tel quel depuis le site en ligne, et le backend a été reconstruit à
partir du contrat d'API que le frontend appelle (`/api/...`), puisque le code
serveur d'origine n'était plus déployé (toutes les routes `/api/*` renvoyaient un
404 Netlify au moment de la reconstruction).

## Stack

- Frontend : HTML/CSS/JS statique (aucun framework), identique aux fichiers servis
  par le site d'origine.
- Backend : serveur Node/Express (`server.js`) qui sert les fichiers statiques et
  adapte les handlers `netlify/functions/*.js` (format `export default async (req)
  => Response`, API Fetch standard) en routes Express — le code métier de chaque
  fonction n'a pas été réécrit, seule la couche de transport a changé.
- Stockage : [Upstash Redis](https://upstash.com) (plan gratuit) via
  `netlify/lib/blobs.js`, qui expose la même interface `getStore()` que Netlify
  Blobs (get/set/delete/list/getWithMetadata) — remplacement direct.

> Ce projet a été migré de Netlify vers Render. Les fichiers `netlify.toml` et le
> dossier `netlify/functions` restent au même endroit (le code métier n'a pas
> bougé), mais le routage `/api/*` et le stockage sont maintenant assurés par
> `server.js` + Upstash Redis plutôt que par Netlify Functions/Blobs.

## Démarrage

```bash
npm install
npm start   # lance le site + l'API sur http://localhost:3000 (PORT en variable d'env)
```

Sans les variables d'environnement ci-dessous, le serveur démarre normalement et
sert le site statique ; seules les routes `/api/*` qui en dépendent renverront une
erreur explicite (ex. `UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
manquants`) tant qu'elles ne sont pas configurées.

## Déployer sur Render

1. Sur [render.com](https://render.com) → **New → Web Service**, connecte ce repo Git.
2. **Build command** : `npm install` — **Start command** : `npm start`.
3. Renseigne les variables d'environnement ci-dessous dans **Environment**.
4. Une fois déployé, Render fournit une URL du type `https://<ton-service>.onrender.com`.

### Provisionner Upstash Redis (stockage — obligatoire)

1. Crée un compte gratuit sur [upstash.com](https://upstash.com) (pas de CB requise).
2. **Redis → Create Database** (type *Regional*, région proche de ton service Render).
3. Dans l'onglet **REST API** de la base, copie `UPSTASH_REDIS_REST_URL` et
   `UPSTASH_REDIS_REST_TOKEN` dans les variables d'environnement Render.

## Variables d'environnement à configurer sur Render

À définir dans **Environment** sur le dashboard Render :

| Variable | Obligatoire | Rôle |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Oui | URL REST de la base Upstash Redis (voir ci-dessus). |
| `UPSTASH_REDIS_REST_TOKEN` | Oui | Jeton REST de la base Upstash Redis. |
| `DISCORD_CLIENT_ID` | Pour la connexion Discord | ID de ton application Discord |
| `DISCORD_CLIENT_SECRET` | Pour la connexion Discord | Secret de ton application Discord |
| `DISCORD_REDIRECT_URI` | Optionnel | Par défaut `https://<ton-service>.onrender.com/api/auth/discord/callback`. À renseigner uniquement si tu utilises un domaine personnalisé. |
| `TRACKER_GG_API_KEY` | Optionnel | Clé d'API [tracker.gg](https://tracker.gg/developers) pour fiabiliser la récupération automatique des rangs (voir limite ci-dessous). |
| `DISCORD_APPLICATIONS_WEBHOOK` | Optionnel | Webhook Discord pour recevoir les candidatures (`/rejoindre`) directement dans un salon. |
| `ADMIN_TOKEN` | Optionnel | Jeton secret pour basculer le bandeau "match en cours" (voir plus bas). |

### Configurer Discord OAuth

1. Crée une application sur https://discord.com/developers/applications
2. Dans **OAuth2 → General**, ajoute comme *Redirect* :
   `https://<ton-service>.onrender.com/api/auth/discord/callback`
   (remplace l'ancienne redirect `.netlify.app` si le site a déjà été utilisé sur Netlify)
3. Copie le **Client ID** et le **Client Secret** dans les variables d'environnement
   ci-dessus.

> Le plan gratuit Render met le service en veille après 15 min d'inactivité (le
> premier chargement après une veille prend quelques secondes de plus le temps
> que l'instance redémarre) — comportement normal, pas un bug.

## Limite connue : récupération automatique des rangs

Le site d'origine annonce récupérer le rang automatiquement depuis Rocket League
Tracker Network à l'inscription. Tracker Network (tracker.gg) protège son site
public par Cloudflare et son **API officielle nécessite une clé** (payante /
soumise à rate-limit) — il n'existe pas d'endpoit public gratuit et stable pour
scraper les rangs par pseudo Epic Games.

`netlify/lib/tracker.js` implémente un appel best-effort vers l'API tracker.gg :
- Sans `TRACKER_GG_API_KEY`, les appels échoueront probablement (403/429).
- Avec une clé valide, la récupération automatique fonctionnera.
- Dans tous les cas, l'utilisateur peut définir son rang manuellement depuis son
  profil — c'est le même comportement de repli que sur le site d'origine.

## Panel admin (`/admin`)

Accessible uniquement aux comptes dont le pseudo du site est **`insane`** ou
**`shadow`** (insensible à la casse) — voir `netlify/lib/admin.js`. Pas de rôle
Discord ni de variable d'environnement : la liste est codée en dur, à modifier
directement dans ce fichier si l'équipe change.

Le panel permet :
- de basculer le bandeau "match en cours" (remplace l'usage manuel via curl —
  toujours possible avec `ADMIN_TOKEN` en plus, si besoin d'un accès scripté) ;
- de valider ou rejeter les clips soumis par les membres ;
- de marquer le rôle en jeu d'un membre comme "vérifié".

```bash
# Toujours possible en scripté, en plus du panel :
curl -X POST https://<ton-site>.netlify.app/api/live-match \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: <valeur de ADMIN_TOKEN>" \
  -d '{"isLive": true, "opponent": "Team Adverse", "streamUrl": "https://twitch.tv/galaxysinks", "note": "BO5"}'
```

## Photo de profil

Redimensionnée et recadrée en carré côté client (canvas, 256×256) avant l'envoi,
puis stockée dans Upstash Redis (store `avatars`) et servie via `/api/avatar?id=...`.
Formats acceptés : PNG, JPEG, WebP — 2 Mo max après redimensionnement.

## Clips soumis par les membres

Upload de fichier vidéo réel (pas de lien externe), stocké dans Upstash Redis
(store `clips-video`) et modéré avant publication (`clips-meta`, statut
`pending`/`approved`/`rejected`).

**Limite importante** : le corps de requête est limité à **4 Mo** de vidéo décodée
côté serveur (`netlify/functions/clips-submit.js`, en tenant compte du surcoût du
base64) — adapté à un clip très court (quelques secondes, typiquement une reprise
de but), pas à une vidéo complète. Testé jusqu'à 4 Mo sans problème sur le plan
gratuit Upstash. Si cette limite est trop contraignante en pratique, la solution
la plus robuste serait de passer à une soumission par lien externe
(YouTube/Twitch/Discord) plutôt que par upload direct.

## Structure du projet

```
index.html, roster.html, competition.html, boutique.html,
clips.html, rejoindre.html, histoire.html, membre.html   → pages (copies exactes)
style.css, interactions.css, pages.css, ...               → styles (copies exactes)
common.js, script.js, roster.js, boutique.js, ...          → scripts client (copies exactes)
server.js                                                   → serveur Express (statique + adaptateur API)
netlify/functions/                                          → logique métier des endpoints (inchangée)
netlify/lib/                                                → logique partagée (sessions, rangs, stockage Redis...)
netlify.toml                                                → conservé pour référence, plus utilisé par Render
```

## Ce qui est identique vs. reconstruit

- **Identique** : tout le HTML/CSS/JS servi au navigateur — récupéré directement
  depuis le site en ligne, donc rendu visuel et interactions front-end
  pixel-perfect.
- **Reconstruit** (le code serveur original n'existait plus) :
  - Authentification (comptes, sessions, Discord OAuth)
  - Classement et calcul de position
  - Récupération/définition des rangs
  - Candidatures (`/rejoindre`)
  - Bandeau "match en cours"
  - La liste des rangs (couleurs/libellés) suit la nomenclature standard de
    Rocket League en français ; si le site d'origine utilisait des couleurs
    différentes, ajuste `netlify/lib/ranks.js`.
