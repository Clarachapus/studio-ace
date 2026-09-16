# Mettre en ligne studio a.c.e avec son éditeur (Netlify, gratuit)

Résultat : https://studioace.fr pour le site, et https://studioace.fr/admin protégé par mot de passe,
où Clara modifie tout elle-même. Chaque enregistrement est sauvegardé dans SON dépôt GitHub,
et Netlify remet le site à jour tout seul 1 à 2 minutes plus tard. Tout est à son nom.

Coût : hébergement Netlify 0 €, nom de domaine studioace.fr déjà payé chez OVH.

## 1. Le code sur le GitHub de Clara (5 minutes)

1. Clara crée un compte gratuit sur https://github.com/signup.
2. Le code lui est remis dans un dépôt PRIVÉ à son nom, appelé `studio-ace-site`
   (transfert du dépôt existant vers son compte, ou envoi du code dans un dépôt vide qu'elle crée).

## 2. Netlify (5 minutes)

1. Sur https://app.netlify.com/signup, choisir « Sign up with GitHub » avec le compte de Clara.
2. « Add new site » puis « Import an existing project », « GitHub », choisir `studio-ace-site`.
   Netlify lit le fichier `netlify.toml` : ne rien changer aux réglages de build.
3. **Clé d'écriture GitHub** (connecté au GitHub de Clara) : https://github.com/settings/personal-access-tokens/new
   - Nom : `studio-ace-editeur`. Expiration : la plus longue proposée.
   - « Repository access » : « Only select repositories » puis `studio-ace-site`.
   - « Permissions » puis « Contents » : « Read and write ». Générer et copier la clé.
4. Dans Netlify, « Site configuration » puis « Environment variables », ajouter :

   | Nom | Valeur |
   |---|---|
   | `ADMIN_PASSWORD` | le mot de passe de Clara pour l'éditeur |
   | `GITHUB_TOKEN` | la clé copiée à l'étape 3 |
   | `GITHUB_REPO` | `pseudo-github-de-clara/studio-ace-site` |
   | `NEXT_PUBLIC_SITE_URL` | `https://studioace.fr` |

5. « Deploys » puis « Trigger deploy ». Le site répond à une adresse en `.netlify.app`.

## 3. Brancher studioace.fr (OVH, 10 minutes, puis jusqu'à 24 h de propagation)

1. Dans Netlify : « Domain management » puis « Add a domain », saisir `studioace.fr`,
   accepter d'ajouter aussi `www.studioace.fr`.
2. Dans l'espace client OVH : « Noms de domaine », `studioace.fr`, onglet « Zone DNS » :
   - Supprimer les enregistrements `A` et `AAAA` existants du domaine nu et de `www`.
   - Ajouter un enregistrement `A` : sous-domaine vide, cible `75.2.60.5`
     (adresse du répartiteur Netlify : vérifier celle affichée par Netlify à l'étape 1).
   - Ajouter un enregistrement `CNAME` : sous-domaine `www`, cible `nom-du-site.netlify.app.`
3. Revenir dans Netlify, « Verify DNS configuration ». Le cadenas HTTPS s'active tout seul.

## Ensuite

- Clara se connecte sur https://studioace.fr/admin avec son mot de passe.
- Demandes de sculpture : sans service d'envoi, le formulaire ouvre la messagerie du visiteur.
  Pour un e-mail automatique, ajouter `RESEND_API_KEY` et `LEADS_FROM_EMAIL`.
- Avant l'ouverture publique : acheter la licence web de la police Graphik.
- Retrouver une ancienne version : chaque modification est un « commit » dans GitHub,
  et Netlify garde chaque déploiement (« Deploys », « Publish deploy »).
