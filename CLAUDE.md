@AGENTS.md

# STUDIO A.C.E — règles projet

- Projet INDÉPENDANT (client tiers). Ne jamais partager code, comptes ou données avec Like a Lundi Films ou d'autres projets.
- Avant toute modification : `./backup.sh "description"` (snapshot V<N+1> dans `/Volumes/Crucial X9/STUDIO ACE/`).
- Avant de dire "fait" : `npm run typecheck && npm run lint && npm run test && npm run build`.
- Contenu : `content/` (JSON validé par Zod, `src/lib/content/schemas.ts`). Éditeur `/admin` = dev uniquement.
- Spec : `docs/superpowers/specs/2026-09-15-studio-ace-design.md`.
- exFAT : supprimer les `._*` (`find . -name '._*' -not -path './node_modules/*' -delete`) si un outil se plaint.
