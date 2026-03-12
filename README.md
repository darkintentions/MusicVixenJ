# Music Library

A web app for music teachers to manage a PDF library, tag pieces, and assign them to students.

## Stack

- **Frontend:** React + Vite + Tailwind CSS
- **API:** Cloudflare Pages Functions
- **Database:** Cloudflare D1 (SQLite)
- **File Storage:** Cloudflare R2

---

## First-Time Setup

### 1. Install dependencies

```bash
cd musicvixenj
npm install
```

### 2. Log in to Cloudflare

```bash
npx wrangler login
```

### 3. Create D1 database

```bash
npx wrangler d1 create musicvixenj
```

Copy the `database_id` from the output and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "musicvixenj"
database_id = "PASTE_YOUR_ID_HERE"   # <-- replace this
```

### 4. Create R2 bucket

```bash
npx wrangler r2 bucket create musicvixenj
```

### 5. Apply database schema and seed tags

```bash
npm run db:schema
npm run db:seed
```

### 6. Change the JWT secret

Edit `wrangler.toml` and change the `JWT_SECRET` variable to something secret:

```toml
[vars]
JWT_SECRET = "your-random-secret-string-here"
```

---

## Development

Run both the Vite dev server and Wrangler in parallel:

```bash
npm run dev
```

Then open **http://localhost:8788** in your browser.

On first visit, you'll be redirected to `/setup` to create your teacher account.

---

## Deploy to Cloudflare Pages

### 1. Build and deploy

```bash
npm run deploy
```

### 2. Apply schema to production D1

```bash
npm run db:schema:remote
npm run db:seed:remote
```

### 3. Set a strong JWT secret in Cloudflare dashboard

Go to **Pages → your project → Settings → Environment variables** and add:

```
JWT_SECRET = <your secret>
```

---

## Features

### Teacher
- Upload PDFs (text is automatically extracted for search)
- Create color-coded tags (Beginner, Piano, etc.)
- Assign tags to music pieces
- Create student accounts
- Assign music pieces to specific students

### Student
- Log in with credentials provided by teacher
- View assigned music pieces
- Read PDFs inline in the browser

---

## Default Tags

The seed file creates these tags automatically:
- Beginner (green)
- Intermediate (yellow)
- Advanced (red)
- Piano (indigo)
- Guitar (purple)
- Theory (cyan)
- Scales (pink)
- Sight Reading (orange)
