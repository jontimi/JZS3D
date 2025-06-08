document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const modelSelect = document.getElementById('modelSelect');
    const mainViewer = document.getElementById('mainViewer');
    const filterPopupBtn = document.getElementById('filterPopupBtn');
    const filterControls = document.getElementById('filterControls');
    const brightnessRange = document.getElementById('brightnessRange');
    const brightnessValue = document.getElementById('brightnessValue');
    const contrastRange = document.getElementById('contrastRange');
    const contrastValue = document.getElementById('contrastValue');
    const closeFilterBtn = document.getElementById('closeFilterBtn');
    const arBtn = document.getElementById('arBtn');
    const resetViewBtn = document.getElementById('resetViewBtn');
    const arDialog = document.getElementById('arDialog');
    const qrCanvas = document.getElementById('qrCanvas');
    const closeArDialogBtn = document.getElementById('closeArDialogBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const nightModeToggle = document.getElementById('nightModeToggle');

    let modelsData = [];
    const LOCAL_STORAGE_THEME_KEY = 'jzs-3d-showcase-theme';

    // --- Helper Functions ---

    function applyTheme(theme) {
        if (theme === 'night') {
            document.body.classList.add('night');
            nightModeToggle.textContent = 'Toggle Light Mode';
        } else {
            document.body.classList.remove('night');
            nightModeToggle.textContent = 'Toggle Night Mode';
        }
    }

    function toggleTheme() {
        const currentTheme = document.body.classList.contains('night') ? 'night' : 'light';
        const newTheme = currentTheme === 'night' ? 'light' : 'night';
        localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme);
        applyTheme(newTheme);
    }

    function showLoadingOverlay() {
        const mvProgressBar = mainViewer.shadowRoot ? mainViewer.shadowRoot.querySelector('.loading-overlay') : null;

        if (mvProgressBar) {
            mvProgressBar.style.display = 'flex';
            mvProgressBar.style.opacity = '1';
        } else if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            loadingOverlay.style.opacity = '1';
        }
        mainViewer.classList.add('is-loading');
    }

    function hideLoadingOverlay() {
        const mvProgressBar = mainViewer.shadowRoot ? mainViewer.shadowRoot.querySelector('.loading-overlay') : null;

        if (mvProgressBar) {
            mvProgressBar.style.opacity = '0';
            setTimeout(() => {
                mvProgressBar.style.display = 'none';
            }, 300);
        } else if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 300);
        }
        mainViewer.classList.remove('is-loading');
    }


    // --- Load Models Data ---
    async function loadModelsData() {
        showLoadingOverlay();
        try {
            const response = await fetch('models.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            modelsData = await response.json();
            populateModelSelect();
            if (modelsData.length > 0) {
                modelSelect.value = 0;
            } else {
                console.warn('No models found in models.json');
            }
            hideLoadingOverlay();
        } catch (error) {
            console.error('Failed to load models data:', error);
            alert(`Error loading models data: ${error.message}. Please ensure models.json is valid and accessible.`);
            hideLoadingOverlay();
        }
    }

    // --- Populate Model Select Dropdown ---
    function populateModelSelect() {
        modelSelect.innerHTML = '';
        modelsData.forEach((model, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });
    }

    // --- Load Selected Model ---
    function loadModel(index) {
        if (index < 0 || index >= modelsData.length) {
            console.error('Invalid model index:', index);
            mainViewer.src = '';
            hideLoadingOverlay();
            return;
        }

        const model = modelsData[index];
        mainViewer.src = model.src;
        mainViewer.alt = model.name;

        mainViewer.cameraOrbit = '0deg 75deg 105%';
        mainViewer.fieldOfView = '30deg';

        brightnessRange.value = 1;
        contrastRange.value = 1;
        updateModelFilters();

        if (arDialog.style.display !== 'none' && typeof QRious !== 'undefined') {
            generateQrCode(model.src);
        }
    }

    // --- Update Model Filters (Brightness/Contrast) ---
    function updateModelFilters() {
        const brightness = parseFloat(brightnessRange.value).toFixed(2);
        const contrast = parseFloat(contrastRange.value).toFixed(2);

        brightnessValue.textContent = brightness;
        contrastValue.textContent = contrast;

        mainViewer.style.filter = `brightness(<span class="math-inline">\{brightness\}\) contrast\(</span>{contrast})`;
    }

    // --- Generate QR Code for AR (Using QRious) ---
    function generateQrCode(modelUrl) {
        if (typeof QRious !== 'undefined' && modelUrl) {
            const currentUrl = window.location.href.split('?')[0].split('#')[0];
            const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
            const absoluteModelUrl = new URL(modelUrl, baseUrl).href;

            console.log('Attempting to generate QR code for URL (using QRious):', absoluteModelUrl);

            new QRious({
                element: qrCanvas,
                value: absoluteModelUrl,
                size: 256,
                level: 'H'
            });
            console.log('QR Code generated with QRious!');

        } else {
            console.error('QRious library is not available or modelUrl is missing. Check index.html script order.');
        }
    }

    // --- Event Listeners ---

    modelSelect.addEventListener('change', (event) => {
        const selectedIndex = parseInt(event.target.value);
        loadModel(selectedIndex);
    });

    nightModeToggle.addEventListener('click', toggleTheme);

    filterPopupBtn.addEventListener('click', () => {
        filterControls.classList.toggle('visible');
    });

    closeFilterBtn.addEventListener('click', () => {
        filterControls.classList.remove('visible');
    });

    brightnessRange.addEventListener('input', updateModelFilters);
    contrastRange.addEventListener('input', updateModelFilters);

    resetViewBtn.addEventListener('click', () => {
        mainViewer.cameraOrbit = '0deg 75deg 105%';
        mainViewer.fieldOfView = '30deg';
        mainViewer.exposure = '1';
        mainViewer.shadowIntensity = '1';
        mainViewer.style.filter = 'none';
        brightnessRange.value = 1;
        contrastRange.value = 1;
        brightnessValue.textContent = '1.00';
        contrastValue.textContent = '1.00';
    });

    arBtn.addEventListener('click', () => {
        filterControls.classList.remove('visible');

        const currentModel = modelsData[parseInt(modelSelect.value)];
        if (currentModel && currentModel.src) {
            arDialog.style.display = 'flex';
            generateQrCode(currentModel.src);
        } else {
            console.error('No model selected or model source is missing for AR.');
            alert('Please select a model to view in AR first.');
            arDialog.style.display = 'none';
        }
    });

    closeArDialogBtn.addEventListener('click', () => {
        arDialog.style.display = 'none';
    });

    mainViewer.addEventListener('loadstart', showLoadingOverlay);
    mainViewer.addEventListener('progress', (event) => {
        // You can use event.detail.totalProgress for a progress bar if needed
    });
    mainViewer.addEventListener('load', hideLoadingOverlay);
    mainViewer.addEventListener('error', (event) => {
        console.error('Model Viewer Error:', event.detail);
        alert('Failed to load 3D model. Please check the model file and console for details.');
        hideLoadingOverlay();
        mainViewer.src = '';
    });

    // --- Initial Setup ---
    applyTheme(localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || 'light');

    arDialog.style.display = 'none';

    loadModelsData();
});