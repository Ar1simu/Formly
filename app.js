function showPage(pageId) {
  const pages = document.querySelectorAll(".page");

  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
}

/* BUDGET */
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
    total <= 150 ? "Low Range" :
    total <= 300 ? "Standard Range" :
    total <= 600 ? "High Range" :
    "Luxury Range";

  document.getElementById("budgetRange").innerText = range;
}

/* OUTFIT INFO */
function toggleInfo(id) {
  document.getElementById(id).classList.toggle("hidden");
}

/* PREDICTION SYSTEM */
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

/* INIT */
window.onload = function () {
  updateBudget();

  document.getElementById("predictionText").innerText = getPrediction();
  document.getElementById("fallFormal").innerText = "Predicted: ~Fall season window";
  document.getElementById("prom").innerText = "Predicted: Spring season window";
};