"use strict";

/* ==========================================================
   North Star Bakery - Interactivity and Client-Side Data

   1. Pre-order list (products.html): visitors add items to a
      list, and the list is saved in localStorage.
   2. Contact form (contact.html): the saved list pre-fills the
      form, and JavaScript validates the entries.
   ========================================================== */

/* ---------- Data ---------- */

// Array of objects: every item the bakery sells.
const catalog = [
  { id: "country-sourdough", name: "Country Sourdough", category: "Bread" },
  { id: "honey-oat-loaf", name: "Honey Oat Sandwich Loaf", category: "Bread" },
  { id: "rosemary-focaccia", name: "Rosemary Focaccia", category: "Bread" },
  { id: "butter-croissant", name: "Butter Croissant", category: "Pastry" },
  { id: "cinnamon-morning-bun", name: "Cinnamon Morning Bun", category: "Pastry" },
  { id: "seasonal-fruit-danish", name: "Seasonal Fruit Danish", category: "Pastry" },
  { id: "chocolate-chip-cookie", name: "Chocolate Chip Cookie", category: "Pastry" },
  { id: "classic-celebration-cake", name: "Classic Celebration Cake", category: "Cake" },
  { id: "lemon-blueberry-cake", name: "Lemon Blueberry Cake", category: "Cake" }
];

// Object: settings and the localStorage key.
const settings = {
  storageKey: "northStarPreorderList",
  minDaysNotice: 2,
  closedDay: 1 // Monday (Sunday is 0)
};

// Object: every validation message in one place.
const messages = {
  nameRequired: "Please enter your name (at least 2 characters).",
  emailRequired: "Please enter your email address.",
  emailInvalid: "Enter a valid email address, like name@example.com.",
  phoneInvalid: "Enter your phone number like 218-555-0176, or leave it blank.",
  typeRequired: "Please choose a request type.",
  dateRequired: "Choose a pickup date for your pre-order.",
  dateTooSoon: "Pre-orders need at least 2 days of notice. Please choose a later date.",
  dateClosed: "We are closed on Mondays. Please choose another day.",
  detailsRequired: "Please tell us what you would like or what you want to ask.",
  detailsShort: "Please add a little more detail (at least 10 characters).",
  detailsLong: "Please keep this under 500 characters.",
  allergiesLong: "Please keep allergy notes under 300 characters."
};

// Array of ids: the items the visitor has saved (loaded from localStorage).
let savedIds = [];

/* ---------- Browser storage ---------- */

function loadSavedIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(settings.storageKey));
    if (Array.isArray(stored)) {
      // Keep only ids that still exist in the catalog.
      return stored.filter(function (id) {
        return getItemById(id) !== undefined;
      });
    }
  } catch (error) {
    // Storage blocked or data damaged: start with an empty list.
  }
  return [];
}

function storeSavedIds() {
  try {
    localStorage.setItem(settings.storageKey, JSON.stringify(savedIds));
  } catch (error) {
    // Storage is unavailable; the list still works until the page closes.
  }
}

/* ---------- Pre-order list logic ---------- */

function getItemById(id) {
  return catalog.find(function (item) {
    return item.id === id;
  });
}

function isSaved(id) {
  return savedIds.includes(id);
}

function toggleItem(id) {
  if (isSaved(id)) {
    savedIds = savedIds.filter(function (savedId) {
      return savedId !== id;
    });
  } else {
    savedIds.push(id);
  }
  storeSavedIds();
  updateProductsPage();
}

function clearList() {
  savedIds = [];
  storeSavedIds();
  updateProductsPage();
}

/* ---------- Pre-order list display (products.html) ---------- */

function updateSaveButtons() {
  document.querySelectorAll(".save-btn").forEach(function (button) {
    const saved = isSaved(button.dataset.id);
    const item = getItemById(button.dataset.id);
    button.setAttribute("aria-pressed", String(saved));
    button.textContent = saved ? "Added to list (remove)" : "Add to pre-order list";
    if (item) {
      button.setAttribute(
        "aria-label",
        (saved ? "Remove " : "Add ") + item.name + (saved ? " from" : " to") + " pre-order list"
      );
    }
  });
}

function renderList() {
  const listElement = document.getElementById("saved-list");
  const statusElement = document.getElementById("list-status");
  const actionsElement = document.getElementById("list-actions");

  listElement.innerHTML = "";

  savedIds.forEach(function (id) {
    const item = getItemById(id);
    const listItem = document.createElement("li");
    const label = document.createElement("span");
    const removeButton = document.createElement("button");

    label.textContent = item.name + " (" + item.category + ")";
    removeButton.type = "button";
    removeButton.className = "small-btn";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", "Remove " + item.name + " from pre-order list");
    removeButton.addEventListener("click", function () {
      toggleItem(id);
    });

    listItem.append(label, removeButton);
    listElement.appendChild(listItem);
  });

  if (savedIds.length === 0) {
    statusElement.textContent =
      'Your list is empty. Choose "Add to pre-order list" on any item below.';
    actionsElement.hidden = true;
  } else {
    statusElement.textContent =
      savedIds.length + (savedIds.length === 1 ? " item" : " items") +
      " saved. Your list stays here when you leave or refresh the page.";
    actionsElement.hidden = false;
  }
}

function updateProductsPage() {
  if (!document.getElementById("saved-list")) {
    return; // not on the products page
  }
  updateSaveButtons();
  renderList();
}

function initProductsPage() {
  document.querySelectorAll(".save-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      toggleItem(button.dataset.id);
    });
  });
  document.getElementById("clear-list").addEventListener("click", clearList);
  updateProductsPage();
}

/* ---------- Contact form: pre-fill from saved list ---------- */

function getSavedNames() {
  return savedIds.map(function (id) {
    return getItemById(id).name;
  });
}

function prefillContactForm() {
  if (savedIds.length === 0) {
    return;
  }
  const details = document.getElementById("details");
  const note = document.getElementById("prefill-note");

  if (details.value.trim() === "") {
    details.value = "I would like to pre-order: " + getSavedNames().join(", ") + ".";
    document.getElementById("type-preorder").checked = true;
  }
  note.textContent =
    "We filled in the items from your pre-order list. You can edit them below.";
  note.hidden = false;
}

/* ---------- Contact form: validation ---------- */

function getFieldValue(id) {
  return document.getElementById(id).value.trim();
}

function parseDate(value) {
  const parts = value.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function daysFromToday(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date - today) / 86400000);
}

function validateName(value) {
  return value.length >= 2 ? "" : messages.nameRequired;
}

function validateEmail(value) {
  if (value === "") {
    return messages.emailRequired;
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailPattern.test(value) ? "" : messages.emailInvalid;
}

function validatePhone(value) {
  if (value === "") {
    return ""; // optional field
  }
  return /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/.test(value) ? "" : messages.phoneInvalid;
}

function validateRequestType() {
  const chosen = document.querySelector('input[name="request-type"]:checked');
  return chosen ? "" : messages.typeRequired;
}

function validatePickupDate(value) {
  const chosen = document.querySelector('input[name="request-type"]:checked');
  if (!chosen || chosen.value !== "pre-order") {
    return ""; // the date only matters for pre-orders
  }
  if (value === "") {
    return messages.dateRequired;
  }
  const date = parseDate(value);
  if (daysFromToday(date) < settings.minDaysNotice) {
    return messages.dateTooSoon;
  }
  if (date.getDay() === settings.closedDay) {
    return messages.dateClosed;
  }
  return "";
}

function validateDetails(value) {
  if (value === "") {
    return messages.detailsRequired;
  }
  if (value.length < 10) {
    return messages.detailsShort;
  }
  return value.length > 500 ? messages.detailsLong : "";
}

function validateAllergies(value) {
  return value.length > 300 ? messages.allergiesLong : "";
}

// Returns an object that maps each field id to its error message ("" = valid).
function validateForm() {
  return {
    name: validateName(getFieldValue("name")),
    email: validateEmail(getFieldValue("email")),
    phone: validatePhone(getFieldValue("phone")),
    type: validateRequestType(),
    "pickup-date": validatePickupDate(getFieldValue("pickup-date")),
    details: validateDetails(getFieldValue("details")),
    allergies: validateAllergies(getFieldValue("allergies"))
  };
}

/* ---------- Contact form: feedback near each field ---------- */

function showError(fieldId, message) {
  const errorElement = document.getElementById(fieldId + "-error");
  const field = document.getElementById(fieldId);
  errorElement.textContent = message;
  if (field) {
    field.classList.toggle("field-invalid", message !== "");
    field.setAttribute("aria-invalid", String(message !== ""));
  }
}

function showAllErrors(errors) {
  Object.keys(errors).forEach(function (fieldId) {
    showError(fieldId, errors[fieldId]);
  });
}

function firstInvalidFieldId(errors) {
  const order = ["name", "email", "phone", "type", "pickup-date", "details", "allergies"];
  return order.find(function (fieldId) {
    return errors[fieldId] !== "";
  });
}

function focusField(fieldId) {
  const target =
    fieldId === "type" ? document.getElementById("type-preorder") : document.getElementById(fieldId);
  target.focus();
}

function showSuccess(name) {
  const status = document.getElementById("form-status");
  status.textContent =
    "Thank you, " + name + "! Your request has been received. " +
    "We will reply by email to confirm the details.";
  status.hidden = false;
  status.focus();
}

function handleSubmit(event) {
  // Always stop the browser's own submit so we can check the entries first.
  event.preventDefault();
  const errors = validateForm();
  showAllErrors(errors);

  const firstInvalid = firstInvalidFieldId(errors);
  if (firstInvalid) {
    document.getElementById("form-status").hidden = true;
    focusField(firstInvalid);
    return; // entries stay in the form so the user can fix them
  }

  const name = getFieldValue("name");
  event.target.reset(); // clears the form (and any old messages)
  clearList(); // the saved items were just requested
  document.getElementById("prefill-note").hidden = true;
  showSuccess(name);
}

function clearErrorOnInput(event) {
  const id = event.target.id;
  if (event.target.name === "request-type") {
    showError("type", "");
    showError("pickup-date", "");
  } else if (document.getElementById(id + "-error")) {
    showError(id, "");
  }
}

function initContactPage() {
  const form = document.getElementById("contact-form");
  prefillContactForm();
  form.addEventListener("submit", handleSubmit);
  form.addEventListener("input", clearErrorOnInput);
  form.addEventListener("change", clearErrorOnInput);
  form.addEventListener("reset", function () {
    showAllErrors({
      name: "", email: "", phone: "", type: "",
      "pickup-date": "", details: "", allergies: ""
    });
    document.getElementById("form-status").hidden = true;
  });
}

/* ---------- Start ---------- */

function init() {
  savedIds = loadSavedIds();
  if (document.getElementById("saved-list")) {
    initProductsPage();
  }
  if (document.getElementById("contact-form")) {
    initContactPage();
  }
}

document.addEventListener("DOMContentLoaded", init);
