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

## Current scope
- Premium dark product shell
- Overview dashboard
- Reading preview
- Separation between vision, calibration and adaptive engines

## Planned next
1. Interactive reading controls and local profile persistence
2. MediaPipe face landmark integration
3. Calibrated, approximate viewing-distance estimation
4. Conservative user-approved adaptation rules

## Privacy principles
- Camera permission must be explicit.
- Process frames locally in the browser where feasible.
- Do not store or upload raw camera frames.
- Provide a clear tracking-off state and manual override.
