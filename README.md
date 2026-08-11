# Galaxy Sinks™

Reconstruction complète du site `galaxysink.netlify.app` : le frontend (HTML/CSS/JS)
a été récupéré tel quel depuis le site en ligne, et le backend a été reconstruit à
partir du contrat d'API que le frontend appelle (`/api/...`), puisque le code
serveur d'origine n'était plus déployé (toutes les routes `/api/*` renvoyaient un
404 Netlify au moment de la reconstruction).

## Stack

- Frontend : HTML/CSS/JS statique (aucun framework), identique aux fichiers servis
  par le site d'origine.
- Backend : [Netlify Functions](https://docs.netlify.com/functions/overview/)
  (format v2, `export default async (req) => ...`).
- Stockage : [Netlify Blobs](https://docs.netlify.com/blobs/overview/) — aucune
  base de données externe à provisionner.

## Démarrage

`npm install` n'installe que la petite dépendance `@netlify/blobs` — le CLI Netlify
n'est **pas** requis en dépendance locale : Netlify installe lui-même les paquets
sur ses serveurs au moment du déploiement.

### Option A — déployer directement (recommandé si peu d'espace disque local)

Sur [app.netlify.com](https://app.netlify.com) :
- **Glisser-déposer** ce dossier (bouton "Deploy manually"), ou
- **Connecter un repo Git** (push ce dossier sur GitHub/GitLab, puis "Import an
  existing project" sur Netlify)

Dans les deux cas, Netlify build et exécute `npm install` de son côté — rien à
installer sur ta machine.

### Option B — tester en local avec `netlify dev`

```bash
npm install
npx netlify-cli link   # ou: npx netlify-cli init, pour lier ce dossier à ton site Netlify
npx netlify-cli dev    # lance le site + les fonctions en local sur http://localhost:8888
```

`npx netlify-cli` télécharge le CLI à la volée sans l'ajouter en dépendance
permanente au projet (utile si l'espace disque local est limité). `netlify dev`
émule Netlify Blobs localement, donc les comptes créés en local sont utilisables
sans configuration supplémentaire.

## Variables d'environnement à configurer sur Netlify

À définir dans **Site settings → Environment variables** (ou `netlify env:set`) :

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DISCORD_CLIENT_ID` | Pour la connexion Discord | ID de ton application Discord |
| `DISCORD_CLIENT_SECRET` | Pour la connexion Discord | Secret de ton application Discord |
| `DISCORD_REDIRECT_URI` | Optionnel | Par défaut `https://<ton-site>.netlify.app/api/auth/discord/callback`. À renseigner uniquement si tu utilises un domaine personnalisé. |
| `TRACKER_GG_API_KEY` | Optionnel | Clé d'API [tracker.gg](https://tracker.gg/developers) pour fiabiliser la récupération automatique des rangs (voir limite ci-dessous). |
| `DISCORD_APPLICATIONS_WEBHOOK` | Optionnel | Webhook Discord pour recevoir les candidatures (`/rejoindre`) directement dans un salon. |
| `ADMIN_TOKEN` | Optionnel | Jeton secret pour basculer le bandeau "match en cours" (voir plus bas). |

### Configurer Discord OAuth

1. Crée une application sur https://discord.com/developers/applications
2. Dans **OAuth2 → General**, ajoute comme *Redirect* :
   `https://<ton-site>.netlify.app/api/auth/discord/callback`
3. Copie le **Client ID** et le **Client Secret** dans les variables d'environnement
   ci-dessus.

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
puis stockée dans Netlify Blobs (store `avatars`) et servie via `/api/avatar?id=...`.
Formats acceptés : PNG, JPEG, WebP — 2 Mo max après redimensionnement.

## Clips soumis par les membres

Upload de fichier vidéo réel (pas de lien externe), stocké dans Netlify Blobs
(store `clips-video`) et modéré avant publication (`clips-meta`, statut
`pending`/`approved`/`rejected`).

**Limite importante** : les fonctions Netlify plafonnent le corps de requête à
6 Mo. En tenant compte du surcoût du base64 (~33 %), la vidéo décodée est donc
limitée à **4 Mo** côté serveur (`netlify/functions/clips-submit.js`) — adapté à
un clip très court (quelques secondes, typiquement une reprise de but), pas à
une vidéo complète. Si cette limite est trop contraignante en pratique, la
solution la plus robuste serait de passer à une soumission par lien externe
(YouTube/Twitch/Discord) plutôt que par upload direct.

## Structure du projet

```
index.html, roster.html, competition.html, boutique.html,
clips.html, rejoindre.html, histoire.html, membre.html   → pages (copies exactes)
style.css, interactions.css, pages.css, ...               → styles (copies exactes)
common.js, script.js, roster.js, boutique.js, ...          → scripts client (copies exactes)
netlify/functions/                                         → API backend (reconstruite)
netlify/lib/                                                → logique partagée (sessions, rangs, blobs...)
netlify.toml                                                → mapping /api/* → fonctions
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
