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

            // The ar-modes attribute is now in index.html to control default behavior
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

        // Get the base URL of your deployed site (e.g., https://furniturear.netlify.app/)
        const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        const modelAbsoluteUrl = `${baseUrl}/${currentModelSrc}`; // This is the direct GLB URL

        // Construct Google Scene Viewer Intent URL for Android
        // This is the most reliable way to launch AR on Android from a QR code.
        const sceneViewerIntentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelAbsoluteUrl)}&mode=ar_only#Intent;scheme=https;package=com.google.android.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(baseUrl)};end;`;

        // Use the Scene Viewer intent URL for the QR code.
        // For iOS, direct GLB links often work well with Quick Look,
        // but Scene Viewer intent URLs are primarily for Android.
        // We'll use the intent URL as the primary QR code value for broader compatibility.
        let qrCodeValue = sceneViewerIntentUrl;
        
        console.log("Generating QR for:", qrCodeValue);

        // Generate QR code on the canvas element
        const qr = new QRious({
            element: qrCodeCanvas,
            value: qrCodeValue, // Use the intent URL for better AR launch
            size: 256,
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