# Echtit Hand

A Wi-Fi controlled, 3D-printed tendon-driven robotic hand using ESP8266 and 5× SG90 servos.

## Project Overview

Echtit Hand is a prototype robotic hand project that combines a 3D-printed tendon-driven mechanism, an ESP8266 D1 Mini, five SG90 micro servos, and local browser-based hand tracking.

Long-term system flow:

```text
MacBook
  |
  v
Built-in Webcam
  |
  v
Browser-based hand tracking
  |
  v
5 finger bend values
  |
  v
0-180 degree servo commands
  |
  v
Wi-Fi
  |
  v
ESP8266 D1 Mini
  |
  v
5 SG90 servos
  |
  v
Tendon-driven robotic hand
```

## Current Status

| Feature | Status |
|---|---|
| 3D hand design | In development |
| D1 Mini firmware | Prototype |
| Wi-Fi control | Prototype |
| Webcam hand tracking | In development |
| Servo control | Hardware pending |
| 5-finger mechanical movement | Hardware pending |
| Final calibration | Planned |

The SG90 motors have not arrived yet. Firmware and web software should be tested without assuming the physical hand is complete.

## Features

- Prototype ESP8266 SoftAP control mode.
- HTTP API for five independent servo angles.
- Configurable software servo limits.
- HOME, STOP, and START commands.
- Local browser hand-tracking prototype in `web/`.
- Documentation for wiring, pin mapping, power, and mechanical planning.

## System Architecture

The MacBook webcam captures the operator hand. The browser tracks hand landmarks locally, calculates normalized finger bend values, converts them to servo angles, and will later send JSON commands to the D1 Mini over Wi-Fi.

The ESP8266 D1 Mini runs a local HTTP server. It receives angle commands, clamps them to safe software limits, and outputs servo signals to five SG90 servos. The servos pull tendons routed through the 3D-printed fingers.

## Hardware

Controller:

- ESP8266 D1 Mini x1

Actuators:

- SG90 micro servo x5

Mechanical:

- 3D-printed robotic hand
- Finger joints
- Tendon/string routing
- Servo mounting system
- Elastic return mechanism
- Servo pulley/winch system

Computer:

- MacBook built-in webcam

## Pin Mapping

| Finger | D1 Mini Pin | ESP8266 GPIO | Function |
|---|---|---|---|
| Thumb | D1 | GPIO5 | Servo signal |
| Index | D2 | GPIO4 | Servo signal |
| Middle | D5 | GPIO14 | Servo signal |
| Ring | D6 | GPIO12 | Servo signal |
| Pinky | D7 | GPIO13 | Servo signal |

These GPIO pins carry only the servo control signal wires.

## Power Architecture

Use an external regulated 5V supply for the servos. A supply around 5A is recommended for five SG90 servos.

Important rule: the D1 Mini does not power all five servos.

```text
External PSU GND
        |
        v
Servo GND
        |
        v
D1 Mini GND
```

Connect all grounds together. Never connect 5V directly to an ESP8266 GPIO pin.

## How It Works

The web prototype estimates five finger bend values from hand landmarks. Each bend value is normalized from `0` open to `1` closed, then mapped to a servo command from `0` to `180` degrees.

The D1 Mini firmware receives those commands as JSON, validates numeric fields, clamps values to configured software limits, and writes the safe angle to each servo signal pin.

## Wi-Fi Communication

Prototype Wi-Fi mode is ESP8266 SoftAP:

- SSID: `Echtit-Hand`
- Password: `EchtitHand123`
- IP: `192.168.4.1`

The password is a local prototype credential. Change it before any public or long-term deployment.

Prototype API:

- `POST /api/servos`
- `GET /api/status`
- `POST /api/home`
- `POST /api/stop`
- `POST /api/start`

See [docs/communication-protocol.md](docs/communication-protocol.md).

## D1 Mini Firmware

Firmware is in [firmware/d1-mini/Echtit_Hand_D1Mini.ino](firmware/d1-mini/Echtit_Hand_D1Mini.ino).

It provides:

- ESP8266 SoftAP setup.
- Minimal HTTP server.
- Five-servo control.
- Software angle limits.
- HOME, STOP, and START endpoints.
- A small browser slider page at `http://192.168.4.1`.

## Web Hand Tracking

The current web prototype is in [web/](web/). It runs locally in the browser and does not use cloud APIs.

Current focus:

- Webcam access.
- MediaPipe hand landmarks.
- Finger bend estimation.
- Simulated servo values.

Planned next step:

- Send the generated JSON command to the D1 Mini HTTP API.

## 3D Printed Mechanical Design

The mechanical system is in development. The design is planned as a tendon-driven robotic hand with servo winches or pulleys, elastic return, and routed tendons through articulated fingers.

See [docs/mechanical-design.md](docs/mechanical-design.md) and [3d-print/README.md](3d-print/README.md).

## Blueprint

The current system and architecture blueprint is available here:

[View the Echtit Hand Blueprint](https://www.blueprint.io/project/bc514b0b-045c-4718-ad8d-a333d53e818b?tab=graph)

The blueprint is an external project reference, not a file stored inside this repository.

## Photos

Photos are placeholders until real project photos are added.

### Prototype

<!-- PHOTO: Add main prototype photo here -->

![Echtit Hand Prototype](images/echtit-hand-prototype.jpg)

### Electronics

<!-- PHOTO: Add D1 Mini + servo wiring photo here -->

![Electronics](images/electronics.jpg)

### 3D Printed Parts

<!-- PHOTO: Add 3D printed parts photo here -->

![3D Printed Parts](images/3d-printed-parts.jpg)

### Assembly

<!-- PHOTO: Add assembly photo here -->

![Assembly](images/assembly.jpg)

See [docs/photos.md](docs/photos.md) before adding external images.

## Installation

Web prototype:

```bash
cd web
npm install
npm run dev
```

D1 Mini firmware:

1. Install Arduino IDE or Arduino CLI.
2. Install ESP8266 board support.
3. Select a D1 Mini / ESP8266 board.
4. Open `firmware/d1-mini/Echtit_Hand_D1Mini.ino`.
5. Upload to the D1 Mini.
6. Connect to Wi-Fi network `Echtit-Hand`.
7. Open `http://192.168.4.1`.

## Future Development

- Connect the web prototype to the D1 Mini HTTP API.
- Add real SG90 servos when hardware arrives.
- Tune per-finger servo limits.
- Add mechanical calibration values.
- Add STL/STEP files and exact mechanical source notes.
- Add real prototype photos.
- Add station-mode Wi-Fi option.

## References

### Project Resources

- [Echtit Hand Blueprint](https://www.blueprint.io/project/bc514b0b-045c-4718-ad8d-a333d53e818b?tab=graph)
- Echtit Hand GitHub repository: add URL after the repository is published.
- 3D-print files: planned.

### External References

- [MyMiniFactory robotic hand reference / inspiration](https://www.myminifactory.com/object/3d-print-48754)
- Future research papers: none added yet.
- Future libraries/frameworks: document here when added.

## License

MIT License. See [LICENSE](LICENSE).
