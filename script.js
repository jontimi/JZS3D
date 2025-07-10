document.addEventListener('DOMContentLoaded', () => {
    const productSelect = document.querySelector('.category-select');
    const modelViewer = document.getElementById('product-model');
    const refreshButton = document.querySelector('.refresh-button');
    const arButton = document.querySelector('.ar-button');
    const productNameDisplay = document.querySelector('.product-name');
    const brightnessSlider = document.querySelector('.brightness-slider');
    const colorOptionsContainer = document.querySelector('.color-options'); // Get the color options container

    const dimensionHeightDisplay = document.querySelector('.dimension-height');
    const dimensionWidthDisplay = document.querySelector('.dimension-width');
    const dimensionDepthDisplay = document.querySelector('.dimension-depth');

    let allModelsData = [];

    async function fetchModelsData() {
        try {
            const response = await fetch('./models.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for models.json`);
            }
            
            const data = await response.json(); 
            
            if (!Array.isArray(data)) {
                throw new Error("Invalid models.json structure: Expected a top-level array of model objects.");
            }
            
            allModelsData = data;

            console.log("Fetched models data (flat array):", allModelsData);
            
            populateProductDropdown(allModelsData);

            if (allModelsData.length > 0) {
                const defaultModel = allModelsData[0];
                loadModel(defaultModel.src);
                updateProductDetails(defaultModel);
                populateColorOptions(defaultModel.colors); // Populate colors for the default model
                productSelect.value = defaultModel.src;
                
                if (brightnessSlider && modelViewer) {
                    brightnessSlider.value = modelViewer.exposure * 50;
                }
            } else {
                console.warn("No models found in models.json. Viewer might be empty.");
                if (productNameDisplay) productNameDisplay.textContent = "No Products Available";
                populateColorOptions([]); // Clear colors if no models
            }

        } catch (error) {
            console.error("Error fetching or processing models data:", error);
            alert(`Error loading product models. Please check 'models.json' file content and browser console for details: ${error.message}`);
            if (productNameDisplay) productNameDisplay.textContent = "Error Loading Products";
        }
    }

    function populateProductDropdown(models) {
        if (models.length === 0) {
            console.warn("No models found to populate the dropdown.");
            return;
        }

        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.src;
            option.textContent = model.name;
            productSelect.appendChild(option);
        });
        console.log("Product dropdown populated.");
    }

    function loadModel(modelSrc) {
        if (modelViewer && modelSrc) {
            modelViewer.src = modelSrc;
            modelViewer.cameraOrbit = "0deg 75deg 105%";
            console.log("Model loaded:", modelSrc);
        } else {
            console.warn("Model viewer element or source path is missing.");
        }
    }

    // --- New function to populate color options ---
    function populateColorOptions(colors) {
        if (!colorOptionsContainer) {
            console.warn("Color options container not found.");
            return;
        }

        // Clear existing swatches but keep the add button if it exists
        const addButton = colorOptionsContainer.querySelector('.color-add-button');
        colorOptionsContainer.innerHTML = '';
        if (addButton) {
            colorOptionsContainer.appendChild(addButton);
        }

        if (colors && colors.length > 0) {
            colors.forEach((color, index) => {
                const swatch = document.createElement('div');
                swatch.classList.add('color-swatch');
                swatch.style.backgroundColor = color;
                // Make the first swatch active by default, or you can add logic to match model's current color
                if (index === 0) {
                    swatch.classList.add('active');
                }
                // Add event listener for color selection if you want to change model color
                swatch.addEventListener('click', () => {
                    // Implement logic here to change the model's material color
                    // This is complex and depends on your GLB's material setup
                    // For now, it just changes the active state of the swatch
                    colorOptionsContainer.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                    swatch.classList.add('active');
                    console.log("Selected color:", color);
                });
                colorOptionsContainer.insertBefore(swatch, addButton); // Insert before the add button
            });
        } else {
            const noColorsMessage = document.createElement('span');
            noColorsMessage.textContent = 'No colors available for this product.';
            noColorsMessage.style.fontSize = '12px';
            noColorsMessage.style.color = '#777';
            colorOptionsContainer.insertBefore(noColorsMessage, addButton);
            console.log("No colors specified for this model.");
        }
    }

    function updateProductDetails(model) {
        console.log("Updating product details for model:", model);

        if (productNameDisplay) {
            productNameDisplay.textContent = model.name || "Unknown Product";
        }

        if (dimensionHeightDisplay) {
            const heightCm = model.height !== undefined ? (model.height * 100).toFixed(1) : 'N/A';
            dimensionHeightDisplay.textContent = `${heightCm}cm`;
        } else { console.warn("dimensionHeightDisplay element not found."); }
        
        if (dimensionWidthDisplay) {
            const widthCm = model.width !== undefined ? (model.width * 100).toFixed(1) : 'N/A';
            dimensionWidthDisplay.textContent = `${widthCm}cm`;
        } else { console.warn("dimensionWidthDisplay element not found."); }
        
        if (dimensionDepthDisplay) {
            const depthCm = model.depth !== undefined ? (model.depth * 100).toFixed(1) : 'N/A';
            dimensionDepthDisplay.textContent = `${depthCm}cm`;
        } else { console.warn("dimensionDepthDisplay element not found."); }
        
        console.log("Dimensions attempted to update to (in CM):", model.height * 100, model.width * 100, model.depth * 100);
    }

    productSelect.addEventListener('change', (event) => {
        const selectedModelSrc = event.target.value;
        if (selectedModelSrc) {
            loadModel(selectedModelSrc);
            const selectedModel = allModelsData.find(model => model.src === selectedModelSrc);
            if (selectedModel) {
                updateProductDetails(selectedModel);
                populateColorOptions(selectedModel.colors); // Update colors when product changes
            }
        } else {
            modelViewer.src = ''; 
            if (productNameDisplay) productNameDisplay.textContent = "Select a Product";
            if (dimensionHeightDisplay) dimensionHeightDisplay.textContent = 'N/A';
            if (dimensionWidthDisplay) dimensionWidthDisplay.textContent = 'N/A';
            if (dimensionDepthDisplay) dimensionDepthDisplay.textContent = 'N/A';
            console.log("No product selected or default option chosen.");
            populateColorOptions([]); // Clear colors if no product is selected
        }
    });

    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            if (modelViewer.src) {
                const currentSrc = modelViewer.src;
                modelViewer.src = '';
                modelViewer.src = currentSrc;
                modelViewer.cameraOrbit = "0deg 75deg 105%";
                console.log("Model refreshed and camera reset.");
            }
        });
    }

    if (arButton) {
        arButton.addEventListener('click', () => {
            console.log("AR button clicked.");
            console.log("modelViewer.ar:", modelViewer.ar);
            console.log("modelViewer.src:", modelViewer.src);

            if (modelViewer.ar && modelViewer.src) {
                modelViewer.activateAR();
                console.log("Attempting to activate AR...");
            } else {
                let errorMessage = "AR activation failed.";
                if (!modelViewer.ar) {
                    errorMessage += " AR not supported on this device/browser, or requires HTTPS (for live deployment).";
                }
                if (!modelViewer.src) {
                    errorMessage += " No 3D model is currently loaded.";
                }
                alert(errorMessage + " Check console for more details.");
                console.error(errorMessage);
            }
        });
    } else {
        console.error("AR button element not found.");
    }

    if (brightnessSlider && modelViewer) {
        brightnessSlider.addEventListener('input', (event) => {
            const sliderValue = parseFloat(event.target.value);
            modelViewer.exposure = sliderValue / 50; 
            console.log("Brightness set to:", modelViewer.exposure);
        });
    } else {
        console.warn("Brightness slider or model-viewer not found for brightness control.");
    }

    fetchModelsData();
});