# Pyesa

**Pyesa** is a Progressive Web App (PWA) choir companion for mass. It lets choir members browse weekly song sets, search a full song library, and follow the Rosario Kantada prayer with interactive song markers — all offline-capable and mobile-first.

## Features

- **Sets** — Weekly mass song sets listed by date. Auto-selects the current week. Swipe between songs.
- **Song Library** — Every song is saved to the browser (IndexedDB), seeded from a canonical `library.json`, and searchable by name, author, subtitle, or lyrics.
- **Rosario Kantada** — Full prayer text with interactive **(AWIT)** buttons that open a song picker (suggested songs + library search).
- **Set Builder** — Passcode-protected collaborative editor (`/builder`). Build next week's set on any phone: search the library, add placeholders for songs that still need encoding, reorder, and publish. Publishing writes the set live to the app and creates a shareable page with the song list (Messenger link previews work).
- **SongbookPro Import** — Upload a SongbookPro `.sbp` export in the Builder to add newly encoded songs to the library; matching placeholders in draft sets resolve automatically.
- **Dark / Light Mode** — Auto-detects OS preference; manual toggle in the header.
- **Offline Support** — All assets and song data are pre-cached via a Service Worker. Songs are persisted in IndexedDB.
- **Installable** — PWA install prompt on supported browsers. Works as a standalone app on mobile and desktop.
- **ChordPro Rendering** — Songs in ChordPro format are parsed and rendered with chords or lyrics-only mode, adjustable font size, and auto-scroll.

## Tech Stack

| Layer           | Technology                                 |
| --------------- | ------------------------------------------ |
| UI              | React 18, React Router 7                   |
| Styling         | Tailwind CSS 4 (Catppuccin-inspired theme) |
| Icons           | react-icons (Feather)                      |
| Song parsing    | chordsheetjs                               |
| Offline storage | IndexedDB via `idb`                        |
| PWA             | vite-plugin-pwa + Workbox                  |
| Build           | Vite 6                                     |
| Hosting         | AWS S3 + CloudFront                        |
| Infra           | Terraform                                  |

## Project Structure

```
public/
  files/               # Song data (separate private git repo; S3 is source of truth)
    mass/              #   Song set JSON files (YYYY-MM-DD - Name.json)
    drafts/            #   Set-builder drafts (written by the API)
    sets.json          #   Auto-generated manifest of all sets
    library.json       #   Canonical deduped song library
    rosario-set.json   #   Suggested songs for Rosario AWIT markers
scripts/
  generate-manifest.js # Generates sets.json from mass/ directory
  generate-library.js  # Merges mass/ songs into library.json
  upload-song.sh       # Clean → manifest → sync to S3 → git push
  sync-down.sh         # Pull S3 → public/files → commit to songs repo (backup)
server/                # API Lambda (set builder backend)
  index.mjs            #   Lambda entrypoint
  lib/                 #   Router, .sbp parser, S3 store, share pages...
  test/run.mjs         #   Smoke tests (npm run test-api)
src/
  components/          # Shared UI components (Header, SongViewer, etc.)
  contexts/            # ThemeContext (dark/light mode)
  db/                  # IndexedDB layer (songs + sets persistence)
  hooks/               # useOnlineStatus
  pages/               # SetsPage, LibraryPage, RosarioPage, BuilderPage
  api.js               # Client for the set-builder API
  App.jsx              # Route definitions
  main.jsx             # Entry point
  index.css            # Tailwind + custom theme + song styles
infra/                 # Terraform (S3, CloudFront, Lambda API)
```

## Set Builder Workflow

The weekly flow between the set builder and SongbookPro:

1. A choir member opens **`/builder`** (passcode required once per device) and creates the set for the upcoming Sunday — searching the library and adding **placeholders** (name, album, artist) for songs not yet encoded.
2. The maintainer encodes the missing songs in SongbookPro, exports a set containing them (`.sbp`), and uploads it via **Upload .sbp** in the Builder. New songs join `library.json` and matching placeholders resolve automatically.
3. Once no placeholders remain, **Publish Set** writes `mass/<date> - <name>.json` to S3, regenerates `sets.json`, invalidates CloudFront, and creates a share page (`/share/<slug>.html`) whose link previews the song list in Messenger.
4. The maintainer rebuilds the set in SongbookPro by picking the songs (never import a set back into SongbookPro — it duplicates songs).

> **Note:** Since the builder writes directly to S3, S3 is the source of truth for `public/files/`. Run `./scripts/sync-down.sh` periodically (and before local edits) to back up S3 → the pyesa-songs repo.

### API

A single Lambda (`server/`) behind the CloudFront `/api/*` behavior handles drafts CRUD, `.sbp` upload, and publishing. All write endpoints require the `x-pyesa-key` passcode header. Run its tests with `npm run test-api` (uses `sample.sbp` in the repo root if present).

In local dev, `/api` is proxied to production (override with `PYESA_API_ORIGIN`).

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- AWS CLI (for uploading songs and deploying)

### Install & Run

```bash
git clone git@github.com:ianpogi5/pyesa.git
cd pyesa
npm install
npm run dev
```

The dev server starts at `http://localhost:5173` with HMR and PWA enabled.

### Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

## Uploading Song Files

Song data lives in `public/files/` which is a separate private git repo ([ianpogi5/pyesa-songs](https://github.com/ianpogi5/pyesa-songs)). Song files are synced to S3 — the deployed app reads them from there.

### Adding a new song set

1. Export the song set as a JSON file from your song app
2. Copy it to the mass directory with the naming convention:

   ```bash
   cp ~/exported-set.json "public/files/mass/2025-12-25 - Christmas Day.json"
   ```

3. Run the upload script:

   ```bash
   ./scripts/upload-song.sh
   ```

   This will:
   - Regenerate `sets.json` from all files in `public/files/mass/`
   - Sync everything to S3 (immediately live on the site via CloudFront)
   - Commit and push changes in the songs repo

### Environment Variables

| Variable          | Default     | Description                        |
| ----------------- | ----------- | ---------------------------------- |
| `PYESA_S3_BUCKET` | `pyesa-web` | S3 bucket name                     |
| `AWS_PROFILE`     | `pyesa`     | AWS CLI profile for authentication |

## Deployment

Deployment is handled via GitHub Actions. There are two ways to deploy:

### Release (recommended)

Creating a release auto-deploys to production. The changelog is generated automatically from commit messages.

1. Go to **Actions → Release → Run workflow**
2. Enter the version number (e.g. `2.1.0`)
3. The workflow will:
   - Bump the version in `package.json`
   - Auto-generate release notes from commits since the last release
   - Update `CHANGELOG.md`
   - Create a GitHub Release with the tag
4. The published release **automatically triggers the deploy workflow**

> **Tip:** Use [conventional commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, etc.) so the auto-generated changelog is well-organized.

### Manual deploy

You can also trigger a deploy without a release:

1. Go to **Actions → Deploy to Production → Run workflow**

### What the deploy does

1. Checks out the code
2. Syncs song data from S3 into `public/files/`
3. Installs dependencies and builds the app
4. Runs Terraform to ensure infra is up to date
5. Uploads the built `dist/` to S3
6. Invalidates the CloudFront cache

### Required GitHub Secrets & Variables

Configured in the repo's **Settings → Secrets and variables → Actions**:

**Secrets** (environment: Production):

| Secret                  | Description                                                             |
| ----------------------- | ----------------------------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | AWS IAM access key                                                       |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key                                                       |
| `API_PASSCODE`          | Shared passcode for the set-builder API                                  |
| `SONGS_REPO_TOKEN`      | Fine-grained PAT (Contents rw on pyesa-songs) for the weekly song backup |

**Variables** (environment: Production):

| Variable         | Description                        |
| ---------------- | ---------------------------------- |
| `S3_BUCKET`      | S3 bucket name (e.g. `pyesa-web`)  |
| `AWS_REGION`     | AWS region (e.g. `ap-southeast-1`) |
| `AWS_ACCOUNT_ID` | AWS account ID                     |
| `AWS_USER`       | AWS IAM user name                  |
| `SSL_CERT_ARN`   | ACM certificate ARN for the domain |
| `DOMAIN`         | Domain name (e.g. `pyesa.kdc.sh`)  |
| `API_DOMAIN`     | API domain (if applicable)         |

Runs `git pull --recurse-submodules && npm install && npm run build && pm2 restart pyesa`.

## License

Private project.
