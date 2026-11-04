
/* ==========================================
   TIME SPACE — CLOCK DASHBOARD 3.0
   ========================================== */

// ---------- SETTINGS AND SAVED DATA ----------

const defaultSettings = {
  format: "12",
  accent: "cyan",
  sound: true,
  world24: false
};

function loadSettings() {
  try {
    return {
      ...defaultSettings,
      ...JSON.parse(localStorage.getItem("clockSettings") || "{}")
    };
  } catch {
    return { ...defaultSettings };
  }
}

let settings = loadSettings();

function saveSettings() {
  localStorage.setItem("clockSettings", JSON.stringify(settings));
}

function loadJSON(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return saved ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- ELEMENT HELPERS ----------

const $ = (id) => document.getElementById(id);

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// ---------- SOUND ----------

let audioContext = null;

function unlockAudio() {
  if (!settings.sound) return;

  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
  } catch (error) {
    console.warn("Audio is unavailable:", error);
  }
}

function playSound() {
  if (!settings.sound) return;

  try {
    unlockAudio();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;

    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.6
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.6);
  } catch (error) {
    console.warn("Could not play sound:", error);
  }
}

function playAlarmSound() {
  playSound();
  setTimeout(playSound, 450);
  setTimeout(playSound, 900);
}

// ---------- NAVIGATION ----------

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.toggle("active", page.id === pageId);
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.target === pageId);
  });
}

document.querySelectorAll(".tab[data-target]").forEach((tab) => {
  tab.addEventListener("click", () => {
    showPage(tab.dataset.target);
  });
});

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => {
    showPage(button.dataset.go);
  });
});

// ---------- MAIN CLOCK ----------

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function getWeekNumber(date) {
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ));

  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));

  return Math.ceil(
    (((utcDate - yearStart) / 86400000) + 1) / 7
  );
}

function updateMainClock() {
  const now = new Date();

  const options = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: settings.format === "12"
  };

  const timeParts = new Intl.DateTimeFormat(
    undefined,
    options
  ).formatToParts(now);

  const hourMinuteSecond = timeParts
    .filter(part => ["hour", "minute", "second"].includes(part.type))
    .map(part => part.value);

  $("mainClock").textContent = hourMinuteSecond.join(":");

  const period = timeParts.find(part => part.type === "dayPeriod");
  $("ampm").textContent = period ? period.value : "";

  $("todayText").textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  $("dayOfYear").textContent = getDayOfYear(now);
  $("weekNumber").textContent = getWeekNumber(now);

  $("localZone").textContent =
    Intl.DateTimeFormat().resolvedOptions().timeZone;
}

updateMainClock();
setInterval(updateMainClock, 1000);

// ---------- WORLD CLOCKS ----------

const defaultCities = [
  { zone: "Asia/Kolkata", name: "Hyderabad" },
  { zone: "Europe/London", name: "London" },
  { zone: "America/New_York", name: "New York" },
  { zone: "Asia/Tokyo", name: "Tokyo" },
  { zone: "Australia/Sydney", name: "Sydney" },
  { zone: "Europe/Madrid", name: "Barcelona" }
];

let cities = loadJSON("clockCities", defaultCities);

const cityNames = {
  "Asia/Kolkata": "Hyderabad",
  "Europe/London": "London",
  "America/New_York": "New York",
  "Asia/Tokyo": "Tokyo",
  "Australia/Sydney": "Sydney",
  "Europe/Madrid": "Barcelona",
  "Europe/Barcelona": "Barcelona",
  "Europe/Paris": "Paris",
  "Asia/Dubai": "Dubai",
  "Asia/Singapore": "Singapore",
  "America/Los_Angeles": "Los Angeles",
  "Africa/Cairo": "Cairo",
  "Asia/Seoul": "Seoul"
};

function normalizeZone(zone) {
  return zone === "Europe/Barcelona" ? "Europe/Madrid" : zone;
}

function renderWorldClocks() {
  const worldHTML = cities.map((city, index) => {
    let time = "--:--:--";
    let date = "";

    try {
      const zone = normalizeZone(city.zone);

      time = new Intl.DateTimeFormat(undefined, {
        timeZone: zone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: !settings.world24
      }).format(new Date());

      date = new Intl.DateTimeFormat(undefined, {
        timeZone: zone,
        weekday: "short",
        day: "numeric",
        month: "short"
      }).format(new Date());
    } catch {
      time = "Invalid timezone";
    }

    return `
      <article class="world-card">
        <h3>${city.name}</h3>
        <p class="city-zone">${city.zone}</p>
        <div class="world-time">${time}</div>
        <p class="world-date">${date}</p>
        <button
          class="remove-city"
          data-remove-city="${index}"
          title="Remove city"
          aria-label="Remove ${city.name}"
        >×</button>
      </article>
    `;
  }).join("");

  $("worldList").innerHTML = worldHTML;
  $("worldGrid").innerHTML = worldHTML;

  $("homeWorld").textContent =
    `${cities.length} cities added`;

  document.querySelectorAll("[data-remove-city]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.removeCity);
      cities.splice(index, 1);
      saveJSON("clockCities", cities);
      renderWorldClocks();
      showToast("City removed");
    });
  });
}

$("addCityBtn").addEventListener("click", () => {
  const select = $("citySelect");
  const zone = select.value;

  if (!zone) {
    showToast("Choose a city first");
    return;
  }

  const actualZone = normalizeZone(zone);

  if (cities.some(city => city.zone === actualZone)) {
    showToast("This city is already added");
    return;
  }

  cities.push({
    zone: actualZone,
    name: cityNames[zone] || zone
  });

  saveJSON("clockCities", cities);
  renderWorldClocks();

  select.value = "";
  showToast("City added");
});

renderWorldClocks();
setInterval(renderWorldClocks, 1000);

// ---------- STOPWATCH ----------

let stopwatchRunning = false;
let stopwatchStartTime = 0;
let stopwatchElapsed = 0;
let stopwatchInterval = null;
let laps = [];

function formatStopwatch(milliseconds) {
  const total = Math.floor(milliseconds / 10);
  const hundredths = total % 100;
  const seconds = Math.floor(total / 100) % 60;
  const minutes = Math.floor(total / 6000) % 60;
  const hours = Math.floor(total / 360000);

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0")
  ].join(":") + "." + String(hundredths).padStart(2, "0");
}

function updateStopwatch() {
  const elapsed = stopwatchElapsed +
    (stopwatchRunning ? performance.now() - stopwatchStartTime : 0);

  $("stopwatchDisplay").textContent = formatStopwatch(elapsed);
}

function startStopwatch() {
  if (stopwatchRunning) return;

  unlockAudio();
  stopwatchRunning = true;
  stopwatchStartTime = performance.now();

  stopwatchInterval = setInterval(updateStopwatch, 30);
}

function pauseStopwatch() {
  if (!stopwatchRunning) return;

  stopwatchElapsed += performance.now() - stopwatchStartTime;
  stopwatchRunning = false;

  clearInterval(stopwatchInterval);
  updateStopwatch();
}

function resetStopwatch() {
  pauseStopwatch();

  stopwatchElapsed = 0;
  laps = [];

  $("lapList").innerHTML =
    '<p class="muted">Your laps will appear here.</p>';

  updateStopwatch();
}

$("watchStart").addEventListener("click", startStopwatch);
$("watchPause").addEventListener("click", pauseStopwatch);
$("watchReset").addEventListener("click", resetStopwatch);

$("watchLap").addEventListener("click", () => {
  if (!stopwatchRunning) {
    showToast("Start the stopwatch first");
    return;
  }

  const elapsed = stopwatchElapsed +
    performance.now() - stopwatchStartTime;

  laps.push(elapsed);

  $("lapList").innerHTML = laps.map((lap, index) => `
    <div class="lap-item">
      <span>Lap ${index + 1}</span>
      <strong>${formatStopwatch(lap)}</strong>
    </div>
  `).reverse().join("");
});

// ---------- COUNTDOWN TIMER ----------

let timerRemaining = 300;
let timerTotal = 300;
let timerRunning = false;
let timerInterval = null;
let timerEndTime = 0;

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateTimerDisplay() {
  $("timerDisplay").textContent = formatTimer(timerRemaining);

  const percentage = timerTotal > 0
    ? ((timerTotal - timerRemaining) / timerTotal) * 100
    : 0;

  $("timerProgress").style.width = `${percentage}%`;
}

function stopTimerInterval() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning = false;
}

function timerTick() {
  timerRemaining = Math.max(
    0,
    Math.ceil((timerEndTime - Date.now()) / 1000)
  );

  updateTimerDisplay();

  if (timerRemaining <= 0) {
    stopTimerInterval();
    $("timerState").textContent = "Completed!";
    $("timerMessage").textContent = "Your countdown has finished.";
    playAlarmSound();
    showToast("Timer finished!");
  }
}

function startTimer() {
  if (timerRunning) return;

  if (timerRemaining <= 0) {
    showToast("Set a new timer first");
    return;
  }

  unlockAudio();

  timerRunning = true;
  timerEndTime = Date.now() + timerRemaining * 1000;

  $("timerState").textContent = "Running";

  timerInterval = setInterval(timerTick, 200);
}

function pauseTimer() {
  if (!timerRunning) return;

  timerTick();
  if (!timerRunning) return;

  stopTimerInterval();
  $("timerState").textContent = "Paused";
}

function resetTimer() {
  stopTimerInterval();

  const minutes = Math.max(0, Math.min(
    999,
    Number($("timerMinutes").value) || 0
  ));

  const seconds = Math.max(0, Math.min(
    59,
    Number($("timerSeconds").value) || 0
  ));

  timerTotal = minutes * 60 + seconds;
  timerRemaining = timerTotal;

  $("timerMinutes").value = minutes;
  $("timerSeconds").value = seconds;

  $("timerState").textContent = "Ready";
  $("timerMessage").textContent = "";

  updateTimerDisplay();
}

$("timerStart").addEventListener("click", startTimer);
$("timerPause").addEventListener("click", pauseTimer);
$("timerReset").addEventListener("click", resetTimer);

document.querySelectorAll("[data-timer]").forEach((button) => {
  button.addEventListener("click", () => {
    stopTimerInterval();

    const minutes = Number(button.dataset.timer);

    $("timerMinutes").value = minutes;
    $("timerSeconds").value = 0;

    resetTimer();
    showToast(`${minutes}-minute timer selected`);
  });
});

$("timerMinutes").addEventListener("change", resetTimer);
$("timerSeconds").addEventListener("change", resetTimer);

resetTimer();

// ---------- POMODORO TIMER ----------

const pomoModes = {
  focus: {
    seconds: 25 * 60,
    message: "Stay focused on your task."
  },
  short: {
    seconds: 5 * 60,
    message: "Take a short break."
  },
  long: {
    seconds: 15 * 60,
    message: "Enjoy a longer break."
  }
};

let pomoMode = "focus";
let pomoRemaining = pomoModes.focus.seconds;
let pomoRunning = false;
let pomoInterval = null;
let pomoEndTime = 0;

function updatePomoDisplay() {
  $("pomoDisplay").textContent = formatTimer(pomoRemaining);
}

function stopPomoInterval() {
  clearInterval(pomoInterval);
  pomoInterval = null;
  pomoRunning = false;
}

function selectPomoMode(mode) {
  if (!pomoModes[mode]) return;

  stopPomoInterval();

  pomoMode = mode;
  pomoRemaining = pomoModes[mode].seconds;

  document.querySelectorAll("[data-pomo]").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.pomo === mode
    );
  });

  $("pomoState").textContent = "Ready";
  $("pomoMessage").textContent = pomoModes[mode].message;

  updatePomoDisplay();
}

function pomoTick() {
  pomoRemaining = Math.max(
    0,
    Math.ceil((pomoEndTime - Date.now()) / 1000)
  );

  updatePomoDisplay();

  if (pomoRemaining <= 0) {
    stopPomoInterval();

    $("pomoState").textContent = "Session complete!";
    $("pomoMessage").textContent = "Choose your next session.";
    playAlarmSound();
    showToast("Pomodoro session finished!");
  }
}

function startPomo() {
  if (pomoRunning) return;

  if (pomoRemaining <= 0) {
    showToast("Choose a Pomodoro mode first");
    return;
  }

  unlockAudio();

  pomoRunning = true;
  pomoEndTime = Date.now() + pomoRemaining * 1000;

  $("pomoState").textContent = "Session running";

  pomoInterval = setInterval(pomoTick, 200);
}

function pausePomo() {
  if (!pomoRunning) return;

  pomoTick();
  if (!pomoRunning) return;

  stopPomoInterval();
  $("pomoState").textContent = "Paused";
}

function resetPomo() {
  stopPomoInterval();
  pomoRemaining = pomoModes[pomoMode].seconds;

  $("pomoState").textContent = "Ready";
  updatePomoDisplay();
}

document.querySelectorAll("[data-pomo]").forEach((button) => {
  button.addEventListener("click", () => {
    selectPomoMode(button.dataset.pomo);
  });
});

$("pomoStart").addEventListener("click", startPomo);
$("pomoPause").addEventListener("click", pausePomo);
$("pomoReset").addEventListener("click", resetPomo);

selectPomoMode("focus");

// ---------- ALARMS ----------

let alarms = loadJSON("clockAlarms", []);
let lastAlarmCheck = "";

function saveAlarms() {
  saveJSON("clockAlarms", alarms);
}

function renderAlarms() {
  $("homeAlarms").textContent =
    `${alarms.filter(alarm => alarm.enabled).length} active`;

  if (alarms.length === 0) {
    $("alarmList").innerHTML =
      '<article class="card"><p class="muted">No alarms yet. Create your first alarm above.</p></article>';
    return;
  }

  $("alarmList").innerHTML = alarms.map((alarm) => `
    <article class="alarm-item">
      <div class="alarm-info">
        <strong>${escapeHTML(alarm.time)}</strong>
        <small>${escapeHTML(alarm.label || "Alarm")}</small>
      </div>
      <div class="alarm-actions">
        <label class="switch">
          <input
            type="checkbox"
            data-alarm-toggle="${alarm.id}"
            ${alarm.enabled ? "checked" : ""}
          >
          <span></span>
        </label>
        <button
          class="alarm-delete"
          data-alarm-delete="${alarm.id}"
          aria-label="Delete alarm"
        >×</button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll("[data-alarm-toggle]").forEach((input) => {
    input.addEventListener("change", () => {
      const alarm = alarms.find(item =>
        item.id === input.dataset.alarmToggle
      );

      if (alarm) {
        alarm.enabled = input.checked;
        saveAlarms();
        renderAlarms();
      }
    });
  });

  document.querySelectorAll("[data-alarm-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      alarms = alarms.filter(item =>
        item.id !== button.dataset.alarmDelete
      );

      saveAlarms();
      renderAlarms();
      showToast("Alarm deleted");
    });
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

$("alarmForm").addEventListener("submit", (event) => {
  event.preventDefault();
  unlockAudio();

  const time = $("alarmTime").value;
  const label = $("alarmLabel").value.trim();

  if (!time) {
    showToast("Choose an alarm time");
    return;
  }

  alarms.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time,
    label: label || "Alarm",
    enabled: true
  });

  saveAlarms();
  renderAlarms();

  $("alarmForm").reset();
  showToast("Alarm added");
});

function checkAlarms() {
  const now = new Date();

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  const currentTime =
    `${String(now.getHours()).padStart(2, "0")}:` +
    `${String(now.getMinutes()).padStart(2, "0")}`;

  const checkKey = `${today}-${currentTime}`;

  if (checkKey === lastAlarmCheck) return;
  lastAlarmCheck = checkKey;

  const matchingAlarms = alarms.filter(alarm =>
    alarm.enabled && alarm.time === currentTime
  );

  if (matchingAlarms.length > 0) {
    matchingAlarms.forEach(alarm => {
      showToast(`Alarm: ${alarm.label}`);
    });

    playAlarmSound();
  }
}

renderAlarms();
setInterval(checkAlarms, 1000);

// ---------- CALENDAR ----------

let calendarDate = new Date();
let selectedDate = new Date();

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  $("monthTitle").textContent =
    calendarDate.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric"
    });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const previousMonthDays = new Date(year, month, 0).getDate();

  const today = new Date();

  let html = "";

  for (let i = 0; i < 42; i++) {
    let day;
    let date;
    let outside = false;

    if (i < firstDay) {
      day = previousMonthDays - firstDay + i + 1;
      date = new Date(year, month - 1, day);
      outside = true;
    } else if (i >= firstDay + daysInMonth) {
      day = i - firstDay - daysInMonth + 1;
      date = new Date(year, month + 1, day);
      outside = true;
    } else {
      day = i - firstDay + 1;
      date = new Date(year, month, day);
    }

    const isToday =
      date.toDateString() === today.toDateString();

    const isSelected =
      date.toDateString() === selectedDate.toDateString();

    const classes = [
      "calendar-day",
      outside ? "outside" : "",
      isToday ? "today" : "",
      isSelected ? "selected" : ""
    ].filter(Boolean).join(" ");

    html += `
      <button
        class="${classes}"
        data-calendar-date="${date.getFullYear()}-${date.getMonth()}-${date.getDate()}"
      >${day}</button>
    `;
  }

  $("calendarDays").innerHTML = html;

  document.querySelectorAll("[data-calendar-date]").forEach((button) => {
    button.addEventListener("click", () => {
      const [year, month, day] =
        button.dataset.calendarDate.split("-").map(Number);

      selectedDate = new Date(year, month, day);
      calendarDate = new Date(year, month, 1);

      renderCalendar();
      updateSelectedDate();
    });
  });

  updateSelectedDate();
}

function updateSelectedDate() {
  $("calendarSelected").textContent =
    `Selected: ${selectedDate.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    })}`;
}

$("prevMonth").addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

$("nextMonth").addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

renderCalendar();

// ---------- SETTINGS ----------

function applySettings() {
  document.body.dataset.theme = settings.accent;

  $("formatSelect").value = settings.format;
  $("accentSelect").value = settings.accent;
  $("soundToggle").checked = settings.sound;
  $("world24Toggle").checked = settings.world24;

  updateMainClock();
  renderWorldClocks();
}

$("formatSelect").addEventListener("change", () => {
  settings.format = $("formatSelect").value;
  saveSettings();
  updateMainClock();
});

$("accentSelect").addEventListener("change", () => {
  settings.accent = $("accentSelect").value;
  saveSettings();
  applySettings();
});

$("soundToggle").addEventListener("change", () => {
  settings.sound = $("soundToggle").checked;
  saveSettings();

  if (settings.sound) unlockAudio();

  showToast(settings.sound ? "Sound enabled" : "Sound disabled");
});

$("world24Toggle").addEventListener("change", () => {
  settings.world24 = $("world24Toggle").checked;
  saveSettings();
  renderWorldClocks();
});

$("resetSettings").addEventListener("click", () => {
  settings = { ...defaultSettings };
  saveSettings();
  applySettings();
  showToast("Settings restored");
});

applySettings();

// ---------- THEME BUTTON ----------

const themes = ["cyan", "purple", "green", "orange", "pink"];

$("themeBtn").addEventListener("click", () => {
  const currentIndex = themes.indexOf(settings.accent);
  settings.accent = themes[(currentIndex + 1) % themes.length];

  saveSettings();
  applySettings();

  showToast(`Theme: ${settings.accent}`);
});

// ---------- FULLSCREEN ----------

$("fullscreenBtn").addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch {
    showToast("Fullscreen is not available");
  }
});

// ---------- KEYBOARD SHORTCUTS ----------

document.addEventListener("keydown", (event) => {
  const tag = document.activeElement.tagName;

  const isTyping =
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    document.activeElement.isContentEditable;

  if (event.code === "Space" && !isTyping) {
    event.preventDefault();

    if ($("tools").classList.contains("active")) {
      if (stopwatchRunning) {
        pauseStopwatch();
      } else {
        startStopwatch();
      }
    }
  }
});

// ---------- STARTUP ----------

showPage("home");
renderWorldClocks();
renderAlarms();
updateMainClock();
updateStopwatch();
updateTimerDisplay();
updatePomoDisplay();
renderCalendar();

console.log("TIME SPACE Dashboard 3.0 loaded successfully!");
