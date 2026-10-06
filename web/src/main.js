import {
  FINGERS,
  FINGER_LABELS,
  SimulatedServoOutput,
  buildServoCommand,
  emptyServoAngles
} from "./servoOutput.js";

const SMOOTHING_ALPHA = 0.22;
const CALIBRATION_KEY = "robotic-hand-calibration-v1";

const FINGER_JOINTS = {
  thumb: [
    [1, 2, 3],
    [2, 3, 4]
  ],
  index: [
    [5, 6, 7],
    [6, 7, 8]
  ],
  middle: [
    [9, 10, 11],
    [10, 11, 12]
  ],
  ring: [
    [13, 14, 15],
    [14, 15, 16]
  ],
  pinky: [
    [17, 18, 19],
    [18, 19, 20]
  ]
};

const DEFAULT_CALIBRATION = {
  thumb: { open: 12, closed: 85 },
  index: { open: 5, closed: 105 },
  middle: { open: 5, closed: 110 },
  ring: { open: 5, closed: 110 },
  pinky: { open: 5, closed: 105 }
};

const elements = {
  video: document.querySelector("#inputVideo"),
  canvas: document.querySelector("#overlayCanvas"),
  videoStage: document.querySelector("#videoStage"),
  cameraMessage: document.querySelector("#cameraMessage"),
  appMessage: document.querySelector("#appMessage"),
  handStatus: document.querySelector("#handStatus"),
  fpsStatus: document.querySelector("#fpsStatus"),
  outputStatus: document.querySelector("#outputStatus"),
  servoList: document.querySelector("#servoList"),
  startCameraButton: document.querySelector("#startCameraButton"),
  calibrateOpenButton: document.querySelector("#calibrateOpenButton"),
  calibrateClosedButton: document.querySelector("#calibrateClosedButton"),
  stopButton: document.querySelector("#stopButton"),
  resetButton: document.querySelector("#resetButton"),
  mirrorToggle: document.querySelector("#mirrorToggle"),
  debugHand: document.querySelector("#debugHand"),
  commandPreview: document.querySelector("#commandPreview"),
  debugAngles: {
    thumb: document.querySelector("#debugThumb"),
    index: document.querySelector("#debugIndex"),
    middle: document.querySelector("#debugMiddle"),
    ring: document.querySelector("#debugRing"),
    pinky: document.querySelector("#debugPinky")
  }
};

const ctx = elements.canvas.getContext("2d");

const state = {
  cameraStarted: false,
  isProcessing: false,
  isStopped: false,
  handDetected: false,
  lastRawBends: emptyServoAngles(),
  normalizedBends: Object.fromEntries(FINGERS.map((finger) => [finger, 0])),
  targetAngles: emptyServoAngles(),
  smoothedAngles: emptyServoAngles(),
  calibration: loadCalibration(),
  frameCounter: 0,
  lastFpsTime: performance.now()
};

const servoOutput = new SimulatedServoOutput(updateServoUi);

let hands = null;

createServoControls();
bindControls();
updateServoUi(state.smoothedAngles);
updateDebugPanel();
setMirrorMode(elements.mirrorToggle.checked);
startCamera();

function bindControls() {
  elements.startCameraButton.addEventListener("click", startCamera);
  elements.calibrateOpenButton.addEventListener("click", () => calibrate("open"));
  elements.calibrateClosedButton.addEventListener("click", () => calibrate("closed"));
  elements.stopButton.addEventListener("click", toggleStop);
  elements.resetButton.addEventListener("click", resetServos);
  elements.mirrorToggle.addEventListener("change", (event) => {
    setMirrorMode(event.target.checked);
  });
}

function createServoControls() {
  elements.servoList.innerHTML = "";

  FINGERS.forEach((finger, index) => {
    const item = document.createElement("article");
    item.className = "servo-card";
    item.dataset.finger = finger;
    item.innerHTML = `
      <div class="servo-card-header">
        <div>
          <h3>${FINGER_LABELS[finger]}</h3>
          <p>Servo ${index + 1} -> <span data-angle>0°</span></p>
        </div>
        <span class="finger-state" data-state>Open</span>
      </div>
      <div class="servo-gauge" aria-hidden="true">
        <div class="servo-needle" data-needle></div>
      </div>
      <input
        data-slider
        type="range"
        min="0"
        max="180"
        value="0"
        disabled
        aria-label="${FINGER_LABELS[finger]} simulated servo angle"
      />
    `;
    elements.servoList.appendChild(item);
  });
}

async function startCamera() {
  if (state.cameraStarted) {
    return;
  }

  if (!window.Hands || !window.drawConnectors || !window.drawLandmarks) {
    showMessage("MediaPipe files are missing. Run npm install, then start the app again.", true);
    return;
  }

  try {
    elements.startCameraButton.disabled = true;
    showCameraMessage("Requesting webcam...");
    showMessage("Requesting webcam permission.");

    setupHands();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user"
      }
    });

    elements.video.srcObject = stream;
    await elements.video.play();
    resizeCanvasToVideo();

    state.cameraStarted = true;
    hideCameraMessage();
    showMessage("Camera running. Show one hand to begin tracking.");
    requestAnimationFrame(processFrame);
  } catch (error) {
    elements.startCameraButton.disabled = false;
    showCameraMessage("Camera unavailable");
    showMessage(`Camera error: ${error.message}`, true);
  }
}

function setupHands() {
  if (hands) {
    return;
  }

  hands = new window.Hands({
    locateFile: (file) => `/mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.65,
    minTrackingConfidence: 0.55
  });

  hands.onResults(handleResults);
}

async function processFrame() {
  if (!state.cameraStarted) {
    return;
  }

  if (elements.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !state.isProcessing) {
    state.isProcessing = true;
    try {
      await hands.send({ image: elements.video });
    } catch (error) {
      showMessage(`Tracking error: ${error.message}`, true);
    } finally {
      state.isProcessing = false;
    }
  }

  requestAnimationFrame(processFrame);
}

function handleResults(results) {
  resizeCanvasToVideo();
  ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);

  const landmarks = results.multiHandLandmarks?.[0];
  state.handDetected = Boolean(landmarks);

  if (landmarks) {
    window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
      color: "#17a398",
      lineWidth: 4
    });
    window.drawLandmarks(ctx, landmarks, {
      color: "#ffffff",
      fillColor: "#ffbf46",
      lineWidth: 2,
      radius: 4
    });

    state.lastRawBends = measureAllFingerBends(landmarks);
    updateTargetsFromRawBends();
  }

  if (!state.isStopped && state.handDetected) {
    smoothAngles();
    servoOutput.send(state.smoothedAngles);
  }

  updateHandStatus();
  updateFps();
  updateDebugPanel();
}

function measureAllFingerBends(landmarks) {
  return Object.fromEntries(
    FINGERS.map((finger) => [finger, measureFingerBend(landmarks, finger)])
  );
}

function measureFingerBend(landmarks, finger) {
  const bends = FINGER_JOINTS[finger].map(([a, b, c]) => {
    const jointAngle = angleAtPoint(landmarks[a], landmarks[b], landmarks[c]);
    return clamp(180 - jointAngle, 0, 140);
  });

  return average(bends);
}

function angleAtPoint(a, b, c) {
  const ab = {
    x: a.x - b.x,
    y: a.y - b.y,
    z: (a.z ?? 0) - (b.z ?? 0)
  };
  const cb = {
    x: c.x - b.x,
    y: c.y - b.y,
    z: (c.z ?? 0) - (b.z ?? 0)
  };
  const denominator = vectorLength(ab) * vectorLength(cb);

  if (denominator === 0) {
    return 180;
  }

  const cosine = clamp(dot(ab, cb) / denominator, -1, 1);
  return (Math.acos(cosine) * 180) / Math.PI;
}

function updateTargetsFromRawBends() {
  FINGERS.forEach((finger) => {
    const raw = state.lastRawBends[finger];
    const calibration = state.calibration[finger];
    const range = calibration.closed - calibration.open;
    const normalized =
      Math.abs(range) < 1 ? clamp(raw / 110, 0, 1) : clamp((raw - calibration.open) / range, 0, 1);

    state.normalizedBends[finger] = normalized;
    state.targetAngles[finger] = normalized * 180;
  });
}

function smoothAngles() {
  FINGERS.forEach((finger) => {
    const current = state.smoothedAngles[finger];
    const target = state.targetAngles[finger];
    state.smoothedAngles[finger] = current + (target - current) * SMOOTHING_ALPHA;
  });
}

function calibrate(referenceName) {
  if (!state.handDetected) {
    showMessage("No hand detected for calibration.", true);
    return;
  }

  FINGERS.forEach((finger) => {
    state.calibration[finger][referenceName] = state.lastRawBends[finger];
  });

  saveCalibration(state.calibration);
  showMessage(
    referenceName === "open"
      ? "Open-hand calibration saved as 0°."
      : "Closed-hand calibration saved as 180°."
  );
}

function toggleStop() {
  state.isStopped = !state.isStopped;
  elements.stopButton.textContent = state.isStopped ? "RESUME" : "STOP";
  elements.outputStatus.textContent = state.isStopped ? "Stopped" : "Live";
  elements.outputStatus.classList.toggle("stopped", state.isStopped);
  showMessage(state.isStopped ? "Simulated servos frozen." : "Simulated servos live.");
}

function resetServos() {
  state.targetAngles = emptyServoAngles();
  state.smoothedAngles = emptyServoAngles();
  state.isStopped = true;
  elements.stopButton.textContent = "RESUME";
  elements.outputStatus.textContent = "Stopped";
  elements.outputStatus.classList.add("stopped");
  servoOutput.reset();
  updateDebugPanel();
  showMessage("Simulated servos reset to 0°.");
}

function updateServoUi(angles) {
  const command = buildServoCommand(angles);

  FINGERS.forEach((finger) => {
    const angle = command[finger];
    const card = elements.servoList.querySelector(`[data-finger="${finger}"]`);
    const slider = card.querySelector("[data-slider]");
    const angleLabel = card.querySelector("[data-angle]");
    const needle = card.querySelector("[data-needle]");
    const stateLabel = card.querySelector("[data-state]");
    const normalized = state.normalizedBends[finger] ?? 0;

    slider.value = angle;
    angleLabel.textContent = `${angle}°`;
    needle.style.setProperty("--servo-angle", `${angle - 90}deg`);
    stateLabel.textContent = describeFingerState(normalized);
    stateLabel.dataset.level = describeFingerState(normalized).toLowerCase();
  });

  elements.commandPreview.textContent = JSON.stringify(command, null, 2);
}

function updateDebugPanel() {
  const command = buildServoCommand(state.smoothedAngles);
  elements.debugHand.textContent = state.handDetected ? "YES" : "NO";
  FINGERS.forEach((finger) => {
    elements.debugAngles[finger].textContent = `${command[finger]}°`;
  });
  elements.commandPreview.textContent = JSON.stringify(command, null, 2);
}

function updateHandStatus() {
  elements.handStatus.textContent = `Hand: ${state.handDetected ? "YES" : "NO"}`;
  elements.handStatus.classList.toggle("ready", state.handDetected);
  elements.debugHand.textContent = state.handDetected ? "YES" : "NO";
}

function updateFps() {
  state.frameCounter += 1;
  const now = performance.now();

  if (now - state.lastFpsTime >= 1000) {
    elements.fpsStatus.textContent = `FPS: ${state.frameCounter}`;
    state.frameCounter = 0;
    state.lastFpsTime = now;
  }
}

function resizeCanvasToVideo() {
  const width = elements.video.videoWidth || 1280;
  const height = elements.video.videoHeight || 720;

  if (elements.canvas.width !== width || elements.canvas.height !== height) {
    elements.canvas.width = width;
    elements.canvas.height = height;
  }
}

function setMirrorMode(enabled) {
  elements.videoStage.classList.toggle("mirrored", enabled);
}

function describeFingerState(normalized) {
  if (normalized >= 0.72) {
    return "Closed";
  }
  if (normalized >= 0.25) {
    return "Bent";
  }
  return "Open";
}

function loadCalibration() {
  try {
    const saved = JSON.parse(localStorage.getItem(CALIBRATION_KEY));

    if (!saved) {
      return structuredClone(DEFAULT_CALIBRATION);
    }

    return Object.fromEntries(
      FINGERS.map((finger) => [
        finger,
        {
          open: Number(saved[finger]?.open ?? DEFAULT_CALIBRATION[finger].open),
          closed: Number(saved[finger]?.closed ?? DEFAULT_CALIBRATION[finger].closed)
        }
      ])
    );
  } catch {
    return structuredClone(DEFAULT_CALIBRATION);
  }
}

function saveCalibration(calibration) {
  localStorage.setItem(CALIBRATION_KEY, JSON.stringify(calibration));
}

function showMessage(message, isError = false) {
  elements.appMessage.textContent = message;
  elements.appMessage.classList.toggle("error", isError);
}

function showCameraMessage(message) {
  elements.cameraMessage.hidden = false;
  elements.cameraMessage.textContent = message;
}

function hideCameraMessage() {
  elements.cameraMessage.hidden = true;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function vectorLength(vector) {
  return Math.hypot(vector.x, vector.y, vector.z);
}
