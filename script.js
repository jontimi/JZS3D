document.addEventListener('DOMContentLoaded', () => {
    const modelSelect = document.getElementById('model-select');
    const modelViewer = document.querySelector('.model-viewer');
    const qrButton = document.getElementById('qr-button');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const qrCodeCanvas = document.getElementById('qr-code-canvas');
    const closeQrButton = document.getElementById('close-qr');

    let models = [];
    let currentModelSrc = '';

    // --- NEW FUNCTION: Check AR support and toggle QR button visibility ---
    function updateQrButtonVisibility() {
        // modelViewer.hasAR is true if the device supports AR (e.g., WebXR, ARCore, ARKit)
        if (modelViewer && modelViewer.hasAR) {
            qrButton.style.display = 'none'; // Hide the "View Model on Phone" button if AR is supported
        } else {
            qrButton.style.display = 'inline-block'; // Show it if AR is NOT supported
        }
    }

    // Call this function once the DOM is loaded and model-viewer capabilities are assessed
    // model-viewer capabilities are usually ready by DOMContentLoaded
    updateQrButtonVisibility();

    // You can also call it after a model loads, though hasAR is device-dependent, not model-dependent
    modelViewer.addEventListener('load', () => {
        // This ensures the button visibility is correct even if state changes after initial load
        updateQrButtonVisibility();
    });


    // --- Fetch models.json to get the list of models ---
    fetch('models.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - Could not load models.json`);
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

            if (models.length > 0) {
                updateModel(models[0].src, models[0].name);
            }
        })
        .catch(error => {
            console.error('Error loading models.json:', error);
            alert(`Error loading models data: ${error.message}. Please ensure models.json is valid and accessible.`);
        });

    function populateDropdown(modelsArray) {
        modelSelect.innerHTML = '';
        modelsArray.forEach(model => {
            const option = document.createElement('option');
            option.value = model.src;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });
    }

    function updateModel(modelSrc, modelName) {
        if (modelViewer) {
            modelViewer.src = modelSrc;
            modelViewer.alt = `A 3D model of ${modelName}`;
            currentModelSrc = modelSrc;
            // AR attributes are handled directly in index.html for model-viewer
        } else {
            console.error("model-viewer element not found in the DOM!");
            alert("Error: 3D viewer not initialized. Please check index.html.");
        }
    }

    modelSelect.addEventListener('change', (event) => {
        const selectedSrc = event.target.value;
        const selectedModel = models.find(m => m.src === selectedSrc);
        if (selectedModel) {
            updateModel(selectedModel.src, selectedModel.name);
        }
    });

    qrButton.addEventListener('click', () => {
        if (!currentModelSrc) {
            alert('Please select a model first.');
            return;
        }

        const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        // QR code value is now simply the absolute URL to the GLB model
        const qrCodeValue = `${baseUrl}/${currentModelSrc}`; 
        
        console.log("Generating QR for:", qrCodeValue);

        const qr = new QRious({
            element: qrCodeCanvas,
            value: qrCodeValue,
            size: 256,
            background: 'white',
            foreground: 'black'
        });

        qrCodeContainer.style.display = 'flex'; // Show the QR code overlay
    });

    closeQrButton.addEventListener('click', () => {
        qrCodeContainer.style.display = 'none'; // Hide the QR code overlay
    });
});