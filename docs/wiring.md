# Wiring

## Power Rule

The D1 Mini does not power all five SG90 servos.

Use an external regulated 5V supply for the servos. Around 5A is recommended for five SG90 servos.

All grounds must be common:

```text
External PSU GND
        |
        v
Servo GND
        |
        v
D1 Mini GND
```

Never connect 5V directly to an ESP8266 GPIO pin.

## SG90 Wiring

Typical SG90 wire colors:

| Wire | Function |
|---|---|
| Red | +5V |
| Brown/Black | GND |
| Orange/Yellow | Signal |

## Servo Power Wiring

```text
5V PSU +5V
 |-- Thumb servo +
 |-- Index servo +
 |-- Middle servo +
 |-- Ring servo +
 |-- Pinky servo +

5V PSU GND
 |-- Thumb servo GND
 |-- Index servo GND
 |-- Middle servo GND
 |-- Ring servo GND
 |-- Pinky servo GND
 |-- D1 Mini GND
```

## Signal Wiring

```text
D1 Mini D1 -> Thumb signal
D1 Mini D2 -> Index signal
D1 Mini D5 -> Middle signal
D1 Mini D6 -> Ring signal
D1 Mini D7 -> Pinky signal
```

Only the servo signal wires connect to D1 Mini GPIO pins.
