window.onload = () => {
    const productSelect = document.querySelector('.category-select');
    const modelViewer = document.getElementById('product-model');
    const refreshButton = document.querySelector('.refresh-button');
    // Removed mobileARButton as a separate element to query; model-viewer handles its own AR button
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
                const marioLampModel = allModelsData.find(model => model.name === "Mario Floor Lamp");
                let defaultModel;

                if (marioLampModel) {
                    defaultModel = marioLampModel;
                    console.log("Setting Mario Floor Lamp as default.");
                } else {
                    defaultModel = allModelsData[0]; // Fallback to the first model if Mario is not found
                    console.warn("Mario Floor Lamp not found in models.json. Loading the first available model instead.");
                }

                loadModel(defaultModel.src);
                updateProductDetails(defaultModel);
                populateColorOptions(defaultModel.colors);
                populateMaterialOptions(defaultModel.materials);
                productSelect.value = defaultModel.src; // Set the dropdown to the default model
                if (brightnessSlider && modelViewer) {
                    brightnessSlider.value = modelViewer.exposure * 50;
                }
            } else {
                console.warn("No models found in models.json. Viewer might be empty.");
                if (productNameDisplay) productNameDisplay.textContent = "No Products Available";
                populateColorOptions([]);
                populateMaterialOptions([]);
            }
            // setupARButtons is called by loadModel now for initial and subsequent loads
        }
        catch (error) {
            console.error("Error fetching or processing models data:", error);
            alert(`Error loading product models. Please check 'models.json' file content and browser console for details: ${error.message}`);
            if (productNameDisplay) productNameDisplay.textContent = "Error Loading Products";
        }
    }

    function setupARButtons() {
        // modelViewer.canActivateAR checks if AR is supported on the device
        if (modelViewer.canActivateAR) {
            // On AR-capable devices, enable model-viewer's native AR mode
            modelViewer.setAttribute('ar', '');
            modelViewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
            desktopQRButton.style.display = 'none'; // Hide the custom QR button
            console.log("AR supported: Enabling native AR button and hiding QR button.");
        } else {
            // On non-AR devices (e.g., desktop), disable model-viewer's AR and show QR button
            modelViewer.removeAttribute('ar');
            modelViewer.removeAttribute('ar-modes');
            desktopQRButton.style.display = 'block'; // Show the custom QR button
            console.log("AR not supported: Hiding native AR button and showing QR button.");
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
            currentModelSrc = modelSrc;
            currentModelData = allModelsData.find(model => model.src === modelSrc); // Store the full model data
            console.log("Model loaded:", modelSrc);
            setupARButtons(); // Recalibrate AR buttons after new model loads
        } else {
            console.warn("Model viewer element or source path is missing.");
        }
    }

    function populateColorOptions(colors) {
        if (!colorOptionsContainer) {
            console.warn("Color options container not found.");
            return;
        }
        const addButton = colorOptionsContainer.querySelector('.color-add-button');
        colorOptionsContainer.querySelectorAll('.color-swatch, span').forEach(el => {
            if (el !== addButton) el.remove();
        });
        if (addButton) {
             colorOptionsContainer.appendChild(addButton);
        }
        if (colors && colors.length > 0) {
            colors.forEach((color, index) => {
                const swatch = document.createElement('div');
                swatch.classList.add('color-swatch');
                swatch.style.backgroundColor = color;
                if (index === 0) {
                    swatch.classList.add('active');
                }
                swatch.addEventListener('click', () => {
                    colorOptionsContainer.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                    swatch.classList.add('active');
                    console.log("Selected color:", color);
                });
                colorOptionsContainer.insertBefore(swatch, addButton);
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

    function populateMaterialOptions(materials) {
        if (!materialOptionsContainer) {
            console.warn("Material options container not found.");
            return;
        }
        materialOptionsContainer.innerHTML = '';
        if (materials && materials.length > 0) {
            materials.forEach(material => {
                const tag = document.createElement('span');
                tag.classList.add('material-tag');
                tag.textContent = material;
                materialOptionsContainer.appendChild(tag);
            });
        } else {
            const noMaterialsMessage = document.createElement('span');
            noMaterialsMessage.textContent = 'No materials specified for this product.';
            noMaterialsMessage.style.fontSize = '12px';
            noMaterialsMessage.style.color = '#777';
            materialOptionsContainer.appendChild(noMaterialsMessage);
            console.log("No materials specified for this model.");
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
                populateColorOptions(selectedModel.colors);
                populateMaterialOptions(selectedModel.materials);
            }
        } else {
            modelViewer.src = ''; 
            if (productNameDisplay) productNameDisplay.textContent = "Select a Product";
            if (dimensionHeightDisplay) dimensionHeightDisplay.textContent = 'N/A';
            if (dimensionWidthDisplay) dimensionWidthDisplay.textContent = 'N/A';
            if (dimensionDepthDisplay) dimensionDepthDisplay.textContent = 'N/A';
            console.log("No product selected or default option chosen.");
            populateColorOptions([]);
            populateMaterialOptions([]);
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

    if (desktopQRButton) {
        desktopQRButton.addEventListener('click', () => {
            console.log("Desktop QR button clicked."); 

            // CRITICAL FIX: Use 'QRCode' as defined by qrcode.min.js
            if (typeof QRCode === 'undefined' || typeof QRCode !== 'function') {
                console.error("QRCode library is not loaded or not properly defined. 'QRCode' is not a function.");
                alert("QR code generation failed. Please try a hard refresh (Ctrl+F5) and check the browser console for details.");
                return; 
            }

            if (!qrcodeDiv) {
                console.error("The 'qrcode' div element was not found in the DOM.");
                alert("Cannot display QR code. Missing 'qrcode' element.");
                return; 
            }

            if (currentModelData) { 
                // CRITICAL FIX: Ensure the model URL includes the repository name for GitHub Pages
                const modelUrl = `https://jontimi.github.io/JZS-AR-SHOWCASE/${currentModelData.src}`;
                
                const arUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_only`;
                
                console.log("Final AR URL for QR Code:", arUrl);
                
                qrcodeDiv.innerHTML = ''; // Clear existing QR code content

                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 256;
                qrcodeDiv.appendChild(canvas);

                try {
                    // CRITICAL FIX: Use 'new QRCode'
                    new QRCode(canvas, {
                        text: arUrl,
                        width: 256,
                        height: 256,
                        colorDark : "#000000",
                        colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.H // High error correction
                    });
                    console.log("QR Code successfully generated for URL:", arUrl);
                } catch (error) {
                    console.error("Error generating QR code:", error);
                    alert("An error occurred while generating the QR code. See console for details.");
                    return; 
                }
                
                qrModal.style.display = 'flex';
            } else {
                alert("Please select a product first to generate the AR QR code.");
            }
        });
    }

    // No explicit click listener needed for model-viewer's native AR button.
    // It's handled by model-viewer itself when 'ar' attribute is present.

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            qrModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target == qrModal) {
            qrModal.style.display = 'none';
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

    fetchModelsData();
};