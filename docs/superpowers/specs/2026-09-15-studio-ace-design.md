# STUDIO A.C.E — Design du site (V1)

Date : 2026-09-15. Client : STUDIO A.C.E (Arche, Cactus, Escalier). Projet totalement séparé de Like a Lundi Films : dossier, dépôt, comptes Resend/Vercel/Turnstile propres au client. Aucun code ni identifiant partagé.

## 1. Objectifs

1. Présenter les projets d'architecture (vitrine).
2. Présenter et vendre des sculptures en terre cuite, par demande de prix (pas de paiement en ligne en V1).
3. Générer des leads clients (formulaire projet + formulaire sculpture) livrés par email.
4. Permettre au client d'éditer le contenu via une page `/admin` locale (V1), évolutive vers une édition en ligne avec mot de passe (V2).

## 2. Stack

- Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS 4.
- GSAP + ScrollTrigger + Lenis pour le héros parallaxe (composant fourni par le client, adapté).
- next-intl pour le bilingue FR/EN, routes `/fr/...` et `/en/...`.
- Zod pour valider contenu et formulaires.
- Resend (email des leads) + Cloudflare Turnstile (anti-robot). Comptes au nom du client.
- Hébergement Vercel. Sauvegardes : `/Volumes/Crucial X9/STUDIO ACE/STUDIO ACE V<N>/` avant chaque modification (rsync source-only).

## 3. Direction artistique

Fil conducteur : terre cuite mexicaine. Un seul système visuel, trois densités.

- Palette : sable `#EFE6D8`, crème `#F7F1E7`, terre cuite `#B8562E`, brun cuit `#4A2B1F`, noir chaud `#1E1512`, ocre `#D99A5B`. Pas de blanc pur ni de noir pur.
- Typographies : serif à caractère (Fraunces) pour les titres, sans-serif sobre (Inter) pour le texte. Chargées via next/font.
- Motifs A.C.E : arche = masque de cadrage des images (radius haut), escalier = grilles décalées en marches, cactus = silhouette SVG ponctuelle (séparateurs, page 404).
- Projets : galerie minimale, fond sable, images en arche, typographie fine.
- Sculptures : brut monumental, fond brun cuit, titres énormes, images pleine largeur.
- À propos : éditorial, fond crème, colonnes, lettrine, grandes photos d'atelier.
- Animations : révélation douce au scroll (GSAP), respect de `prefers-reduced-motion`.

## 4. Pages publiques

| Route | Contenu |
|---|---|
| `/[locale]` | Héros parallaxe (4 couches, titre STUDIO A.C.E), trois portes Arche/Cactus/Escalier vers Projets/Sculptures/À propos, projets mis en avant, sculptures mises en avant, appel à contact |
| `/[locale]/projets` | Grille minimale, filtre par type |
| `/[locale]/projets/[slug]` | Couverture, infos (lieu, année, type, surface), galerie, texte, projet suivant |
| `/[locale]/sculptures` | Grille brute, filtre par statut |
| `/[locale]/sculptures/[slug]` | Images, matériau, dimensions, année, prix ou « sur demande », bouton « Demander cette pièce » |
| `/[locale]/a-propos` | Histoire du studio, signification A.C.E, atelier, équipe |
| `/[locale]/contact` | Formulaire projet + coordonnées |
| `/[locale]/mentions-legales`, `/[locale]/confidentialite` | Pages légales |

Slugs de route en anglais : `/en/projects`, `/en/sculptures`, `/en/about`, `/en/contact`, `/en/legal`, `/en/privacy`.

## 5. Modèle de contenu

Tout dans `content/`, validé par Zod au build (`src/lib/content/schemas.ts`).

- `content/projects/<slug>.json` : `slug, type (residential|public|interior|landscape), location, year, surface (m², optionnel), cover, gallery[], featured, order, fr{title, summary, description}, en{...}`.
- `content/sculptures/<slug>.json` : `slug, material, dimensions, year, status (available|sold|commission), price (number|null), images[], featured, order, fr{title, summary, description}, en{...}`.
- `content/pages/about.json` : `fr{...}, en{...}` (sections texte + images).
- `content/site.json` : nom, email de réception des leads, téléphone, adresse, réseaux, textes SEO fr/en.
- `content/hero.json` : chemins des 4 couches du héros (layer1, layer2, layer4 images ; layer3 = titre).
- Images : `public/media/projects/<slug>/`, `public/media/sculptures/<slug>/`, `public/media/hero/`, `public/media/about/`.

Textes d'interface (menus, boutons, labels) dans `messages/fr.json` et `messages/en.json`.

## 6. Éditeur `/admin`

- Route `/admin` (sans locale). Middleware : refusée hors `NODE_ENV=development` (404). API `/api/admin/*` protégée de la même façon.
- Couche de stockage `src/lib/content/store.ts` exposant une interface `ContentStore` : `listProjects, getProject, saveProject, deleteProject`, idem sculptures, `getAbout, saveAbout, getSite, saveSite, uploadImage(kind, slug, file)`. Implémentation V1 : `FsContentStore` (écrit les JSON et copie les images dans `public/media`). V2 : implémentation base en ligne, même interface, plus authentification.
- UI : liste des projets et sculptures, formulaire par entrée avec onglets FR/EN, upload d'images par glisser-déposer, réordonnancement, bouton « mis en avant », suppression avec confirmation. Édition d'À propos et des infos du site.
- Les images uploadées sont renommées en slug + index, redimensionnées côté serveur (sharp) à 2400 px max, converties en WebP.
- Après édition, le client prévient ; mise en ligne par git commit + push (Vercel).

## 7. Leads

- Deux formulaires : projet (`/contact`) et sculpture (fiche sculpture, champ pièce pré-rempli).
- Route `POST /api/leads` : validation Zod, champ honeypot, vérification Turnstile, envoi Resend vers `site.json.leadsEmail` avec Reply-To = email du visiteur, copie de confirmation au visiteur.
- En développement sans clés : le lead est journalisé en console et ajouté à `.leads/leads.jsonl` (ignoré par git). Jamais en production.
- Réponse UI : message de succès inline, erreurs de validation par champ.

## 8. Sécurité, légal, SEO

- Secrets uniquement dans `.env.local` (`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`). `.env.example` fourni.
- Rate limiting simple sur `/api/leads` (mémoire, par IP, 5/10 min) ; Vercel assure le reste.
- Headers de sécurité via `next.config.ts`.
- Pages légales et politique de confidentialité (RGPD : finalité, durée, droits, hébergement). À faire relire par un juriste.
- SEO : metadata par page fr/en, `hreflang`, sitemap, robots, Open Graph, images `next/image`.

## 9. Tests

- Vitest : schémas Zod (contenu valide/invalide), `FsContentStore` (répertoire temporaire), validation des leads.
- Playwright smoke : accueil fr/en, liste et fiche projet, liste et fiche sculpture, contact rend le formulaire, `/admin` renvoie 404 en production.
- `npx tsc --noEmit` et `npm run build` verts avant chaque mise en ligne.

## 10. Hors périmètre V1

Paiement en ligne, édition en ligne authentifiée, CMS externe, newsletter, blog, gestion des leads dans l'éditeur.
