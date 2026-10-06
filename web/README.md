# Web Hand Tracking

Status: In development.

This folder contains the current local browser prototype for Echtit Hand.

Current flow:

```text
MacBook webcam
  |
  v
Browser
  |
  v
MediaPipe Hands
  |
  v
Finger landmarks
  |
  v
Normalized bend values
  |
  v
Simulated 0-180 degree servo angles
```

No ESP8266/D1 Mini or physical servos are controlled in this version.

## Install

```bash
npm install
```

The install step downloads MediaPipe and Vite, then copies the MediaPipe browser files into `public/mediapipe` so the app can run locally without CDN calls.

## Start

```bash
npm run dev
```

Open the URL printed by Vite, usually:

```text
http://127.0.0.1:5173/
```

## macOS Webcam Access

When the browser asks for camera permission, click **Allow**.

If the camera is blocked:

1. Open **System Settings**.
2. Go to **Privacy & Security**.
3. Open **Camera**.
4. Enable camera access for the browser you are using.
5. Reload the page.

Local webcam access works from `localhost` or `127.0.0.1`; opening `index.html` directly from Finder will not work reliably.

## What You Should See

- A live webcam view.
- Hand landmarks and skeleton drawn over your hand.
- `Hand: YES/NO` and current FPS.
- Five live simulated servo values:
  - Thumb
  - Index
  - Middle
  - Ring
  - Pinky
- Finger state labels: `Open`, `Bent`, or `Closed`.
- A debug panel with the current servo angles.
- A JSON preview shaped like the future D1 Mini command:

```json
{
  "thumb": 90,
  "index": 120,
  "middle": 100,
  "ring": 80,
  "pinky": 70
}
```

This is the planned D1 Mini command format.

## Calibration

1. Hold your hand open and press **Calibrate Open Hand**.
2. Close your hand into the shape you want to count as fully closed and press **Calibrate Closed Hand**.

The app stores those two reference poses in browser local storage.

## How Finger Bending Works

MediaPipe Hands returns 21 hand landmarks. For each finger, the app measures bend at two joints:

- Thumb: landmarks `1-2-3` and `2-3-4`
- Index: landmarks `5-6-7` and `6-7-8`
- Middle: landmarks `9-10-11` and `10-11-12`
- Ring: landmarks `13-14-15` and `14-15-16`
- Pinky: landmarks `17-18-19` and `18-19-20`

Each joint is treated like an angle. A straight finger is near open. A curled finger creates more bend. Calibration maps the open pose to `0` and the closed pose to `1`.

Then:

```text
servo angle = normalized bend * 180
```

The value is clamped to `0-180` degrees and smoothed with a simple exponential filter:

```text
smoothed = previous + (target - previous) * 0.22
```

## STOP and RESET

- **STOP** freezes the simulated servo angles while tracking continues.
- **RESUME** returns to live simulated values.
- **RESET** sets all simulated servos to `0°` and pauses output.

## Later D1 Mini Connection

This version only updates simulated servo values in the browser.

Later, replace `SimulatedServoOutput` in `src/servoOutput.js` with a Wi-Fi sender that sends this object to the D1 Mini:

```json
{
  "thumb": 90,
  "index": 120,
  "middle": 100,
  "ring": 80,
  "pinky": 70
}
```

Future POST target when connected to the D1 Mini SoftAP:

```text
http://192.168.4.1/api/servos
```

Planned full flow:

```text
MacBook webcam
  |
  v
Browser
  |
  v
MediaPipe Hands or another local browser-compatible tracker
  |
  v
Finger bend values from 0-1
  |
  v
0-180 degree servo command JSON
  |
  v
HTTP POST to D1 Mini
```

Keep this disabled until the webcam hand tracking feels stable.
