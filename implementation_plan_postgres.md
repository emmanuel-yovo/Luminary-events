# Plan : Migration vers PostgreSQL

Ce plan détaille la migration du système de stockage de SQLite vers une base de données PostgreSQL "réelle", plus adaptée à une production robuste.

## User Review Required

> [!WARNING]
> La migration vers PostgreSQL nécessite une instance Postgres active accessible via une URL de connexion (ex: `postgresql://user:password@localhost:5432/luminary`).
> Les données actuelles dans `database.db` ne seront pas migrées automatiquement. Un nouveau schéma sera créé dans Postgres.

> [!IMPORTANT]
> Je vais introduire une couche d'abstraction dans `database.js` pour permettre au code existant de fonctionner avec Postgres tout en changeant la syntaxe des placeholders (`?` vers `$1`).

## Proposed Changes

### Configuration & Infrastructure

#### [MODIFY] [database.js](file:///c:/Users/emman/OneDrive/Bureau/luminary-events/server/config/database.js)
- Améliorer l'initialisation du Pool `pg`.
- Créer un wrapper compatible avec l'API SQLite (`get`, `run`, `all`) mais utilisant Postgres en interne. Cela évitera de devoir réécrire 100% des appels dans les contrôleurs.
- Gérer la conversion automatique des placeholders `?` en `$1, $2` pour assurer la compatibilité descendante du code SQL.

### Backend Initialization

#### [MODIFY] [server.js](file:///c:/Users/emman/OneDrive/Bureau/luminary-events/server.js)
- Adapter la création initiale des tables pour la syntaxe Postgres (ex: types de données, contraintes).
- S'assurer que les injections de données initiales (Admin) fonctionnent.

### Controllers (Optionnel si le wrapper est parfait)

#### [MODIFY] [authController.js](file:///c:/Users/emman/OneDrive/Bureau/luminary-events/server/controllers/authController.js) & autres
- Revue minutieuse des requêtes pour détecter les spécificités SQL non compatibles (ex: dates, concaténation).

## Open Questions

- Avez-vous déjà une instance PostgreSQL de prête ? (Sinon, je peux configurer le code pour qu'il soit "PG-Ready" via une variable d'environnement `DATABASE_URL`).
- Souhaitez-vous utiliser un ORM comme **Prisma** ou **Sequelize**, ou préférez-vous rester sur du SQL brut pour garder un contrôle total ?

## Verification Plan

### Manual Verification
1. Configurer une `DATABASE_URL` pointant vers un Postgres local ou cloud (ex: Supabase, Neon).
2. Lancer le serveur et vérifier la création automatique des tables.
3. Tester une inscription et une connexion.
4. Vérifier que les événements sont bien lus et créés dans la nouvelle base.
