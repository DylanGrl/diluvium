# Diluvium - Progress Tracker

## Completed

### Phase 1: Project Scaffolding
- [x] Vite + React 19 + TypeScript project initialized
- [x] All dependencies installed (TanStack Query, React Router, Tailwind CSS v4, Lucide, sonner)
- [x] Vite proxy configured for `/json` and `/upload` to deluge-web
- [x] Path aliases (`@/`) configured
- [x] Project directory structure created

### Phase 2: Core API Layer
- [x] `DelugeClient` class with JSON-RPC wrapper
- [x] TypeScript types for all API responses (TorrentStatus, TorrentFile, Peer, Tracker, etc.)
- [x] TanStack Query hooks: useAuth, useConnection, useUpdateUI, useTorrentStatus, useTorrentFiles, useTorrentPeers, useTorrentActions, useAddTorrent, useConfig

### Phase 3: Login + Connection Flow
- [x] Login page with password field
- [x] Session check with auto-redirect
- [x] Auto-connect to first available daemon

### Phase 4: Main Dashboard
- [x] App shell layout
- [x] Header with speed indicators, DHT nodes, free space
- [x] Sidebar with state/tracker/label filters and counts
- [x] Sortable torrent table (name, size, progress, state, speeds, ETA, ratio, seeds, peers)
- [x] Multi-select with Ctrl/Cmd+click
- [x] Toolbar with pause/resume/remove/recheck/queue actions
- [x] Keyboard shortcuts (A=add, Space=pause/resume, Delete=remove, Esc=deselect)

### Phase 5: Torrent Detail Views
- [x] Detail panel slides up from bottom
- [x] General tab with full status info and progress bar
- [x] Files tab with file list, sizes, progress, priorities
- [x] Peers tab with IP, client, speeds, progress
- [x] Trackers tab
- [x] Options tab showing per-torrent limits

### Phase 6: Add Torrent Dialog
- [x] Drag-and-drop .torrent file upload
- [x] Magnet link input
- [x] URL input
- [x] File browser fallback

### Phase 7: Settings + Polish
- [x] Settings dialog with speed limits
- [x] Dark/light theme toggle (dark by default)
- [x] Toast notifications via sonner
- [x] About page with keyboard shortcuts reference

### UI Components (shadcn/ui style, no Radix dependency)
- [x] Button, Input, Label, Dialog, Tabs, Checkbox, Badge
- [x] ScrollArea, DropdownMenu, Progress, Tooltip, Separator
- [x] Select, Switch, Slider

## Architecture Notes

- All components use custom implementations (no @radix-ui dependency)
- Tailwind CSS v4 with oklch color system
- Polling interval: 3s default (configurable via store)
- Local preferences persisted to localStorage (theme, sort, columns)
- Vite dev proxy forwards /json and /upload to localhost:8112

## Known Limitations / Future Work

- [ ] Responsive design for mobile/tablet (sidebar hidden on mobile, needs hamburger menu)
- [ ] Speed graphs (Recharts)
- [ ] Country flags for peers
- [ ] Per-torrent file priority editing (UI to change priorities)
- [ ] Connection picker when multiple daemon hosts available
- [ ] Download location picker in add torrent dialog
- [ ] Column visibility customization
- [ ] Torrent context menu (right-click)
