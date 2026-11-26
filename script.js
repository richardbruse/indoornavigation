const locations = {
  "EG-001": "Du befindest dich am Haupteingang.",
  "EG-002": "Du befindest dich im Erdgeschoss, Flur A.",
  "EG-003": "Vor dir befindet sich Raum 12.",
  "EG-004": "Du befindest dich vor dem Aufzug.",
  "OG-001": "Du befindest dich im Obergeschoss, Flur A."
};

const statusText = document.getElementById("status");
const locationDisplay = document.getElementById("location");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const repeatButton = document.getElementById("repeatButton");

let scanner = null;
let scanning = false;
let lastCode = "";
let lastAnnouncement = "";
let lastSeenAt = 0;

function speak(message) {
  if (!("speechSynthesis" in window)) {
    statusText.textContent = "Sprachausgabe wird nicht unterstützt.";
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = "de-DE";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function onScanSuccess(decodedText) {
  const code = decodedText.trim();
  const now = Date.now();
  if (code === lastCode && now - lastSeenAt < 8000) return;
  lastCode = code;
  lastSeenAt = now;

  const announcement = locations[code];
  if (announcement) {
    lastAnnouncement = announcement;
    locationDisplay.textContent = announcement;
    statusText.textContent = "Standort erkannt: " + code;
    speak(announcement);
  } else {
    lastAnnouncement = "";
    locationDisplay.textContent = "Unbekannter QR-Code: " + code;
    statusText.textContent = "Unbekannter QR-Code erkannt.";
    speak("Unbekannter QR-Code.");
  }
}

async function startScanner() {
  if (scanning) return;
  if (typeof Html5Qrcode === "undefined") {
    statusText.textContent = "QR-Bibliothek nicht geladen. Bitte Internetverbindung prüfen.";
    speak("Die QR-Erkennung konnte nicht geladen werden.");
    return;
  }
  startButton.disabled = true;
  statusText.textContent = "Kamera wird gestartet …";
  try {
    scanner = new Html5Qrcode("reader");
    await scanner.start({ facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess);
    scanning = true;
    statusText.textContent = "Kamera aktiv. Suche QR-Codes.";
    stopButton.disabled = false;
  } catch (error) {
    console.error(error);
    statusText.textContent = "Kamera nicht gestartet. Bitte Berechtigung und HTTPS prüfen.";
    speak("Die Kamera konnte nicht gestartet werden. Bitte prüfe die Kameraberechtigung.");
    scanner = null;
    startButton.disabled = false;
  }
}

async function stopScanner() {
  if (!scanner || !scanning) return;
  stopButton.disabled = true;
  try {
    await scanner.stop();
    await scanner.clear();
    scanner = null;
    scanning = false;
    lastCode = "";
    statusText.textContent = "Kamera ist ausgeschaltet.";
    startButton.disabled = false;
  } catch (error) {
    console.error(error);
    statusText.textContent = "Fehler beim Stoppen der Kamera.";
    stopButton.disabled = false;
  }
}

startButton.addEventListener("click", startScanner);
stopButton.addEventListener("click", stopScanner);
repeatButton.addEventListener("click", () => {
  speak(lastAnnouncement || "Bisher wurde kein bekannter Standort erkannt.");
});
