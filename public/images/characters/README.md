# Character Images

Place character avatar images directly in the `/public` folder (NOT in a subfolder).

The app will automatically search for images using multiple naming patterns:

For **Dorkesh Cartel** (President), any of these will work:
- `dorkesh_cartel.png`, `dorkesh-cartel.png`, `dorkeshcartel.png`
- `moderator.png`

For **Wario Amadeuss**, any of these:
- `wario_amadeuss.png`, `wario-amadeuss.png`, `warioamadeuss.png`
- `player2.png`

For **Domis Hassoiboi**, any of these:
- `domis_hassoiboi.png`, `domis-hassoiboi.png`, `domishassoiboi.png`
- `player3.png`

For **Scan Ctrl+Altman**, any of these:
- `scan_ctrl+altman.png`, `scan-ctrl+altman.png`, `scanctrl+altman.png`
- `player4.png`

For the **human player**, any of these:
- `[your_name].png` (lowercase with underscores/hyphens)
- `human.png`

## Supported formats
- PNG (recommended for transparency)
- JPG/JPEG
- WebP

## Recommended specifications
- Resolution: 512x512 or 1024x1024
- Aspect ratio: 1:1 (square)
- File size: < 500KB for optimal loading

If no image is found for a character, the app will fall back to showing the first letter of their name in a colored circle.
