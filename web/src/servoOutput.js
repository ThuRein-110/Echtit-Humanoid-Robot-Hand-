export const FINGERS = ["thumb", "index", "middle", "ring", "pinky"];

export const FINGER_LABELS = {
  thumb: "Thumb",
  index: "Index",
  middle: "Middle",
  ring: "Ring",
  pinky: "Pinky"
};

export function clampAngle(value) {
  return Math.max(0, Math.min(180, Math.round(value)));
}

export function emptyServoAngles(value = 0) {
  return Object.fromEntries(FINGERS.map((finger) => [finger, value]));
}

export function buildServoCommand(angles) {
  return Object.fromEntries(
    FINGERS.map((finger) => [finger, clampAngle(angles[finger] ?? 0)])
  );
}

export class SimulatedServoOutput {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.lastAngles = emptyServoAngles();
  }

  send(angles) {
    this.lastAngles = buildServoCommand(angles);
    this.onUpdate(this.lastAngles);
  }

  reset() {
    this.send(emptyServoAngles());
  }
}

// Later, replace SimulatedServoOutput with a Wi-Fi transport that sends
// buildServoCommand(angles) to the D1 Mini.
