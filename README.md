# Amilla HR Letters

Letter generator for HR (employment, service and bank letters) as a phone-friendly web app that can sit on the iPhone home screen.

- `index.html` is the whole app.
- `mobile.css`, `mobile.js` are the phone layer (bottom tabs, Staff → Letter → Preview steps, cards instead of wide tables).
- `manifest.webmanifest`, `sw.js`, `pwa.js`, `icons/` make it installable and usable offline.
- `vendor/` holds the Excel and PDF libraries, so nothing is loaded from other websites except the Manrope font (the app falls back to the system font offline).

Staff data, signatures and issued letters are stored **in the browser/phone only**. They are never uploaded to this repository.

## Update the app
Replace the files in the repo and commit. The home-screen app picks up the new version the second time it is opened.
If a change does not show up, change `VERSION` at the top of `sw.js` (for example `v2`).

## Add to iPhone
Open the page in **Safari** → Share → **Add to Home Screen**.
