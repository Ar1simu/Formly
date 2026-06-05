function showPage(pageId) {
  const pages = document.querySelectorAll(".page");

  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
}

/* =========================
   BUDGET (UPDATED 700 → 2500)
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
   OUTFIT BUILDER (NEW LOGIC)
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
   SETTINGS (SIMPLE / ADVANCED)
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
   PREDICTION SYSTEM (UPDATED)
========================= */

function getPrediction() {
  const now = new Date();
  const month = now.getMonth();

  if (month >= 5 && month <= 7) {
    return "Off-season (June–August): No dance cycle active.";
  }

  const homecoming = new Date("2027-01-16");
  const today = new Date();

  const diff = Math.floor((homecoming - today) / (1000 * 60 * 60 * 24));

  return `Homecoming: Jan 16, 2027 | ${diff} days remaining | Typical window: 90–100 days pre-event`;
}

/* =========================
   LIVE COUNTDOWN (HOME PAGE)
========================= */

function updateCountdown() {
  const target = new Date("2027-01-16T00:00:00");
  const now = new Date();

  const diff = target - now;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  document.getElementById("countdown").innerText =
    days + " days until Homecoming";
}

/* =========================
   NEW: REAL EVENT DATES
========================= */

function getEventDates() {
  return {
    fallDance: "September 26, 2026",   // US Fall Dance (Fall Formal)
    prom: "April 17, 2027"
  };
}

/* =========================
   INIT
========================= */

window.onload = function () {
  updateBudget();
  updateCountdown();

  const dates = getEventDates();

  document.getElementById("predictionText").innerText = getPrediction();

  // UPDATED REAL EVENTS
  document.getElementById("fallFormal").innerText =
    "US Fall Dance: " + dates.fallDance;

  document.getElementById("prom").innerText =
    "Prom: " + dates.prom;

  setInterval(updateCountdown, 86400000); // daily update
};
