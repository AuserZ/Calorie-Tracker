# Eat·en

A simple personal calorie tracker: snap a photo of food → Gemini estimates calories + macros → log to a daily diary. Track weight over time. See whether you ate too much today.

Stack: **Next.js 16 + Tailwind v4 + Firebase Firestore + Google Gemini Flash**.
Single user, no login. Server-side Gemini key. Food images saved locally to `public/meals/`.

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Create a Firebase project

1. Go to https://console.firebase.google.com → **Add project**
2. **Build → Firestore Database → Create database** (test mode, region nearest you)
3. **Project settings (⚙) → General → Your apps → Web (`</>`)** → register a web app, copy the config values

> Storage is **not** used. Food photos are saved locally by `/api/analyze` to `public/meals/` (gitignored). This means uploads only persist on the machine running the server.

### 3. Get a Gemini API key

https://aistudio.google.com/app/apikey → **Create API key**

### 4. Configure env vars

Copy `.env.example` → `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

```
GEMINI_API_KEY=AIza...                          # server-only

NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...
```

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000. The app will prompt you to enter your profile (age, height, weight, activity, goal) on first run.

---

## Architecture

```
Browser  ──photo──►  /api/analyze  ──►  Gemini Flash (server-side key)
                          │
                          ├─► saves image to public/meals/<id>.jpg
                          └─► returns { name, kcal, macros, confidence, imageUrl }
   │
   └──► Firestore (meal doc references imageUrl, no Storage)
```

- The Gemini key never reaches the browser — only `/api/analyze` can call Gemini.
- Food images are written to `public/meals/` on the server's filesystem and served as static files. **Vercel and most serverless hosts have read-only filesystems**, so this app is best run locally (or on a long-running Node server / VPS).
- Firestore talks directly to the browser via the Firebase Web SDK. Lock it down with security rules (see below).
- Single user model: everything is under `users/owner/...` in Firestore. There is no auth.

### Firestore layout

```
users/owner                          (profile)
users/owner/meals/{mealId}           (each logged meal)
users/owner/weights/{weightId}       (each weight entry)
```

---

## Security note

This app uses the Firebase client SDK with **no auth**. While you're testing locally, "test mode" rules are fine — they auto-expire after 30 days. Before sharing or deploying:

1. Enable **Anonymous Auth** in Firebase Console
2. Wire `signInAnonymously()` once at app boot
3. Lock Firestore rules to your single UID:
   ```
   match /users/owner/{document=**} {
     allow read, write: if request.auth != null && request.auth.uid == "<your-anon-uid>";
   }
   ```

Otherwise the URL is effectively public.

---

## Calorie target math

`lib/calories.ts` uses **Mifflin–St Jeor** for BMR, multiplied by an activity factor for TDEE, then ±500 / +300 kcal based on goal. You can override with `dailyTargetOverride` in the profile.

| Eaten / target | Verdict      |
| -------------- | ------------ |
| < 0.85         | Under target |
| 0.85–1.05      | On track     |
| 1.05–1.20      | Over         |
| > 1.20         | Way over     |

---

## Deploy

Because food images are written to the filesystem (`public/meals/`), this app does **not** work on Vercel/Netlify (read-only fs). To deploy:

- Run on a VPS / your own server with a persistent filesystem (`npm run build && npm start`).
- Or switch image storage back to a cloud service (Firebase Storage, Cloudflare R2, S3) — that means re-introducing the upload step we removed.
