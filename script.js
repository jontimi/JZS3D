document.addEventListener('DOMContentLoaded', () => {
    const modelSelect = document.getElementById('model-select');
    const modelViewer = document.querySelector('.model-viewer');
    const arButtonContainer = document.getElementById('ar-button-container');
    const arButton = document.querySelector('.ar-button');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const qrCodeCanvas = document.getElementById('qr-code-canvas');
    const closeQrButton = document.getElementById('close-qr');
    const filterArButton = document.getElementById('filter-ar');
    const resetViewButton = document.getElementById('reset-view');
    const toggleLightModeButton = document.getElementById('toggle-light-mode');

    let models = [];
    let currentModelViewerSrc = '';
    let currentModelViewerName = '';
    let qr; // Declare qr variable globally within this scope

    // --- Fetch models.json ---
    fetch('models.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                console.error('models.json is empty or not an array:', data);
                alert('Error: models data is empty or invalid. Please check models.json.');
                return;
            }
            models = data;
            populateDropdown(models);
            // Initial model load after dropdown is populated
            if (models.length > 0) {
                updateModel(models[0].src, models[0].name);
            }
        })
        .catch(error => {
            console.error('Error loading models.json:', error);
            alert(`Error loading models data: ${error.message}. Please ensure models.json is valid and accessible.`);
        });

    // --- Dropdown Population ---
    function populateDropdown(modelsArray) {
        modelSelect.innerHTML = ''; // Clear existing options
        modelsArray.forEach(model => {
            const option = document.createElement('option');
            option.value = model.src;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });
    }

    // --- Model Update Function ---
    function updateModel(modelSrc, modelName) {
        if (modelViewer) { // Ensure modelViewer exists before trying to set src
            modelViewer.src = modelSrc;
            modelViewer.alt = `A 3D model of ${modelName}`;
            modelViewer.poster = `images/${modelSrc.split('/').pop().replace('.glb', '')}.webp`; // Adjust poster path if needed
            currentModelViewerSrc = modelSrc;
            currentModelViewerName = modelName;
            
            // Generate QR code for the new model
            generateQRCode(window.location.origin + window.location.pathname + '?model=' + encodeURIComponent(modelSrc));
        } else {
            console.error("model-viewer element not found!");
            alert("Error: 3D viewer not initialized. Page structure problem.");
        }
    }

    // --- Event Listeners ---
    modelSelect.addEventListener('change', (event) => {
        const selectedSrc = event.target.value;
        const selectedModel = models.find(m => m.src === selectedSrc);
        if (selectedModel) {
            updateModel(selectedModel.src, selectedModel.name);
        }
    });

    // Reset Camera View
    resetViewButton.addEventListener('click', () => {
        modelViewer.cameraOrbit = '0deg 75deg 105%'; // Default orbit
        modelViewer.fieldOfView = '45deg'; // Default FOV
        modelViewer.cameraTarget = '0 0 0'; // Center target
    });

    // AR Button Logic (QR code generation)
    filterArButton.addEventListener('click', () => {
        // Hide model viewer and show QR code container
        modelViewer.style.display = 'none';
        qrCodeContainer.style.display = 'flex';
        closeQrButton.style.display = 'block';

        // Ensure QR code is generated for the current model
        generateQRCode(window.location.origin + window.location.pathname + '?model=' + encodeURIComponent(currentModelViewerSrc));
    });

    closeQrButton.addEventListener('click', () => {
        // Show model viewer and hide QR code container
        modelViewer.style.display = 'block';
        qrCodeContainer.style.display = 'none';
        closeQrButton.style.display = 'none';
    });

    // Toggle Light Mode
    toggleLightModeButton.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        if (document.body.classList.contains('light-mode')) {
            modelViewer.style.backgroundColor = '#ffffff'; // Light mode background for viewer
            modelViewer.shadowIntensity = '0.5'; // Adjust shadow intensity
        } else {
            modelViewer.style.backgroundColor = '#f0f0f0'; // Default background (or your dark mode equivalent)
            modelViewer.shadowIntensity = '1'; // Default shadow intensity
        }
    });

    // --- QR Code Generation Function ---
    function generateQRCode(data) {
        if (qrCodeCanvas) {
            if (!qr) {
                qr = new QRious({
                    element: qrCodeCanvas,
                    size: 200,
                    padding: 10,
                    value: data
                });
            } else {
                qr.value = data;
            }
        } else {
            console.error("QR code canvas element not found!");
        }
    }

    // Handle incoming URL parameters for AR links (if shared)
    const urlParams = new URLSearchParams(window.location.search);
    const modelParam = urlParams.get('model');
    if (modelParam) {
        const decodedModelSrc = decodeURIComponent(modelParam);
        // Find the model in your data and set it
        const initialModel = models.find(m => m.src === decodedModelSrc);
        if (initialModel) {
            // Update model viewer and set dropdown
            modelSelect.value = initialModel.src;
            updateModel(initialModel.src, initialModel.name);
        } else {
            console.warn(`Model not found for URL parameter: ${decodedModelSrc}`);
        }
    }
});
