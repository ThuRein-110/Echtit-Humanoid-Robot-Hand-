# Pinout

Use this pin mapping for the five servo signal wires:

| Finger | D1 Mini Pin | ESP8266 GPIO | Function |
|---|---|---|---|
| Thumb | D1 | GPIO5 | Servo signal |
| Index | D2 | GPIO4 | Servo signal |
| Middle | D5 | GPIO14 | Servo signal |
| Ring | D6 | GPIO12 | Servo signal |
| Pinky | D7 | GPIO13 | Servo signal |

Only the signal wires connect to these pins. Servo power comes from the external 5V supply.

## Notes

- Keep D1 Mini GND connected to external PSU GND.
- Do not connect servo 5V to any ESP8266 GPIO pin.
- Adjust software angle limits after the hand is assembled.
