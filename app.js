
/*
 * FORMLY — ALPHA 0.8.0
 * Administrative Expansion
 *
 * Includes:
 * - Safe page navigation
 * - Dynamic event selection and rendering
 * - Event CRUD foundations
 * - Correct countdown states
 * - Budget calculations
 * - Outfit generation
 * - Etiquette toggle
 * - Advanced Mode
 * - Historical theme archive
 * - Explainable theme prediction
 * - Local data persistence
 * - Data import/export
 * - Basic diagnostics
 *
 * IMPORTANT:
 * This application currently uses browser-local storage.
 * Advanced Mode is NOT authentication.
 * Do not store confidential data in this client-side version.
 */

"use strict";

/* =========================================================
   CONFIGURATION
========================================================= */

const FORMLY_VERSION = "0.8.0-alpha";

const STORAGE_KEYS = {
  events: "formly.events.v080",
  themes: "formly.historicalThemes.v080",
  settings: "formly.settings.v080"
};

const MS_PER_DAY = 86400000;

const DEFAULT_EVENTS = {
  fallFormal: {
    id: "fallFormal",
    name: "US Fall Dance",
    shortName: "Fall Formal",
    date: "2026-09-26",
    theme: "Rio de Janeiro",
    venue: "The Gregory School",
    ticket: 20,
    accent: "rio",
    status: "completed",
    type: "fall",
    source: "existing-record"
  },

  homecoming: {
    id: "homecoming",
    name: "Homecoming",
    shortName: "Homecoming",
    date: "2027-01-16",
    theme: null,
    venue: null,
    ticket: null,
    accent: "homecoming",
    status: "predicted",
    type: "homecoming",
    source: "existing-record"
  },

  prom: {
    id: "prom",
    name: "Prom",
    shortName: "Prom",
    date: "2027-04-17",
    theme: null,
    venue: null,
    ticket: null,
    accent: "prom",
    status: "predicted",
    type: "prom",
    source: "existing-record"
  }
};

const DEFAULT_SETTINGS = {
  advancedMode: false,
  predictionEnabled: true
};

/* =========================================================
   STATE
========================================================= */

let eventData = loadEvents();
let historicalThemes = loadHistoricalThemes();
let formlySettings = loadSettings();

let advancedMode = Boolean(formlySettings.advancedMode);

let lastDiagnostics = {
  initialized: false,
  errors: [],
  warnings: [],
  lastRun: null
};

/* =========================================================
   GENERAL HELPERS
========================================================= */

function getElement(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const element = getElement(id);

  if (element) {
    element.textContent = String(value ?? "");
  }
}

function setValue(id, value) {
  const element = getElement(id);

  if (element) {
    element.value = value ?? "";
  }
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return replacements[character];
  });
}

function makeId(prefix = "item") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function parseLocalDate(dateString) {
  if (!dateString || typeof dateString !== "string") {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function localToday() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
}

function daysBetween(startDate, endDate) {
  const start = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );

  const end = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );

  return Math.round((end - start) / MS_PER_DAY);
}

function formatDate(dateString) {
  const date = parseLocalDate(dateString);

  if (!date) {
    return "Date not announced";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(safeNumber(value));
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function notify(message) {
  /*
   * Uses an existing notification element if available.
   * Falls back to a browser alert.
   */

  const notification = getElement("formlyNotification");

  if (notification) {
    notification.textContent = message;
    notification.hidden = false;

    return;
  }

  console.info(`[Formly] ${message}`);
}

/* =========================================================
   LOCAL STORAGE
========================================================= */

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);

    if (stored === null) {
      return fallback;
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error(`[Formly] Could not read ${key}:`, error);

    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));

    return true;
  } catch (error) {
    console.error(`[Formly] Could not save ${key}:`, error);

    notify(
      "Data could not be saved. Check browser storage availability."
    );

    return false;
  }
}

function loadEvents() {
  const stored = readStorage(STORAGE_KEYS.events, null);

  if (
    !stored ||
    typeof stored !== "object" ||
    Array.isArray(stored)
  ) {
    return structuredCloneSafe(DEFAULT_EVENTS);
  }

  return stored;
}

function loadHistoricalThemes() {
  const stored = readStorage(STORAGE_KEYS.themes, []);

  return Array.isArray(stored) ? stored : [];
}

function loadSettings() {
  const stored = readStorage(
    STORAGE_KEYS.settings,
    DEFAULT_SETTINGS
  );

  return {
    ...DEFAULT_SETTINGS,
    ...(stored && typeof stored === "object" ? stored : {})
  };
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function saveEvents() {
  return writeStorage(STORAGE_KEYS.events, eventData);
}

function saveHistoricalThemes() {
  return writeStorage(STORAGE_KEYS.themes, historicalThemes);
}

function saveSettings() {
  formlySettings.advancedMode = advancedMode;

  return writeStorage(STORAGE_KEYS.settings, formlySettings);
}

/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId) {
  const target = getElement(pageId);

  if (!target) {
    console.warn(`[Formly] Page not found: ${pageId}`);

    return;
  }

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
    page.setAttribute("aria-hidden", "true");
  });

  target.classList.add("active");
  target.setAttribute("aria-hidden", "false");

  /*
   * Refresh page-specific information when navigating.
   */

  updateEventDisplay();
  updateHomepageTheme();
  updateAllCountdowns();

  if (pageId === "budget") {
    updateBudget();
  }

  if (pageId === "adminPage") {
    renderAdminDashboard();
  }
}

/* =========================================================
   EVENT DATA AND VALIDATION
========================================================= */

function getEvents() {
  return Object.values(eventData).filter(event => {
    return event && typeof event === "object";
  });
}

function getEventById(id) {
  return eventData[id] || null;
}

function validateEvent(event) {
  const errors = [];

  if (!event || typeof event !== "object") {
    return ["Event data must be an object."];
  }

  if (!String(event.id ?? "").trim()) {
    errors.push("Event ID is required.");
  }

  if (!String(event.name ?? "").trim()) {
    errors.push("Event name is required.");
  }

  if (event.date && !parseLocalDate(event.date)) {
    errors.push("Event date must be a valid YYYY-MM-DD date.");
  }

  if (
    event.ticket !== null &&
    event.ticket !== undefined &&
    (
      !Number.isFinite(Number(event.ticket)) ||
      Number(event.ticket) < 0
    )
  ) {
    errors.push("Ticket price must be a nonnegative number.");
  }

  const allowedStatuses = [
    "predicted",
    "tentative",
    "confirmed",
    "completed"
  ];

  if (!allowedStatuses.includes(event.status)) {
    errors.push("Event status is invalid.");
  }

  return errors;
}

function getEventStatus(event) {
  if (!event) {
    return "unknown";
  }

  const today = localToday();
  const eventDate = parseLocalDate(event.date);

  if (!eventDate) {
    return event.status || "unknown";
  }

  if (eventDate < today) {
    return "completed";
  }

  if (eventDate.getTime() === today.getTime()) {
    return "today";
  }

  return event.status || "predicted";
}

function getUpcomingEvents() {
  const today = localToday();

  return getEvents()
    .filter(event => {
      const date = parseLocalDate(event.date);

      return date && date >= today;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getNextUpcomingEvent() {
  return getUpcomingEvents()[0] || null;
}

/* =========================================================
   EVENT ADMINISTRATION
========================================================= */

function createEvent(event) {
  const newEvent = {
    ...event,
    id: String(event.id || makeId("event"))
  };

  const errors = validateEvent(newEvent);

  if (errors.length) {
    notify(errors.join(" "));
    return false;
  }

  if (eventData[newEvent.id]) {
    notify("An event with this ID already exists.");
    return false;
  }

  eventData[newEvent.id] = newEvent;

  if (!saveEvents()) {
    delete eventData[newEvent.id];
    return false;
  }

  refreshFormly();

  notify("Event created.");

  return true;
}

function updateEvent(id, updates) {
  const existing = getEventById(id);

  if (!existing) {
    notify("The selected event does not exist.");
    return false;
  }

  const updated = {
    ...existing,
    ...updates,
    id: existing.id
  };

  const errors = validateEvent(updated);

  if (errors.length) {
    notify(errors.join(" "));
    return false;
  }

  eventData[id] = updated;

  if (!saveEvents()) {
    eventData[id] = existing;
    return false;
  }

  refreshFormly();

  notify("Event updated.");

  return true;
}

function deleteEvent(id) {
  const existing = getEventById(id);

  if (!existing) {
    notify("The selected event does not exist.");
    return false;
  }

  const approved = window.confirm(
    `Delete "${existing.name}"? This cannot be undone without a backup.`
  );

  if (!approved) {
    return false;
  }

  delete eventData[id];

  if (!saveEvents()) {
    eventData[id] = existing;
    return false;
  }

  refreshFormly();

  notify("Event deleted.");

  return true;
}

function duplicateEvent(id) {
  const existing = getEventById(id);

  if (!existing) {
    notify("The selected event does not exist.");
    return false;
  }

  const duplicate = {
    ...structuredCloneSafe(existing),
    id: makeId("event"),
    name: `${existing.name} (Copy)`,
    shortName: `${existing.shortName || existing.name} Copy`,
    status: "tentative"
  };

  eventData[duplicate.id] = duplicate;

  if (!saveEvents()) {
    delete eventData[duplicate.id];
    return false;
  }

  refreshFormly();

  notify("Event duplicated.");

  return duplicate.id;
}

function archiveEvent(id) {
  const existing = getEventById(id);

  if (!existing) {
    notify("The selected event does not exist.");
    return false;
  }

  return updateEvent(id, {
    status: "completed"
  });
}

/*
 * Expected optional form IDs:
 * adminEventId
 * adminEventName
 * adminEventShortName
 * adminEventDate
 * adminEventTheme
 * adminEventVenue
 * adminEventTicket
 * adminEventAccent
 * adminEventType
 * adminEventStatus
 */

function saveEventFromAdminForm() {
  const id = getElement("adminEventId")?.value.trim();

  const name = getElement("adminEventName")?.value.trim();

  const shortName =
    getElement("adminEventShortName")?.value.trim() || name;

  const date = getElement("adminEventDate")?.value || null;

  const theme =
    getElement("adminEventTheme")?.value.trim() || null;

  const venue =
    getElement("adminEventVenue")?.value.trim() || null;

  const ticketInput =
    getElement("adminEventTicket")?.value;

  const ticket =
    ticketInput === "" || ticketInput === undefined
      ? null
      : safeNumber(ticketInput, NaN);

  const accent =
    getElement("adminEventAccent")?.value.trim() || "default";

  const type =
    getElement("adminEventType")?.value.trim() || "other";

  const status =
    getElement("adminEventStatus")?.value || "tentative";

  const record = {
    id: id || makeId("event"),
    name,
    shortName,
    date,
    theme,
    venue,
    ticket,
    accent,
    type,
    status,
    source: "admin"
  };

  if (id && getEventById(id)) {
    return updateEvent(id, record);
  }

  return createEvent(record);
}

function populateAdminEventForm(id) {
  const event = getEventById(id);

  if (!event) {
    notify("Select a valid event first.");
    return false;
  }

  setValue("adminEventId", event.id);
  setValue("adminEventName", event.name);
  setValue("adminEventShortName", event.shortName);
  setValue("adminEventDate", event.date);
  setValue("adminEventTheme", event.theme);
  setValue("adminEventVenue", event.venue);
  setValue("adminEventTicket", event.ticket);
  setValue("adminEventAccent", event.accent);
  setValue("adminEventType", event.type);
  setValue("adminEventStatus", event.status);

  return true;
}

/* =========================================================
   EVENT DISPLAY
========================================================= */

function buildEventSummary(event) {
  if (!event) {
    return "No event information available.";
  }

  const parts = [
    `${event.name}: ${formatDate(event.date)}`
  ];

  parts.push(`Status: ${getEventStatus(event)}`);

  parts.push(`Theme: ${event.theme || "TBD"}`);
  parts.push(`Venue: ${event.venue || "TBD"}`);

  parts.push(
    `Ticket: ${
      event.ticket === null || event.ticket === undefined
        ? "TBD"
        : formatCurrency(event.ticket)
    }`
  );

  return parts.join(" | ");
}

function renderEventSummary(id, event) {
  /*
   * Supports both legacy IDs and new unique IDs.
   * It intentionally updates every matching ID to help
   * during migration away from duplicated IDs.
   */

  const elements = document.querySelectorAll(
    `[id="${CSS.escape(id)}"]`
  );

  elements.forEach(element => {
    element.textContent = buildEventSummary(event);
  });
}

function updateEventDisplay() {
  renderEventSummary(
    "fallFormal",
    getEventById("fallFormal")
  );

  renderEventSummary(
    "homecoming",
    getEventById("homecoming")
  );

  renderEventSummary(
    "prom",
    getEventById("prom")
  );

  /*
   * Optional dynamic homepage card IDs:
   * featuredEventName
   * featuredEventDate
   * featuredEventTheme
   * featuredEventVenue
   * featuredEventTicket
   * featuredEventStatus
   */

  const event = getNextUpcomingEvent();

  if (!event) {
    setText("featuredEventName", "No upcoming events");
    setText("featuredEventDate", "Check back later.");
    setText("featuredEventTheme", "TBD");
    setText("featuredEventVenue", "TBD");
    setText("featuredEventTicket", "TBD");
    setText("featuredEventStatus", "No upcoming event");
    return;
  }

  setText("featuredEventName", event.shortName || event.name);
  setText("featuredEventDate", formatDate(event.date));
  setText("featuredEventTheme", event.theme || "TBD");
  setText("featuredEventVenue", event.venue || "TBD");

  setText(
    "featuredEventTicket",
    event.ticket === null || event.ticket === undefined
      ? "TBD"
      : formatCurrency(event.ticket)
  );

  setText("featuredEventStatus", getEventStatus(event));
}

/* =========================================================
   DYNAMIC HOMEPAGE THEMING
========================================================= */

function updateHomepageTheme() {
  const homepage = document.body;

  if (!homepage) {
    return;
  }

  const event = getNextUpcomingEvent();

  const themeClasses = [
    "theme-rio",
    "theme-homecoming",
    "theme-prom",
    "theme-default"
  ];

  homepage.classList.remove(...themeClasses);

  if (!event) {
    homepage.classList.add("theme-default");

    delete homepage.dataset.activeEvent;
    delete homepage.dataset.eventTheme;

    return;
  }

  const accent = normalizeText(event.accent || "default")
    .replace(/[^a-z0-9-]/g, "");

  const className = `theme-${accent}`;

  /*
   * Only apply a generated class if it exists in the stylesheet.
   * Keep the fallback safe if an accent is not configured.
   */

  const knownThemeClasses = new Set(themeClasses);

  if (knownThemeClasses.has(className)) {
    homepage.classList.add(className);
  } else {
    homepage.classList.add("theme-default");
  }

  homepage.dataset.activeEvent = event.shortName || event.name;
  homepage.dataset.eventTheme = event.theme || "none";
  homepage.dataset.eventId = event.id;
}

/* =========================================================
   BUDGET PLANNER
========================================================= */

function readSlider(id) {
  const element = getElement(id);

  if (!element) {
    return 0;
  }

  return Math.max(0, safeNumber(element.value, 0));
}

function updateBudget() {
  const ticket = readSlider("ticketSlider");
  const outfit = readSlider("outfitSlider");
  const food = readSlider("foodSlider");
  const extras = readSlider("extrasSlider");

  setText("ticketValue", formatCurrency(ticket));
  setText("outfitValue", formatCurrency(outfit));
  setText("foodValue", formatCurrency(food));
  setText("extrasValue", formatCurrency(extras));

  const total = ticket + outfit + food + extras;

  setText("totalCost", formatCurrency(total));

  const range =
    total <= 300 ? "Low Range" :
    total <= 700 ? "Standard Range" :
    total <= 1500 ? "High Range" :
    "Luxury Range";

  setText("budgetRange", range);

  /*
   * Optional overall spending limit:
   * budgetLimit
   * budgetRemaining
   */

  const budgetLimitElement = getElement("budgetLimit");

  if (budgetLimitElement) {
    const limit = Math.max(
      0,
      safeNumber(budgetLimitElement.value, 0)
    );

    setText(
      "budgetRemaining",
      formatCurrency(limit - total)
    );
  }

  return total;
}

/* =========================================================
   OUTFIT GENERATOR
========================================================= */

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
  const type = getElement("outfitType")?.value;
  const list = outfitData[type];

  if (!Array.isArray(list) || list.length === 0) {
    setText("outfitResult", "Select a valid outfit category.");
    return null;
  }

  const result = list[
    Math.floor(Math.random() * list.length)
  ];

  setText("outfitResult", `Recommended Outfit: ${result}`);

  return result;
}

/* =========================================================
   ETIQUETTE
========================================================= */

function showEtiquette() {
  const box = getElement("etiquetteBox");

  if (!box) {
    return;
  }

  box.classList.toggle("hidden");

  const isHidden = box.classList.contains("hidden");

  box.setAttribute("aria-hidden", String(isHidden));
}

/* =========================================================
   ADVANCED MODE / ADMIN CONSOLE
========================================================= */

function applyAdvancedMode() {
  document.querySelectorAll(".advanced").forEach(element => {
    /*
     * The hidden attribute preserves the element's intended
     * display type better than forcing display: block.
     */

    element.hidden = !advancedMode;
  });

  const toggle = getElement("advancedModeToggle");

  if (toggle) {
    toggle.checked = advancedMode;
    toggle.setAttribute("aria-pressed", String(advancedMode));
  }

  setText(
    "advancedModeStatus",
    advancedMode ? "Advanced Mode enabled" : "Standard Mode"
  );

  setText(
    "adminAccessStatus",
    advancedMode
      ? "Local admin workspace enabled"
      : "Admin workspace hidden"
  );

  saveSettings();

  if (advancedMode) {
    renderAdminDashboard();
  }
}

function toggleMode() {
  advancedMode = !advancedMode;

  applyAdvancedMode();

  notify(
    advancedMode
      ? "Advanced Mode enabled."
      : "Advanced Mode disabled."
  );
}

/*
 * Compatibility helper for an HTML checkbox using:
 * onchange="setAdvancedMode(this.checked)"
 */

function setAdvancedMode(enabled) {
  advancedMode = Boolean(enabled);

  applyAdvancedMode();
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function renderAdminDashboard() {
  if (!advancedMode) {
    return;
  }

  setText("adminVersion", FORMLY_VERSION);
  setText("adminEventCount", getEvents().length);
  setText("adminHistoricalThemeCount", historicalThemes.length);

  const nextEvent = getNextUpcomingEvent();

  setText(
    "adminNextEvent",
    nextEvent
      ? `${nextEvent.name} — ${formatDate(nextEvent.date)}`
      : "No upcoming events"
  );

  renderAdminEventList();
  renderHistoricalThemeList();
  renderPredictionResults();
  renderDiagnostics();
}

function renderAdminEventList() {
  const container = getElement("adminEventList");

  if (!container) {
    return;
  }

  container.replaceChildren();

  getEvents()
    .sort((a, b) => {
      return String(a.date || "").localeCompare(
        String(b.date || "")
      );
    })
    .forEach(event => {
      const row = document.createElement("div");

      row.className = "admin-event-row";

      const title = document.createElement("strong");
      title.textContent = event.name;

      const details = document.createElement("p");
      details.textContent =
        `${formatDate(event.date)} · ${getEventStatus(event)}`;

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Edit";

      editButton.addEventListener("click", () => {
        populateAdminEventForm(event.id);
      });

      const duplicateButton = document.createElement("button");
      duplicateButton.type = "button";
      duplicateButton.textContent = "Duplicate";

      duplicateButton.addEventListener("click", () => {
        duplicateEvent(event.id);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";

      deleteButton.addEventListener("click", () => {
        deleteEvent(event.id);
      });

      row.append(
        title,
        details,
        editButton,
        duplicateButton,
        deleteButton
      );

      container.appendChild(row);
    });
}

function renderDiagnostics() {
  const errors = [];
  const warnings = [];

  const allEvents = getEvents();

  const ids = allEvents.map(event => event.id);

  if (new Set(ids).size !== ids.length) {
    errors.push("Duplicate event IDs detected.");
  }

  allEvents.forEach(event => {
    errors.push(
      ...validateEvent(event).map(message => {
        return `${event.name || event.id}: ${message}`;
      })
    );

    if (!event.theme) {
      warnings.push(`${event.name}: theme not recorded.`);
    }

    if (!event.venue) {
      warnings.push(`${event.name}: venue not recorded.`);
    }

    if (!event.date) {
      warnings.push(`${event.name}: date not recorded.`);
    }
  });

  lastDiagnostics = {
    initialized: true,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    lastRun: new Date().toISOString()
  };

  return lastDiagnostics;
}

function renderDiagnosticsToConsole() {
  const result = renderDiagnostics();

  console.group("[Formly] Diagnostics");
  console.log("Version:", FORMLY_VERSION);
  console.log("Events:", getEvents().length);
  console.log("Historical themes:", historicalThemes.length);
  console.log("Errors:", result.errors);
  console.log("Warnings:", result.warnings);
  console.groupEnd();

  renderDiagnostics();

  return result;
}

function renderDiagnosticsPanel() {
  const result = renderDiagnostics();

  setText(
    "diagnosticsErrors",
    result.errors.length
      ? result.errors.join("\n")
      : "No validation errors found."
  );

  setText(
    "diagnosticsWarnings",
    result.warnings.length
      ? result.warnings.join("\n")
      : "No warnings."
  );

  setText("diagnosticsLastRun", result.lastRun || "Not run");
}

function renderAdminDashboardDiagnostics() {
  renderDiagnosticsPanel();
}

function runDiagnostics() {
  const result = renderDiagnosticsToConsole();

  renderDiagnosticsPanel();

  notify(
    result.errors.length
      ? `Diagnostics finished with ${result.errors.length} error(s).`
      : "Diagnostics finished. No validation errors found."
  );

  return result;
}

/* =========================================================
   HISTORICAL THEME ARCHIVE
========================================================= */

/*
 * Historical record format:
 *
 * {
 *   id: "theme-...",
 *   date: "2024-10-01",
 *   eventName: "Fall Dance",
 *   eventType: "fall",
 *   theme: "Masquerade",
 *   category: "Glamour",
 *   notes: ""
 * }
 */

function validateHistoricalTheme(record) {
  const errors = [];

  if (!record || typeof record !== "object") {
    return ["Historical record must be an object."];
  }

  if (!parseLocalDate(record.date)) {
    errors.push("A valid event date is required.");
  }

  if (!String(record.eventName ?? "").trim()) {
    errors.push("An event name is required.");
  }

  if (!String(record.theme ?? "").trim()) {
    errors.push("A historical theme is required.");
  }

  return errors;
}

function addHistoricalTheme(record) {
  const newRecord = {
    id: String(record.id || makeId("theme")),
    date: String(record.date || ""),
    eventName: String(record.eventName || "").trim(),
    eventType: String(record.eventType || "other").trim(),
    theme: String(record.theme || "").trim(),
    category: String(record.category || "").trim(),
    notes: String(record.notes || "").trim()
  };

  const errors = validateHistoricalTheme(newRecord);

  if (errors.length) {
    notify(errors.join(" "));
    return false;
  }

  const duplicate = historicalThemes.some(existing => {
    return (
      existing.date === newRecord.date &&
      normalizeText(existing.eventName) ===
        normalizeText(newRecord.eventName) &&
      normalizeText(existing.theme) ===
        normalizeText(newRecord.theme)
    );
  });

  if (duplicate) {
    notify("This historical record already exists.");
    return false;
  }

  historicalThemes.push(newRecord);

  if (!saveHistoricalThemes()) {
    historicalThemes.pop();
    return false;
  }

  renderHistoricalThemeList();
  renderPredictionResults();

  notify("Historical theme added.");

  return true;
}

function updateHistoricalTheme(id, updates) {
  const index = historicalThemes.findIndex(record => {
    return record.id === id;
  });

  if (index === -1) {
    notify("Historical theme not found.");
    return false;
  }

  const previous = historicalThemes[index];

  const updated = {
    ...previous,
    ...updates,
    id: previous.id
  };

  const errors = validateHistoricalTheme(updated);

  if (errors.length) {
    notify(errors.join(" "));
    return false;
  }

  historicalThemes[index] = updated;

  if (!saveHistoricalThemes()) {
    historicalThemes[index] = previous;
    return false;
  }

  renderHistoricalThemeList();
  renderPredictionResults();

  return true;
}

function deleteHistoricalTheme(id) {
  const index = historicalThemes.findIndex(record => {
    return record.id === id;
  });

  if (index === -1) {
    notify("Historical theme not found.");
    return false;
  }

  const record = historicalThemes[index];

  if (
    !window.confirm(
      `Delete the historical theme "${record.theme}"?`
    )
  ) {
    return false;
  }

  historicalThemes.splice(index, 1);

  if (!saveHistoricalThemes()) {
    historicalThemes.splice(index, 0, record);
    return false;
  }

  renderHistoricalThemeList();
  renderPredictionResults();

  notify("Historical theme deleted.");

  return true;
}

function renderHistoricalThemeList() {
  const container = getElement("historicalThemeList");

  if (!container) {
    return;
  }

  container.replaceChildren();

  const sorted = [...historicalThemes].sort((a, b) => {
    return a.date.localeCompare(b.date);
  });

  if (!sorted.length) {
    const empty = document.createElement("p");

    empty.textContent =
      "No historical themes entered. Add your school's past dances.";

    container.appendChild(empty);

    return;
  }

  sorted.forEach(record => {
    const row = document.createElement("div");

    row.className = "historical-theme-row";

    const details = document.createElement("p");

    details.textContent =
      `${formatDate(record.date)} · ${record.eventName} · ` +
      `${record.theme}` +
      (record.category ? ` · ${record.category}` : "");

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.textContent = "Delete record";

    deleteButton.addEventListener("click", () => {
      deleteHistoricalTheme(record.id);
    });

    row.append(details, deleteButton);

    container.appendChild(row);
  });
}

function saveHistoricalThemeFromForm() {
  return addHistoricalTheme({
    date: getElement("historicalThemeDate")?.value || "",
    eventName:
      getElement("historicalThemeEventName")?.value || "",
    eventType:
      getElement("historicalThemeEventType")?.value || "other",
    theme: getElement("historicalThemeName")?.value || "",
    category:
      getElement("historicalThemeCategory")?.value || "",
    notes: getElement("historicalThemeNotes")?.value || ""
  });
}

/* =========================================================
   THEME CATEGORY CLASSIFICATION
========================================================= */

const THEME_CATEGORY_KEYWORDS = {
  Fantasy: [
    "enchanted",
    "fairytale",
    "fairy tale",
    "fantasy",
    "wonderland",
    "magical",
    "storybook",
    "castle",
    "mythical"
  ],

  Cultural: [
    "rio",
    "brazil",
    "paris",
    "tokyo",
    "around the world",
    "venice",
    "italian",
    "greek",
    "destination",
    "world tour"
  ],

  Era: [
    "1920",
    "roaring twenties",
    "1950",
    "1960",
    "1970",
    "1980",
    "1990",
    "retro",
    "decades",
    "disco",
    "old hollywood"
  ],

  Nature: [
    "garden",
    "forest",
    "under the sea",
    "ocean",
    "starlight",
    "moonlight",
    "celestial",
    "winter",
    "spring",
    "autumn",
    "enchanted woods"
  ],

  Glamour: [
    "masquerade",
    "hollywood",
    "red carpet",
    "black tie",
    "royal",
    "royalty",
    "gala",
    "diamonds",
    "elegance",
    "luxury"
  ]
};

function classifyTheme(theme) {
  const normalized = normalizeText(theme);

  if (!normalized) {
    return "Unknown";
  }

  let bestCategory = "Other";
  let bestScore = 0;

  Object.entries(THEME_CATEGORY_KEYWORDS).forEach(
    ([category, keywords]) => {
      const score = keywords.reduce((total, keyword) => {
        return total + (
          normalized.includes(keyword) ? 1 : 0
        );
      }, 0);

      if (score > bestScore) {
        bestCategory = category;
        bestScore = score;
      }
    }
  );

  return bestScore ? bestCategory : "Other";
}

/* =========================================================
   THEME PREDICTION ENGINE
========================================================= */

/*
 * This is a transparent, rule-based baseline.
 * It is not a trained machine-learning model.
 *
 * It estimates patterns from the historical archive.
 * Ten records can provide exploratory evidence but cannot
 * justify highly precise or guaranteed probabilities.
 */

function inferEventType(eventName) {
  const name = normalizeText(eventName);

  if (name.includes("homecoming")) {
    return "homecoming";
  }

  if (name.includes("prom")) {
    return "prom";
  }

  if (
    name.includes("fall") ||
    name.includes("autumn") ||
    name.includes("october")
  ) {
    return "fall";
  }

  if (
    name.includes("winter") ||
    name.includes("snowball")
  ) {
    return "winter";
  }

  if (
    name.includes("spring") ||
    name.includes("formal")
  ) {
    return "formal";
  }

  return "other";
}

function getHistoricalCategory(record) {
  return record.category &&
    record.category !== "Unknown"
      ? record.category
      : classifyTheme(record.theme);
}

function getComparableHistory(targetEvent) {
  const targetType =
    targetEvent.type || inferEventType(targetEvent.name);

  const validRecords = historicalThemes.filter(record => {
    return (
      !validateHistoricalTheme(record).length
    );
  });

  const sameType = validRecords.filter(record => {
    const historicalType =
      record.eventType || inferEventType(record.eventName);

    return historicalType === targetType;
  });

  /*
   * Prefer same-event-type history when available.
   * Fall back to all historical events if necessary.
   */

  if (sameType.length >= 2) {
    return {
      records: sameType,
      usedFallback: false
    };
  }

  return {
    records: validRecords,
    usedFallback: sameType.length === 0
  };
}

function predictThemes(targetEventId) {
  if (!formlySettings.predictionEnabled) {
    return {
      status: "disabled",
      message: "Theme prediction is disabled.",
      results: []
    };
  }

  const target = getEventById(targetEventId);

  if (!target) {
    return {
      status: "error",
      message: "Select a valid target event.",
      results: []
    };
  }

  const history = getComparableHistory(target);

  const records = history.records;

  if (!records.length) {
    return {
      status: "insufficient-data",
      message:
        "Enter historical dance themes before generating predictions.",
      targetEvent: target,
      results: []
    };
  }

  const categoryCounts = new Map();
  const exactThemeCounts = new Map();

  records.forEach(record => {
    const category = getHistoricalCategory(record);

    categoryCounts.set(
      category,
      (categoryCounts.get(category) || 0) + 1
    );

    const normalizedTheme = normalizeText(record.theme);

    if (normalizedTheme) {
      const existing = exactThemeCounts.get(normalizedTheme) || {
        theme: record.theme,
        count: 0,
        dates: []
      };

      existing.count += 1;
      existing.dates.push(record.date);

      exactThemeCounts.set(normalizedTheme, existing);
    }
  });

  const totalRecords = records.length;

  const categories = [...categoryCounts.entries()]
    .map(([category, count]) => ({
      category,
      count,
      share: count / totalRecords
    }))
    .sort((a, b) => b.count - a.count);

  const repeatedThemes = [...exactThemeCounts.values()]
    .filter(theme => theme.count > 1)
    .sort((a, b) => b.count - a.count);

  /*
   * Category shares describe the archive.
   * They are NOT calibrated probabilities of future school choices.
   */

  const results = categories.map(category => {
    const matchingRecords = records.filter(record => {
      return getHistoricalCategory(record) === category.category;
    });

    const examples = matchingRecords
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3)
      .map(record => ({
        date: record.date,
        eventName: record.eventName,
        theme: record.theme
      }));

    return {
      category: category.category,
      historicalCount: category.count,
      archiveShare: Number(
        (category.share * 100).toFixed(1)
      ),
      examples
    };
  });

  const dataQuality =
    totalRecords < 3 ? "Very limited" :
    totalRecords < 6 ? "Limited" :
    totalRecords < 10 ? "Moderate" :
    "Exploratory sample";

  return {
    status: "success",
    message: history.usedFallback
      ? "No adequate same-type history was found; all valid records were used."
      : "Prediction uses historical records from the matching event type.",
    targetEvent: target,
    targetType: target.type || inferEventType(target.name),
    recordsUsed: totalRecords,
    dataQuality,
    categoryDistribution: results,
    repeatedThemes: repeatedThemes.map(theme => ({
      theme: theme.theme,
      appearances: theme.count,
      dates: theme.dates.sort()
    })),
    limitations: [
      "Historical frequency is not a calibrated probability of future selection.",
      "School organizers can choose entirely new themes.",
      "Predictions are exploratory and must not be presented as official announcements."
    ]
  };
}

function renderPredictionResults() {
  const container = getElement("themePredictionResults");

  if (!container) {
    return;
  }

  container.replaceChildren();

  const targetId = getElement("predictionTargetEvent")?.value;

  const target = targetId
    ? getEventById(targetId)
    : getNextUpcomingEvent();

  if (!target) {
    container.textContent = "No target event is available.";

    return;
  }

  const prediction = predictThemes(target.id);

  const heading = document.createElement("h3");

  heading.textContent = `Theme analysis: ${target.name}`;

  const explanation = document.createElement("p");

  explanation.textContent = prediction.message;

  container.append(heading, explanation);

  if (prediction.status !== "success") {
    return;
  }

  const summary = document.createElement("p");

  summary.textContent =
    `Records analyzed: ${prediction.recordsUsed}. ` +
    `Data quality: ${prediction.dataQuality}.`;

  container.appendChild(summary);

  prediction.categoryDistribution.forEach(item => {
    const row = document.createElement("div");

    row.className = "theme-prediction-row";

    const label = document.createElement("p");

    label.textContent =
      `${item.category}: ${item.historicalCount} of ` +
      `${prediction.recordsUsed} historical records ` +
      `(${item.archiveShare}% of this archive)`;

    const examples = document.createElement("p");

    examples.textContent = item.examples.length
      ? `Examples: ${item.examples.map(example => {
          return `${example.theme} (${example.date})`;
        }).join(", ")}`
      : "No examples available.";

    row.append(label, examples);

    container.appendChild(row);
  });

  const disclaimer = document.createElement("p");

  disclaimer.textContent =
    "These figures describe the historical archive. " +
    "They are not verified probabilities of the next theme.";

  container.appendChild(disclaimer);
}

/* =========================================================
   LEGACY PREDICTION TEXT
========================================================= */

function getPrediction() {
  const event = getNextUpcomingEvent();

  if (!event) {
    return "Dance season complete. No upcoming events are configured.";
  }

  const days = daysBetween(
    localToday(),
    parseLocalDate(event.date)
  );

  const countdownText =
    days === 0
      ? "Today"
      : `${days} day${days === 1 ? "" : "s"} remaining`;

  return (
    `${event.name}: ${formatDate(event.date)} | ` +
    `${countdownText} | ` +
    `Theme: ${event.theme || "TBD"} | ` +
    `Venue: ${event.venue || "TBD"} | ` +
    `Ticket: ${
      event.ticket === null || event.ticket === undefined
        ? "TBD"
        : formatCurrency(event.ticket)
    }`
  );
}

/* =========================================================
   COUNTDOWN SYSTEM
========================================================= */

function updateCountdown(id, date, label) {
  const element = getElement(id);

  if (!element) {
    return;
  }

  const target = parseLocalDate(date);

  if (!target) {
    element.textContent = `${label}: Date not announced`;
    return;
  }

  const days = daysBetween(localToday(), target);

  if (days < 0) {
    element.textContent = `${label}: Event completed`;
  } else if (days === 0) {
    element.textContent = `${label}: Today!`;
  } else {
    element.textContent =
      `${days} day${days === 1 ? "" : "s"} until ${label}`;
  }
}

function updateAllCountdowns() {
  updateCountdown(
    "countdown",
    getEventById("homecoming")?.date,
    "Homecoming"
  );

  updateCountdown(
    "fallCountdown",
    getEventById("fallFormal")?.date,
    "US Fall Dance"
  );

  updateCountdown(
    "promCountdown",
    getEventById("prom")?.date,
    "Prom"
  );
}

/* =========================================================
   DATA EXPORT AND IMPORT
========================================================= */

function exportFormlyData() {
  const backup = {
    application: "Formly",
    version: FORMLY_VERSION,
    exportedAt: new Date().toISOString(),
    events: eventData,
    historicalThemes,
    settings: formlySettings
  };

  const json = JSON.stringify(backup, null, 2);

  const blob = new Blob([json], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = `formly-backup-${Date.now()}.json`;

  document.body.appendChild(link);

  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  return backup;
}

function validateBackup(backup) {
  const errors = [];

  if (!backup || typeof backup !== "object") {
    return ["Backup must be a JSON object."];
  }

  if (
    !backup.events ||
    typeof backup.events !== "object" ||
    Array.isArray(backup.events)
  ) {
    errors.push("Backup does not contain valid event data.");
  }

  if (!Array.isArray(backup.historicalThemes)) {
    errors.push("Backup does not contain a valid theme archive.");
  }

  if (
    backup.events &&
    typeof backup.events === "object" &&
    !Array.isArray(backup.events)
  ) {
    Object.values(backup.events).forEach(event => {
      errors.push(...validateEvent(event));
    });
  }

  if (Array.isArray(backup.historicalThemes)) {
    backup.historicalThemes.forEach(record => {
      errors.push(...validateHistoricalTheme(record));
    });
  }

  return errors;
}

function importFormlyDataFromText(jsonText) {
  let backup;

  try {
    backup = JSON.parse(jsonText);
  } catch (error) {
    notify("Import failed: the file is not valid JSON.");
    return false;
  }

  const errors = validateBackup(backup);

  if (errors.length) {
    notify(`Import rejected: ${errors.join(" ")}`);
    return false;
  }

  const approved = window.confirm(
    "Import this backup? Existing local event and theme data will be replaced."
  );

  if (!approved) {
    return false;
  }

  const oldEvents = eventData;
  const oldThemes = historicalThemes;
  const oldSettings = formlySettings;

  eventData = backup.events;
  historicalThemes = backup.historicalThemes;
  formlySettings = {
    ...DEFAULT_SETTINGS,
    ...(backup.settings || {})
  };

  advancedMode = Boolean(formlySettings.advancedMode);

  const saved =
    saveEvents() &&
    saveHistoricalThemes() &&
    saveSettings();

  if (!saved) {
    eventData = oldEvents;
    historicalThemes = oldThemes;
    formlySettings = oldSettings;
    advancedMode = Boolean(oldSettings.advancedMode);

    notify("Import could not be fully saved. Previous in-memory data restored.");

    return false;
  }

  applyAdvancedMode();
  refreshFormly();

  notify("Backup imported.");

  return true;
}

function importFormlyDataFromFile(file) {
  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    importFormlyDataFromText(String(reader.result || ""));
  };

  reader.onerror = () => {
    notify("Unable to read the selected backup file.");
  };

  reader.readAsText(file);
}

/* =========================================================
   REFRESH AND DIAGNOSTICS
========================================================= */

function refreshFormly() {
  updateEventDisplay();
  updateHomepageTheme();
  updateAllCountdowns();

  const predictionText = getElement("predictionText");

  if (predictionText) {
    predictionText.textContent = getPrediction();
  }

  if (advancedMode) {
    renderAdminDashboard();
  }
}

function renderDiagnostics() {
  const result = runBasicDiagnostics();

  setText(
    "diagnosticsErrors",
    result.errors.length
      ? result.errors.join("\n")
      : "No validation errors found."
  );

  setText(
    "diagnosticsWarnings",
    result.warnings.length
      ? result.warnings.join("\n")
      : "No warnings."
  );

  setText("diagnosticsLastRun", result.lastRun || "Not run");
}

function runBasicDiagnostics() {
  const errors = [];
  const warnings = [];

  const events = getEvents();

  const ids = events.map(event => event.id);

  if (new Set(ids).size !== ids.length) {
    errors.push("Duplicate event IDs detected.");
  }

  events.forEach(event => {
    errors.push(...validateEvent(event));

    if (!event.theme) {
      warnings.push(`${event.name}: theme is not recorded.`);
    }

    if (!event.venue) {
      warnings.push(`${event.name}: venue is not recorded.`);
    }
  });

  const duplicateHistoricalRecords = new Set();

  historicalThemes.forEach(record => {
    errors.push(...validateHistoricalTheme(record));

    const key = [
      record.date,
      normalizeText(record.eventName),
      normalizeText(record.theme)
    ].join("|");

    if (duplicateHistoricalRecords.has(key)) {
      warnings.push(
        `Potential duplicate historical theme: ${record.theme}`
      );
    }

    duplicateHistoricalRecords.add(key);
  });

  return {
    initialized: true,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    lastRun: new Date().toISOString()
  };
}

/* =========================================================
   INITIALIZATION
========================================================= */

function initializeFormly() {
  console.info(`[Formly] Initializing ${FORMLY_VERSION}`);

  /*
   * Attach budget listeners without requiring inline HTML
   * event attributes.
   */

  [
    "ticketSlider",
    "outfitSlider",
    "foodSlider",
    "extrasSlider",
    "budgetLimit"
  ].forEach(id => {
    const element = getElement(id);

    if (element) {
      element.addEventListener("input", updateBudget);
      element.addEventListener("change", updateBudget);
    }
  });

  const advancedToggle = getElement("advancedModeToggle");

  if (advancedToggle) {
    advancedToggle.addEventListener("change", event => {
      setAdvancedMode(event.target.checked);
    });
  }

  const eventForm = getElement("adminEventForm");

  if (eventForm) {
    eventForm.addEventListener("submit", event => {
      event.preventDefault();
      saveEventFromAdminForm();
    });
  }

  const historicalThemeForm = getElement("historicalThemeForm");

  if (historicalThemeForm) {
    historicalThemeForm.addEventListener("submit", event => {
      event.preventDefault();

      if (saveHistoricalThemeFromForm()) {
        historicalThemeForm.reset();
      }
    });
  }

  const predictionTarget = getElement("predictionTargetEvent");

  if (predictionTarget) {
    predictionTarget.addEventListener(
      "change",
      renderPredictionResults
    );
  }

  const exportButton = getElement("exportFormlyData");

  if (exportButton) {
    exportButton.addEventListener("click", exportFormlyData);
  }

  const importInput = getElement("importFormlyData");

  if (importInput) {
    importInput.addEventListener("change", event => {
      importFormlyDataFromFile(event.target.files?.[0]);
      event.target.value = "";
    });
  }

  const diagnosticsButton = getElement("runDiagnostics");

  if (diagnosticsButton) {
    diagnosticsButton.addEventListener("click", runDiagnostics);
  }

  const predictionButton = getElement("runThemePrediction");

  if (predictionButton) {
    predictionButton.addEventListener(
      "click",
      renderPredictionResults
    );
  }

  updateBudget();
  refreshFormly();
  applyAdvancedMode();

  lastDiagnostics = runBasicDiagnostics();

  console.info("[Formly] Initialization complete.");
}

/*
 * Use addEventListener rather than replacing window.onload,
 * so this script does not overwrite another initializer.
 */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeFormly,
    { once: true }
  );
} else {
  initializeFormly();
}

