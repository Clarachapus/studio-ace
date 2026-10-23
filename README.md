# STUDIO A.C.E — site web

Site bilingue (FR/EN) d'architecture et de sculpture. Arche · Cactus · Escalier.
Projet indépendant : ses propres comptes (Resend, Turnstile, Vercel), aucun lien avec d'autres sites.

## Démarrer en local

```bash
cp .env.example .env.local   # clés optionnelles en local
npm install
npm run dev                  # http://localhost:3000
```

- Site : `http://localhost:3000/fr` ou `/en`
- Éditeur : `http://localhost:3000/admin` (local uniquement, renvoie 404 en production)

## Modifier le contenu

Tout est dans `content/` et validé au build (un contenu invalide fait échouer le build, jamais une page cassée).

| Quoi | Où | Comment |
|---|---|---|
| Projets | `content/projects/<slug>.json` | via `/admin/projects` (formulaire FR/EN + upload d'images) |
| Sculptures | `content/sculptures/<slug>.json` | via `/admin/sculptures` |
| Page À propos | `content/pages/about.json` | via `/admin/about` (éditeur structuré) |
| Infos du site, email des leads, SEO | `content/site.json` | via `/admin/site` |
| Images du héros parallaxe | `content/hero.json` + `public/media/hero/` | à la main : déposer 3 images (fond, milieu, avant-plan) et renseigner les chemins |
| Textes d'interface (menus, boutons) | `messages/fr.json`, `messages/en.json` | à la main |

Les images uploadées via l'éditeur sont converties en WebP (2400 px max) dans `public/media/<type>/<slug>/`.
Les textes marqués `[À REMPLIR]` / `[TO FILL]` sont des placeholders à remplacer.

## Leads

Les formulaires (contact et demande de pièce) appellent `POST /api/leads` : validation, honeypot, Turnstile, puis email via Resend à `site.json → leadsEmail`, avec accusé de réception au visiteur.
Sans clés (`RESEND_API_KEY`, `LEADS_FROM_EMAIL`) en local, les leads vont dans `.leads/leads.jsonl`.

## Scripts

```bash
npm run typecheck   # tsc
npm run lint        # eslint
npm run test        # tests unitaires (Vitest)
npm run test:e2e    # tests de bout en bout (Playwright, build + start sur le port 3100)
npm run build       # build de production
npm run placeholders # régénère les images de démonstration
./backup.sh "desc"  # snapshot source vers /Volumes/Crucial X9/STUDIO ACE/STUDIO ACE V<N>/
```

## Partager un aperçu (WhatsApp, email)

```bash
./scripts/share.sh
```

Le script construit une version de production, puis ouvre un lien public temporaire `https://….trycloudflare.com/fr` via Cloudflare, sans compte.

- L'éditeur `/admin` n'est pas accessible depuis ce lien.
- Le lien ne marche que tant que le script tourne et que le Mac reste allumé et éveillé. Ctrl+C arrête le partage.
- Chaque lancement donne une nouvelle adresse.
- Les moteurs de recherche reçoivent une consigne de non-indexation.
- Sans clés Resend, les formulaires de contact affichent une erreur d'envoi sur l'aperçu.

Pour mettre à jour le site derrière un lien déjà envoyé, sans changer l'adresse :

```bash
./scripts/share-refresh.sh
```

Pour un lien permanent, il faut déployer sur Vercel avec le compte du studio.

## Mise en ligne

Vercel : importer le dépôt, renseigner les variables de `.env.example`, déployer. Domaine personnalisé dans le tableau de bord Vercel.
Avant chaque mise en ligne : `npm run typecheck && npm run lint && npm run test && npm run build`.

## Faire évoluer l'éditeur vers une édition en ligne (V2)

Tout passe par l'interface `ContentStore` (`src/lib/content/store.ts`). Remplacer `FsContentStore` par une implémentation base en ligne + stockage d'images, ajouter une authentification sur `/admin`, et lever la garde dev-only dans `src/proxy.ts` et `src/lib/admin/guard.ts`. L'interface de l'éditeur ne change pas.

## Notes

- Disque exFAT : macOS crée des fichiers `._*`. Ils sont ignorés par git, eslint et vitest ; `find . -name '._*' -delete` si besoin.
- Le build supprime `.next` d'abord (le cache Turbopack n'aime pas l'exFAT).
- En local, l'optimisation d'images Next est désactivée : les fichiers `._*` corrompent son cache sur exFAT. Elle reste active sur Vercel.
- Les tests de bout en bout construisent dans `.next-e2e`, pour ne pas écraser le cache du serveur de dev.

test
