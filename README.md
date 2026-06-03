# xfolio

automatically turn your X videos into a portfolio you actually own.
```
record → post on X → upload to xfolio → share your portfolio
```

---

## what it does

- upload your videos directly from your device — stored permanently on Cloudinary
- add captions, dates, and a link back to the original tweet
- tag videos by category (web3, fintech, brand deals, etc.)
- pin your best work to the top
- hide videos you don't want public
- share a clean, fast portfolio page at your own domain
- filter by tag — send `yoursite.com/?tag=fintech` directly to brand clients

---

## the flow

**every time you post a video:**
1. save the video file to your device (use the original from CapCut or download from [twittervideodownloader.com](https://twittervideodownloader.com))
2. open `/dashboard` on your deployed site
3. fill in caption, date, and tweet URL
4. drag the video file in
5. done — it's live on your portfolio instantly

---

## deploy in 5 minutes

### 1. set up Cloudinary (free)
go to [cloudinary.com](https://cloudinary.com) → create a free account → grab your **cloud name**, **API key**, and **API secret** from the dashboard.

### 2. set up a database (free)
create a free [Neon](https://neon.tech) postgres database and copy the connection string.

### 3. deploy to pxxl

go to [pxxl.app](https://pxxl.app) → connect your GitHub repo → deploy with one click.

add these environment variables in your pxxl project settings:

| variable | value |
|---|---|
| `X_USERNAME` | your X handle without @ |
| `DATABASE_URL` | neon connection string |
| `CLOUDINARY_CLOUD_NAME` | from Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | from Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | from Cloudinary dashboard |
| `DASHBOARD_PASSWORD` | password to access your dashboard |
| `DISPLAY_NAME` | how your name shows on the portfolio |
| `BIO` | one line bio |
| `ACCENT_COLOR` | your brand color e.g. `#ff6b9d` |
| `ACCENT_COLOR_DIM` | same color at 20% opacity e.g. `#ff6b9d33` |

### 4. set up the database schema
after deploying, run this once locally:
```bash
npm run db:push
```

---

## local development

```bash
git clone https://github.com/yourusername/xfolio
cd xfolio
cp .env.example .env.local
# fill in your values
npm install
npm run db:push
npm run dev
```

open `http://localhost:3000` for the portfolio and `http://localhost:3000/dashboard` to manage your videos.

---

## customising your theme

ACCENT_COLOR=#ff6b9d     # pink (default)
ACCENT_COLOR=#7c3aed     # purple
ACCENT_COLOR=#06b6d4     # cyan
ACCENT_COLOR=#f59e0b     # amber
ACCENT_COLOR=#10b981     # green

---

## pages

| route | description |
|---|---|
| `/` | public portfolio — share this with brands |
| `/dashboard` | password-protected — manage your videos |
| `/video/[id]` | individual video page with stats |

---

## tech stack

- **Next.js 14** (app router)
- **Prisma** + **PostgreSQL** (Neon)
- **Cloudinary** (video storage)
- **pxxl** (hosting)
- **Syne** + **JetBrains Mono** (fonts)

---

## contributing

PRs welcome. open an issue first for big changes.

built by [@whakee_](https://x.com/whakee_) · [follow for updates](https://x.com/whakee_)

---

## license

MIT

set `ACCENT_COLOR` in your `.env` to any hex color — the entire portfolio follows it:
MIT
