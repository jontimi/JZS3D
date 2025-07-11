window.onload = () => {
    const productSelect = document.querySelector('.category-select');
    const modelViewer = document.getElementById('product-model');
    const refreshButton = document.querySelector('.refresh-button');
    const desktopQRButton = document.querySelector('.desktop-qr-button'); 

    const productNameDisplay = document.querySelector('.product-name');
    const brightnessSlider = document.querySelector('.brightness-slider');
    const colorOptionsContainer = document.querySelector('.color-options');
    const materialOptionsContainer = document.querySelector('.material-options');

    const dimensionHeightDisplay = document.querySelector('.dimension-height');
    const dimensionWidthDisplay = document.querySelector('.dimension-width');
    const dimensionDepthDisplay = document.querySelector('.dimension-depth');

    const qrModal = document.getElementById('qrModal');
    const closeButton = document.querySelector('.close-button');
    const qrcodeDiv = document.getElementById('qrcode'); 

    let allModelsData = [];
    let currentModelSrc = ''; 
    let currentModelData = null; // Store the full data of the currently selected model

    if (qrModal) {
        qrModal.style.display = 'none';
    }

    // Function to fetch model data from models.json
    async function fetchModelsData() {
        console.log("Attempting to fetch models.json...");
        try {
            const response = await fetch('./models.json');
            
            if (!response.ok) {
                // Log HTTP error details
                console.error(`HTTP error! Status: ${response.status} when fetching models.json. ` + 
                              `Please check if 'models.json' exists at the root and your live server is running correctly.`);
                alert(`Error loading model data: Server responded with status ${response.status}. Please check your browser's console for details (F12).`);
                return; // Stop execution if response is not OK
            }

            // Attempt to parse JSON
            let jsonData = await response.json();
            allModelsData = jsonData;
            
            // Log the actual content fetched
            console.log("Fetched models data (allModelsData):", allModelsData); 

            if (allModelsData.length > 0) {
                console.log("Model data loaded successfully. Populating dropdown and loading default model.");
                populateProductDropdown();
                // Load the first model by default after data is fetched
                const defaultModel = allModelsData[0];
                if (defaultModel) {
                    loadModel(defaultModel);
                } else {
                    console.warn("models.json contains data, but the first element is undefined.");
                }
            } else {
                console.warn("models.json was fetched successfully but contains no model data (it's an empty array or invalid structure after parsing).");
                alert("No model data found in models.json or file is empty/invalid. Please check the content of 'models.json'.");
            }
        } catch (error) {
            console.error("Error fetching or parsing models.json:", error);
            alert("Failed to load model data due to a network or parsing error. See your browser's console (F12) for details.");
        }
    }

    // Function to populate the product dropdown
    function populateProductDropdown() {
        if (!productSelect) {
            console.warn("Product select dropdown (.category-select) not found in HTML.");
            return;
        }
        productSelect.innerHTML = ''; // Clear existing options
        allModelsData.forEach(model => {
            const option = document.createElement('option');
            option.value = model.name;
            option.textContent = model.name;
            productSelect.appendChild(option);
        });

        // Set the default selected option if available
        if (allModelsData.length > 0) {
            productSelect.value = allModelsData[0].name;
            console.log("Product dropdown populated successfully.");
        } else {
            console.warn("No models data to populate product dropdown.");
        }
    }

    // Function to load a specific model
    function loadModel(model) {
        if (!modelViewer) {
            console.warn("Model viewer element (#product-model) not found in HTML.");
            return;
        }
        if (!model || !model.src) {
            console.error("Attempted to load an invalid model object:", model);
            alert("Error: Model data is incomplete. Cannot load model.");
            return;
        }
        currentModelData = model;
        currentModelSrc = model.src;
        modelViewer.src = currentModelSrc; // Update the model-viewer src
        console.log(`Loading model: ${currentModelSrc}`);

        // Update product info
        if (productNameDisplay) productNameDisplay.textContent = model.name;
        if (dimensionHeightDisplay) dimensionHeightDisplay.textContent = `${(model.height * 100).toFixed(1)}cm`; // Added .toFixed(1) for cleaner display
        if (dimensionWidthDisplay) dimensionWidthDisplay.textContent = `${(model.width * 100).toFixed(1)}cm`;
        if (dimensionDepthDisplay) dimensionDepthDisplay.textContent = `${(model.depth * 100).toFixed(1)}cm`;

        // Update colors
        updateColors(model.colors);
        // Update materials
        updateMaterials(model.materials);
    }

    // Function to update color swatches
    function updateColors(colors) {
        if (!colorOptionsContainer) {
            console.warn("Color options container not found.");
            return;
        }
        colorOptionsContainer.innerHTML = ''; // Clear previous colors
        if (!colors || !Array.isArray(colors)) {
            console.warn("Invalid colors data provided:", colors);
            return;
        }
        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.addEventListener('click', () => {
                modelViewer.style.setProperty('--main-color', color);
            });
            colorOptionsContainer.appendChild(swatch);
        });
        const addColorButton = document.createElement('div');
        addColorButton.className = 'color-add-button';
        addColorButton.textContent = '+';
        colorOptionsContainer.appendChild(addColorButton);

        // Set default color
        if (colors.length > 0) {
            modelViewer.style.setProperty('--main-color', colors[0]);
        }
    }

    // Function to update material tags
    function updateMaterials(materials) {
        if (!materialOptionsContainer) {
            console.warn("Material options container not found.");
            return;
        }
        materialOptionsContainer.innerHTML = ''; // Clear previous materials
        if (!materials || !Array.isArray(materials)) {
            console.warn("Invalid materials data provided:", materials);
            return;
        }
        materials.forEach(material => {
            const tag = document.createElement('span');
            tag.className = 'material-tag';
            tag.textContent = material;
            materialOptionsContainer.appendChild(tag);
        });
    }

    // Event Listeners
    if (productSelect) {
        productSelect.addEventListener('change', (event) => {
            const selectedModelName = event.target.value;
            const selectedModel = allModelsData.find(model => model.name === selectedModelName);
            if (selectedModel) {
                loadModel(selectedModel);
            } else {
                console.warn(`Selected model '${selectedModelName}' not found in allModelsData.`);
            }
        });
    } else {
        console.warn("Product select dropdown not available for event listener setup.");
    }


    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            if (modelViewer) {
                modelViewer.resetCamera(); 
                if (currentModelData) {
                    loadModel(currentModelData); 
                } else {
                    console.warn("No current model data to reload; attempting to re-fetch all data.");
                    fetchModelsData(); // Attempt to re-fetch all data
                }
                console.log("Refresh button clicked. Camera reset.");
            } else {
                console.warn("Model viewer not found for refresh button.");
            }
        });
    } else {
        console.warn("Refresh button not found.");
    }

    // Desktop QR Button
    if (desktopQRButton) {
        desktopQRButton.addEventListener('click', () => {
            if (currentModelData) {
                // Ensure qrcodeDiv is cleared before new QR generation
                if (qrcodeDiv) {
                    qrcodeDiv.innerHTML = '';
                } else {
                    console.error("QR Code div (#qrcode) not found in HTML. Cannot generate QR.");
                    alert("QR Code display area missing. Please check your HTML structure for an element with id='qrcode'.");
                    return;
                }

                // Base URL for your GitHub Pages project
                const baseUrl = 'https://jontimi.github.io/JZS-AR-SHOWCASE/';
                const modelPath = currentModelData.src; // e.g., models/Lamps/mario_floor_lamp.glb

                // Construct the full URL to the GLB model
                const fullModelUrl = `${baseUrl}${modelPath}`;

                // Construct the AR viewer URL for Google Scene Viewer
                // Ensure modelPath is URL-encoded for the 'file' parameter
                const arUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(fullModelUrl)}&mode=ar_only`;
                
                console.log("Final AR URL for QR Code:", arUrl);

                try {
                    // CRITICAL FIX: Use 'new QRCode' instead of directly calling QRCode
                    // This creates a new instance correctly
                    new QRCode(qrcodeDiv, {
                        text: arUrl,
                        width: 256,
                        height: 256,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });
                    console.log("QR Code successfully generated for URL:", arUrl);
                } catch (error) {
                    console.error("Error generating QR code:", error);
                    alert("An error occurred while generating the QR code. See console for details (F12).");
                    return; 
                }
                
                qrModal.style.display = 'flex';
            } else {
                console.warn("No current model data available. Cannot generate QR code.");
                alert("Please select a product first to generate the AR QR code.");
            }
        });
    } else {
        console.warn("Desktop QR button not found.");
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            qrModal.style.display = 'none';
            console.log("QR Modal closed.");
        });
    } else {
        console.warn("Close button for QR modal not found.");
    }

    window.addEventListener('click', (event) => {
        if (event.target == qrModal) {
            qrModal.style.display = 'none';
            console.log("QR Modal closed by clicking outside.");
        }
    });
    
    if (brightnessSlider && modelViewer) {
        brightnessSlider.addEventListener('input', (event) => {
            const sliderValue = parseFloat(event.target.value);
            modelViewer.exposure = sliderValue / 50; 
            console.log("Brightness set to:", modelViewer.exposure);
        });
    } else {
        console.warn("Brightness slider or model-viewer not found for brightness control.");
    }

    // Initial data fetch when the page loads
    fetchModelsData();
};