# Electron app assets

This folder holds the binary art that gets baked into the installers.
Replace the placeholders with real artwork before the first release.

## Required files

| File          | Purpose                          | Size requirements                          |
| ------------- | -------------------------------- | ------------------------------------------ |
| `icon.icns`   | macOS app + dock icon            | 1024×1024 source, multi-rep `.icns`        |
| `icon.ico`    | Windows app + installer icon     | 256×256 multi-resolution `.ico`            |
| `icon.png`    | Linux + fallback (BrowserWindow) | 512×512 PNG                                |
| `icon-tray.png` | System tray (light + dark)     | 16×16 base + `icon-tray@2x.png` (32×32)    |

## Generating from a single PNG

If you have a 1024×1024 master PNG, use these tools:

```bash
# .icns (macOS) — install: brew install libicns
png2icns icon.icns icon-1024.png

# .ico (Windows) — install: brew install imagemagick
magick icon-1024.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# Tray icon — quickest is sharp or imagemagick
magick icon-1024.png -resize 16x16 icon-tray.png
magick icon-1024.png -resize 32x32 icon-tray@2x.png
```

## macOS template image

`icon-tray.png` for macOS should be a **monochrome template image**
(black on transparent) so the OS recolors it for light/dark menubar.
The main process calls `image.setTemplateImage(true)` for that path —
make sure the PNG is genuinely monochrome or it'll render weirdly in
dark mode.

## Until real icons land

`electron-builder` will fail the macOS / Windows build if these files
don't exist. Dev mode (`npm run dev:electron`) works without them —
Electron falls back to its default icon. So you can ship the shell to
QA before the brand team finalizes artwork.
