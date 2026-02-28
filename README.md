# Pyesa

**Pyesa** is a Progressive Web App (PWA) choir companion for mass. It lets choir members browse weekly song sets, search a full song library, and follow the Rosario Kantada prayer with interactive song markers — all offline-capable and mobile-first.

## Features

- **Sets** — Weekly mass song sets listed by date. Auto-selects the current week. Swipe between songs.
- **Song Library** — Every song ever loaded is saved to the browser (IndexedDB) and searchable by name, author, subtitle, or lyrics.
- **Rosario Kantada** — Full prayer text with interactive **(AWIT)** buttons that open a song picker (suggested songs + library search).
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
  files/               # ← git submodule (ianpogi5/pyesa-songs, private)
    mass/              #   Song set JSON files (YYYY-MM-DD - Name.json)
    sets.json          #   Auto-generated manifest of all sets
    rosario-set.json   #   Suggested songs for Rosario AWIT markers
scripts/
  generate-manifest.js # Generates sets.json from mass/ directory
  upload-song.sh       # Upload a new set: copy → manifest → S3 → git push
src/
  components/          # Shared UI components (Header, SongViewer, etc.)
  contexts/            # ThemeContext (dark/light mode)
  db/                  # IndexedDB layer (songs + sets persistence)
  hooks/               # useOnlineStatus
  pages/               # SetsPage, LibraryPage, RosarioPage
  App.jsx              # Route definitions
  main.jsx             # Entry point
  index.css            # Tailwind + custom theme + song styles
infra/                 # Terraform (S3, CloudFront, etc.)
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- AWS CLI (for uploading songs)

### Clone (with submodule)

```bash
git clone --recurse-submodules git@github.com:ianpogi5/pyesa.git
cd pyesa
```

If you've already cloned without `--recurse-submodules`:

```bash
git submodule update --init --recursive
```

### Install & Run

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173` with HMR and PWA enabled.

### Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

## Weekly Workflow: Adding a New Song Set

Each week, export the song set as a JSON file from your song app, then run:

```bash
./scripts/upload-song.sh 2025-12-25 "Christmas Day" ~/exported-set.json
```

This will:

1. Copy the JSON to `public/files/mass/`
2. Regenerate `sets.json` manifest
3. Upload the new JSON + updated `sets.json` to S3 (`pyesa-web` bucket)
4. Commit and push in the `pyesa-songs` submodule

The uploaded files are immediately live on the site (served via CloudFront from S3).

### Environment Variables

| Variable          | Default     | Description    |
| ----------------- | ----------- | -------------- |
| `PYESA_S3_BUCKET` | `pyesa-web` | S3 bucket name |

### Manual Alternative

```bash
# 1. Copy the file
cp ~/set.json "public/files/mass/2025-12-25 - Christmas Day.json"

# 2. Regenerate manifest
npm run generate-manifest

# 3. Upload to S3
aws s3 cp "public/files/mass/2025-12-25 - Christmas Day.json" s3://pyesa-web/files/mass/
aws s3 cp public/files/sets.json s3://pyesa-web/files/sets.json
```

## Songs Submodule

Song data lives in a separate private repository: **[ianpogi5/pyesa-songs](https://github.com/ianpogi5/pyesa-songs)**.

It is mounted as a git submodule at `public/files/`. This keeps song content private while the app code remains public.

### Updating the submodule

```bash
cd public/files
git pull origin main
cd ../..
git add public/files
git commit -m "Update songs submodule"
```

## CI/CD

A GitHub Action (`.github/workflows/generate-manifest.yml`) regenerates `sets.json` when mass files change on push to `main`. It uses the `SONGS_REPO_TOKEN` secret to access the private submodule.

## Deployment

```bash
npm run deploy
```

Runs `git pull --recurse-submodules && npm install && npm run build && pm2 restart pyesa`.

## License

Private project.
