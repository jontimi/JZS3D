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

            // Check URL for pre-selected model (e.g., from QR code scan)
            const urlParams = new URLSearchParams(window.location.search);
            const modelIndexFromUrl = urlParams.get('model');
            let initialModelIndex = 0; // Default to first model

            if (modelIndexFromUrl !== null && !isNaN(parseInt(modelIndexFromUrl))) {
                const parsedIndex = parseInt(modelIndexFromUrl);
                if (parsedIndex >= 0 && parsedIndex < modelsData.length) {
                    initialModelIndex = parsedIndex;
                }
            }
            
            if (modelsData.length > 0) {
                modelSelect.value = initialModelIndex; // Set dropdown to selected index
                loadModel(initialModelIndex); // Load the model
            } else {
                console.warn('No models found in models.json');
            }
            hideLoadingOverlay(); // Hide overlay after models.json is processed
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
        mainViewer.src = model.src; // This is the path from models.json (e.g., "Sodas/BLACKSofa.glb")
        mainViewer.alt = model.name;

        // Reset camera orbit to default on new model load
        mainViewer.cameraOrbit = '0deg 75deg 105%';
        mainViewer.fieldOfView = '30deg';

        // Reset brightness/contrast filters
        brightnessRange.value = 1;
        contrastRange.value = 1;
        updateModelFilters();

        // If AR dialog is somehow open, re-generate QR code for the new model
        // The QR code now points to the page itself, not the model GLB
        if (arDialog.style.display !== 'none' && typeof QRious !== 'undefined') {
            const currentPageUrl = window.location.origin + window.location.pathname + `?model=${index}`;
            generateQrCode(currentPageUrl);
        }
    }

    // --- Update Model Filters (Brightness/Contrast) ---
    function updateModelFilters() {
        const brightness = parseFloat(brightnessRange.value).toFixed(2);
        const contrast = parseFloat(contrastRange.value).toFixed(2);

        brightnessValue.textContent = brightness;
        contrastValue.textContent = contrast;

        mainViewer.style.filter = `brightness(${brightness}) contrast(${contrast})`;
    }

    // --- Generate QR Code for AR (Using QRious) ---
    function generateQrCode(url) { // Now takes the full URL to encode
        if (typeof QRious !== 'undefined' && url) {
            console.log('Attempting to generate QR code for URL (using QRious):', url);

            new QRious({
                element: qrCanvas,
                value: url,
                size: 256,
                level: 'H'
            });
            console.log('QR Code generated with QRious for URL:', url);

        } else {
            console.error('QRious library is not available or URL is missing. Check index.html script order.');
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
        brightnessRange.value = 1;
        contrastRange.value = 1;
        brightnessValue.textContent = '1.00';
        contrastValue.textContent = '1.00';
    });

    // AR Button
    arBtn.addEventListener('click', async () => {
        filterControls.classList.remove('visible'); // Hide filter controls if open

        const currentModelIndex = parseInt(modelSelect.value);
        const currentModel = modelsData[currentModelIndex];

        if (currentModel && currentModel.src) {
            // First, display the QR code for the current page + model index
            arDialog.style.display = 'flex';
            const currentPageUrl = window.location.origin + window.location.pathname + `?model=${currentModelIndex}`;
            generateQrCode(currentPageUrl);

            // Then, attempt to activate AR directly on the device
            // This is the model-viewer's built-in AR activation
            if (mainViewer.hasAttribute('ar-modes') && mainViewer.activateAR) {
                console.log("Attempting to activate AR directly with model-viewer...");
                try {
                    await mainViewer.activateAR(); // This will launch AR on compatible devices
                    // If AR launches successfully, the dialog might not need to be shown
                    // but we keep it for devices that can't launch AR directly (e.g. desktop)
                    // or for manual QR scan later.
                } catch (error) {
                    console.error("Error activating AR:", error);
                    // If AR fails to activate directly, the QR code remains for manual scan
                    alert("Could not directly launch AR. Please scan the QR code to view on your device.");
                }
            } else {
                console.warn("AR support not available via model-viewer or activateAR method missing.");
                alert("AR not directly supported on this device/browser. Please scan the QR code to view on your mobile device.");
            }
        } else {
            console.error('No model selected or model source is missing for AR.');
            alert('Please select a model to view in AR first.');
            arDialog.style.display = 'none';
        }
    });

    closeArDialogBtn.addEventListener('click', () => {
        arDialog.style.display = 'none';
    });

    // Handle model-viewer loading state
    mainViewer.addEventListener('loadstart', showLoadingOverlay);
    mainViewer.addEventListener('progress', (event) => {
        // You can use event.detail.totalProgress for a progress bar if needed
    });
    mainViewer.addEventListener('load', hideLoadingOverlay);
    mainViewer.addEventListener('error', (event) => {
        console.error('Model Viewer Error:', event.detail);
        alert('Failed to load 3D model. Please check the model file and console for details.');
        hideLoadingOverlay();
        mainViewer.src = ''; // Clear the model viewer content on error
    });

    // --- Initial Setup ---
    applyTheme(localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || 'light');

    // Ensure AR dialog is hidden on initial load
    arDialog.style.display = 'none';

    loadModelsData(); // Start by loading models
});
