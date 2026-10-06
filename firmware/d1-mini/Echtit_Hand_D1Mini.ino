#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <Servo.h>

// Echtit Hand prototype firmware for ESP8266 D1 Mini.
// The default SoftAP password is for local prototype testing only.

#define THUMB_PIN D1
#define INDEX_PIN D2
#define MIDDLE_PIN D5
#define RING_PIN D6
#define PINKY_PIN D7

const char* AP_SSID = "Echtit-Hand";
const char* AP_PASSWORD = "EchtitHand123";

IPAddress AP_IP(192, 168, 4, 1);
IPAddress AP_GATEWAY(192, 168, 4, 1);
IPAddress AP_SUBNET(255, 255, 255, 0);

const int THUMB_MIN = 0;
const int THUMB_MAX = 180;
const int INDEX_MIN = 0;
const int INDEX_MAX = 180;
const int MIDDLE_MIN = 0;
const int MIDDLE_MAX = 180;
const int RING_MIN = 0;
const int RING_MAX = 180;
const int PINKY_MIN = 0;
const int PINKY_MAX = 180;

const int THUMB_HOME = 0;
const int INDEX_HOME = 0;
const int MIDDLE_HOME = 0;
const int RING_HOME = 0;
const int PINKY_HOME = 0;

enum FingerIndex {
  THUMB = 0,
  INDEX = 1,
  MIDDLE = 2,
  RING = 3,
  PINKY = 4,
  SERVO_COUNT = 5
};

const char* FINGER_KEYS[SERVO_COUNT] = {
  "thumb",
  "index",
  "middle",
  "ring",
  "pinky"
};

const uint8_t SERVO_PINS[SERVO_COUNT] = {
  THUMB_PIN,
  INDEX_PIN,
  MIDDLE_PIN,
  RING_PIN,
  PINKY_PIN
};

const int SERVO_MIN[SERVO_COUNT] = {
  THUMB_MIN,
  INDEX_MIN,
  MIDDLE_MIN,
  RING_MIN,
  PINKY_MIN
};

const int SERVO_MAX[SERVO_COUNT] = {
  THUMB_MAX,
  INDEX_MAX,
  MIDDLE_MAX,
  RING_MAX,
  PINKY_MAX
};

const int SERVO_HOME[SERVO_COUNT] = {
  THUMB_HOME,
  INDEX_HOME,
  MIDDLE_HOME,
  RING_HOME,
  PINKY_HOME
};

Servo servos[SERVO_COUNT];
int currentAngles[SERVO_COUNT] = {
  THUMB_HOME,
  INDEX_HOME,
  MIDDLE_HOME,
  RING_HOME,
  PINKY_HOME
};

bool emergencyStop = false;
ESP8266WebServer server(80);

const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Echtit Hand</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #f3f6f7; color: #18242a; }
    main { max-width: 720px; margin: 0 auto; padding: 20px; }
    h1 { margin: 0 0 14px; }
    .panel { background: #fff; border: 1px solid #d8e0e3; border-radius: 8px; padding: 16px; }
    .row { display: grid; grid-template-columns: 76px 1fr 52px; gap: 10px; align-items: center; margin: 14px 0; }
    input[type="range"] { width: 100%; }
    button { border: 0; border-radius: 8px; padding: 12px 14px; margin: 4px; background: #18242a; color: #fff; font-weight: 700; }
    button.stop { background: #c83d3d; }
    pre { overflow: auto; background: #10191d; color: #d9fffa; padding: 12px; border-radius: 8px; }
  </style>
</head>
<body>
  <main>
    <h1>Echtit Hand</h1>
    <section class="panel">
      <div id="sliders"></div>
      <button onclick="home()">HOME</button>
      <button class="stop" onclick="stopServos()">STOP</button>
      <button onclick="startServos()">START</button>
      <p id="state">Loading...</p>
      <pre id="status">{}</pre>
    </section>
  </main>
  <script>
    const fingers = ["thumb", "index", "middle", "ring", "pinky"];
    const labels = { thumb: "Thumb", index: "Index", middle: "Middle", ring: "Ring", pinky: "Pinky" };
    let sendTimer = null;

    function buildSliders() {
      const root = document.getElementById("sliders");
      root.innerHTML = fingers.map((finger) => `
        <label class="row">
          <span>${labels[finger]}</span>
          <input id="${finger}" type="range" min="0" max="180" value="0">
          <strong id="${finger}Value">0</strong>
        </label>
      `).join("");

      fingers.forEach((finger) => {
        const slider = document.getElementById(finger);
        slider.addEventListener("input", () => {
          document.getElementById(`${finger}Value`).textContent = slider.value;
          clearTimeout(sendTimer);
          sendTimer = setTimeout(sendServos, 120);
        });
      });
    }

    function payloadFromSliders() {
      const payload = {};
      fingers.forEach((finger) => {
        payload[finger] = Number(document.getElementById(finger).value);
      });
      return payload;
    }

    async function sendServos() {
      const response = await fetch("/api/servos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromSliders())
      });
      showStatus(await response.json());
    }

    async function refreshStatus() {
      const response = await fetch("/api/status");
      showStatus(await response.json());
    }

    async function home() {
      const response = await fetch("/api/home", { method: "POST" });
      showStatus(await response.json());
    }

    async function stopServos() {
      const response = await fetch("/api/stop", { method: "POST" });
      showStatus(await response.json());
    }

    async function startServos() {
      const response = await fetch("/api/start", { method: "POST" });
      showStatus(await response.json());
    }

    function showStatus(data) {
      fingers.forEach((finger) => {
        if (typeof data[finger] === "number") {
          document.getElementById(finger).value = data[finger];
          document.getElementById(`${finger}Value`).textContent = data[finger];
        }
      });
      document.getElementById("state").textContent = data.stopped ? "STOP active" : "Running";
      document.getElementById("status").textContent = JSON.stringify(data, null, 2);
    }

    buildSliders();
    refreshStatus();
  </script>
</body>
</html>
)rawliteral";

void addCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void sendJson(int statusCode, const String& body) {
  addCorsHeaders();
  server.send(statusCode, "application/json", body);
}

String statusJson(bool success, const String& message = "") {
  String json = "{";
  json += "\"success\":";
  json += (success ? "true" : "false");
  json += ",\"stopped\":";
  json += (emergencyStop ? "true" : "false");

  for (uint8_t i = 0; i < SERVO_COUNT; i++) {
    json += ",\"";
    json += FINGER_KEYS[i];
    json += "\":";
    json += currentAngles[i];
  }

  if (message.length() > 0) {
    json += ",\"message\":\"";
    json += message;
    json += "\"";
  }

  json += "}";
  return json;
}

bool isJsonWhitespace(char value) {
  return value == ' ' || value == '\n' || value == '\r' || value == '\t';
}

bool extractJsonInt(const String& body, const char* key, int& value) {
  String token = "\"";
  token += key;
  token += "\"";

  int keyPosition = body.indexOf(token);
  if (keyPosition < 0) {
    return false;
  }

  int colonPosition = body.indexOf(':', keyPosition + token.length());
  if (colonPosition < 0) {
    return false;
  }

  int cursor = colonPosition + 1;
  while (cursor < body.length() && isJsonWhitespace(body.charAt(cursor))) {
    cursor++;
  }

  int sign = 1;
  if (cursor < body.length() && body.charAt(cursor) == '-') {
    sign = -1;
    cursor++;
  }

  if (cursor >= body.length() || !isDigit(body.charAt(cursor))) {
    return false;
  }

  long parsed = 0;
  while (cursor < body.length() && isDigit(body.charAt(cursor))) {
    parsed = (parsed * 10) + (body.charAt(cursor) - '0');
    cursor++;
  }

  value = (int)(parsed * sign);
  return true;
}

int safeServoAngle(uint8_t finger, int requestedAngle) {
  if (finger >= SERVO_COUNT) {
    return 0;
  }

  if (requestedAngle < SERVO_MIN[finger]) {
    return SERVO_MIN[finger];
  }

  if (requestedAngle > SERVO_MAX[finger]) {
    return SERVO_MAX[finger];
  }

  return requestedAngle;
}

void writeServo(uint8_t finger, int requestedAngle) {
  int safeAngle = safeServoAngle(finger, requestedAngle);
  currentAngles[finger] = safeAngle;
  servos[finger].write(safeAngle);

  Serial.print(FINGER_KEYS[finger]);
  Serial.print(" -> ");
  Serial.println(safeAngle);
}

void moveHome() {
  Serial.println("Moving all servos home.");
  for (uint8_t i = 0; i < SERVO_COUNT; i++) {
    writeServo(i, SERVO_HOME[i]);
  }
}

void handleRoot() {
  addCorsHeaders();
  server.send_P(200, "text/html", INDEX_HTML);
}

void handleOptions() {
  addCorsHeaders();
  server.send(204, "text/plain", "");
}

void handleStatus() {
  sendJson(200, statusJson(true));
}

void handleServos() {
  if (server.method() != HTTP_POST) {
    sendJson(405, statusJson(false, "Use POST"));
    return;
  }

  int requestedAngles[SERVO_COUNT];
  String body = server.arg("plain");

  for (uint8_t i = 0; i < SERVO_COUNT; i++) {
    if (!extractJsonInt(body, FINGER_KEYS[i], requestedAngles[i])) {
      Serial.print("Invalid or missing JSON field: ");
      Serial.println(FINGER_KEYS[i]);
      sendJson(400, statusJson(false, "Missing or invalid servo angle"));
      return;
    }
  }

  if (emergencyStop) {
    Serial.println("Command ignored because STOP is active.");
    sendJson(409, statusJson(false, "Emergency stop is active"));
    return;
  }

  for (uint8_t i = 0; i < SERVO_COUNT; i++) {
    writeServo(i, requestedAngles[i]);
  }

  sendJson(200, statusJson(true));
}

void handleHome() {
  moveHome();
  sendJson(200, statusJson(true, "Home position applied"));
}

void handleStop() {
  emergencyStop = true;
  Serial.println("Emergency stop enabled. Holding current servo positions.");
  sendJson(200, statusJson(true, "Emergency stop enabled"));
}

void handleStart() {
  emergencyStop = false;
  Serial.println("Emergency stop disabled. Servo commands enabled.");
  sendJson(200, statusJson(true, "Servo commands enabled"));
}

void handleNotFound() {
  sendJson(404, statusJson(false, "Not found"));
}

void attachServos() {
  for (uint8_t i = 0; i < SERVO_COUNT; i++) {
    servos[i].attach(SERVO_PINS[i]);
    Serial.print("Attached ");
    Serial.print(FINGER_KEYS[i]);
    Serial.print(" servo to pin ");
    Serial.println((int)SERVO_PINS[i]);
  }
}

void setupSoftAp() {
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(AP_IP, AP_GATEWAY, AP_SUBNET);
  WiFi.softAP(AP_SSID, AP_PASSWORD);

  Serial.println();
  Serial.println("SoftAP started.");
  Serial.print("SSID: ");
  Serial.println(AP_SSID);
  Serial.print("Password: ");
  Serial.println(AP_PASSWORD);
  Serial.print("IP: ");
  Serial.println(WiFi.softAPIP());
}

void setupRoutes() {
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/servos", HTTP_POST, handleServos);
  server.on("/api/servos", HTTP_OPTIONS, handleOptions);
  server.on("/api/home", HTTP_POST, handleHome);
  server.on("/api/home", HTTP_OPTIONS, handleOptions);
  server.on("/api/stop", HTTP_POST, handleStop);
  server.on("/api/stop", HTTP_OPTIONS, handleOptions);
  server.on("/api/start", HTTP_POST, handleStart);
  server.on("/api/start", HTTP_OPTIONS, handleOptions);
  server.onNotFound(handleNotFound);
}

void setup() {
  Serial.begin(115200);
  delay(100);

  Serial.println();
  Serial.println("Echtit Hand D1 Mini firmware starting...");

  attachServos();
  moveHome();
  setupSoftAp();
  setupRoutes();
  server.begin();

  Serial.println("HTTP server started.");
}

void loop() {
  server.handleClient();
  yield();
}
