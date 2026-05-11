# Andre Sun Portfolio

Interactive portfolio website for Sun Qisheng / Andre Sun.

## Open directly

Open `index.html` at the repository root. The root file is the standalone build and can be hosted as a static GitHub Pages site.

## Source project

The editable Vite React source is in `app/`.

```powershell
cd app
npm ci
npm run build:standalone
```

`npm run build:standalone` rebuilds the Vite app and writes the directly openable root `index.html`.

## Validation

- `npm run lint`
- `npm run build:standalone`
- Checked the root `file://` build with Playwright across desktop and mobile viewports.
