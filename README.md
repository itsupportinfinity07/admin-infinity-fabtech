# Infinity Fabtech Admin

Admin panel for the Infinity Fabtech website. Next.js 15 + Firebase (Firestore + Auth). Images are stored as base64 documents in Firestore (`images` collection, served by `/api/img/[id]`).

## Setup
1. `npm install`
2. Fill `.env.local` (see `.env.example`). The service-account values come from Firebase > Project settings > Service accounts > Generate new private key (`client_email`, `private_key`). Never commit them.
3. In Firebase: create Firestore (production mode) and enable Authentication > Email/Password.
4. Firestore rules: deny everything (all access goes through the server): `allow read, write: if false;`
5. `npm run create-admin -- you@example.com 'a-long-password'`
6. `npm run seed` copies the current website content and images into Firestore (re-runnable).
7. `npm run dev`, then sign in at `/login`.

## What you can edit
Projects (info, map pin, photos, publish), map locations + other clients, jobs, page content, products, services, testimonials, users.

## Deploy (Vercel)
Add every variable from `.env.example` as a Vercel environment variable. `FIREBASE_PRIVATE_KEY` must keep its `\n` sequences.
