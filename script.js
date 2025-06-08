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
                // Load the first model immediately after populating the dropdown
                loadModel(0);
                modelSelect.value = 0;
            } else {
                console.warn('No models found in models.json');
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
            mainViewer.src = '';
            hideLoadingOverlay();
            return;
        }

        const model = modelsData[index];
        mainViewer.src = model.src;
        mainViewer.alt = model.name;
        mainViewer.poster = model.poster || '';
        mainViewer.cameraOrbit = '0deg 75deg 105%';
        mainViewer.fieldOfView = '30deg';
        brightnessRange.value = 1;
        contrastRange.value = 1;
        updateModelFilters();
    }

    // --- Update Model Filters (Brightness/Contrast) ---
    function updateModelFilters() {
        const brightness = parseFloat(brightnessRange.value).toFixed(2);
        const contrast = parseFloat(contrastRange.value).toFixed(2);

        brightnessValue.textContent = brightness;
        contrastValue.textContent = contrast;

        mainViewer.style.filter = `brightness(${brightness}) contrast(${contrast})`;
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
    arBtn.addEventListener('click', () => {
        filterControls.classList.remove('visible'); // Hide filter controls if open

        const currentModel = modelsData[parseInt(modelSelect.value)];
        if (currentModel && currentModel.src) {
            arDialog.style.display = 'flex';
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