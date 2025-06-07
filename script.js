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
        // Check if the loading overlay is part of the shadow DOM (recommended for model-viewer)
        // or if it's directly in the light DOM
        const mvProgressBar = mainViewer.shadowRoot ? mainViewer.shadowRoot.querySelector('.loading-overlay') : null;

        if (mvProgressBar) {
            mvProgressBar.style.display = 'flex';
            mvProgressBar.style.opacity = '1';
        } else if (loadingOverlay) { // Fallback if not using slot or element is outside model-viewer
            loadingOverlay.style.display = 'flex';
            loadingOverlay.style.opacity = '1';
        }
        // Add a class to mainViewer to signify loading state for CSS adjustments
        mainViewer.classList.add('is-loading');
    }

    function hideLoadingOverlay() {
        const mvProgressBar = mainViewer.shadowRoot ? mainViewer.shadowRoot.querySelector('.loading-overlay') : null;

        if (mvProgressBar) {
            mvProgressBar.style.opacity = '0';
            setTimeout(() => { // Hide after transition
                mvProgressBar.style.display = 'none';
            }, 300); // Match CSS transition duration
        } else if (loadingOverlay) { // Fallback
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
                loadModel(0); // Load the first model by default
            } else {
                console.warn('No models found in models.json');
                hideLoadingOverlay();
            }
        } catch (error) {
            console.error('Failed to load models data:', error);
            alert(`Error loading models data: ${error.message}. Please ensure models.json is valid and accessible.`);
            hideLoadingOverlay();
        }
    }

    // --- Populate Model Select Dropdown ---
    function populateModelSelect() {
        modelSelect.innerHTML = ''; // Clear existing options
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
            mainViewer.src = ''; // Clear the viewer if index is invalid
            hideLoadingOverlay();
            return;
        }

        const model = modelsData[index];
        mainViewer.src = model.src;
        mainViewer.alt = model.name;
        mainViewer.poster = model.poster || ''; // Set poster if available

        // Reset camera orbit to default on new model load
        mainViewer.cameraOrbit = '0deg 75deg 105%';
        mainViewer.fieldOfView = '30deg'; // Standard field of view

        // Reset brightness/contrast filters
        brightnessRange.value = 1;
        contrastRange.value = 1;
        updateModelFilters();

        // If AR dialog is somehow open, re-generate QR code for the new model
        if (arDialog.style.display !== 'none') {
            generateQrCode(model.src); // Use model.src here, which is the currently loaded model's path
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

    // --- Generate QR Code for AR ---
    function generateQrCode(modelUrl) {
        // Ensure QrCode library is available
        if (typeof QrCode !== 'undefined' && modelUrl) {
            const currentUrl = window.location.href.split('?')[0].split('#')[0];
            const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
            const absoluteModelUrl = new URL(modelUrl, baseUrl).href;

            QrCode.toCanvas(qrCanvas, absoluteModelUrl, { width: 256, errorCorrectionLevel: 'H' }, function (error) {
                if (error) {
                    console.error('QR Code generation failed:', error);
                    // Optionally, show a message in the AR dialog that QR failed
                }
            });
        } else {
            console.error('QR Code library not loaded or modelUrl missing for AR.');
        }
    }

    // --- Event Listeners ---

    // Model selection change
    modelSelect.addEventListener('change', (event) => {
        const selectedIndex = parseInt(event.target.value);
        loadModel(selectedIndex);
    });

    // Toggle Night Mode
    nightModeToggle.addEventListener('click', toggleTheme);

    // Show/Hide Filter Controls
    filterPopupBtn.addEventListener('click', () => {
        filterControls.classList.toggle('visible');
    });

    closeFilterBtn.addEventListener('click', () => {
        filterControls.classList.remove('visible');
    });

    // Brightness and Contrast Changes
    brightnessRange.addEventListener('input', updateModelFilters);
    contrastRange.addEventListener('input', updateModelFilters);

    // Reset View Button
    resetViewBtn.addEventListener('click', () => {
        mainViewer.cameraOrbit = '0deg 75deg 105%';
        mainViewer.fieldOfView = '30deg';
        mainViewer.exposure = '1';
        mainViewer.shadowIntensity = '1';
        mainViewer.style.filter = 'none'; // Clear CSS filter
        brightnessRange.value = 1; // Reset range input
        contrastRange.value = 1;   // Reset range input
        brightnessValue.textContent = '1.00'; // Update displayed value
        contrastValue.textContent = '1.00';   // Update displayed value
    });

    // AR Button
    arBtn.addEventListener('click', () => {
        filterControls.classList.remove('visible'); // Hide filter controls if open

        const currentModel = modelsData[parseInt(modelSelect.value)];
        if (currentModel && currentModel.src) {
            arDialog.style.display = 'flex'; // Show AR dialog
            generateQrCode(currentModel.src);
        } else {
            console.error('No model selected or model source is missing for AR.');
            alert('Please select a model to view in AR first.');
            arDialog.style.display = 'none'; // Hide dialog if no model
        }
    });

    closeArDialogBtn.addEventListener('click', () => {
        arDialog.style.display = 'none'; // Hide AR dialog
    });

    // Handle model-viewer loading state
    mainViewer.addEventListener('loadstart', showLoadingOverlay);
    mainViewer.addEventListener('progress', (event) => {
        // You can use event.detail.totalProgress for a progress bar if needed
        // console.log(`Loading progress: ${event.detail.totalProgress.toFixed(2)}%`);
    });
    mainViewer.addEventListener('load', hideLoadingOverlay);
    mainViewer.addEventListener('error', (event) => {
        console.error('Model Viewer Error:', event.detail);
        alert('Failed to load 3D model. Please check the model file and console for details.');
        hideLoadingOverlay();
        // If there's an error, clear the current model to avoid a broken state
        mainViewer.src = '';
    });

    // --- Initial Setup ---
    applyTheme(localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || 'light');

    // Ensure AR dialog is hidden on initial load
    arDialog.style.display = 'none'; 

    loadModelsData(); // Start by loading models
});