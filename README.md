# Luminary Events

Une plateforme moderne pour découvrir, créer et gérer des événements. Application full-stack avec authentification OAuth (Google), base de données SQLite, et interface React/TypeScript.

## Fonctionnalités

- **Découverte d'événements** : Parcourez et filtrez des événements par catégorie.
- **Création d'événements** : Organisateurs peuvent créer et gérer leurs événements.
- **Billetterie simulée** : Réservation de billets avec mise à jour en temps réel.
- **Authentification** : Connexion via Google OAuth ou inscription locale (email/mot de passe).
- **Persistance** : Base de données SQLite pour utilisateurs et événements.

## Technologies

- **Frontend** : React 19, TypeScript, Tailwind CSS, Vite
- **Backend** : Node.js, Express, Passport.js (Google OAuth), SQLite
- **Authentification** : Google OAuth 2.0 + inscription locale avec bcrypt
- **Base de données** : SQLite avec sqlite3

## Installation et exécution

### Prérequis

- Node.js (version 18+)
- npm ou yarn

### Étapes

1. **Cloner le projet** :
   ```bash
   git clone <url-du-repo>
   cd luminary-events
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement** :
   - Copiez `.env` et ajustez les valeurs :
     ```
     GOOGLE_CLIENT_ID=votre_client_id_google
     GOOGLE_CLIENT_SECRET=votre_client_secret_google
     GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
     SESSION_SECRET=votre_clef_secrète
     FRONTEND_URL=http://localhost:5173
     ```
   - Pour l'auth Google : Créez une app OAuth sur [Google Cloud Console](https://console.cloud.google.com/), ajoutez `http://localhost:3000/auth/google/callback` comme URI de redirection.

4. **Démarrer la base de données** :
   - Le serveur crée automatiquement `database.db` avec les tables et données initiales.

5. **Lancer l'application** :
   - **Backend** (dans un terminal) :
     ```bash
     npm run start:server
     ```
     Serveur sur http://localhost:3000
   - **Frontend** (dans un autre terminal) :
     ```bash
     npm run dev
     ```
     App sur http://localhost:5173

6. **Accéder à l'app** :
   - Ouvrez http://localhost:5173 dans votre navigateur.
   - Inscrivez-vous ou connectez-vous pour créer/réserver des événements.

## Scripts disponibles

- `npm run dev` : Lance le frontend en mode développement.
- `npm run build` : Construit le frontend pour la production.
- `npm run start:server` : Lance le serveur backend.
- `npx tsc --noEmit` : Vérifie les types TypeScript.

## Structure du projet

```
luminary-events/
├── components/          # Composants React réutilisables
├── services/            # Services (ex. Gemini AI)
├── server.js            # Serveur Express avec auth et API
├── App.tsx              # Composant principal React
├── index.tsx            # Point d'entrée frontend
├── types.ts             # Types TypeScript
├── vite.config.ts       # Config Vite (avec proxy)
├── package.json         # Dépendances et scripts
├── .env                 # Variables d'environnement (non commité)
└── database.db          # Base de données SQLite (générée)
```

## API Endpoints

- `GET /api/events` : Liste des événements
- `POST /api/events` : Créer un événement (auth requis)
- `POST /api/events/:id/buy` : Acheter un billet (auth requis)
- `POST /auth/register` : Inscription locale
- `POST /auth/login` : Connexion locale
- `GET /auth/google` : Démarrer OAuth Google
- `GET /auth/logout` : Déconnexion

## Déploiement

### Frontend (Vercel)

1. Poussez le code sur GitHub.
2. Connectez votre repo à [Vercel](https://vercel.com).
3. Déployez : Vercel détecte automatiquement Vite et construit le frontend.
4. URL du frontend : `https://votre-app.vercel.app`

### Backend (Railway)

1. Créez un compte sur [Railway](https://railway.app).
2. Connectez votre repo GitHub.
3. Ajoutez une base de données PostgreSQL dans Railway.
4. Dans les variables d'environnement de Railway :
   - `DATABASE_URL` : URL de la DB PostgreSQL (remplacez SQLite)
   - `GOOGLE_CLIENT_ID` : Votre ID client Google
   - `GOOGLE_CLIENT_SECRET` : Votre secret Google
   - `GOOGLE_CALLBACK_URL` : `https://votre-backend.railway.app/auth/google/callback`
   - `SESSION_SECRET` : Une clé secrète aléatoire
   - `FRONTEND_URL` : `https://votre-app.vercel.app`
5. Déployez le backend.
6. Mettez à jour le proxy dans `vite.config.ts` pour pointer vers l'URL Railway en production.

### Configuration pour Production

- **Base de données** : Remplacez SQLite par PostgreSQL en utilisant `DATABASE_URL`.
- **Auth Google** : Ajoutez l'URL de production comme URI autorisée dans Google Cloud Console.
- **CORS** : Assurez-vous que `FRONTEND_URL` pointe vers votre domaine Vercel.

### Variables d'Environnement de Production

Créez un fichier `.env.production` ou configurez dans le service de déploiement :

```
DATABASE_URL=sqlite:./database.db  # ou PostgreSQL URL
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://votre-backend.railway.app/auth/google/callback
SESSION_SECRET=votre_secret_unique
FRONTEND_URL=https://votre-app.vercel.app
VITE_API_BASE=https://votre-backend.railway.app
```

### Test Local

- Frontend : `npm run dev`
- Backend : `npm run start:server`
- Ouvrez `http://localhost:5173`

L'application est maintenant fonctionnelle et prête pour le déploiement !
# Luminary-events
