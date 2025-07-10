document.addEventListener('DOMContentLoaded', () => {
    const productSelect = document.querySelector('.category-select');
    const modelViewer = document.getElementById('product-model');
    const refreshButton = document.querySelector('.refresh-button');
    const mobileARButton = document.querySelector('.mobile-ar-button'); 
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

    // Ensure modal is hidden immediately on script load, complementing the inline style
    if (qrModal) {
        qrModal.style.display = 'none';
    }

    // Helper to detect mobile device
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
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
                const defaultModel = allModelsData[0];
                loadModel(defaultModel.src);
                updateProductDetails(defaultModel);
                populateColorOptions(defaultModel.colors);
                populateMaterialOptions(defaultModel.materials);
                productSelect.value = defaultModel.src;
                if (brightnessSlider && modelViewer) {
                    brightnessSlider.value = modelViewer.exposure * 50;
                }
            } else {
                console.warn("No models found in models.json. Viewer might be empty.");
                if (productNameDisplay) productNameDisplay.textContent = "No Products Available";
                populateColorOptions([]);
                populateMaterialOptions([]);
            }
            setupARButtons(); // This is called after initial data load
        } catch (error) {
            console.error("Error fetching or processing models data:", error);
            alert(`Error loading product models. Please check 'models.json' file content and browser console for details: ${error.message}`);
            if (productNameDisplay) productNameDisplay.textContent = "Error Loading Products";
        }
    }

    function setupARButtons() {
        if (isMobile()) {
            mobileARButton.style.display = 'block'; // Show native button
            desktopQRButton.style.display = 'none'; // Hide custom QR button
            modelViewer.setAttribute('ar', ''); // Enable AR mode
            modelViewer.setAttribute('ar-modes', 'scene-viewer quick-look webxr'); // Mobile AR modes
            console.log("Mobile device detected: Showing native AR button.");
        } else {
            mobileARButton.style.display = 'none'; // Ensure native AR button is hidden
            desktopQRButton.style.display = 'block'; // Show custom QR button
            modelViewer.removeAttribute('ar'); // Remove AR attribute
            modelViewer.removeAttribute('ar-modes'); // Remove AR modes
            
            // This explicit check for `modelViewer.canActivateAR` might be useful for debugging
            // but `model-viewer` usually handles its own button visibility based on AR support.
            // if (modelViewer.canActivateAR) {
            //     // This means the desktop CAN support WebXR, so a different button logic might be needed
            //     // However, for QR code, we assume it's for devices that *can't* directly run WebXR.
            //     console.log("Desktop is WebXR capable, but showing QR for mobile fallback.");
            // }

            console.log("Desktop device detected: Showing QR button. Model-viewer AR attributes removed.");
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
            console.log("Model loaded:", modelSrc);
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
                // Temporarily clear src to force re-render, then set back
                modelViewer.src = '';
                modelViewer.src = currentSrc;
                modelViewer.cameraOrbit = "0deg 75deg 105%"; // Reset camera view
                console.log("Model refreshed and camera reset.");
            }
        });
    }

    if (desktopQRButton) {
        desktopQRButton.addEventListener('click', () => {
            // Check if QRCode is defined before using it
            if (typeof QRCode === 'undefined') {
                console.error("QRCode library is not loaded. Cannot generate QR code.");
                alert("QR code generation failed. Please refresh the page (Ctrl+F5) and check console for errors.");
                return; // Exit if QRCode is not defined
            }

            if (currentModelSrc) {
                // Construct the full URL to the GLB model
                // window.location.origin gives "http://127.0.0.1:5500"
                // currentModelSrc gives "models/Sofas/wasily_chair.glb"
                // Combined: "http://127.0.0.1:5500/models/Sofas/wasily_chair.glb"
                const modelUrl = window.location.origin + '/' + currentModelSrc; 
                
                // This is the correct HTTPS Scene Viewer URL for QR codes
                // It works on iOS (Quick Look) and Android (Scene Viewer app)
                const arUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_only`;
                
                // Clear previous QR code and generate new one
                qrcodeDiv.innerHTML = ''; // Clear existing QR to prevent duplicates
                new QRCode(qrcodeDiv, {
                    text: arUrl,
                    width: 256,
                    height: 256,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H // High error correction
                });
                qrModal.style.display = 'flex'; // Show the modal
                console.log("QR Code generated for URL:", arUrl);
            } else {
                alert("Please select a product first to generate the AR QR code.");
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            qrModal.style.display = 'none'; // Hide the modal
        });
    }

    // Close modal if user clicks outside of it
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

    // Initial data fetch and setup when the page loads
    fetchModelsData();
});