# Deployment Guide — AI-Based Career Guidance System

This guide deploys the app as a **single free web service on Render**, with
**MongoDB Atlas** for the database and **Groq** for the AI. When deployed, Express
serves both the API and the built React frontend on one public URL.

> Local dev still uses **Ollama** (no Groq key needed). In production, Groq is used.

---

## What you'll get

- One public URL, e.g. `https://ai-career-guidance.onrender.com`
- The React app + API on the same host (no CORS headaches)

## Accounts you need (all free to start)

| Service | Sign up | Why |
| ------- | ------- | --- |
| MongoDB Atlas | https://www.mongodb.com/cloud/atlas/register | Hosted MongoDB |
| Groq | https://console.groq.com | AI API key |
| Render | https://render.com | Host the app |

---

## Step 1 — MongoDB Atlas (database)

1. Create a free **M0** cluster (any cloud/region close to you).
2. **Database Access** → add a database user (username + password) — save these.
3. **Network Access** → add `0.0.0.0/0` (allow connections from anywhere, since
   Render's IP changes). For tighter security you can later restrict to Render's
   egress, but `0.0.0.0/0` is the simple path for a demo.
4. Click **Connect → Drivers → Node.js** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<username>` and `<password>` with the ones from step 2.

   👉 This is your **`MONGO_URI`**.

## Step 2 — Groq (AI)

1. Sign in at https://console.groq.com
2. Go to **API Keys** → **Create API Key** → copy it.

   👉 This is your **`GROQ_API_KEY`**.

   > Groq's Developer plan is usage-based; for a low-traffic demo the cost is
   > negligible (fractions of a cent per query). The default model
   > `openai/gpt-oss-120b` is set via `GROQ_MODEL`.

## Step 3 — Render (host the app)

### Option A — Blueprint (easiest, recommended)

The repo already contains `render.yaml`.

1. Go to the Render Dashboard → **New** → **Blueprint**.
2. Select your GitHub account and the `ai-based-career-guidance-system` repo.
3. Render detects `render.yaml` and shows the service.
4. It prompts for the two `sync: false` env vars — enter:
   - **`MONGO_URI`** → your Atlas connection string
   - **`GROQ_API_KEY`** → your Groq key
5. Click **Apply**. Render builds and deploys.

### Option B — Manual web service

1. Dashboard → **New** → **Web Service** → connect the GitHub repo.
2. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
3. **Environment variables** — add:
   | Key | Value |
   | --- | --- |
   | `MONGO_URI` | your Atlas connection string |
   | `GROQ_API_KEY` | your Groq key |
   | `JWT_SECRET` | any long random string |
   | `JWT_EXPIRES_IN` | `1d` |
   | `GROQ_MODEL` | `openai/gpt-oss-120b` |
4. **Create Web Service**.

## Step 4 — Open your app

When the deploy finishes, Render shows a URL like
`https://ai-career-guidance.onrender.com`. Open it:

- Register → scan the 2FA QR code → verify the OTP → log in → ask career questions.

Sanity check the backend with:
```
https://<your-app>.onrender.com/api/health   →  {"status":"ok"}
```

---

## Notes & troubleshooting

- **Free-tier cold starts:** Render's free web services sleep after ~15 min of
  inactivity. The first request after sleep takes ~30–60s to wake up.
- **MongoDB IP:** if the app can't connect, ensure Atlas Network Access allows
  `0.0.0.0/0`.
- **Groq model retired error:** Groq occasionally retires model IDs. If the AI
  returns a model-not-found error, set `GROQ_MODEL` to a current one from
  https://console.groq.com/docs/models (e.g. `openai/gpt-oss-20b`).
- **Want it public/visible to a reviewer:** Render URLs are public by default, so
  anyone with the link can use the app.
