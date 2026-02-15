# CFBlog

A serverless blog platform running entirely on [Cloudflare Workers](https://workers.cloudflare.com/), with D1 as the database and R2 for file storage. Zero servers to manage.

## Features

- Hono web framework with edge-side rendering
- D1 (SQLite) database with 14 migration files
- R2 object storage for uploads and Hexo-compatible markdown backups
- Admin panel built with Vue 3 + TDesign
- Markdown editor (md-editor-v3) with image upload
- Comments, feedback/guestbook, full-text search
- RSS feed, dark mode, responsive design
- Session-based auth with login rate limiting and audit log
- R2 caching layer for post lists, individual posts, settings, and RSS

## Quick Start

### Prerequisites

- Node.js >= 18
- npm
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm i -g wrangler`)
- A Cloudflare account

### 1. Clone and install

```bash
git clone https://github.com/your-username/cfblog.git
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

Copy the returned database ID and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "cfblog-database"
database_id = "<your-database-id>"
migrations_dir = "migrations"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "cfblog-uploads"
```

### 3. Run database migrations

```bash
# Local development
npm run db:local

# Remote (production)
npm run db:migrate
```

### 4. Start dev server

```bash
npm run dev
```

Open http://localhost:8787. Admin panel at http://localhost:8787/admin.

Default login: `admin` / `admin123` (change immediately after first login).

## Deployment

```bash
npm run deploy
```

Or with an API token:

```bash
CLOUDFLARE_API_TOKEN=<your-token> npx wrangler deploy
```

### Environment variables

Edit `wrangler.toml` `[vars]` section for production:

```toml
[vars]
ENVIRONMENT = "production"
SESSION_SECRET = "<random-secret-string>"
```

> Use a strong, random string for `SESSION_SECRET`. This signs session cookies.

## Settings

All settings are managed in the admin panel under **Settings** (`/admin` > Settings tab).

| Setting | Description |
|---------|-------------|
| `blog_title` | Site name shown in navbar and page titles |
| `blog_description` | Site description for SEO meta tags |
| `blog_subtitle` | Subtitle shown on homepage |
| `posts_per_page` | Number of posts per page (default: 10) |
| `comment_moderation` | `0` = auto-approve, `1` = require manual approval |
| `comment_permission` | `all` = anyone can comment, `registered` = logged-in only |
| `upload_allowed_types` | Comma-separated file extensions (e.g. `jpg,png,gif,pdf`) |
| `upload_max_size` | Max upload size in bytes (default: 5242880 = 5MB) |
| `meta_description` | SEO meta description |
| `meta_keywords` | SEO meta keywords |

## Developing Your Own Theme

The frontend is rendered server-side in [src/routes-hono/frontend.js](src/routes-hono/frontend.js). The entire theme (HTML + CSS + client JS) is defined in this single file, making it straightforward to customize.

### Architecture

```
src/routes-hono/frontend.js
├── CSS        — CSS custom properties + all styles (const CSS)
├── BASE_JS    — Shared client-side utilities (const BASE_JS)
├── layout()   — HTML shell: <head>, navbar, footer, script tags
└── Routes     — Each page route returns c.html(layout({ content, script }))
```

### CSS Custom Properties

All colors and dimensions are defined via CSS variables in `:root`. Override them to change the look:

```css
:root {
  --bg: #fff;              /* Page background */
  --bg2: #f6f8fa;          /* Secondary background (cards, code blocks) */
  --text: #24292f;         /* Primary text color */
  --text2: #57606a;        /* Secondary text */
  --muted: #8b949e;        /* Muted/hint text */
  --accent: #0969da;       /* Links, buttons, active states */
  --accent2: #0550ae;      /* Accent hover */
  --border: #d0d7de;       /* Borders */
  --border2: #d8dee4;      /* Subtle borders */
  --tag-bg: #ddf4ff;       /* Tag background */
  --tag-c: #0969da;        /* Tag text */
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --mono: "SFMono-Regular", Consolas, monospace;
  --nav-h: 52px;           /* Navbar height */
  --max-w: 960px;          /* Max content width */
  --side-w: 240px;         /* Sidebar width */
}
```

Dark mode is activated via `body[data-theme="dark"]` and overrides the same variables:

```css
body[data-theme="dark"] {
  --bg: #0d1117;
  --text: #e6edf3;
  --accent: #58a6ff;
  /* ... */
}
```

### Key CSS Classes

| Class | Used for |
|-------|----------|
| `.navbar` | Top navigation bar |
| `.page` | Main content container (centered, max-width) |
| `.page.with-sidebar` | Two-column layout |
| `.page.narrow` | Narrow content (780px, for post detail) |
| `.article` | Article card in list pages |
| `.article-title` / `.article-meta` / `.article-excerpt` | Article card elements |
| `.post-header` / `.post-body` | Post detail page |
| `.cat-grid` / `.cat-card` | Category list grid |
| `.tag-page` | Tag cloud |
| `.pager` | Pagination |
| `.cmt-*` | Comment components |
| `.fb-*` | Feedback form |

### Layout Function

Every page uses the `layout()` function which generates a complete HTML document:

```javascript
return c.html(layout({
  title: 'Page Title',          // <title> content
  blogTitle: 'My Blog',         // Navbar brand text
  activePage: 'home',           // Highlights active nav link
  content: `<div>...</div>`,    // Page HTML (inserted into <main>)
  script: `var x = 1; ...`      // Page-specific JavaScript
}));
```

The layout automatically includes:
- The full CSS (`const CSS`)
- The shared JS utilities (`const BASE_JS`)
- marked.js for client-side Markdown rendering
- Navbar with search, navigation links, and dark mode toggle
- Footer

### Shared Client Utilities (BASE_JS)

These functions are available on every page:

| Function | Description |
|----------|-------------|
| `escapeHtml(text)` | HTML entity escaping |
| `getFirstImg(text)` | Extract first image URL from HTML/Markdown |
| `checkThumb(el, src)` | Load thumbnail only if image is >= 320px wide |
| `readTime(text)` | Estimate reading time (Chinese: 500 chars/min) |
| `renderMd(text)` | Render Markdown via marked.js |
| `renderArticleList(container, posts, opts)` | Render article card list (shared across all list pages) |

### Creating a New Theme

1. Fork or copy `src/routes-hono/frontend.js`
2. Modify the `CSS` constant to change colors, fonts, layout
3. Modify the `layout()` function to change the HTML structure (navbar, footer)
4. Adjust individual route handlers to change page layouts
5. Deploy and test

Since the theme is pure server-rendered HTML + CSS + vanilla JS, there's no build step for the frontend. Just edit and deploy.

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
│   │   ├── BaseModel.js
│   │   ├── Post.js
│   │   ├── User.js
│   │   ├── Category.js
│   │   ├── Tag.js
│   │   ├── Comment.js
│   │   ├── Feedback.js
│   │   ├── Settings.js
│   │   ├── Attachment.js
│   │   └── LoginAudit.js
│   └── utils/
│       ├── auth.js             # Session & password hashing
│       ├── cache.js            # R2 caching + Hexo markdown export
│       └── slug.js             # URL slug generation
├── migrations/                 # D1 SQL migrations (0001-0014)
├── public/                     # Static assets (admin bundle)
├── tests/                      # API tests (vitest) & E2E (playwright)
├── wrangler.toml               # Cloudflare Workers config
└── package.json
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start local dev server (port 8787) |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run db:local` | Apply migrations locally |
| `npm run db:migrate` | Apply migrations to production D1 |
| `npm run test:api` | Run API tests (vitest) |
| `npm run test:e2e` | Run E2E tests (playwright) |

## Documentation

- [API Reference](docs/API.md) - Complete REST API documentation
- [LICENSE](LICENSE) - MIT License

## License

[MIT](LICENSE)
