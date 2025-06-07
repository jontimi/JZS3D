// Constants for selectors
const viewer = document.getElementById('viewer');
const descElement = document.getElementById('desc');
const categoryDropdown = document.getElementById('category');
const modelDropdown = document.getElementById('model');
const langSwitchBtn = document.getElementById('langSwitch');
const nightSwitchBtn = document.getElementById('nightSwitch');
const variantSwitchBtn = document.getElementById('variantSwitch');
const resetViewBtn = document.getElementById('resetViewBtn');
const brightnessRange = document.getElementById('brightnessRange');
const contrastRange = document.getElementById('contrastRange');
const brightnessValSpan = document.getElementById('brightnessVal');
const contrastValSpan = document.getElementById('contrastVal');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const bgUploadInput = document.getElementById('bgUpload');
const clearBgButton = document.getElementById('clearBgBtn');
const viewerWrapper = document.getElementById('viewer-wrapper');
const viewerTitle = document.getElementById('title');
const labelCategory = document.getElementById('label-category');
const labelModel = document.getElementById('label-model');
const viewerLoadingOverlay = document.getElementById('viewerLoadingOverlay');

// --- Brightness and Contrast Controls ---
function updateFilters() {
  const bright = parseFloat(brightnessRange.value);
  const contrast = parseFloat(contrastRange.value);
  viewer.style.filter = `brightness(${bright}) contrast(${contrast})`;
  brightnessValSpan.textContent = bright.toFixed(2);
  contrastValSpan.textContent = contrast.toFixed(2);
}
brightnessRange.addEventListener('input', updateFilters);
contrastRange.addEventListener('input', updateFilters);
resetFiltersBtn.addEventListener('click', function() {
  brightnessRange.value = 1.0;
  contrastRange.value = 1.0;
  updateFilters();
});
viewer.addEventListener('load', updateFilters);

// --- Viewer Logic ---
function adjustViewerHeight() {
  const aspectRatio = 9 / 16;
  const width = viewerWrapper.offsetWidth;
  let height = width * aspectRatio;
  if (height < 220) height = 220;
  if (height > 600) height = 600;
  viewerWrapper.style.height = height + 'px';
}
window.addEventListener('resize', function() {
  if (!viewerWrapper.classList.contains('bg-has-img')) {
    adjustViewerHeight();
  }
});
window.addEventListener('DOMContentLoaded', adjustViewerHeight);

function setGentleZoomStep() {
  if (viewer && viewer.cameraControls) {
    viewer.cameraControls.dollyStep = 0.002;
    viewer.cameraControls.dollySpeed = 0.2;
  }
}
viewer.addEventListener('load', setGentleZoomStep);
function safeSetGentleZoomStep() { setTimeout(setGentleZoomStep, 100); }

resetViewBtn.onclick = function() {
  if (viewer) {
    viewer.resetTurntableRotation();
    viewer.jumpCameraToGoal();
  }
};

// Translations and support code (unchanged)
const translations = {
  en: {
    title: "3D Model Showcase",
    category: "Category:",
    model: "Model:",
    night: "🌙 Night Mode",
    light: "☀️ Light Mode",
    lang: "🇮🇱 עברית",
    switchTo: "Switch to",
    desc: (cat, model, variant) => `Category: ${cat} | Model: ${model}${variant ? ' (' + variant + ')' : ''}`,
    resetView: "🔄 Reset View"
  },
  he: {
    title: "תצוגת מודלים בתלת-ממד",
    category: "קטגוריה:",
    model: "מודל:",
    night: "🌙 מצב לילה",
    light: "☀️ מצב יום",
    lang: "🇬🇧 English",
    switchTo: "החלף ל",
    desc: (cat, model, variant) => `קטגוריה: ${cat} | מודל: ${model}${variant ? ' (' + variant + ')' : ''}`,
    resetView: "🔄 איפוס תצוגה"
  }
};
const categoryLabels = {
  "Cabinets": { en: "Cabinets", he: "ארונות" },
  "Lamps": { en: "Lamps", he: "מנורות" },
  "Sofas": { en: "Sofas", he: "ספות" },
  "Tables": { en: "Tables", he: "שולחנות" }
};
let lang = "en";
let modelsData = {};
let currentCategory = "";
let currentModelIndex = 0;
let currentVariantIndex = 0;

function prettyCategory(cat) {
  return (categoryLabels[cat] && categoryLabels[cat][lang]) ? categoryLabels[cat][lang] : cat;
}
function prettyModel(modelObj) {
  if (!modelObj) return "";
  return lang === "he" ? (modelObj.label_he || modelObj.label_en || modelObj.name) : (modelObj.label_en || modelObj.name);
}
function prettyVariant(variantObj) {
  if (!variantObj) return "";
  return lang === "he" ? (variantObj.label_he || variantObj.label) : (variantObj.label || variantObj.label_he);
}

function setLanguage(newLang) {
  lang = newLang;
  viewerTitle.textContent = translations[lang].title;
  labelCategory.textContent = translations[lang].category;
  labelModel.textContent = translations[lang].model;
  langSwitchBtn.textContent = translations[lang].lang;
  langSwitchBtn.setAttribute('aria-label',
    lang === "en" ? "Switch to Hebrew" : "Switch to English");
  const isNight = document.body.classList.contains('night');
  updateNightModeButtonText();
  resetViewBtn.textContent = translations[lang].resetView;
  renderCategoryDropdown();
  renderModelDropdown();
  updateViewer();
  document.body.dir = (lang === "he") ? "rtl" : "ltr";
}
function renderCategoryDropdown() {
  const cats = Object.keys(modelsData);
  categoryDropdown.innerHTML = '';
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = prettyCategory(cat);
    categoryDropdown.appendChild(opt);
  });
  categoryDropdown.value = currentCategory;
}
function renderModelDropdown() {
  if (!modelsData[currentCategory]) return;
  modelDropdown.innerHTML = '';
  modelsData[currentCategory].forEach((model, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = prettyModel(model);
    modelDropdown.appendChild(opt);
  });
  modelDropdown.selectedIndex = currentModelIndex;
}
function updateViewer() {
  const modelObj = modelsData[currentCategory][currentModelIndex];
  let modelFile = modelObj.file;
  let variantLabel = "";
  let hasValidVariants = false;
  let validVariants = [];
  if (modelObj.variants && Array.isArray(modelObj.variants)) {
    validVariants = modelObj.variants.filter(v => v.file);
    hasValidVariants = validVariants.length >= 2;
    if (hasValidVariants) {
      if (currentVariantIndex >= validVariants.length) currentVariantIndex = 0;
      const variantObj = validVariants[currentVariantIndex];
      modelFile = variantObj.file;
      variantLabel = prettyVariant(variantObj);
      variantSwitchBtn.style.display = '';
      const nextVariantObj = validVariants[(currentVariantIndex + 1) % validVariants.length];
      variantSwitchBtn.textContent = translations[lang].switchTo + ' ' + prettyVariant(nextVariantObj);
    } else {
      currentVariantIndex = 0;
      variantSwitchBtn.style.display = 'none';
    }
  } else {
    currentVariantIndex = 0;
    variantSwitchBtn.style.display = 'none';
  }
  showLoadingOverlay();
  viewer.src = modelFile;
  viewer.alt = prettyModel(modelObj);
  viewer.removeAttribute('min-camera-orbit');
  viewer.setAttribute('max-camera-orbit', 'auto auto 24m');
  viewer.removeAttribute('disable-pan');
  descElement.textContent = translations[lang].desc(
    prettyCategory(currentCategory),
    prettyModel(modelObj),
    variantLabel
  );
  safeSetGentleZoomStep();
  viewer.addEventListener('load', hideLoadingOverlay, { once: true });
}

langSwitchBtn.onclick = function() {
  setLanguage(lang === "en" ? "he" : "en");
  safeSetGentleZoomStep();
};
nightSwitchBtn.onclick = function() {
  document.body.classList.toggle('night');
  const isNight = document.body.classList.contains('night');
  localStorage.setItem(THEME_KEY, isNight ? 'night' : 'light');
  updateNightModeButtonText();
  safeSetGentleZoomStep();
};
categoryDropdown.addEventListener('change', function() {
  currentCategory = this.value;
  currentModelIndex = 0;
  currentVariantIndex = 0;
  renderModelDropdown();
  updateViewer();
  safeSetGentleZoomStep();
});
modelDropdown.addEventListener('change', function() {
  currentModelIndex = +this.value;
  currentVariantIndex = 0;
  updateViewer();
  safeSetGentleZoomStep();
});
variantSwitchBtn.onclick = function () {
  const modelObj = modelsData[currentCategory][currentModelIndex];
  if (!modelObj.variants || !Array.isArray(modelObj.variants)) return;
  const validVariants = modelObj.variants.filter(v => v.file);
  if (validVariants.length < 2) return;
  currentVariantIndex = (currentVariantIndex + 1) % validVariants.length;
  updateViewer();
  safeSetGentleZoomStep();
};

bgUploadInput.addEventListener('change', function(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      let viewportWidth = Math.min(window.innerWidth, 1200) * 0.85;
      if (window.innerWidth < 900) {
        viewportWidth = window.innerWidth * 0.99;
      }
      const aspect = img.height / img.width;
      let width = viewportWidth;
      let height = width * aspect;
      if (width < 250) width = 250;
      if (width > 1200) width = 1200;
      if (height < 220) height = 220;
      if (height > 600) height = 600;
      viewerWrapper.style.width = width + 'px';
      viewerWrapper.style.height = height + 'px';
      viewerWrapper.classList.add('bg-has-img');
      viewerWrapper.style.backgroundImage = `url('${e.target.result}')`;
      viewer.removeAttribute('min-camera-orbit');
      viewer.setAttribute('max-camera-orbit', 'auto auto 24m');
      viewer.removeAttribute('disable-pan');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

clearBgButton.onclick = function() {
  viewerWrapper.classList.remove('bg-has-img');
  viewerWrapper.style.backgroundImage = '';
  bgUploadInput.value = '';
  viewerWrapper.style.width = '';
  viewerWrapper.style.height = '';
  adjustViewerHeight();
  viewer.removeAttribute('min-camera-orbit');
  viewer.setAttribute('max-camera-orbit', 'auto auto 24m');
  viewer.removeAttribute('disable-pan');
};

viewer.addEventListener('model-visibility', function() {
  if (viewer) {
    viewer.resetTurntableRotation();
    viewer.jumpCameraToGoal();
  }
});

// --- Loading Overlay Functions ---
function showLoadingOverlay() {
  viewerLoadingOverlay.classList.add('visible');
}
function hideLoadingOverlay() {
  viewerLoadingOverlay.classList.remove('visible');
}

// --- Theme Persistence ---
const THEME_KEY = 'appTheme';
function loadThemePreference() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'night') {
    document.body.classList.add('night');
  } else {
    document.body.classList.remove('night');
  }
  updateNightModeButtonText();
}
function updateNightModeButtonText() {
  const isNight = document.body.classList.contains('night');
  nightSwitchBtn.textContent = isNight ? translations[lang].light : translations[lang].night;
  nightSwitchBtn.setAttribute('aria-label',
    isNight ? (lang === "en" ? "Switch to Light Mode" : "החלף למצב יום") :
               (lang === "en" ? "Switch to Night Mode" : "החלף למצב לילה"));
}

// --- Robust models.json loading ---
fetch('models.json')
  .then(response => {
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response.json();
  })
  .then(data => {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('models.json is empty or invalid.');
    }
    modelsData = data;
    currentCategory = Object.keys(modelsData)[0];
    currentModelIndex = 0;
    currentVariantIndex = 0;
    setLanguage(lang);
    adjustViewerHeight();
    safeSetGentleZoomStep();
    descElement.textContent = '';
    categoryDropdown.disabled = false;
    modelDropdown.disabled = false;
    hideLoadingOverlay();
    loadThemePreference();
  })
  .catch(err => {
    console.error(err);
    descElement.textContent = `Failed to load models.json: ${err.message}`;
    categoryDropdown.disabled = true;
    modelDropdown.disabled = true;
    hideLoadingOverlay();
  });
