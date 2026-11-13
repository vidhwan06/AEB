"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  Camera,
  CameraOff,
  CheckCircle2,
  Eye,
  Focus,
  Gauge,
  LockKeyhole,
  Ruler,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import {
  DEFAULT_READING_PROFILE,
  normalizeReadingProfile,
  READING_PROFILE_STORAGE_KEY,
  type ReadingProfile,
} from "@/lib/reading-profile";
import { getAdaptiveSuggestion } from "@/lib/adaptive-controller";
import Link from "next/link";
import {
  estimateDistanceCm,
  getVisionSnapshot,
  median,
  type DistanceCalibration,
  type VisionSnapshot,
} from "@/lib/vision-metrics";

type CameraState = "idle" | "starting" | "active" | "error";

const CALIBRATION_KEY = "aeb-vision-distance-calibration-v1";
const VISION_VERSION = "1.2.3";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const DETECTION_INTERVAL_MS = 140;
const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
  379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93,
  234, 127, 162, 21, 54, 103, 67, 109,
];

function describeCameraError(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera permission was denied or blocked. Allow camera access for this site in your browser settings, then try again.";
  }
  if (name === "NotFoundError") {
    return "No camera was found. Connect a webcam or enable your laptop camera.";
  }
  if (name === "NotReadableError") {
    return "The camera is already in use or could not be opened. Close other camera apps and try again.";
  }
  if (name === "OverconstrainedError") {
    return "The selected camera cannot provide the requested video settings. Try another camera.";
  }
  return error instanceof Error
    ? `Vision setup failed: ${error.message}`
    : "Vision setup failed. Check your camera and internet connection, then try again.";
}

function drawLandmarks(
  canvas: HTMLCanvasElement | null,
  width: number,
  height: number,
  landmarks: { x: number; y: number }[] | null,
) {
  if (!canvas) return;
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return;

  context.clearRect(0, 0, width, height);
  if (!landmarks) return;

  context.beginPath();
  FACE_OVAL.forEach((index, position) => {
    const point = landmarks[index];
    if (!point) return;
    const x = point.x * width;
    const y = point.y * height;
    if (position === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.closePath();
  context.strokeStyle = "rgba(177, 160, 255, 0.94)";
  context.lineWidth = Math.max(2, width / 320);
  context.shadowColor = "rgba(155, 140, 255, 0.7)";
  context.shadowBlur = 12;
  context.stroke();
  context.shadowBlur = 0;

  [33, 133, 362, 263, 1].forEach((index) => {
    const point = landmarks[index];
    if (!point) return;
    context.beginPath();
    context.arc(point.x * width, point.y * height, Math.max(3, width / 180), 0, Math.PI * 2);
    context.fillStyle = index === 1 ? "#9BE7CF" : "#B4A5FF";
    context.fill();
  });
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Eye;
}) {
  return (
    <div className="panel rounded-2xl p-4">
      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
        <Icon size={14} className="text-violet" />
        {label}
      </div>
      <div className="mt-3 text-lg font-semibold tracking-tight text-zinc-100">{value}</div>
      <div className="mt-1 text-[10px] leading-4 text-zinc-500">{hint}</div>
    </div>
  );
}

export function VisionMonitorClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationRef = useRef<number | null>(null);
  const sessionRef = useRef(0);
  const lastDetectionRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const distanceHistoryRef = useRef<number[]>([]);
  const calibrationRef = useRef<DistanceCalibration | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [snapshot, setSnapshot] = useState<VisionSnapshot | null>(null);
  const [calibration, setCalibration] = useState<DistanceCalibration | null>(null);
  const [referenceDistanceInput, setReferenceDistanceInput] = useState("55");
  const [profileStatus, setProfileStatus] = useState("Not calibrated");
  const [distanceEstimate, setDistanceEstimate] = useState<number | null>(null);
  const [readingProfile, setReadingProfile] = useState<ReadingProfile>(DEFAULT_READING_PROFILE);

  useEffect(() => {
    calibrationRef.current = calibration;
  }, [calibration]);

  useEffect(() => {
    try {
      const savedProfile = window.localStorage.getItem(READING_PROFILE_STORAGE_KEY);
      if (savedProfile) setReadingProfile(normalizeReadingProfile(JSON.parse(savedProfile)));

      const stored = window.localStorage.getItem(CALIBRATION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DistanceCalibration;
        if (
          Number.isFinite(parsed.referenceEyeSpanPx) &&
          parsed.referenceEyeSpanPx > 0 &&
          Number.isFinite(parsed.referenceDistanceCm) &&
          parsed.referenceDistanceCm >= 20 &&
          parsed.referenceDistanceCm <= 150
        ) {
          setCalibration(parsed);
          setReferenceDistanceInput(String(parsed.referenceDistanceCm));
          setProfileStatus("Calibration restored");
        }
      }
    } catch {
      setProfileStatus("Local calibration unavailable");
    }
  }, []);

  const releaseResources = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    landmarkerRef.current?.close();
    landmarkerRef.current = null;

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const stopCamera = useCallback(() => {
    sessionRef.current += 1;
    releaseResources();
    setCameraState("idle");
    setSnapshot(null);
    setDistanceEstimate(null);
    distanceHistoryRef.current = [];
    setErrorMessage("");
  }, [releaseResources]);

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      releaseResources();
    };
  }, [releaseResources]);

  const startCamera = useCallback(async () => {
    if (cameraState === "starting" || cameraState === "active") return;

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCameraState("error");
      setErrorMessage("Camera access requires HTTPS or localhost. Open the local development site at http://localhost:3000 or use the secure deployed URL.");
      return;
    }

    const sessionId = sessionRef.current + 1;
    sessionRef.current = sessionId;
    setCameraState("starting");
    setErrorMessage("");
    setSnapshot(null);
    setDistanceEstimate(null);
    distanceHistoryRef.current = [];

    let localStream: MediaStream | null = null;
    let localLandmarker: FaceLandmarker | null = null;

    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 24 },
        },
      });

      if (sessionRef.current !== sessionId) {
        localStream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = localStream;
      const video = videoRef.current;
      if (!video) throw new Error("The camera preview is not ready.");

      video.srcObject = localStream;
      await video.play();

      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      localLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.55,
        minFacePresenceConfidence: 0.55,
        minTrackingConfidence: 0.55,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });

      if (sessionRef.current !== sessionId) {
        localLandmarker.close();
        localStream.getTracks().forEach((track) => track.stop());
        return;
      }

      landmarkerRef.current = localLandmarker;
      setCameraState("active");

      const renderLoop = () => {
        if (sessionRef.current !== sessionId) return;

        const currentVideo = videoRef.current;
        const landmarker = landmarkerRef.current;
        const now = performance.now();

        if (
          currentVideo &&
          landmarker &&
          currentVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          currentVideo.currentTime !== lastVideoTimeRef.current &&
          now - lastDetectionRef.current >= DETECTION_INTERVAL_MS
        ) {
          lastDetectionRef.current = now;
          lastVideoTimeRef.current = currentVideo.currentTime;

          try {
            const result = landmarker.detectForVideo(currentVideo, now);
            const landmarks = result.faceLandmarks?.[0] ?? null;

            if (landmarks && currentVideo.videoWidth && currentVideo.videoHeight) {
              const nextSnapshot = getVisionSnapshot(
                landmarks,
                currentVideo.videoWidth,
                currentVideo.videoHeight,
              );

              setSnapshot(nextSnapshot);
              drawLandmarks(
                canvasRef.current,
                currentVideo.videoWidth,
                currentVideo.videoHeight,
                nextSnapshot ? landmarks : null,
              );

              const activeCalibration = calibrationRef.current;
              if (nextSnapshot && activeCalibration) {
                const nextDistance = estimateDistanceCm(
                  nextSnapshot.eyeSpanPx,
                  activeCalibration,
                );

                if (nextDistance !== null) {
                  const history = [...distanceHistoryRef.current, nextDistance].slice(-7);
                  distanceHistoryRef.current = history;
                  setDistanceEstimate(median(history));
                } else {
                  setDistanceEstimate(null);
                }
              } else {
                setDistanceEstimate(null);
              }
            } else {
              setSnapshot(null);
              setDistanceEstimate(null);
              drawLandmarks(canvasRef.current, currentVideo.videoWidth, currentVideo.videoHeight, null);
            }
          } catch {
            setErrorMessage("The vision model stopped processing frames. Stop the camera and try again.");
            setCameraState("error");
            sessionRef.current += 1;
            releaseResources();
            return;
          }
        }

        animationRef.current = requestAnimationFrame(renderLoop);
      };

      animationRef.current = requestAnimationFrame(renderLoop);
    } catch (error) {
      localStream?.getTracks().forEach((track) => track.stop());
      localLandmarker?.close();

      if (sessionRef.current === sessionId) {
        releaseResources();
        setCameraState("error");
        setErrorMessage(describeCameraError(error));
      }
    }
  }, [cameraState, releaseResources]);

  const calibrateDistance = useCallback(() => {
    const measuredDistance = Number(referenceDistanceInput);
    if (!snapshot || !Number.isFinite(measuredDistance) || measuredDistance < 20 || measuredDistance > 150) {
      setProfileStatus("Enter a measured distance from 20 to 150 cm with a face in view");
      return;
    }

    const nextCalibration: DistanceCalibration = {
      referenceEyeSpanPx: snapshot.eyeSpanPx,
      referenceDistanceCm: measuredDistance,
      baselineFontSize: readingProfile.fontSize,
    };

    try {
      window.localStorage.setItem(CALIBRATION_KEY, JSON.stringify(nextCalibration));
      setCalibration(nextCalibration);
      setProfileStatus("Calibrated on this device");
      distanceHistoryRef.current = [];
    } catch {
      setProfileStatus("Could not save calibration in this browser");
    }
  }, [readingProfile.fontSize, referenceDistanceInput, snapshot]);

  const clearCalibration = useCallback(() => {
    try {
      window.localStorage.removeItem(CALIBRATION_KEY);
      setCalibration(null);
      setDistanceEstimate(null);
      distanceHistoryRef.current = [];
      setProfileStatus("Not calibrated");
    } catch {
      setProfileStatus("Could not clear local calibration");
    }
  }, []);

  const applyAdaptiveSuggestion = useCallback(() => {
    if (distanceEstimate === null) return;
    const suggestion = getAdaptiveSuggestion(
      distanceEstimate,
      calibration,
      readingProfile,
      snapshot,
    );
    if (!suggestion) return;

    const nextProfile = normalizeReadingProfile({
      ...readingProfile,
      fontSize: suggestion.suggestedFontSize,
    });

    try {
      window.localStorage.setItem(READING_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
      setReadingProfile(nextProfile);
      setProfileStatus("Adaptive text size saved to your Reading Lab profile");
    } catch {
      setProfileStatus("Could not save the adaptive suggestion in this browser");
    }
  }, [calibration, distanceEstimate, readingProfile, snapshot]);

  const adaptiveSuggestion = distanceEstimate === null
    ? null
    : getAdaptiveSuggestion(distanceEstimate, calibration, readingProfile, snapshot);

  const faceValue = cameraState !== "active"
    ? "Camera inactive"
    : snapshot
      ? "Face detected"
      : "Looking for face";
  const distanceValue = !calibration
    ? "Not calibrated"
    : distanceEstimate !== null
      ? `~${Math.round(distanceEstimate)} cm`
      : snapshot
        ? "Out of estimate range"
        : "Waiting for face";

  return (
    <div className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-11 lg:py-9">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs tracking-[.12em] text-zinc-500">WORKSPACE / VISION MONITOR</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Understand your viewing position</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Use your webcam to estimate face position and movement. Distance is available only after a measured reference calibration.</p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[.03] px-3 py-2 text-xs text-zinc-400 sm:self-auto">
          <span className={`h-2 w-2 rounded-full ${cameraState === "active" ? "bg-emerald-300" : cameraState === "error" ? "bg-rose-400" : "bg-zinc-600"}`} />
          {cameraState === "active" ? "Tracking active" : cameraState === "starting" ? "Starting…" : cameraState === "error" ? "Needs attention" : "Camera off"}
        </div>
      </header>

      <div className="mt-8 grid items-start gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        <section className="min-w-0 space-y-4">
          <div className="panel overflow-hidden rounded-3xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2 text-sm font-medium"><Video size={16} className="text-violet"/> Camera preview</div>
              <span className="text-[10px] uppercase tracking-[.15em] text-zinc-500">Local processing</span>
            </div>

            <div className="relative aspect-video overflow-hidden bg-[#08090e]">
              <video
                ref={videoRef}
                muted
                playsInline
                aria-label="Mirrored webcam preview"
                className={`absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)] ${cameraState === "active" || cameraState === "starting" ? "opacity-100" : "opacity-0"}`}
              />
              <canvas
                ref={canvasRef}
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)] ${cameraState === "active" ? "opacity-100" : "opacity-0"}`}
              />

              {cameraState !== "active" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(155,140,255,.10),transparent_55%)] px-6 text-center">
                  <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl border border-violet/20 bg-violet/[.08] text-violet">
                    {cameraState === "error" ? <AlertCircle size={27}/> : <Camera size={27}/>}
                  </div>
                  <div className="text-sm font-medium text-zinc-200">
                    {cameraState === "starting" ? "Preparing vision engine" : cameraState === "error" ? "Camera setup needs attention" : "Camera is off"}
                  </div>
                  <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-500">
                    {cameraState === "starting"
                      ? "Waiting for permission, then loading the face-landmark model."
                      : cameraState === "error"
                        ? errorMessage
                        : "Press Start camera when you are ready. Your browser will ask for permission."}
                  </p>
                </div>
              )}

              {cameraState === "active" && !snapshot && (
                <div className="absolute inset-0 flex items-end justify-center p-5">
                  <div className="rounded-full border border-white/15 bg-black/60 px-4 py-2 text-xs text-white backdrop-blur">Move into view and face the camera</div>
                </div>
              )}

              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] text-zinc-300 backdrop-blur">
                <span className={`h-1.5 w-1.5 rounded-full ${cameraState === "active" ? "animate-pulse bg-emerald-300" : "bg-zinc-500"}`}/>
                {cameraState === "active" ? "LIVE" : "PREVIEW OFF"}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <LockKeyhole size={13}/>
                No video recording or upload
              </div>
              {cameraState === "active" ? (
                <button type="button" onClick={stopCamera} className="inline-flex items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/[.07] px-4 py-2.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-300/[.12]">
                  <CameraOff size={14}/> Stop camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={cameraState === "starting" ? stopCamera : startCamera}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-xs font-semibold text-[#100d1c] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
                >
                  <Camera size={14}/>{cameraState === "starting" ? "Cancel setup" : "Start camera"}
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="Face detection" value={faceValue} hint="One face at a time" icon={Eye}/>
            <MetricCard label="Face framing" value={snapshot?.framing ?? "Waiting"} hint="Coarse position in camera frame" icon={Focus}/>
            <MetricCard label="Approx. viewing distance" value={distanceValue} hint={calibration ? "One-point calibrated estimate" : "Calibrate with a measured distance"} icon={Ruler}/>
            <MetricCard label="Head orientation" value={snapshot?.headTurn ?? "Waiting"} hint="Approximate landmark heuristic" icon={Activity}/>
            <MetricCard label="Head tilt" value={snapshot?.headTilt ?? "Waiting"} hint={snapshot ? `${Math.abs(snapshot.tiltDegrees).toFixed(1)}° relative to horizontal` : "Waiting for face"} icon={Gauge}/>
            <MetricCard label="Face width in frame" value={snapshot ? `${(snapshot.faceWidthRatio * 100).toFixed(0)}%` : "—"} hint="Relative size, not a distance measurement" icon={Eye}/>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="panel rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet/10 text-violet"><Ruler size={18}/></div>
              <div>
                <h2 className="text-sm font-semibold">Distance calibration</h2>
                <p className="mt-1 text-[11px] text-zinc-500">{profileStatus}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
              <div className="text-xs font-medium text-zinc-200">One-point reference</div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">Measure from the webcam to your face. Sit at that distance, keep your head centered, then save the reference while a face is detected.</p>
              <label htmlFor="reference-distance" className="mt-4 block text-xs text-zinc-400">Measured distance (cm)</label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="reference-distance"
                  type="number"
                  min={20}
                  max={150}
                  step={1}
                  value={referenceDistanceInput}
                  onChange={(event) => setReferenceDistanceInput(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0a0b11] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet/60"
                />
                <span className="text-xs text-zinc-500">cm</span>
              </div>
              <button
                type="button"
                onClick={calibrateDistance}
                disabled={cameraState !== "active" || !snapshot || snapshot.framing !== "Centered" || snapshot.headTurn !== "Facing camera"}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet/30 bg-violet/[.09] px-3 py-2.5 text-xs font-semibold text-violet transition hover:bg-violet/[.15] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircle2 size={14}/> Save reference calibration
              </button>
              <p className="mt-3 text-[10px] leading-4 text-zinc-600">Usable range: 20–150 cm. Recalibrate if you change camera, zoom, resolution or camera position.</p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-[11px] text-zinc-500">{calibration ? `Reference: ${calibration.referenceDistanceCm} cm` : "No reference saved"}</div>
              <button type="button" onClick={clearCalibration} disabled={!calibration} className="text-[11px] text-zinc-400 underline decoration-white/20 underline-offset-4 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-35">Clear calibration</button>
            </div>
          </section>

          <section className="panel rounded-3xl border-violet/20 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet/10 text-violet"><Sparkles size={18}/></div>
              <div>
                <h2 className="text-sm font-semibold">Adaptive reading suggestion</h2>
                <p className="mt-1 text-[11px] text-zinc-500">Distance-aware text sizing · approval required</p>
              </div>
            </div>

            {!calibration ? (
              <p className="mt-4 text-xs leading-5 text-zinc-400">Calibrate your preferred viewing distance first. AEB will capture the current Reading Lab font size as the reference.</p>
            ) : calibration.baselineFontSize === undefined ? (
              <p className="mt-4 text-xs leading-5 text-zinc-400">This calibration predates adaptive sizing. Clear it and recalibrate after choosing your preferred Reading Lab font size.</p>
            ) : cameraState !== "active" ? (
              <p className="mt-4 text-xs leading-5 text-zinc-400">Start the camera to receive a live suggestion. No settings will change automatically.</p>
            ) : !snapshot ? (
              <p className="mt-4 text-xs leading-5 text-zinc-400">Keep your face in frame while AEB collects a stable reading-distance estimate.</p>
            ) : snapshot.framing !== "Centered" || snapshot.headTurn !== "Facing camera" || snapshot.headTilt !== "Level" ? (
              <p className="mt-4 text-xs leading-5 text-zinc-400">For a more consistent estimate, center your face and look straight toward the camera.</p>
            ) : distanceEstimate === null ? (
              <p className="mt-4 text-xs leading-5 text-zinc-400">Waiting for a calibrated distance estimate.</p>
            ) : adaptiveSuggestion ? (
              <>
                <div className="mt-4 rounded-2xl border border-violet/20 bg-violet/[.06] p-4">
                  <div className="text-[10px] uppercase tracking-[.16em] text-violet">Optional adjustment</div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <span className="text-2xl font-semibold">{adaptiveSuggestion.currentFontSize}px</span>
                    <span className="text-sm text-zinc-500">→</span>
                    <span className="text-2xl font-semibold text-violet">{adaptiveSuggestion.suggestedFontSize}px</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">
                    You are {Math.abs(adaptiveSuggestion.distanceChangePercent).toFixed(0)}% {adaptiveSuggestion.distanceChangePercent > 0 ? "farther from" : "closer to"} your calibrated distance. This small change aims to maintain a similar apparent text size.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={applyAdaptiveSuggestion}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet px-4 py-3 text-xs font-semibold text-[#100d1c] transition hover:brightness-110"
                >
                  <CheckCircle2 size={14}/> Apply suggestion
                </button>
              </>
            ) : (
              <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[.05] p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-200"><CheckCircle2 size={14}/> No adjustment needed</div>
                <p className="mt-2 text-xs leading-5 text-zinc-400">Your current viewing distance is near the calibration reference, or your Reading Lab profile already uses the suggested size.</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[.07] pt-3">
              <span className="text-[10px] text-zinc-500">Current Reading Lab size: {readingProfile.fontSize}px</span>
              <Link href="/reading-lab" className="text-[11px] font-medium text-violet hover:text-white">Open Reading Lab →</Link>
            </div>
            <p className="mt-3 text-[10px] leading-4 text-zinc-600">Experimental sizing heuristic, limited to ±2px from your calibration baseline. It does not measure eyesight and never applies changes without your click.</p>
          </section>

          <section className="panel rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={17} className="text-emerald-300"/> Privacy and limitations</div>
            <ul className="mt-4 space-y-3 text-xs leading-5 text-zinc-400">
              <li className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-300"/> Camera access starts only after your click and browser permission.</li>
              <li className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-300"/> Frames are processed on this device; no camera footage is uploaded or recorded by AEB.</li>
              <li className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-300"/> Only the reference eye-span measurement and distance are saved locally.</li>
              <li className="flex gap-2"><AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-300"/> MediaPipe may send SDK usage/performance metrics. Its input images and video are not sent to Google.</li>
              <li className="flex gap-2"><AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-300"/> Distance and head-angle values are rough estimates, not medical measurements or gaze tracking.</li>
            </ul>
          </section>
        </aside>
      </div>

      <footer className="mt-7 flex flex-wrap items-center gap-2 text-[10px] leading-5 text-zinc-600">
        <LockKeyhole size={12}/>
        Camera stream is released when you stop tracking or leave this page.
        <span className="ml-auto">MediaPipe Tasks Vision {VISION_VERSION}</span>
      </footer>
    </div>
  );
}
