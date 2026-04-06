/* ==============================
   BRINGO.PK — APP.JS
   ============================== */

// ── CONFIGURATION ──────────────────────────────────────────────────
// IMPORTANT: Replace this with your actual Google Apps Script Web App URL
// See SETUP_GUIDE.md for instructions on how to get this URL
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyPA7ZbzPynL-PHibLZLAFue_FOtbmf3UNBXloKZXIJ-l3Ge3jGel3GX5MuIFWJDVyE/exec";

// ── NAVBAR SCROLL EFFECT ────────────────────────────────────────────
window.addEventListener("scroll", () => {
  const nav = document.getElementById("navbar");
  if (window.scrollY > 20) {
    nav.classList.add("scrolled");
  } else {
    nav.classList.remove("scrolled");
  }
});

// ── SCROLL REVEAL ANIMATION ─────────────────────────────────────────
function initReveal() {
  const els = document.querySelectorAll(
    ".step-card, .cat-card, .form-wrapper, .hero-card, .trust-item"
  );
  els.forEach(el => el.classList.add("reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("visible"), i * 80);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

// ── FILE UPLOAD PREVIEW ─────────────────────────────────────────────
function initFileUpload() {
  const fileInput = document.getElementById("c_image");
  const preview = document.getElementById("filePreview");
  const dropzone = document.getElementById("fileDrop");

  if (!fileInput) return;

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showFieldError(fileInput, "Please upload a valid image file (JPG, PNG).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showFieldError(fileInput, "File too large. Max 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      preview.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;justify-content:center;">
          <img src="${ev.target.result}" alt="Preview" style="max-height:70px;border-radius:8px;"/>
          <div style="text-align:left">
            <div style="font-size:0.8rem;font-weight:600;color:#FFD700">${file.name}</div>
            <div style="font-size:0.72rem;opacity:0.6">${(file.size/1024).toFixed(0)} KB</div>
          </div>
        </div>`;
      preview.removeAttribute("hidden");
      document.querySelector(".file-drop-inner").style.display = "none";
    };
    reader.readAsDataURL(file);
  });

  // Drag & drop highlight
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "#FFD700";
  });
  dropzone.addEventListener("dragleave", () => {
    dropzone.style.borderColor = "";
  });
  dropzone.addEventListener("drop", () => {
    dropzone.style.borderColor = "";
  });
}

// ── VALIDATION HELPERS ──────────────────────────────────────────────
function showFieldError(input, message) {
  input.classList.add("error");
  let err = input.parentElement.querySelector(".field-error");
  if (!err) {
    err = document.createElement("span");
    err.className = "field-error";
    err.style.cssText = "color:#ef4444;font-size:0.75rem;margin-top:2px;";
    input.parentElement.appendChild(err);
  }
  err.textContent = message || "This field is required.";
}

function clearFieldError(input) {
  input.classList.remove("error");
  const err = input.parentElement.querySelector(".field-error");
  if (err) err.remove();
}

function validateField(field) {
  const val = field.value.trim();
  if (field.hasAttribute("required") && !val) {
    showFieldError(field, "This field is required.");
    return false;
  }
  if (field.type === "tel" && val) {
    const clean = val.replace(/[\s\-]/g, "");
    if (!/^(\+92|0)3\d{9}$/.test(clean)) {
      showFieldError(field, "Enter a valid Pakistani phone number (03XX-XXXXXXX).");
      return false;
    }
  }
  if (field.type === "number" && val && parseInt(val) < 1) {
    showFieldError(field, "Quantity must be at least 1.");
    return false;
  }
  clearFieldError(field);
  return true;
}

function validateForm(formId) {
  const form = document.getElementById(formId);
  const fields = form.querySelectorAll("input, textarea, select");
  let valid = true;
  fields.forEach(field => {
    if (!validateField(field)) valid = false;
  });
  if (!valid) {
    const firstError = form.querySelector(".error");
    if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return valid;
}

// Real-time validation
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("input, textarea, select").forEach(field => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.classList.contains("error")) validateField(field);
    });
  });
});

// ── BUTTON STATE HELPERS ────────────────────────────────────────────
function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  const text = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".btn-spinner");
  btn.disabled = loading;
  if (loading) {
    text.style.opacity = "0.5";
    spinner.removeAttribute("hidden");
  } else {
    text.style.opacity = "1";
    spinner.setAttribute("hidden", "");
  }
}

// ── IMAGE TO BASE64 ─────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── GROCERY FORM SUBMIT ─────────────────────────────────────────────
document.getElementById("groceryOrderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateForm("groceryOrderForm")) return;

  setLoading("grocerySubmitBtn", true);

  const form = e.target;
  const data = {
    type: "grocery",
    timestamp: new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
    items: form.items.value.trim(),
    weight: form.weight.value.trim() || "Not specified",
    quantity: form.quantity.value.trim(),
    fullName: form.fullName.value.trim(),
    phone: form.phone.value.trim(),
    address: form.address.value.trim(),
  };

  try {
    await submitToGoogleSheets(data);
    showSuccess("grocery");
  } catch (err) {
    console.error("Submission error:", err);
    showError("grocery");
  } finally {
    setLoading("grocerySubmitBtn", false);
  }
});

// ── CLOTHING FORM SUBMIT ────────────────────────────────────────────
document.getElementById("clothingOrderForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateForm("clothingOrderForm")) return;

  setLoading("clothingSubmitBtn", true);

  const form = e.target;
  const imageFile = form.image.files[0];
  const imageBase64 = await fileToBase64(imageFile);

  const data = {
    type: "clothing",
    timestamp: new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" }),
    brand: form.brand.value.trim(),
    productCode: form.productCode.value.trim(),
    color: form.color.value.trim(),
    size: form.size.value,
    quantity: form.quantity.value.trim(),
    imageName: imageFile ? imageFile.name : "No image",
    imageData: imageBase64 || null,
    fullName: form.fullName.value.trim(),
    phone: form.phone.value.trim(),
    address: form.address.value.trim(),
  };

  try {
    await submitToGoogleSheets(data);
    showSuccess("clothing");
  } catch (err) {
    console.error("Submission error:", err);
    showError("clothing");
  } finally {
    setLoading("clothingSubmitBtn", false);
  }
});

// ── GOOGLE SHEETS SUBMISSION ────────────────────────────────────────
async function submitToGoogleSheets(data) {
  // If URL not configured, simulate success for testing
  if (GOOGLE_SCRIPT_URL.includes("YOUR_SCRIPT_ID_HERE")) {
    console.warn("⚠️ Google Sheets URL not configured. Simulating submission.");
    console.log("Order data:", data);
    await new Promise(r => setTimeout(r, 1500)); // simulate delay
    return { success: true };
  }

  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors", // Google Apps Script requires no-cors
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  // no-cors means we can't read the response body,
  // but if fetch didn't throw, the request was sent.
  return { success: true };
}

// ── SHOW SUCCESS/ERROR ──────────────────────────────────────────────
function showSuccess(type) {
  const formId = type === "grocery" ? "groceryOrderForm" : "clothingOrderForm";
  const successId = type === "grocery" ? "grocerySuccess" : "clothingSuccess";
  const errorId = type === "grocery" ? "groceryError" : "clothingError";

  document.getElementById(formId).setAttribute("hidden", "");
  document.getElementById(errorId).setAttribute("hidden", "");
  document.getElementById(successId).removeAttribute("hidden");

  document.getElementById(successId).scrollIntoView({ behavior: "smooth", block: "center" });
}

function showError(type) {
  const errorId = type === "grocery" ? "groceryError" : "clothingError";
  document.getElementById(errorId).removeAttribute("hidden");
  document.getElementById(errorId).scrollIntoView({ behavior: "smooth", block: "center" });
}

// ── RESET FORM ──────────────────────────────────────────────────────
function resetForm(type) {
  const formId = type === "grocery" ? "groceryOrderForm" : "clothingOrderForm";
  const successId = type === "grocery" ? "grocerySuccess" : "clothingSuccess";

  document.getElementById(formId).reset();
  document.getElementById(formId).removeAttribute("hidden");
  document.getElementById(successId).setAttribute("hidden", "");

  // Reset file preview
  if (type === "clothing") {
    document.getElementById("filePreview").setAttribute("hidden", "");
    const inner = document.querySelector(".file-drop-inner");
    if (inner) inner.style.display = "";
  }

  document.getElementById(formId).scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── WHATSAPP POPUP DISMISS ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("waPopup");
  if (popup) {
    setTimeout(() => {
      popup.style.transition = "opacity 0.5s ease";
      popup.style.opacity = "0";
      setTimeout(() => popup.style.display = "none", 500);
    }, 5000);

    // Show popup again on hover
    const btn = document.getElementById("waBtn");
    btn.addEventListener("mouseenter", () => {
      popup.style.display = "block";
      popup.style.opacity = "1";
    });
    btn.addEventListener("mouseleave", () => {
      popup.style.opacity = "0";
      setTimeout(() => popup.style.display = "none", 500);
    });
  }

  initReveal();
  initFileUpload();
});

// ── SMOOTH ANCHOR SCROLLING WITH OFFSET ────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", (e) => {
    const targetId = anchor.getAttribute("href");
    if (targetId === "#") return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  });
});
