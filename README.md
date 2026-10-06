# Inkwell — Editorial CMS

A calm, full-stack CMS built with **Next.js (App Router)**.

**MySQL** handles identity. **MongoDB** handles stories.

| Store | Holds | Objects |
|---|---|---|
| MySQL `cms_db` | Users, roles, audit trail | Tables + index, view, trigger, stored procedure (see `db/init.sql`) |
| MongoDB `cms_content` | Articles + metadata | Mongoose schema (see `models/Article.js`) |

Auth is `bcryptjs` + `JWT`. Every API response is `{ success, data, error }`.

---

## What you need

1. **Node.js 18+** — check with `node -v`
2. **Git**
3. **MySQL** — XAMPP, MySQL Server, or MariaDB (must be running on port `3306`)
4. **MongoDB** — local `mongod` on port `27017`, or a free Atlas cluster

No Docker required.

---

## Run it from scratch (fork → run)

### 1. Fork and clone

1. Open `https://github.com/rohit-577/CONTENT-MANAGEMENT`
2. Click **Fork** (top right) to copy it to your account
3. Clone **your fork**:

```bash
git clone https://github.com/<your-username>/CONTENT-MANAGEMENT.git
cd CONTENT-MANAGEMENT
```

> Cloning the original directly also works — forking just lets you push changes.

### 2. Install

```bash
npm install
```

### 3. Set up environment

Copy the example file, then edit it:

```bash
# macOS / Linux / Git Bash
cp .env.local.example .env.local

# Windows PowerShell
Copy-Item .env.local.example .env.local
```

Open `.env.local` and fill in your values:

```ini
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=cms_db

MONGODB_URI=mongodb://localhost:27017/cms_content
JWT_SECRET=paste_a_long_random_string_here_at_least_32_chars
JWT_EXPIRES_IN=7d

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Notes:
- `MYSQL_PASSWORD` is your local MySQL root password.
- `MONGODB_URI` — keep the local URI if MongoDB runs locally. For Atlas, use the `mongodb+srv://...` string from Atlas → Connect → Drivers.
- `JWT_SECRET` — any long random string. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

### 4. Start your databases

**MySQL** must be running first. If you use XAMPP, press **Start** next to MySQL. Verify:

```bash
# should connect without error (use your password)
mysql -u root -p -e "SELECT 1;"
```

**MongoDB** — either:
- Start local `mongod` (must listen on `27017`), or
- Use Atlas (no local install needed, just the `mongodb+srv://` URI above)

Tip: open MongoDB Compass and connect to `mongodb://localhost:27017` to visually confirm.

### 5. Create tables, view, trigger, procedure

This runs `db/init.sql` for you:

```bash
npm run db:init
```

You should see:

```
Database initialized successfully
Roles: Admin, Author
View ActiveAuthorsView: exists
Trigger trg_after_user_insert: exists
Procedure CreateUserWithRole: exists
```

This creates `cms_db` with `Roles`, `Users`, `AuditLogs`, plus `idx_users_email`, `ActiveAuthorsView`, `trg_after_user_insert`, and `CreateUserWithRole`.

### 6. Run the app

```bash
npm run dev
```

Open **http://localhost:3000**

Leave the terminal running. Use a second terminal for other commands.

### 7. Use it

1. Click **Create account**
   - Name, email, password (min 6 chars)
   - Role: pick **Author** first
2. You land on **Dashboard** — click **+ New story**, fill title + content (min 10 chars), Publish
3. Your story appears in the grid. It is saved in MongoDB with `authorId` = your MySQL user id (a Number, not an ObjectId)
4. To test roles:
   - Make a second account as **Author** in an incognito window — it cannot edit the first author's story (API returns `403`)
   - Make a third account as **Admin** — it can edit and delete anyone's story

Sign in next time with **Sign in** using the same email + password.

---

## Project layout

```
app/
  api/auth/register|login|me/route.js  # MySQL + JWT
  api/articles/route.js                # GET list / POST create (MongoDB)
  api/articles/[id]/route.js           # GET / PUT / DELETE (ownership check)
  login/page.js  register/page.js  dashboard/page.js  page.js
components/  navbar.jsx  article-card.jsx  article-editor.jsx
lib/  mysql.js  mongodb.js  auth.js  validation.js  api-response.js  client-auth.js
models/Article.js
db/init.sql
scripts/init-db.js
.env.local.example
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server on `:3000` |
| `npm run build` | Production build check |
| `npm start` | Run production build (after `build`) |
| `npm run lint` | Lint |
| `npm run db:init` | Run `db/init.sql` against MySQL |

## Troubleshooting

| Problem | Fix |
|---|---|
| `Access denied for user 'root'` | Wrong `MYSQL_PASSWORD` in `.env.local`, or MySQL not running |
| `connect ECONNREFUSED 127.0.0.1:27017` | Local MongoDB not running — start `mongod`, or switch `MONGODB_URI` to Atlas. Dev mode also falls back to in-memory Mongo automatically |
| `Missing JWT_SECRET` | You didn't create `.env.local`, or left `JWT_SECRET` empty |
| `Email already registered (409)` | That email exists — Sign in instead |
| `401 Authentication required` | No `Authorization: Bearer <token>` header — sign in again and retry |
| Port `3000` in use | Stop the other `next dev`, or run `npx next dev -p 3001` |
| Fresh start | Re-run `npm run db:init` (safe — recreates base tables and roles) |

## Notes for evaluators

- `authorId` on an article is a MySQL `Users.id` (Number). Open Compass → `cms_content` → `articles` and compare it to MySQL `SELECT id, email FROM cms_db.Users;` — they match.
- Every write is validated with `zod` before any DB call. Role checks live in `lib/auth.js` middleware, not in the UI.
- `.env.local` is gitignored. Only `.env.local.example` is committed — never push real passwords.
