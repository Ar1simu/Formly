function showPage(pageId) {
  const pages = document.querySelectorAll(".page");

  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
}

/* =========================
   EVENT DATA
========================= */

const eventData = {
  fallFormal: {
    name: "US Fall Dance",
    shortName: "Fall Formal",
    date: "2026-09-26",
    theme: "Rio de Janeiro",
    venue: "The Gregory School",
    ticket: 20,
    accent: "rio"
  },

  homecoming: {
    name: "Homecoming",
    shortName: "Homecoming",
    date: "2027-01-16",
    theme: null,
    venue: null,
    ticket: null,
    accent: "default"
  },

  prom: {
    name: "Prom",
    shortName: "Prom",
    date: "2027-04-17",
    theme: null,
    venue: null,
    ticket: null,
    accent: "default"
  }
};

/* =========================
   HOMEPAGE EVENT DISPLAY
========================= */

function updateEventDisplay() {
  const fall = eventData.fallFormal;
  const homecoming = eventData.homecoming;
  const prom = eventData.prom;

  const fallElement = document.getElementById("fallFormal");
  const homecomingElement = document.getElementById("homecoming");
  const promElement = document.getElementById("prom");

  if (fallElement) {
    fallElement.innerText =
      `${fall.name}: September 26, 2026 | Theme: ${fall.theme} | Venue: ${fall.venue} | Ticket: $${fall.ticket}`;
  }

  if (homecomingElement) {
    let text = `${homecoming.name}: January 16, 2027`;

    if (homecoming.theme) {
      text += ` | Theme: ${homecoming.theme}`;
    }

    if (homecoming.venue) {
      text += ` | Venue: ${homecoming.venue}`;
    }

    if (homecoming.ticket !== null) {
      text += ` | Ticket: $${homecoming.ticket}`;
    }

    homecomingElement.innerText = text;
  }

  if (promElement) {
    let text = `${prom.name}: April 17, 2027`;

    if (prom.theme) {
      text += ` | Theme: ${prom.theme}`;
    }

    if (prom.venue) {
      text += ` | Venue: ${prom.venue}`;
    }

    if (prom.ticket !== null) {
      text += ` | Ticket: $${prom.ticket}`;
    }

    promElement.innerText = text;
  }
}

/* =========================
   HOMEPAGE THEMING
========================= */

function updateHomepageTheme() {
  const today = new Date();

  const fallFormal = new Date(eventData.fallFormal.date);
  const homecoming = new Date(eventData.homecoming.date);
  const prom = new Date(eventData.prom.date);

  let activeEvent;

  if (today < fallFormal) {
    activeEvent = eventData.fallFormal;
  } else if (today < homecoming) {
    activeEvent = eventData.homecoming;
  } else if (today < prom) {
    activeEvent = eventData.prom;
  } else {
    activeEvent = null;
  }

  const homepage = document.body;

  if (!homepage) return;

  // Remove previous event themes
  homepage.classList.remove(
    "theme-rio",
    "theme-homecoming",
    "theme-prom",
    "theme-default"
  );

  if (!activeEvent) {
    homepage.classList.add("theme-default");
    return;
  }

  // Apply current event theme
  homepage.classList.add(`theme-${activeEvent.accent}`);

  // Store event information for CSS/other scripts
  homepage.dataset.activeEvent = activeEvent.shortName;
  homepage.dataset.eventTheme = activeEvent.theme || "none";
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
  const today = new Date();

  const fallFormal = new Date(eventData.fallFormal.date);
  const homecoming = new Date(eventData.homecoming.date);
  const prom = new Date(eventData.prom.date);

  // Fall Formal cycle
  if (today < fallFormal) {
    const diff = Math.floor(
      (fallFormal - today) / (1000 * 60 * 60 * 24)
    );

    return `Fall Formal: Sep 26, 2026 | ${diff} days remaining | Theme: Rio de Janeiro | Venue: The Gregory School | Ticket: $20 | Prediction engine: ON`;
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
  updateCountdown("countdown", eventData.homecoming.date, "Homecoming");
  updateCountdown("fallCountdown", eventData.fallFormal.date, "US Fall Dance");
  updateCountdown("promCountdown", eventData.prom.date, "Prom");
}

/* =========================
   INIT
========================= */

window.onload = function () {
  updateBudget();

  // Event information
  updateEventDisplay();

  // Dynamic homepage theme
  updateHomepageTheme();

  // Prediction engine
  const predictionText = document.getElementById("predictionText");

  if (predictionText) {
    predictionText.innerText = getPrediction();
  }

  // countdowns
  updateAllCountdowns();

  setInterval(updateAllCountdowns, 86400000);
  setInterval(updateHomepageTheme, 86400000);
};
