
const clock = document.getElementById("clock");
const period = document.getElementById("period");
const day = document.getElementById("day");
const date = document.getElementById("date");

const formatBtn = document.getElementById("formatBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");

let use24Hour = false;

// Update the clock
function updateClock() {

    const now = new Date();

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const ampm = hours >= 12 ? "PM" : "AM";

    if (!use24Hour) {
        hours = hours % 12 || 12;
    }

    const formattedHours = String(hours).padStart(2, "0");

    clock.textContent =
        `${formattedHours}:${minutes}:${seconds}`;

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

// Change time format
formatBtn.addEventListener("click", function () {

    use24Hour = !use24Hour;

    formatBtn.textContent = use24Hour
        ? "Switch to 12H"
        : "Switch to 24H";

    updateClock();
});

// Full screen button
fullscreenBtn.addEventListener("click", async function () {

    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    } catch (error) {
        console.log("Fullscreen is not available:", error);
    }
});

// Update every second
updateClock();
setInterval(updateClock, 1000);
