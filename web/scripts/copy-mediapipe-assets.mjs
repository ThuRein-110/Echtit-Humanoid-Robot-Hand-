import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const packages = [
  ["@mediapipe/hands", "hands"],
  ["@mediapipe/drawing_utils", "drawing_utils"]
];

for (const [packageName, publicName] of packages) {
  const source = join(projectRoot, "node_modules", ...packageName.split("/"));
  const destination = join(projectRoot, "public", "mediapipe", publicName);

  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  cpSync(source, destination, { recursive: true });
}

console.log("MediaPipe browser assets copied to public/mediapipe.");
