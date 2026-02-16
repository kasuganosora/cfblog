# CFBlog

A serverless blog platform running entirely on [Cloudflare Workers](https://workers.cloudflare.com/). Zero servers, zero cost for small sites.

**D1** (SQLite) as the database, **R2** for file storage, **Hono** as the web framework. Everything runs at the edge.

## Features

- **Hono** web framework with edge-side rendering
- **D1** (SQLite) database with automatic migrations
- **R2** object storage for uploads and cache
- **Admin panel** built with Vue 3 + TDesign
- **Markdown editor** (md-editor-v3) with image upload and live preview
- **Comments & guestbook** with cooldown, moderation, author highlighting
- **RSS feed** auto-generated from published posts
- **Code highlighting** with highlight.js (github-dark theme)
- **Image lightbox** click-to-zoom on article images
- **Chinese slug support** auto pinyin conversion for URL-friendly slugs
- **Sidebar widgets** customizable via admin (Markdown + HTML)
- **Dark mode** toggle with system preference detection
- **Full-text search** across posts
- **Session auth** with PBKDF2 password hashing, login rate limiting, audit log
- **R2 caching layer** for settings, post lists, RSS

## Quick Start

### Prerequisites

- Node.js >= 18
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm i -g wrangler`)
- A Cloudflare account (free plan works)

### 1. Clone and install

```bash
git clone https://github.com/kasuganosora/cfblog.git
cd cfblog
npm install
```

### 2. Create Cloudflare resources

```bash
# Create D1 database
npx wrangler d1 create cfblog-database

# Create R2 bucket
npx wrangler r2 bucket create cfblog-uploads
```

### 3. Configure

```bash
cp wrangler.toml.example wrangler.toml
```

Edit `wrangler.toml` and fill in your D1 database ID (returned from step 2):

```toml
[[d1_databases]]
binding = "DB"
database_name = "cfblog-database"
database_id = "<your-database-id>"    # Replace this
migrations_dir = "migrations"
```

### 4. Run database migrations

```bash
# Local development
npx wrangler d1 migrations apply cfblog-database --local

# Production
npx wrangler d1 migrations apply cfblog-database --remote
```

### 5. Set session secret

```bash
# Generate a random secret for production
npx wrangler secret put SESSION_SECRET
# Enter a random string (64+ characters recommended)
```

### 6. Start dev server

```bash
npm run dev
```

Open http://localhost:8787. Admin panel at http://localhost:8787/admin.

Default login: `admin` / `admin123` (**change immediately** after first login).

## Deployment

### Manual deploy

```bash
npx wrangler deploy
```

### Cloudflare Workers Builds (CI/CD)

Connect your GitHub repo in **Cloudflare Dashboard > Workers > Settings > Builds**, then configure:

| Setting | Value |
|---------|-------|
| **Deploy command** | `node scripts/generate-config.js && npx wrangler deploy` |

Set these **environment variables** in **Settings > Environment variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `CF_D1_DATABASE_ID` | Yes | Your D1 database UUID |
| `CF_D1_DB_NAME` | No | D1 database name (default: `cfblog-database`) |
| `CF_R2_BUCKET_NAME` | No | R2 bucket name (default: `cfblog-uploads`) |
| `CF_WORKER_NAME` | No | Worker name (default: `cfblog`) |
| `CF_CUSTOM_DOMAIN` | No | Custom domain (e.g. `blog.example.com`) |

The build script generates `wrangler.toml` from these variables automatically.

### Custom domain (optional)

To use a custom domain, either:

- Set `CF_CUSTOM_DOMAIN` env var in CI/CD, or
- Add a `[[routes]]` section to your local `wrangler.toml`:

```toml
[[routes]]
pattern = "blog.example.com"
custom_domain = true
```

## Admin Panel

Access at `/admin` after login. Features:

- **Dashboard** - Stats overview, recent posts and comments
- **Posts** - Create/edit/delete articles, Markdown editor with image upload
- **Categories** - Hierarchical categories with custom slugs
- **Tags** - Tag management
- **Comments** - Moderation, approve/reject/delete
- **Feedback** - Guestbook messages
- **Users** - User management
- **Attachments** - Uploaded files management
- **Settings** - Blog info, display, comments, upload, SEO, sidebar widgets, cache management

## Project Structure

```
cfblog/
├── src/
│   ├── index-hono.js           # App entry point
│   ├── routes-hono/            # Route handlers
│   │   ├── frontend.js         # Frontend theme (HTML/CSS/JS)
│   │   ├── admin.js            # Admin panel (Vue 3 SPA)
│   │   ├── post.js             # Post API
│   │   ├── user.js             # Auth & user API
│   │   ├── category.js         # Category API
│   │   ├── tag.js              # Tag API
│   │   ├── comment.js          # Comment API
│   │   ├── feedback.js         # Feedback API
│   │   ├── search.js           # Search API
│   │   ├── upload.js           # File upload API
│   │   ├── settings.js         # Settings API
│   │   └── base.js             # Auth middleware & helpers
│   ├── models/                 # Data models (D1 ORM)
│   └── utils/
│       ├── auth.js             # Session & password hashing
│       ├── cache.js            # R2 caching layer
│       ├── slug.js             # URL slug generation (with pinyin)
│       └── pinyin-data.js      # Chinese character to pinyin lookup
├── migrations/                 # D1 SQL migrations
├── public/                     # Static assets
│   └── static/                 # highlight.js, marked.js, etc.
├── scripts/
│   ├── generate-config.js      # Generate wrangler.toml from env vars
│   └── build-pinyin-dict.js    # Build pinyin lookup table
├── tests/                      # API tests (vitest)
├── wrangler.toml.example       # Config template
└── package.json
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start local dev server (port 8787) |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm test` | Run API tests (vitest) |

## Theming

The frontend is server-rendered in `src/routes-hono/frontend.js`. The entire theme (HTML + CSS + JS) is in this single file. Customize by modifying:

- **CSS variables** in `:root` - colors, fonts, dimensions
- **Dark mode** via `body[data-theme="dark"]` overrides
- **`layout()`** function - HTML shell, navbar, footer
- **Route handlers** - individual page layouts

No frontend build step required. Just edit and deploy.

## License

[MIT](LICENSE)
