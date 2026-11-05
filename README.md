# AI-Based Career Guidance System

A full-stack **MERN** application that provides AI-powered career guidance. Users register with username/password, secure their account with **2FA (TOTP)**, and ask an AI assistant (powered by a local Ollama LLM) for personalized career advice. Queries are saved to history.

This is the MERN rewrite of the original Flask prototype (`app.py`, kept for reference).

## Features

- **MongoDB** data layer (users + query history) via Mongoose
- **Express** REST API with JWT authentication
- **React** (Vite) frontend with routing and protected routes
- **2FA** using TOTP (`otplib`) with QR code setup
- **AI career guidance** via a local **Ollama** model (default `llama3`)
- Password hashing with **bcrypt** (no plaintext storage)

## Tech Stack

| Layer    | Technology                                   |
| -------- | -------------------------------------------- |
| Frontend | React 18, Vite, React Router, Axios          |
| Backend  | Node.js, Express                             |
| Database | MongoDB (Mongoose ODM)                        |
| Auth     | JWT + TOTP 2FA (`otplib`, `jsonwebtoken`)     |
| AI       | Ollama (`ollama` npm package, local model)    |

## Prerequisites

1. **Node.js** v18+
2. **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or MongoDB Atlas
3. **Ollama** installed and a model pulled — start it with:
   ```bash
   ollama run llama3
   ```
   (You can change the model via `OLLAMA_MODEL` in `server/.env`.)

## Installation

From the project root:

```bash
npm run install:all
```

This installs both `server/` and `client/` dependencies.

## Configuration

Copy the example env file and adjust values:

```bash
cp server/.env.example server/.env
```

Key settings in `server/.env`:

```
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/career_guidance
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
OLLAMA_MODEL=llama3
OLLAMA_HOST=http://127.0.0.1:11434
```

## Running the App

Start the backend and frontend in two terminals:

```bash
# Terminal 1 — backend
npm run server

# Terminal 2 — frontend
npm run client
```

Then open **http://localhost:5173**.

## How It Works

1. **Register** — creates an account and returns a TOTP secret + QR code.
2. **Set up 2FA** — scan the QR code in Google Authenticator / Authy, then enter the OTP on the Verify screen. This activates your account.
3. **Login** — enter username/password, then confirm with the OTP from your app.
4. **Dashboard** — ask career questions; the AI returns structured guidance (paths, skills, resources, next steps). Your recent queries are listed below.

## API Endpoints

| Method | Route                  | Auth     | Description                          |
| ------ | ---------------------- | -------- | ------------------------------------ |
| POST   | `/api/auth/register`   | Public   | Register + get 2FA QR code           |
| POST   | `/api/auth/login`      | Public   | Login, returns pre-2FA token         |
| POST   | `/api/auth/verify`     | Public   | Verify OTP, returns session JWT      |
| POST   | `/api/guidance`        | JWT + 2FA| Get AI career guidance               |
| GET    | `/api/guidance/history`| JWT + 2FA| Get recent queries                    |
| GET    | `/api/health`          | Public   | Health check                          |

## Project Structure

```
Ai project/
├── package.json            # root convenience scripts
├── README.md
├── server/                 # Express + MongoDB + Ollama
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js
│       ├── config/db.js
│       ├── models/User.js, Query.js
│       ├── utils/otp.js
│       ├── middleware/auth.js
│       ├── controllers/authController.js, guidanceController.js
│       └── routes/auth.js, guidance.js
└── client/                 # React + Vite
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx, App.jsx
        ├── api/api.js
        ├── context/AuthContext.jsx
        ├── components/Navbar.jsx, ProtectedRoute.jsx
        ├── pages/Login.jsx, Register.jsx, Verify.jsx, Dashboard.jsx
        └── styles/index.css
```

## Notes

- The legacy Flask app lives in `app.py` (and `templates/`, `requirements.txt`) for reference and can be removed once you're done migrating.
- If the AI endpoint returns a 503, make sure Ollama is running and the model is pulled.


## Deployment

The app is configured to deploy as a **single free web service** on Render, with
**MongoDB Atlas** for the database and **Groq** for the AI (local dev still uses
Ollama — no Groq key needed locally). When deployed, Express serves both the API
and the built React frontend on one public URL.

See **[DEPLOY.md](./DEPLOY.md)** for the full step-by-step guide (accounts, keys,
and Render config). A `render.yaml` Blueprint is included for one-click deploys.

Quick deploy summary:
1. MongoDB Atlas → get `MONGO_URI`
2. Groq → get `GROQ_API_KEY`
3. Render → New → Blueprint → pick this repo → paste `MONGO_URI` and `GROQ_API_KEY` → Apply
4. Open `https://<your-service>.onrender.com`

> The Groq model is configurable via `GROQ_MODEL` (default `openai/gpt-oss-120b`).
> See https://console.groq.com/docs/models for current model IDs.
