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
                // If response is not OK (e.g., 404), throw an error
                throw new Error(`HTTP error! status: ${response.status} - Could not load models.json`);
            }
            return response.json(); // Try to parse JSON
        })
        .then(data => {
            // Check if data is a valid array and not empty
            if (!Array.isArray(data) || data.length === 0) {
                console.error('models.json is empty or not an array:', data);
                // Alert if JSON is invalid or empty
                alert('Error: models data is empty or invalid. Please check models.json.');
                return;
            }
            models = data; // Assign fetched data to models array
            populateDropdown(models); // Populate the dropdown menu

            // If models exist, load the first one by default
            if (models.length > 0) {
                updateModel(models[0].src, models[0].name);
            }
        })
        .catch(error => {
            // Catch any errors during fetch or JSON parsing
            console.error('Error loading models.json:', error);
            alert(`Error loading models data: ${error.message}. Please ensure models.json is valid and accessible.`);
        });

    function populateDropdown(modelsArray) {
        modelSelect.innerHTML = ''; // Clear existing options
        modelsArray.forEach(model => {
            const option = document.createElement('option');
            option.value = model.src; // Set option value to model's source path
            option.textContent = model.name; // Set option text to model's display name
            modelSelect.appendChild(option); // Add option to the dropdown
        });
    }

    function updateModel(modelSrc, modelName) {
        if (modelViewer) {
            modelViewer.src = modelSrc; // Set the model-viewer's source
            modelViewer.alt = `A 3D model of ${modelName}`; // Set alt text for accessibility
            currentModelSrc = modelSrc; // Keep track of the currently loaded model's source
        } else {
            console.error("model-viewer element not found in the DOM!");
            alert("Error: 3D viewer not initialized. Please check index.html.");
        }
    }

    // Event listener for dropdown menu change
    modelSelect.addEventListener('change', (event) => {
        const selectedSrc = event.target.value; // Get the source path from the selected option
        // Find the full model object from the models array
        const selectedModel = models.find(m => m.src === selectedSrc);
        if (selectedModel) {
            updateModel(selectedModel.src, selectedModel.name); // Update the model in the viewer
        }
    });

    // Event listener for QR button click
    qrButton.addEventListener('click', () => {
        if (!currentModelSrc) {
            alert('Please select a model first.');
            return;
        }

        // Construct the full URL for the QR code
        // This takes your Netlify site's base URL and appends the model's GLB path
        const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        const qrCodeValue = `${baseUrl}/${currentModelSrc}`; 
        
        console.log("Generating QR for:", qrCodeValue);

        // Generate the QR code using QRious library
        const qr = new QRious({
            element: qrCodeCanvas, // Canvas element to draw the QR code on
            value: qrCodeValue,   // Data to encode in the QR code
            size: 256,            // Size of the QR code in pixels
            background: 'white',  // QR code background color
            foreground: 'black'   // QR code foreground color
        });

        qrCodeContainer.style.display = 'flex'; // Show the QR code overlay (uses flexbox for centering)
    });

    closeQrButton.addEventListener('click', () => {
        qrCodeContainer.style.display = 'none'; // Hide the QR code overlay
    });
});