
// =================================
// 1. DIGITAL CLOCK
// =================================

const clock = document.getElementById("clock");
const period = document.getElementById("period");
const day = document.getElementById("day");
const date = document.getElementById("date");
const formatBtn = document.getElementById("formatBtn");

let use24Hour = false;

function updateClock() {
    const now = new Date();

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const ampm = hours >= 12 ? "PM" : "AM";

    if (!use24Hour) {
        hours = hours % 12 || 12;
    }

    clock.textContent =
        `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`;

    period.textContent = use24Hour ? "24 HOUR FORMAT" : ampm;

    day.textContent = now.toLocaleDateString("en-US", {
        weekday: "long"
    });

    date.textContent = now.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

formatBtn.addEventListener("click", () => {
    use24Hour = !use24Hour;

    formatBtn.textContent = use24Hour
        ? "Switch to 12H"
        : "Switch to 24H";

    updateClock();
});

updateClock();
setInterval(updateClock, 1000);


// =================================
// 2. STOPWATCH
// =================================

const stopwatch = document.getElementById("stopwatch");
const laps = document.getElementById("laps");

let watchRunning = false;
let watchStart = 0;
let watchElapsed = 0;
let watchFrame = null;

function formatStopwatch(ms) {
    const total = Math.floor(ms / 10);
    const hundredths = total % 100;
    const totalSeconds = Math.floor(total / 100);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);

    return (
        String(hours).padStart(2, "0") + ":" +
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0") + "." +
        String(hundredths).padStart(2, "0")
    );
}

function updateStopwatch() {
    if (!watchRunning) return;

    const elapsed = watchElapsed + performance.now() - watchStart;

    stopwatch.textContent = formatStopwatch(elapsed);

    watchFrame = requestAnimationFrame(updateStopwatch);
}

document.getElementById("startWatch").addEventListener("click", () => {
    if (watchRunning) return;

    watchRunning = true;
    watchStart = performance.now();

    updateStopwatch();
});

document.getElementById("pauseWatch").addEventListener("click", () => {
    if (!watchRunning) return;

    watchElapsed += performance.now() - watchStart;
    watchRunning = false;

    cancelAnimationFrame(watchFrame);
    stopwatch.textContent = formatStopwatch(watchElapsed);
});

document.getElementById("resetWatch").addEventListener("click", () => {
    watchRunning = false;
    watchElapsed = 0;

    cancelAnimationFrame(watchFrame);

    stopwatch.textContent = "00:00:00.00";
    laps.innerHTML = "";
});

document.getElementById("lapWatch").addEventListener("click", () => {
    if (!watchRunning) return;

    const elapsed = watchElapsed + performance.now() - watchStart;

    const li = document.createElement("li");
    li.textContent = "Lap " + (laps.children.length + 1) +
        " — " + formatStopwatch(elapsed);

    laps.prepend(li);
});


// =================================
// 3. COUNTDOWN TIMER
// =================================

const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");
const countdown = document.getElementById("countdown");
const timerStatus = document.getElementById("timerStatus");

let timerRemaining = 300000;
let timerDeadline = 0;
let timerRunning = false;
let timerInterval = null;

function showCountdown(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    countdown.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
}

function updateCountdown() {
    timerRemaining = Math.max(0, timerDeadline - Date.now());

    showCountdown(timerRemaining);

    if (timerRemaining <= 0) {
        stopTimer();
        timerStatus.textContent = "Time is up!";
        alert("Your countdown has finished!");
    }
}

function getInputTime() {
    const minutes = Number(minutesInput.value);
    const seconds = Number(secondsInput.value);

    if (
        minutesInput.value === "" ||
        secondsInput.value === "" ||
        !Number.isInteger(minutes) ||
        !Number.isInteger(seconds) ||
        minutes < 0 ||
        minutes > 999 ||
        seconds < 0 ||
        seconds > 59
    ) {
        alert("Enter valid minutes and seconds.");
        return null;
    }

    return (minutes * 60 + seconds) * 1000;
}

document.getElementById("startTimer").addEventListener("click", () => {
    if (timerRunning) return;

    if (timerRemaining <= 0) {
        timerRemaining = getInputTime();

        if (timerRemaining === null) return;
    }

    if (timerRemaining === 0) {
        showCountdown(0);
        timerStatus.textContent = "Set a time first";
        return;
    }

    timerDeadline = Date.now() + timerRemaining;
    timerRunning = true;
    timerStatus.textContent = "Timer running";

    timerInterval = setInterval(updateCountdown, 100);
});

document.getElementById("pauseTimer").addEventListener("click", () => {
    if (!timerRunning) return;

    timerRemaining = Math.max(0, timerDeadline - Date.now());

    stopTimer();
    showCountdown(timerRemaining);
    timerStatus.textContent = "Timer paused";
});

document.getElementById("resetTimer").addEventListener("click", () => {
    stopTimer();

    timerRemaining = getInputTime();

    if (timerRemaining === null) {
        timerRemaining = 0;
    }

    showCountdown(timerRemaining);
    timerStatus.textContent = "Ready to start";
});

function updateInputDisplay() {
    if (timerRunning) return;

    const value = getInputTime();

    if (value !== null) {
        timerRemaining = value;
        showCountdown(timerRemaining);
        timerStatus.textContent = "Ready to start";
    }
}

minutesInput.addEventListener("change", updateInputDisplay);
secondsInput.addEventListener("change", updateInputDisplay);

showCountdown(timerRemaining);


// =================================
// 4. WORLD CLOCK
// =================================

const cities = [
    {
        id: "india",
        zone: "Asia/Kolkata"
    },
    {
        id: "london",
        zone: "Europe/London"
    },
    {
        id: "newyork",
        zone: "America/New_York"
    },
    {
        id: "tokyo",
        zone: "Asia/Tokyo"
    },
    {
        id: "sydney",
        zone: "Australia/Sydney"
    }
];

function updateWorldClock() {
    cities.forEach(city => {
        const cityTime = new Date().toLocaleTimeString("en-GB", {
            timeZone: city.zone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });

        document.getElementById(city.id).textContent = cityTime;
    });
}

updateWorldClock();
setInterval(updateWorldClock, 1000);
