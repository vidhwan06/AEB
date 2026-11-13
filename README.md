# AEB — Adaptive Eye Balance

A web-based readability and display-adaptation prototype. The first release focuses on user-controlled reading presentation. Webcam-based viewing-condition estimation is an experimental, opt-in capability; this project does not diagnose vision or correct refractive errors.

## Requirements
- Node.js 22.12 or newer (required by the current Vitest 5 toolchain)
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
npm test
npm run lint
npm run build
```

## Implemented
- Premium dark product workspace
- Interactive Reading Lab and browser-local reading preferences
- Webcam Vision Monitor with explicit start/stop and local face-landmark processing
- One-point measured viewing-distance calibration
- Distance-aware text-size suggestions, requiring explicit user approval
- Cross-tab synchronization of saved Reading Lab settings
- Local distance validation log with mean absolute error, mean percentage error and within-10% summary
- CSV export of user-entered validation trials
- Unit tests for face geometry, distance calculation, adaptive suggestion rules, profile normalization and validation metrics

## Distance validation
- Compare the Vision Monitor estimate with a tape-measure reading from the webcam lens to approximately the bridge of your nose.
- Record repeat measurements at multiple distances and conditions while maintaining centered, forward-facing, level head position.
- Aim for at least 10 trials per condition. Use the same camera, resolution, zoom and camera position within each calibration set.
- Error summaries describe only the trials you enter; they are not device accuracy certification.
- Validation data stays in browser localStorage and is not uploaded.

## Vision Monitor notes
- Uses `@mediapipe/tasks-vision@1.2.3` and the Face Landmarker float16 model.
- The model and WASM runtime are downloaded from Google-hosted/CDN resources at runtime.
- Face video frames are processed on-device and are not uploaded by AEB. MediaPipe SDK usage/performance metrics may be sent to Google; review the package privacy notice before deploying to users.
- Detection runs at a throttled rate on the browser main thread in this prototype. A worker-based pipeline is a future performance improvement.
- Head orientation is a coarse landmark heuristic, not precise pose estimation or gaze tracking.
- Distance is a one-point proportional estimate based on apparent eye spacing. Camera zoom, camera position, resolution, face angle and measurement error affect it. Recalibrate after changing camera/framing.
- The monitor does not measure eyesight, diagnose a condition, determine a prescription or correct refractive errors.

## Privacy principles
- Camera permission must be explicit.
- No microphone is requested.
- Stop the camera when leaving the Vision Monitor.
- Do not store or upload raw camera frames.
- Calibration and validation data are stored in localStorage on the current browser only.

## Scope
AEB currently changes typography and presentation inside its own reading workspace. It does not control the operating system's global display or provide optical correction.
