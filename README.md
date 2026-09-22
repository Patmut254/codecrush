# Code Crush — React + Firebase

A tech-vocabulary word game for kids, built as a proper React project (Vite) with
optional Firebase Realtime Database progress syncing. Two play modes:

- **Trace Draw** — drag your finger/mouse across a 3×3 letter grid to spell the word (bold connecting line, no tapping required)
- **Drag Build** — drag letter tiles into slots to build the word

Three difficulty tiers (Rookie, Coder, Expert), word definitions shown on completion,
star ratings, a lives system, and celebration animations. Icons are real SVGs, no emoji.

## Project structure

```
code-crush-react/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
└── src/
    ├── main.jsx              # React entry point
    ├── App.jsx                # Screen/state management
    ├── index.css              # All styling
    ├── firebase.js            # Firebase init + progress read/write
    ├── data/
    │   └── wordDatabase.js    # Rookie / Coder / Expert word lists
    ├── hooks/
    │   └── useProgress.js     # Progress hook (Firebase, falls back to localStorage)
    └── components/
        ├── HomeScreen.jsx
        ├── GameScreen.jsx
        ├── HexTraceMode.jsx
        ├── WordBuilderMode.jsx
        ├── DefinitionPopup.jsx
        ├── CelebrationModal.jsx
        └── Icons.jsx
```

## 1. Install dependencies

```bash
npm install
```

## 2. Run it locally

```bash
npm run dev
```

This works immediately with **no Firebase setup** — progress is saved to
`localStorage` until you configure Firebase.

## 3. (Optional) Connect Firebase

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication → Sign-in method → Anonymous**.
3. Enable **Realtime Database**, and set rules (see below).
4. In Project settings → your web app, copy the config values.
5. Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

6. Restart `npm run dev`. Progress will now sync to Realtime Database under
   `users/{anonymousUid}/progress/{difficulty}`.

### Suggested Realtime Database rules

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## 4. Build for production

```bash
npm run build
```

Output goes to `dist/`. Deploy that folder to Firebase Hosting, Netlify, Vercel,
or any static host — for example, with Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # choose "dist" as the public directory
firebase deploy
```

## Customizing

- **Add words**: edit `src/data/wordDatabase.js`.
- **Change colors**: edit the CSS variables at the top of `src/index.css`.
- **Adjust the Trace Draw grid**: `HIT_RADIUS` / `NODE_RADIUS` / `CANVAS_SIZE` in
  `src/components/HexTraceMode.jsx`.
