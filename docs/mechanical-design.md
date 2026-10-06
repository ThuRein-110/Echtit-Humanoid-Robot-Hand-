# Mechanical Design

Status: In development.

Echtit Hand is planned as a 3D-printed tendon-driven robotic hand. The current mechanical direction is:

- Articulated 3D-printed fingers.
- Tendon or string routing through each finger.
- Servo pulley or winch system.
- Elastic return mechanism.
- Servo mounting base.
- Adjustable tendon tension.

## Design Notes

Each SG90 servo should pull one tendon path. The tendon movement should bend the matching finger. An elastic return path should reopen the finger when the servo returns toward the home position.

Final servo limits must be calibrated after assembly. Do not assume the full `0-180` degree servo range is mechanically safe.

## Pending Mechanical Work

- Add exact STL or STEP files.
- Document tendon material and routing.
- Document pulley/winch dimensions.
- Document elastic return material.
- Add assembly photos.
- Record tested servo angle limits per finger.
