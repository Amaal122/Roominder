# Roominder — AI Roommate & Housing Matching Platform

Roominder is a Tunisian cross-platform mobile application that connects people seeking shared housing with compatible roommates and properties. An AI assistant built on the Groq API helps both tenants and property owners throughout the search, matching, and management flow.

## Repository structure

```
backend/               FastAPI backend services
  Ai_roomate/          Roommate matching engine (NLP vectorization + clustering, MediaPipe face detection)
  Ai_housing/          Property matching engine
  backend_user/        Tenant service: auth (JWT), profiles, favorites, matches, WebSocket chat, 2FA
  backend_propertyowner/  Owner service: properties, applications, visits, notifications, stats
  chatbot/             AI assistant (Groq llama-3.1-8b-instant) with owner/seeker role prompts
  db.py                SQLAlchemy / PostgreSQL setup
frontend/              Expo (React Native, TypeScript) mobile app, file-based routing
admin-dashboard/       Next.js admin dashboard + dedicated FastAPI admin backend
```

## How matching works

- Tenant and owner profiles are encoded with NLP embeddings (sentence-transformers).
- Candidate roommates and properties are grouped and ranked via clustering.
- Scoring weights: budget 35%, location 30%, rooms 20%, lifestyle 15%.
- Property owners can also review tenant profiles before approving applications.

## AI assistant

- Backed by the Groq API (`llama-3.1-8b-instant`), with separate system prompts and live context for:
  - **Owners** — property management, revenue/occupancy stats, visit scheduling, application review.
  - **Tenants** — housing and roommate search (constrained to real available listings, never invented), application and messaging guidance.
- Replies in French, Arabic, or English based on the user's language; conversation history (last 10 turns) is included per request.

## Stack

- **Frontend:** React Native (Expo), TypeScript, file-based routing
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL (psycopg), uvicorn, Cloudinary (media)
- **Auth & security:** python-jose (JWT), passlib/bcrypt, pyotp + QR (TOTP two-factor)
- **AI/ML:** sentence-transformers embeddings, clustering, MediaPipe/OpenCV (face detection), Groq `llama-3.1-8b-instant`
- **Real-time:** WebSocket chat with connection/room management

## Running locally

Backend:

```bash
cd backend
pip install -r requirements.txt
# configure database / env (see backend/config.py and .env)
uvicorn app:app --reload
```

Frontend:

```bash
cd frontend
npm install
npx expo start
```

Admin dashboard:

```bash
cd admin-dashboard/frontend
npm install
npm run dev
# plus admin-dashboard/backend: uvicorn main:app --port 8002
```

## Notes

- The mobile frontend is the source of truth for the tenant/owner UX; the admin dashboard is a management view over the same data model.
- Static uploads and local databases are service-level data, not source code.
