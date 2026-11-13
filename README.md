# AEB — Adaptive Eye Balance

A web-based readability and display-adaptation prototype. The first release focuses on user-controlled reading presentation. Webcam-based viewing-condition estimation is an experimental, opt-in capability; this project does not diagnose vision or correct refractive errors.

## Requirements
- Node.js 20.9+
- npm
- Chrome or Edge recommended for the local prototype
- Webcam permission
- HTTPS or localhost for camera access

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
- Explicit save and reset for browser-local reading profiles
- Vision Monitor with explicit camera start/stop
- MediaPipe Face Landmarker, one face at a time
- Local face framing, head-angle heuristic and facial landmark overlay
- Optional one-point viewing-distance calibration with the reference Reading Lab font size saved locally
- Distance-aware font-size suggestions, gated by centered/front-facing/level tracking, capped to ±2px from the calibrated baseline, and applied only after an explicit user click
- Cross-tab synchronization of saved Reading Lab settings

## Vision Monitor notes
- Uses `@mediapipe/tasks-vision@1.2.3` and the official Face Landmarker float16 model.
- The model and WASM runtime are downloaded from Google-hosted/CDN resources at runtime.
- Face video frames are processed on-device and are not uploaded by AEB. MediaPipe SDK usage/performance metrics may be sent to Google; review the MediaPipe package privacy notice before deploying to users.
- Detection runs at a throttled rate on the browser main thread in this prototype. A worker-based pipeline is a future performance improvement.
- Head orientation is a coarse landmark heuristic, not precise pose estimation or gaze tracking.
- Distance is a one-point proportional estimate based on apparent eye spacing. Camera zoom, camera position, resolution, face angle and measurement error affect it. Recalibrate after changing camera/framing.
- The monitor does not measure eyesight, diagnose a condition, determine a prescription or correct refractive errors.

## Privacy principles
- Camera permission must be explicit.
- No microphone is requested.
- Stop the camera when leaving the Vision Monitor.
- Do not store or upload raw camera frames.
- Calibration data is stored in localStorage on the current browser only.

## Scope
AEB currently changes typography and presentation inside its own reading workspace. It does not control the operating system's global display or provide optical correction.
