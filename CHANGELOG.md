# Changelog

## [1.99.2] - 2026-02-28

## What's Changed

### Features
- consolidate release and deployment workflows into a single process

**Full Changelog**: https://github.com/ianpogi5/pyesa/compare/v1.99.1...v1.99.2


## [1.99.1] - 2026-02-28

## What's Changed

### Features
- enhance deployment and release workflows to support manual version input

**Full Changelog**: https://github.com/ianpogi5/pyesa/compare/v1.99.0...v1.99.1


## [1.99.0] - 2026-02-28

## What's Changed

### Features
- implement release workflow with version validation, changelog generation, and GitHub release creation
- update deployment workflow, add S3 sync step, and refactor manifest generation
- add SetsPage component for managing song sets and songs

### Bug Fixes
- enhance manifest generation with empty check and warning ci: update workflows to include submodules and token for checkout

### Other Changes
- refactor: simplify upload-song script by removing argument handling and streamlining S3 sync process
- refactor: update song deduplication to use slug instead of Id
- Add kantada
- Remove kms key
- Get Periodic updates
- Add loading
- Invalidate only generated files
- Cache json files for 1 year
- Add API caching
- Update API URL in prod
- Add API path
- Add infra and deploy
- Make home clickable
- Don't show youtube when offline
- Fix typo
- Fix  kantada on first load
- Change main font to Inter
- Add justify controls
- Add font-size control in kantada
- Complete kantada text
- Fix apostrophe
- Initial cantada
- Load first file on the list
-  Add sidebar file header
- Move back button to the right side of Songs
- Highlite selected on sidebar
- Change colors
- Better lyrics only
- Auto update app
- Remove not needed file
- Change them color
- Change to dark mode
- Initial lyrics only
- Add set to query url
- Embed youtube video
- Add caching
- Add install in deploy
- Add offline support and fix layout issues
- Scroll to top
- Add font
- Add font size change
- Add deploy script
- Fix song color
- Fix bg color
- Change song text bg color
- Make song text darker
- Add html title
- Add production build
- Add production env
- Allow host
- Fix header on desktop
- Add title and menu
- Add album label
- Remove .json in filename
- Fix song view
- Remove log
- Add prev and next button
- Fix css
- Fix css
- Fix column
- Initial codes

**Full Changelog**: https://github.com/ianpogi5/pyesa/compare/d50263e14fdc8def07eedbb8aaf9831ca4f8e64d...v1.99.0


All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-02-28

### Added

- Complete UI revamp with mobile-first design and Catppuccin-inspired theme
- Dark/light mode toggle with system preference detection
- Three main pages: Sets, Library, and Rosario Kantada
- IndexedDB song persistence for offline access
- ChordPro format support with lyrics/chords toggle
- Song auto-scroll with adjustable speed
- Swipe navigation between songs in a set
- Download All Sets button with progress bar
- Searchable song library with deduplication (slug-based)
- YouTube embed support for songs with video links
- PWA install button in header
- Responsive layout with desktop sidebar and mobile bottom tabs
- Font size controls on song viewer and Rosario page
- Song picker modal for Rosario AWIT markers
- Offline indicator in header
- S3-based song data sync for CI/CD deploys
- Upload script for syncing song files to S3

### Changed

- Migrated from plain CSS to Tailwind CSS 4
- Switched from single-page layout to React Router multi-route SPA
- Song storage now uses name-based slugs instead of numeric IDs to prevent duplicates
- Deploy workflow syncs song data from S3 instead of requiring git submodules
- Simplified upload script — no parameters needed, just regenerates manifest and syncs to S3

### Removed

- Legacy single-page Kantada-only layout
- Old CSS component files (ContentArea.css, Kantada.css, Sidebar.css, YouTubeEmbed.css)

## [1.0.0] - 2024-01-01

### Added

- Initial release with Kantada (Rosario) page
- YouTube embed for song videos
- PWA support with offline caching
- Basic sidebar navigation
- AWS S3 + CloudFront hosting with Terraform infrastructure
