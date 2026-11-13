# AEB — Adaptive Eye Balance

A web-based readability and display-adaptation prototype. The first release focuses on user-controlled reading presentation. Webcam-based viewing-condition estimation is a later milestone; this project does not diagnose vision or correct refractive errors.

## Requirements
- Node.js 20.9+
- npm

## Run locally
```powershell
npm install
npm run dev
```
Open http://localhost:3000.

## Quality checks
```powershell
npm run lint
npm run build
```

## Implemented
- Premium dark product workspace
- Interactive Reading Lab
- Live controls for font size, weight, line height, letter spacing, typeface, reading width and reading surface
- Reading preview updates immediately
- Explicit save and reset for a browser-local reading profile
- Defensive validation of stored profile data

## Planned next
1. Browser-based camera permission and clear tracking controls
2. MediaPipe face landmark integration
3. Calibrated, approximate viewing-distance estimation
4. Conservative, user-controlled adaptation suggestions
5. User testing to evaluate readability and comfort

## Privacy principles
- Camera permission must be explicit.
- Process frames locally in the browser where feasible.
- Do not store or upload raw camera frames.
- Provide a clear tracking-off state and manual override.
- Reading preferences are stored in localStorage on the current browser only.

## Scope
AEB currently changes typography and presentation inside its own reading workspace. It does not control the operating system's global display, measure visual acuity, determine a prescription, or correct refractive errors.
