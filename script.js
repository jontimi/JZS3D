document.addEventListener('DOMContentLoaded', () => {
    const modelSelect = document.getElementById('model-select');
    const modelViewer = document.querySelector('.model-viewer');
    const qrButton = document.getElementById('qr-button');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const qrCodeCanvas = document.getElementById('qr-code-canvas');
    const closeQrButton = document.getElementById('close-qr');

    let models = [];
    let currentModelSrc = '';

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
            // No AR attributes set here, as per your request for a clean base
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

    // --- MODIFIED: Event listener for the QR button click to generate AR intent URL ---
    qrButton.addEventListener('click', () => {
        if (!currentModelSrc) {
            alert('Please select a model first.');
            return;
        }

        const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        const modelAbsoluteUrl = `${baseUrl}/${currentModelSrc}`;

        // Construct Google Scene Viewer Intent URL for Android
        // This URL tells Android to open the model in the Google ARCore Scene Viewer app.
        // If the app isn't installed or device doesn't support AR, it provides a fallback URL to your site.
        const sceneViewerIntentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelAbsoluteUrl)}&mode=ar_only#Intent;scheme=https;package=com.google.android.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(baseUrl)};end;`;

        // Use the Scene Viewer intent URL for the QR code value.
        // For iOS devices, scanning this URL will usually still attempt to open the GLB directly
        // via Quick Look, or fall back to the browser. Dedicated USDZ files are ideal for iOS AR.
        const qrCodeValue = sceneViewerIntentUrl;
        
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