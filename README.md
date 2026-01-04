# Task Manager – Frontend & Backend Split

## Project Structure
```
task-manager/
├─ frontend/          # React + Vite (TypeScript) UI
│   ├─ src/           # Your React source files
│   ├─ public/        # Static assets
│   ├─ .env           # Front‑end Supabase config (public anon key)
│   └─ package.json   # Front‑end dependencies & scripts
├─ backend/           # Express API server
│   ├─ src/           # Server code (e.g., server.js, routes)
│   ├─ .env           # Backend Supabase config (service role key)
│   └─ package.json   # Backend dependencies & scripts
├─ .gitignore         # Ignores *.env files automatically
└─ README.md          # This file
```

## 1️⃣ Create the folders (already done)
If you need to recreate them:
```bash
mkdir frontend backend
```

## 2️⃣ Install dependencies
### Front‑end
```bash
cd frontend
npm install   # // turbo – auto‑run
```
### Back‑end
```bash
cd ../backend
npm install   # // turbo – auto‑run
```

## 3️⃣ Environment files
Both `.env` files are already created. Fill them with your Supabase project details.

### Front‑end (`frontend/.env`)
```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```
*The `VITE_` prefix makes the variables available to Vite‑powered client code.*

### Back‑end (`backend/.env`)
```dotenv
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
```
*Use the service‑role key only on the server; never expose it to the client.*

## 4️⃣ Sample Supabase client setup
### Front‑end (`src/lib/supabaseClient.ts`)
```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```
### Back‑end (`src/supabaseClient.ts`)
```ts
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

## 5️⃣ Running the apps
### Front‑end development server
```bash
cd frontend
npm run dev   # Vite dev server (http://localhost:5173)
```
### Back‑end server
Create a simple entry point (`backend/src/server.js` or `backend/server.js`):
```js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from "./supabaseClient.js"; // adjust path if needed

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
```
Then run:
```bash
cd backend
npm run dev   # or npm start if you prefer
```

## 6️⃣ Git ignore
`.gitignore` already contains a rule to ignore any `.env` file, so your secrets stay out of version control.

---
### What to add to the `.env` files to connect to Supabase?
- **Frontend**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (public anon key).
- **Backend**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (service‑role key for privileged server‑side actions).

Replace the placeholder values with the actual values from your Supabase project dashboard (Settings → API). 

Enjoy your split‑frontend/backend architecture! 🎉
