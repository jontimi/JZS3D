document.addEventListener('DOMContentLoaded', () => {
    const modelSelect = document.getElementById('model-select');
    const modelViewer = document.querySelector('.model-viewer');
    const qrButton = document.getElementById('qr-button');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const qrCodeCanvas = document.getElementById('qr-code-canvas');
    const closeQrButton = document.getElementById('close-qr');

    let models = [];
    let currentModelSrc = '';

    // Function to get a query parameter from the URL
    function getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

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

            // --- Check for model in URL query parameter ---
            const urlModelSrc = getQueryParam('model');
            if (urlModelSrc) {
                // Find the model object based on the src from the URL
                const initialModel = models.find(m => m.src === urlModelSrc);
                if (initialModel) {
                    updateModel(initialModel.src, initialModel.name);
                    // Set the dropdown to the loaded model
                    modelSelect.value = initialModel.src;
                } else {
                    console.warn(`Model with src "${urlModelSrc}" not found in models.json. Loading first model.`);
                    updateModel(models[0].src, models[0].name);
                }
            } else if (models.length > 0) {
                // If no model in URL, load the first one by default
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

        // Construct the base URL for the current page
        // This makes sure the QR code links back to index.html
        const baseUrl = window.location.origin + window.location.pathname; 
        
        // Generate the QR code value with the model's source as a query parameter
        const qrCodeValue = `${baseUrl}?model=${currentModelSrc}`; 
        
        console.log("Generating QR for:", qrCodeValue);

        const qr = new QRious({
            element: qrCodeCanvas,
            value: qrCodeValue,
            size: 256,
            background: 'white',
            foreground: 'black'
        });

        qrCodeContainer.style.display = 'flex';
    });

    closeQrButton.addEventListener('click', () => {
        qrCodeContainer.style.display = 'none';
    });
});