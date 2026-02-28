# Changelog

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
