/* ==========================================================================
   Mir Movil Lab Service - main.js

   Three interactive features, each in its own set of functions:

     1. Coverage checker      (index.html)    - reads SERVICE_ZONES
     2. Service request builder (services.html) - reads SERVICES, writes localStorage
     3. Appointment form      (contact.html)  - validation + localStorage restore

   Data lives in two arrays (SERVICES, SERVICE_ZONES) and one configuration
   object (STORAGE_KEYS), so nothing is hard coded inside the functions.
   ========================================================================== */

"use strict";

/* ------------------------------------------------------------------ data -- */

/* ARRAY 1 - the service catalogue. Each entry is an object. */
var SERVICES = [
  { id: "routine-blood", name: "Routine blood draw",             category: "Routine",      price: 45,  minutes: 20 },
  { id: "specialty",     name: "Specialty lab panel",            category: "Specialty",    price: 85,  minutes: 30 },
  { id: "stat",          name: "STAT / urgent collection",       category: "Urgent",       price: 120, minutes: 45 },
  { id: "geriatric",     name: "Homebound and geriatric visit",  category: "In home care", price: 65,  minutes: 35 },
  { id: "pediatric",     name: "Pediatric collection",           category: "In home care", price: 70,  minutes: 30 },
  { id: "wellness",      name: "Corporate wellness event",       category: "Corporate",    price: 350, minutes: 180 }
];

/* ARRAY 2 - the service zones used by the coverage checker. */
var SERVICE_ZONES = [
  {
    id: "core",
    name: "Core Miami",
    fee: 0,
    eta: "same day, morning or evening",
    zips: ["33125","33126","33127","33128","33129","33130","33131","33132","33133",
           "33134","33135","33136","33137","33138","33139","33140","33142","33143",
           "33144","33145","33146","33149","33155","33156","33165","33166","33172",
           "33173","33174","33175","33176","33178","33182","33184","33186"]
  },
  {
    id: "dade",
    name: "Greater Miami-Dade",
    fee: 15,
    eta: "same day when booked before 2:00 PM",
    zips: ["33010","33012","33013","33014","33015","33016","33018","33023","33030",
           "33031","33032","33033","33034","33035","33054","33055","33056","33122",
           "33147","33150","33154","33157","33158","33160","33161","33162","33167",
           "33168","33169","33170","33177","33179","33180","33181","33183","33185",
           "33187","33189","33190","33193","33194","33196"]
  },
  {
    id: "broward",
    name: "Broward County",
    fee: 25,
    eta: "next business day",
    zips: ["33004","33009","33019","33020","33021","33024","33025","33026","33027",
           "33028","33060","33062","33063","33064","33065","33066","33067","33068",
           "33069","33071","33073","33076","33301","33304","33305","33306","33308",
           "33309","33311","33312","33313","33314","33315","33316","33317","33319",
           "33321","33322","33323","33324","33325","33326","33327","33328","33330",
           "33331","33332","33334","33351","33441","33442"]
  }
];

/* OBJECT - every localStorage key in one place so they cannot drift apart. */
var STORAGE_KEYS = {
  selectedServices: "mirmovil.selectedServices",
  lastInquiry: "mirmovil.lastInquiry"
};

/* -------------------------------------------------------------- helpers -- */

function money(amount) {
  return "$" + amount.toFixed(2);
}

function getServiceById(id) {
  for (var i = 0; i < SERVICES.length; i++) {
    if (SERVICES[i].id === id) {
      return SERVICES[i];
    }
  }
  return null;
}

/* localStorage can throw in private browsing, so every access is guarded. */
function readStorage(key, fallback) {
  try {
    var raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
}

/* ============================================ FEATURE 1: coverage checker == */

function findZoneByZip(zip) {
  for (var i = 0; i < SERVICE_ZONES.length; i++) {
    if (SERVICE_ZONES[i].zips.indexOf(zip) !== -1) {
      return SERVICE_ZONES[i];
    }
  }
  return null;
}

function renderCoverageResult(resultBox, zip, zone) {
  if (zone === null) {
    resultBox.classList.add("is-negative");
    resultBox.innerHTML =
      "<strong>We do not currently schedule visits in " + zip + ".</strong> " +
      "We cover Miami-Dade and Broward County. Call (305) 555-0142 and we will " +
      "refer you to a partner collection site nearby.";
    return;
  }

  var feeText = zone.fee === 0
    ? "no travel fee"
    : "a " + money(zone.fee) + " travel fee";

  resultBox.classList.remove("is-negative");
  resultBox.innerHTML =
    "<strong>Good news, " + zip + " is in our " + zone.name + " zone.</strong> " +
    "Visits to this ZIP carry " + feeText + " and are usually scheduled " +
    zone.eta + ".";
}

function initCoverageChecker() {
  var form = document.getElementById("coverage-form");
  var input = document.getElementById("zip-input");
  var resultBox = document.getElementById("coverage-result");

  if (!form || !input || !resultBox) {
    return;                       // not on this page
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var zip = input.value.trim();

    if (!/^[0-9]{5}$/.test(zip)) {
      resultBox.classList.add("is-negative");
      resultBox.textContent = "Please enter a five digit ZIP code, for example 33131.";
      return;
    }

    renderCoverageResult(resultBox, zip, findZoneByZip(zip));
  });
}

/* ====================================== FEATURE 2: service request builder == */

function getSelectedServices() {
  var saved = readStorage(STORAGE_KEYS.selectedServices, []);
  return Array.isArray(saved) ? saved : [];
}

function renderQuote() {
  var summary = document.getElementById("quote-summary");
  var list = document.getElementById("quote-list");
  var totalBox = document.getElementById("quote-total");

  if (!summary || !list || !totalBox) {
    return;
  }

  var selected = getSelectedServices();
  list.innerHTML = "";

  if (selected.length === 0) {
    summary.textContent = "No services selected yet.";
    totalBox.hidden = true;
    return;
  }

  var total = 0;
  var minutes = 0;

  for (var i = 0; i < selected.length; i++) {
    var service = getServiceById(selected[i]);
    if (service === null) {
      continue;
    }
    total += service.price;
    minutes += service.minutes;

    var item = document.createElement("li");
    item.innerHTML = "<span>" + service.name + "</span>" +
                     "<span class=\"qty\">" + money(service.price) + "</span>";
    list.appendChild(item);
  }

  summary.textContent = "Showing " + selected.length +
    (selected.length === 1 ? " selected service." : " selected services.");

  totalBox.hidden = false;
  totalBox.textContent = "Estimated total " + money(total) +
    " for about " + Math.round(minutes / 5) * 5 + " minutes on site.";
}

function updateCardState(card, isSelected) {
  var button = card.querySelector(".service-toggle");
  card.classList.toggle("is-selected", isSelected);

  if (button) {
    button.textContent = isSelected ? "Remove from my request" : "Add to my request";
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    button.classList.toggle("btn-primary", !isSelected);
    button.classList.toggle("btn-ghost", isSelected);
  }
}

function toggleService(id, card) {
  var selected = getSelectedServices();
  var index = selected.indexOf(id);

  if (index === -1) {
    selected.push(id);
  } else {
    selected.splice(index, 1);
  }

  writeStorage(STORAGE_KEYS.selectedServices, selected);
  updateCardState(card, selected.indexOf(id) !== -1);
  renderQuote();
}

function buildToggleButton(card, id) {
  var button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-primary service-toggle";
  button.textContent = "Add to my request";
  button.setAttribute("aria-pressed", "false");

  button.addEventListener("click", function () {
    toggleService(id, card);
  });

  card.appendChild(button);
  return button;
}

function initServicesPage() {
  var grid = document.getElementById("service-grid");
  if (!grid) {
    return;                       // not on this page
  }

  var cards = grid.querySelectorAll(".service-card");
  var selected = getSelectedServices();

  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var id = card.getAttribute("data-service-id");
    buildToggleButton(card, id);
    updateCardState(card, selected.indexOf(id) !== -1);
  }

  renderQuote();

  var clearButton = document.getElementById("quote-clear");
  if (clearButton) {
    clearButton.addEventListener("click", function () {
      writeStorage(STORAGE_KEYS.selectedServices, []);
      for (var j = 0; j < cards.length; j++) {
        updateCardState(cards[j], false);
      }
      renderQuote();
    });
  }
}

/* ============================================= FEATURE 3: appointment form == */

function setError(fieldId, message) {
  var input = document.getElementById(fieldId);
  var errorBox = document.getElementById("err-" + fieldId);
  if (!input || !errorBox) {
    return;
  }
  input.closest(".field").classList.add("has-error");
  input.setAttribute("aria-invalid", "true");
  errorBox.textContent = message;
}

function clearError(fieldId) {
  var input = document.getElementById(fieldId);
  var errorBox = document.getElementById("err-" + fieldId);
  if (!input || !errorBox) {
    return;
  }
  input.closest(".field").classList.remove("has-error");
  input.removeAttribute("aria-invalid");
  errorBox.textContent = "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value);
}

function isValidPhone(value) {
  return /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/.test(value);
}

function isValidZip(value) {
  return /^[0-9]{5}$/.test(value);
}

function isTodayOrLater(value) {
  if (!value) {
    return false;
  }
  var parts = value.split("-");
  var chosen = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  return chosen >= today;
}

/* Runs all six checks, marks every failing field, and returns the id of the
   first one so focus can be moved there. Returns null when everything passes. */
function validateForm() {
  var firstBad = null;

  function fail(fieldId, message) {
    setError(fieldId, message);
    if (firstBad === null) {
      firstBad = fieldId;
    }
  }

  var name = document.getElementById("full-name").value.trim();
  var email = document.getElementById("email").value.trim();
  var phone = document.getElementById("phone").value.trim();
  var zip = document.getElementById("zip").value.trim();
  var service = document.getElementById("service-type").value;
  var date = document.getElementById("preferred-date").value;

  ["full-name", "email", "phone", "zip", "service-type", "preferred-date"]
    .forEach(clearError);

  /* Check 1 - name present and long enough to be a real name. */
  if (name.length < 2) {
    fail("full-name", "Please enter your full name as it appears on your ID.");
  }

  /* Check 2 - email has a local part, an @ sign and a domain. */
  if (!isValidEmail(email)) {
    fail("email", "Please enter a valid email address, for example name@example.com.");
  }

  /* Check 3 - phone matches the exact 305-555-0199 pattern. */
  if (!isValidPhone(phone)) {
    fail("phone", "Please enter your phone number as 305-555-0199.");
  }

  /* Check 4 - ZIP is five digits and inside a zone we actually serve. */
  if (!isValidZip(zip)) {
    fail("zip", "Please enter the five digit ZIP code of the service address.");
  } else if (findZoneByZip(zip) === null) {
    fail("zip", "We do not schedule visits in " + zip + " yet. Please call (305) 555-0142.");
  }

  /* Check 5 - a service was chosen from the list. */
  if (service === "") {
    fail("service-type", "Please choose the service you need.");
  }

  /* Check 6 - the appointment date is today or later, never in the past. */
  if (!isTodayOrLater(date)) {
    fail("preferred-date", "Please choose today or a later date for your visit.");
  }

  return firstBad;
}

function collectFormData() {
  return {
    fullName: document.getElementById("full-name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    zip: document.getElementById("zip").value.trim(),
    service: document.getElementById("service-type").value,
    date: document.getElementById("preferred-date").value,
    notes: document.getElementById("notes").value.trim(),
    savedAt: new Date().toISOString()
  };
}

function fillField(fieldId, value) {
  var input = document.getElementById(fieldId);
  if (input && value) {
    input.value = value;
  }
}

/* Reads back the last saved inquiry, plus anything picked on the services
   page, so a returning visitor does not retype what they already entered. */
function restoreInquiry() {
  var notice = document.getElementById("restore-notice");
  var messages = [];

  var saved = readStorage(STORAGE_KEYS.lastInquiry, null);
  if (saved && typeof saved === "object") {
    fillField("full-name", saved.fullName);
    fillField("email", saved.email);
    fillField("phone", saved.phone);
    fillField("zip", saved.zip);
    fillField("service-type", saved.service);
    fillField("preferred-date", saved.date);
    fillField("notes", saved.notes);

    if (saved.fullName) {
      messages.push("Welcome back, " + saved.fullName + ". We restored the details you sent us last time.");
    }
  }

  var selected = getSelectedServices();
  if (selected.length > 0) {
    var first = getServiceById(selected[0]);
    if (first !== null) {
      fillField("service-type", first.id);
      messages.push("We carried over " + selected.length +
        (selected.length === 1 ? " service" : " services") +
        " from the Services page, starting with " + first.name + ".");
    }
  }

  if (notice && messages.length > 0) {
    notice.hidden = false;
    notice.textContent = messages.join(" ");
  }
}

function initContactForm() {
  var form = document.getElementById("appointment-form");
  if (!form) {
    return;                       // not on this page
  }

  restoreInquiry();

  form.addEventListener("submit", function (event) {
    event.preventDefault();       // nothing is sent until validation passes

    var status = document.getElementById("form-status");
    var firstBad = validateForm();

    if (firstBad !== null) {
      status.classList.add("is-negative");
      status.textContent = "Your request was not sent. Please correct the highlighted fields below.";
      document.getElementById(firstBad).focus();
      return;
    }

    var data = collectFormData();
    writeStorage(STORAGE_KEYS.lastInquiry, data);

    status.classList.remove("is-negative");
    status.textContent = "Thank you, " + data.fullName +
      ". Your request for " + data.date + " has been received. " +
      "We will confirm by phone at " + data.phone + " within one business day.";
  });

  /* Clear a field's error as soon as the visitor starts fixing it. */
  ["full-name", "email", "phone", "zip", "service-type", "preferred-date"]
    .forEach(function (fieldId) {
      var input = document.getElementById(fieldId);
      if (input) {
        input.addEventListener("input", function () {
          clearError(fieldId);
        });
      }
    });
}

/* ----------------------------------------------------------------- boot -- */

document.addEventListener("DOMContentLoaded", function () {
  initCoverageChecker();
  initServicesPage();
  initContactForm();
});
