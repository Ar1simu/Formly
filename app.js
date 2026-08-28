```javascript
function showPage(pageId) {
  const pages = document.querySelectorAll(".page");

  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
}

/* =========================
   BUDGET
========================= */
function updateBudget() {
  let ticket = +document.getElementById("ticketSlider").value;
  let outfit = +document.getElementById("outfitSlider").value;
  let food = +document.getElementById("foodSlider").value;
  let extras = +document.getElementById("extrasSlider").value;

  document.getElementById("ticketValue").innerText = "$" + ticket;
  document.getElementById("outfitValue").innerText = "$" + outfit;
  document.getElementById("foodValue").innerText = "$" + food;
  document.getElementById("extrasValue").innerText = "$" + extras;

  let total = ticket + outfit + food + extras;

  document.getElementById("totalCost").innerText = "$" + total;

  let range =
    total <= 300 ? "Low Range" :
    total <= 700 ? "Standard Range" :
    total <= 1500 ? "High Range" :
    "Luxury Range";

  document.getElementById("budgetRange").innerText = range;
}

/* =========================
   OUTFITS
========================= */

const outfitData = {
  casual: [
    "Button-up + chinos + loafers",
    "Polo + slim chinos + sneakers",
    "Sweater + jeans + clean shoes",
    "Overshirt + t-shirt + chinos",
    "Minimal hoodie + dark jeans",
    "Oxford shirt + relaxed pants"
  ],
  semiformal: [
    "Blazer + button-up + chinos",
    "Turtleneck + dress pants",
    "Sweater vest + shirt + slacks",
    "Light blazer + loafers combo",
    "Monochrome fitted outfit",
    "Pattern shirt + neutral pants"
  ],
  formal: [
    "Full suit + tie + dress shoes",
    "Tux-style blazer + slacks",
    "Three-piece suit setup",
    "Black suit + white shirt combo",
    "Slim formal suit + polished shoes",
    "Modern fitted formal set"
  ]
};

function generateOutfit() {
  const type = document.getElementById("outfitType").value;
  const list = outfitData[type];

  const result = list[Math.floor(Math.random() * list.length)];

  document.getElementById("outfitResult").innerText =
    "Recommended Outfit: " + result;
}

/* =========================
   ETIQUETTE
========================= */

function showEtiquette() {
  document.getElementById("etiquetteBox").classList.toggle("hidden");
}

/* =========================
   SETTINGS
========================= */

let advancedMode = false;

function toggleMode() {
  advancedMode = !advancedMode;

  const elements = document.querySelectorAll(".advanced");

  elements.forEach(el => {
    el.style.display = advancedMode ? "block" : "none";
  });
}

/* =========================
   PREDICTION
========================= */

function getPrediction() {
  const now = new Date();
  const today = new Date();

  const fallFormal = new Date("2026-09-26");
  const homecoming = new Date("2027-01-16");
  const prom = new Date("2027-04-17");

  // Fall Formal cycle
  if (today < fallFormal) {
    const diff = Math.floor(
      (fallFormal - today) / (1000 * 60 * 60 * 24)
    );

    return `Fall Formal: Sep 26, 2026 | ${diff} days remaining | Theme: Rio de Janeiro | Prediction engine: ON`;
  }

  // Homecoming cycle
  if (today < homecoming) {
    const diff = Math.floor(
      (homecoming - today) / (1000 * 60 * 60 * 24)
    );

    return `Homecoming: Jan 16, 2027 | ${diff} days remaining | Prediction engine: ON`;
  }

  // Prom cycle
  if (today < prom) {
    const diff = Math.floor(
      (prom - today) / (1000 * 60 * 60 * 24)
    );

    return `Prom: Apr 17, 2027 | ${diff} days remaining | Prediction engine: ON`;
  }

  return "Dance season complete.";
}

/* =========================
   COUNTDOWN SYSTEM (FIXED)
========================= */

function updateCountdown(id, date, label) {
  const target = new Date(date);
  const now = new Date();

  const diff = target - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  const el = document.getElementById(id);
  if (!el) return;

  el.innerText = `${days} days until ${label}`;
}

/* wrappers */
function updateAllCountdowns() {
  updateCountdown("countdown", "2027-01-16", "Homecoming");
  updateCountdown("fallCountdown", "2026-09-26", "US Fall Dance");
  updateCountdown("promCountdown", "2027-04-17", "Prom");
}

/* =========================
   INIT
========================= */

window.onload = function () {
  updateBudget();

  document.getElementById("predictionText").innerText = getPrediction();

  // event text
  document.getElementById("fallFormal").innerText =
    "US Fall Dance: September 26, 2026 | Theme: Rio de Janeiro";

  document.getElementById("prom").innerText =
    "Prom: April 17, 2027";

  // countdowns
  updateAllCountdowns();
  setInterval(updateAllCountdowns, 86400000);
};
```
