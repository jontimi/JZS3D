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
    const loadingOverlay = document.getElementById('loadingOverlay'); // This is the new overlay within model-viewer's slot
    const nightModeToggle = document.getElementById('nightModeToggle');

    let modelsData = []; // This will now be a simple array of models
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
        // The `loadingOverlay` is slotted into <model-viewer> and displayed via CSS `display: flex`
        // We ensure it's visible by not setting display:none here directly,
        // model-viewer handles its default hide/show behavior for progress-bar slot.
        // We can add a class for custom styling during loading
        mainViewer.classList.add('is-loading');
    }

    function hideLoadingOverlay() {
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

        // Update the AR dialog QR code link if it's open
        if (arDialog.style.display !== 'none') {
            generateQrCode(model.src);
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

    // --- Generate QR Code for AR ---
    function generateQrCode(modelUrl) {
        // Check if QrCode library is available. It should be, due to script order.
        if (typeof QrCode !== 'undefined' && modelUrl) {
            // Get the current base URL to create an absolute path for the model
            const currentUrl = window.location.href.split('?')[0].split('#')[0];
            const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
            const absoluteModelUrl = new URL(modelUrl, baseUrl).href; // Ensures it's an absolute URL

            // The 'ar' attribute of model-viewer requires specific URLs for different platforms.
            // For general QR codes, a direct link to the GLB/GLTF is often sufficient,
            // or a more sophisticated AR link might be needed.
            // model-viewer.generateObjectUrl is useful for native AR links, but
            // for general QR codes, a simple URL to the GLB is usually enough.
            // Let's use the absoluteModelUrl directly for the QR code for simplicity.

            // If you find AR isn't working perfectly on iOS/Android, you might need to
            // use a more robust AR deep-link generator or host your files on a server
            // that supports .usdz for iOS. For now, a direct GLB link is the simplest.
            const qrLink = absoluteModelUrl; 

            // Ensure the link starts with https for iOS Quick Look, if hosted on HTTP
            // If your Live Server is HTTP, this will just make the QR fail on iOS for AR.
            // For proper iOS AR, you need HTTPS hosting and .usdz files.
            // const safeQrLink = qrLink.startsWith('http://') ? qrLink.replace('http://', 'https://') : qrLink;

            QrCode.toCanvas(qrCanvas, qrLink, { width: 256, errorCorrectionLevel: 'H' }, function (error) {
                if (error) console.error('QR Code generation failed:', error);
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
        mainViewer.cameraOrbit = '0deg 75deg 105%'; // Reset default orbit
        mainViewer.fieldOfView = '30deg'; // Reset default FOV
        mainViewer.exposure = '1'; // Reset exposure
        mainViewer.shadowIntensity = '1'; // Reset shadow intensity
        mainViewer.style.filter = 'none'; // Clear brightness/contrast filters
        brightnessRange.value = 1; // Reset range inputs
        contrastRange.value = 1;
        brightnessValue.textContent = '1.00';
        contrastValue.textContent = '1.00';
    });

    // AR Button
    arBtn.addEventListener('click', () => {
        // Hide filter controls if open
        filterControls.classList.remove('visible');

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
    // Use the slot="progress-bar" functionality, which model-viewer manages
    mainViewer.addEventListener('loadstart', showLoadingOverlay); // Called when model starts loading
    mainViewer.addEventListener('progress', (event) => {
        // You can use event.detail.totalProgress for a progress bar if needed
        // console.log(`Loading progress: ${event.detail.totalProgress.toFixed(2)}%`);
    });
    mainViewer.addEventListener('load', hideLoadingOverlay); // Called when model is fully loaded and rendered
    mainViewer.addEventListener('error', (event) => {
        console.error('Model Viewer Error:', event.detail);
        alert('Failed to load 3D model. Please check the model file and console for details.');
        hideLoadingOverlay();
    });

    // --- Initial Setup ---
    applyTheme(localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || 'light'); // Apply saved theme or default
    loadModelsData(); // Start by loading models
});