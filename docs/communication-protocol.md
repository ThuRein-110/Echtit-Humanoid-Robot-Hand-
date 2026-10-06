# Communication Protocol

Status: Prototype.

The first firmware version uses ESP8266 SoftAP mode and a local HTTP API.

## Wi-Fi

- Mode: SoftAP
- SSID: `Echtit-Hand`
- Password: `EchtitHand123`
- IP: `192.168.4.1`

The password is a prototype credential. Change it before deployment.

## Servo Command

Endpoint:

```http
POST /api/servos
Content-Type: application/json
```

Expected body:

```json
{
  "thumb": 90,
  "index": 120,
  "middle": 100,
  "ring": 80,
  "pinky": 70
}
```

The firmware validates that all five fields are present and numeric. Values are clamped to per-finger software limits before being written to the servos.

Example response:

```json
{
  "success": true,
  "stopped": false,
  "thumb": 90,
  "index": 120,
  "middle": 100,
  "ring": 80,
  "pinky": 70
}
```

## Status

```http
GET /api/status
```

Returns the current servo positions and stop state.

## Home

```http
POST /api/home
```

Moves all servos to the configured home angle.

## Stop

```http
POST /api/stop
```

Enables the emergency stop state. Normal servo commands will not update positions while stopped.

## Start

```http
POST /api/start
```

Disables the emergency stop state.

## Future Web Integration

The MacBook browser hand-tracking app should send the same JSON shape to:

```text
http://192.168.4.1/api/servos
```
