// Main script for 3D Model Showcase

const modelViewer = document.getElementById('mainViewer');
const modelSelect = document.getElementById('modelSelect');
const arBtn = document.getElementById('arBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const filterPopupBtn = document.getElementById('filterPopupBtn');
const filterControls = document.getElementById('filterControls');
const closeFilterBtn = document.getElementById('closeFilterBtn');
const brightnessRange = document.getElementById('brightnessRange');
const contrastRange = document.getElementById('contrastRange');
const brightnessValue = document.getElementById('brightnessValue');
const contrastValue = document.getElementById('contrastValue');
const arDialog = document.getElementById('arDialog');
const closeArDialogBtn = document.getElementById('closeArDialogBtn');
const qrCanvas = document.getElementById('qrCanvas');
const loadingOverlay = document.getElementById('loadingOverlay');

let models = [];
let currentModel = null;
let defaultCameraOrbit = null;
let defaultFieldOfView = null;

function showLoading(show) {
  if (loadingOverlay) loadingOverlay.style.display = show ? 'flex' : 'none';
}

async function loadModels() {
  showLoading(true);
  try {
    const res = await fetch('models.json');
    models = await res.json();
    modelSelect.innerHTML = '';
    // Group by category
    const categories = {};
    models.forEach(m => {
      if (!categories[m.category]) categories[m.category] = [];
      categories[m.category].push(m);
    });
    Object.keys(categories).forEach(cat => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = cat;
      categories[cat].forEach((m, i) => {
        const opt = document.createElement('option');
        opt.value = models.indexOf(m);
        opt.textContent = m.label_en || m.name || `Model ${i+1}`;
        optgroup.appendChild(opt);
      });
      modelSelect.appendChild(optgroup);
    });
    if (models.length > 0) {
      modelSelect.selectedIndex = 0;
      loadModel(modelSelect.value);
    }
  } catch (e) {
    alert('Failed to load models.json');
  }
  showLoading(false);
}

function loadModel(idx) {
  // idx may be a string (from select.value), ensure it's a number
  idx = Number(idx);
  const m = models[idx];
  if (!m) return;
  currentModel = m;
  showLoading(true);
  // Remove any previous model-viewer errors
  modelViewer.removeAttribute('reveal');
  // Use correct property for model path
  modelViewer.src = m.file;
  if (m.iosPath) modelViewer.setAttribute('ios-src', m.iosPath);
  else modelViewer.removeAttribute('ios-src');
  modelViewer.alt = m.label_en || m.name || '3D model';
  // Reset filters
  setFilters(1, 1);
  // Reset camera
  setTimeout(() => {
    if (defaultCameraOrbit) modelViewer.cameraOrbit = defaultCameraOrbit;
    if (defaultFieldOfView) modelViewer.fieldOfView = defaultFieldOfView;
    showLoading(false);
  }, 300);
}

function setFilters(brightness, contrast) {
  modelViewer.style.filter = `brightness(${brightness}) contrast(${contrast})`;
  brightnessRange.value = brightness;
  contrastRange.value = contrast;
  brightnessValue.textContent = Number(brightness).toFixed(2);
  contrastValue.textContent = Number(contrast).toFixed(2);
}

modelSelect.addEventListener('change', e => {
  loadModel(e.target.value);
});

resetViewBtn.addEventListener('click', () => {
  if (defaultCameraOrbit) modelViewer.cameraOrbit = defaultCameraOrbit;
  if (defaultFieldOfView) modelViewer.fieldOfView = defaultFieldOfView;
});

filterPopupBtn.addEventListener('click', () => {
  filterControls.classList.toggle('visible');
});
closeFilterBtn.addEventListener('click', () => {
  filterControls.classList.remove('visible');
});

brightnessRange.addEventListener('input', () => {
  setFilters(brightnessRange.value, contrastRange.value);
});
contrastRange.addEventListener('input', () => {
  setFilters(brightnessRange.value, contrastRange.value);
});

// AR Button logic
arBtn.addEventListener('click', async () => {
  if (window.modelViewer && window.modelViewer.isARSupported) {
    const supported = await window.modelViewer.isARSupported();
    if (supported) {
      modelViewer.activateAR();
      return;
    }
  }
  // Show QR dialog if AR not supported
  showArDialog();
});

function showArDialog() {
  if (!currentModel) return;
  arDialog.style.display = 'flex';
  // Generate QR code for minimal viewer
  const url = `${window.location.origin}${window.location.pathname.replace(/index.html$/, '')}viewer.html?model=${encodeURIComponent(currentModel.file)}`;
  qrCanvas.width = 256; qrCanvas.height = 256;
  QRCode.toCanvas(qrCanvas, url, { width: 256, margin: 1 }, function (error) {
    if (error) console.error(error);
  });
}
closeArDialogBtn.addEventListener('click', () => {
  arDialog.style.display = 'none';
});

// Hide AR dialog on outside click
arDialog.addEventListener('click', e => {
  if (e.target === arDialog) arDialog.style.display = 'none';
});

// Save default camera settings after model loads
modelViewer.addEventListener('load', () => {
  if (!defaultCameraOrbit) defaultCameraOrbit = modelViewer.getCameraOrbit && modelViewer.getCameraOrbit();
  if (!defaultFieldOfView) defaultFieldOfView = modelViewer.fieldOfView;
  showLoading(false);
});

// Hide loading overlay on error
modelViewer.addEventListener('error', () => {
  showLoading(false);
  alert('Failed to load model.');
});

// Theme persistence (optional, can be removed if not needed)
(function() {
  const theme = localStorage.getItem('theme');
  if (theme === 'night') document.body.classList.add('night');
})();

// Initialize
window.addEventListener('DOMContentLoaded', loadModels);
