document.addEventListener('DOMContentLoaded', () => {
    const modelSelect = document.getElementById('model-select');
    const modelViewer = document.querySelector('.model-viewer');
    // NEW: References for QR button and overlay
    const qrButton = document.getElementById('qr-button');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const qrCodeCanvas = document.getElementById('qr-code-canvas');
    const closeQrButton = document.getElementById('close-qr');

    let models = [];
    let currentModelSrc = ''; // To store the path of the currently loaded model

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

    // --- Populates the dropdown menu with model names ---
    function populateDropdown(modelsArray) {
        modelSelect.innerHTML = '';
        modelsArray.forEach(model => {
            const option = document.createElement('option');
            option.value = model.src;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });
    }

    // --- Updates the 3D model displayed in model-viewer ---
    function updateModel(modelSrc, modelName) {
        if (modelViewer) {
            modelViewer.src = modelSrc;
            modelViewer.alt = `A 3D model of ${modelName}`;
            currentModelSrc = modelSrc;
        } else {
            console.error("model-viewer element not found in the DOM!");
            alert("Error: 3D viewer not initialized. Please check index.html.");
        }
    }

    // --- Event listener for when a new model is selected from the dropdown ---
    modelSelect.addEventListener('change', (event) => {
        const selectedSrc = event.target.value;
        const selectedModel = models.find(m => m.src === selectedSrc);
        if (selectedModel) {
            updateModel(selectedModel.src, selectedModel.name);
        }
    });

    // --- NEW: Event listener for the QR button click ---
    qrButton.addEventListener('click', () => {
        if (!currentModelSrc) {
            alert('Please select a model first.');
            return;
        }

        // Get the base URL of your deployed site (e.g., https://furniturear.netlify.app/)
        // This ensures the QR code always points to the correct location.
        const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        const modelAbsoluteUrl = `${baseUrl}/${currentModelSrc}`;

        // Generate QR code on the canvas element
        const qr = new QRious({
            element: qrCodeCanvas,
            value: modelAbsoluteUrl, // QR code points directly to the GLB file
            size: 256,
            background: 'white',
            foreground: 'black'
        });

        // Show the QR code overlay
        qrCodeContainer.style.display = 'flex';
    });

    // --- NEW: Event listener for the Close QR button click ---
    closeQrButton.addEventListener('click', () => {
        // Hide the QR code overlay
        qrCodeContainer.style.display = 'none';
    });
});