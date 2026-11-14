# PowerPDF

Chat with your PDF. Runs locally (Postgres + local file storage + in-app vector search) or on Vercel (Neon Postgres + Vercel Blob). The AI service is the Google Gemini API, which has a free tier.

## Local development

1. Get a free API key at https://aistudio.google.com/apikey
2. `cp .env.example .env`, then edit `.env`:
   - `GEMINI_API_KEY` = your key
   - `AUTH_SECRET` = any long random string (e.g. `openssl rand -hex 32`)
   - `DATABASE_URL` and `DATABASE_URL_UNPOOLED` = your Neon (or any Postgres) URLs. After deploying once you can fetch them with `vercel env pull .env` (needs the Vercel CLI and `vercel link`), or copy them from the Neon store in the Vercel Storage tab.
   - Leave `BLOB_READ_WRITE_TOKEN` empty: PDFs are then stored in `uploads/` on disk.
3. `npm install`
4. `npm run db:push` (creates the tables)
5. `npm run dev` and open http://localhost:3000

Sign up with an email and password (min 8 characters), upload a PDF (max 16MB, 50 pages) and start asking questions.

## Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. On https://vercel.com click Add New > Project and import the repo (framework preset: Next.js; the `vercel-build` script is used automatically).
3. In the project open the Storage tab:
   - Create a Neon Postgres database and connect it to the project. This adds `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED`.
   - Create a Blob store (choose **Private** access) and connect it. This adds `BLOB_READ_WRITE_TOKEN`. If you create a public store, also set `BLOB_ACCESS=public`.
4. In Settings > Environment Variables add `GEMINI_API_KEY`, `GEMINI_CHAT_MODEL` (`gemini-4-hydrogen`) and `AUTH_SECRET` (a long random string).
5. Deploy (or Redeploy if the first build ran before the stores were connected). `vercel-build` runs `prisma generate && prisma db push --skip-generate && next build`, so tables are created automatically.

Notes:
- The Vercel Hobby plan is for non-commercial, personal use only.
- In Blob mode the browser uploads straight to Blob (function bodies are capped at 4.5MB), then `/api/files/register` verifies and indexes the PDF. PDFs are still served only through the owner-checked `/api/files/<id>` route.
- Indexing runs inside one request (`maxDuration = 300`); on Hobby, long PDFs near the 50 page limit may approach the function time limit.
- Neon free tier has 0.5GB storage. Embeddings are 768-dimensional to keep this small.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | none | Required |
| `GEMINI_CHAT_MODEL` | `gemini-4-hydrogen` | Chat model |
| `GEMINI_EMBED_MODEL` | `gemini-embedding-001` | Embedding model |
| `AUTH_SECRET` | none | Signs the session cookie (HMAC-SHA256) |

| `DATABASE_URL` | none | Postgres URL (pooled on Neon) |
| `DATABASE_URL_UNPOOLED` | none | Direct Postgres URL, used by Prisma for schema push |
| `BLOB_READ_WRITE_TOKEN` | none | Optional locally; set (auto on Vercel) to store PDFs in Vercel Blob |
| `BLOB_ACCESS` | `private` | Access mode of the Blob store |

Auth: email + password accounts. Passwords are hashed with scrypt (`node:crypto`, per-user random salt) and stored in `User.passwordHash`; the session is an HMAC-signed httpOnly cookie. Accounts created before passwords existed (no hash) can claim themselves by signing up with the same email. There is no rate limiting on sign-in/sign-up yet.

## How it works

- Uploads are saved to `uploads/` (gitignored) or Vercel Blob and served only to their owner at `/api/files/<id>`.
- On upload the PDF is parsed, split into ~1000-character chunks, embedded with Gemini and stored in the `Chunk` table.
- On a question, the query is embedded, cosine similarity is computed in JS over that file's chunks, and the top 4 go into the prompt. The answer is streamed back as plain text.
