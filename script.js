document.addEventListener('DOMContentLoaded', () => {
    const modelSelect = document.getElementById('model-select');
    const modelViewer = document.querySelector('.model-viewer');
    const arButton = document.getElementById('ar-button'); // Reference to the AR button
    const qrCodeContainer = document.getElementById('qr-code-container'); // Reference to QR overlay
    const qrCodeCanvas = document.getElementById('qr-code-canvas'); // Reference to QR canvas
    const closeQrButton = document.getElementById('close-qr'); // Reference to close button

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
            // Validate if data is an array and not empty
            if (!Array.isArray(data) || data.length === 0) {
                console.error('models.json is empty or not an array:', data);
                alert('Error: models data is empty or invalid. Please check models.json.');
                return;
            }
            models = data; // Store the fetched models
            populateDropdown(models); // Fill the dropdown

            // Load the first model by default if available
            if (models.length > 0) {
                updateModel(models[0].src, models[0].name);
            }
        })
        .catch(error => {
            // Catch any errors during the fetch or JSON parsing
            console.error('Error loading models.json:', error);
            alert(`Error loading models data: ${error.message}. Please ensure models.json is valid and accessible.`);
        });

    // --- Populates the dropdown menu with model names ---
    function populateDropdown(modelsArray) {
        modelSelect.innerHTML = ''; // Clear existing options
        modelsArray.forEach(model => {
            const option = document.createElement('option');
            option.value = model.src; // Value is the path to the GLB file
            option.textContent = model.name; // Text shown in dropdown is the model's name
            modelSelect.appendChild(option);
        });
    }

    // --- Updates the 3D model displayed in model-viewer ---
    function updateModel(modelSrc, modelName) {
        if (modelViewer) {
            modelViewer.src = modelSrc; // Set the source of the 3D model
            modelViewer.alt = `A 3D model of ${modelName}`; // Set alt text for accessibility
            currentModelSrc = modelSrc; // Update the stored current model source

            // Enable AR functionality for the model-viewer
            // model-viewer automatically handles USDZ for iOS (Quick Look) and GLB for Android (Scene Viewer)
            // when the 'ar' attribute is present.
            modelViewer.setAttribute('ar', ''); 

            // Optional: If you want to specify specific AR modes, uncomment and adjust:
            // modelViewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look'); 
        } else {
            console.error("model-viewer element not found in the DOM!");
            alert("Error: 3D viewer not initialized. Please check index.html.");
        }
    }

    // --- Event listener for when a new model is selected from the dropdown ---
    modelSelect.addEventListener('change', (event) => {
        const selectedSrc = event.target.value; // Get the selected GLB path
        // Find the full model object from our 'models' array to get its name
        const selectedModel = models.find(m => m.src === selectedSrc);
        if (selectedModel) {
            updateModel(selectedModel.src, selectedModel.name); // Update the model viewer
        }
    });

    // --- Event listener for the AR button click ---
    arButton.addEventListener('click', () => {
        if (!currentModelSrc) {
            alert('Please select a model first.');
            return;
        }

        // Construct the full absolute URL for the GLB model.
        // This is crucial because the QR code needs a complete URL that a phone
        // can directly access from anywhere.
        // Example: https://jontimi.github.io/JZS-AR-SHOWCASE/Sofas/Black_Sofa.glb
        const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        const modelAbsoluteUrl = `${baseUrl}/${currentModelSrc}`;
        
        console.log("Generating QR for:", modelAbsoluteUrl);

        // Generate QR code on the canvas element
        const qr = new QRious({
            element: qrCodeCanvas,
            value: modelAbsoluteUrl, // The URL the QR code will open
            size: 256, // Size of the QR code in pixels
            background: 'white',
            foreground: 'black'
        });

        // Show the QR code overlay
        qrCodeContainer.style.display = 'flex'; 
    });

    // --- Event listener for the Close QR button click ---
    closeQrButton.addEventListener('click', () => {
        // Hide the QR code overlay
        qrCodeContainer.style.display = 'none';
    });
});