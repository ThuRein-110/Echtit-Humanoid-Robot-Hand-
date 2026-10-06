# D1 Mini Firmware

Firmware file:

```text
Echtit_Hand_D1Mini.ino
```

Status: Prototype.

This firmware targets an ESP8266 D1 Mini and controls five SG90 servo signal outputs.

## Arduino Setup

1. Install Arduino IDE or Arduino CLI.
2. Install ESP8266 board support.
3. Select a D1 Mini / ESP8266 board.
4. Open `Echtit_Hand_D1Mini.ino`.
5. Upload to the D1 Mini.

The sketch uses standard ESP8266 Arduino libraries:

- `ESP8266WiFi`
- `ESP8266WebServer`
- `Servo`

No physical servos are required for the first upload test.

## Wi-Fi

The firmware starts a SoftAP:

- SSID: `Echtit-Hand`
- Password: `EchtitHand123`
- IP: `192.168.4.1`

Change the password before any real deployment.

## Test

1. Power the D1 Mini.
2. Connect your computer or phone to Wi-Fi network `Echtit-Hand`.
3. Open `http://192.168.4.1`.
4. Use the five sliders to send test angles.
5. Open Serial Monitor at `115200` baud for debug output.

## Servo Safety

Initial software limits are `0-180` degrees for every finger. Change these constants after the physical hand is assembled:

- `THUMB_MIN`, `THUMB_MAX`
- `INDEX_MIN`, `INDEX_MAX`
- `MIDDLE_MIN`, `MIDDLE_MAX`
- `RING_MIN`, `RING_MAX`
- `PINKY_MIN`, `PINKY_MAX`

Do not assume the mechanical hand can safely move through the full servo range.
