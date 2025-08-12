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
                console.error(`HTTP error! Status: ${response.status} when fetching models.json. ` + 
                              `Please check if 'models.json' exists at the root and your live server is running correctly.`);
                alert(`Error loading model data: Server responded with status ${response.status}. Please check your browser's console for details (F12).`);
                return; // Stop execution if response is not OK
            }

            // Attempt to parse JSON
            let jsonData = await response.json();
            allModelsData = jsonData;
            
            console.log("Fetched models data (allModelsData):", allModelsData); 

            if (allModelsData.length > 0) {
                console.log("Model data loaded successfully. Populating dropdown and loading default model.");
                populateProductDropdown();
                
                const marioLamp = allModelsData.find(model => model.name === "Mario Floor Lamp");
                if (marioLamp) {
                    loadModel(marioLamp);
                    if (productSelect) {
                        productSelect.value = "Mario Floor Lamp";
                    }
                    console.log("Mario Floor Lamp set as the default model.");
                } else {
                    console.warn("Mario Floor Lamp not found in models.json, loading the first available model.");
                    const defaultModel = allModelsData[0];
                    if (defaultModel) {
                        loadModel(defaultModel);
                        if (productSelect) {
                            productSelect.value = defaultModel.name;
                        }
                    } else {
                        console.error("No default model (first model) found in models.json array.");
                    }
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

        if (allModelsData.length > 0) {
            console.log("Product dropdown populated successfully.");
        } else {
            console.warn("No models data to populate product dropdown.");
        }
    }

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

        modelViewer.addEventListener('load', function setInitialCamera() {
            if (!initialCameraSet) {
                initialCameraOrbit = modelViewer.getAttribute('camera-orbit');
                initialFieldOfView = modelViewer.getAttribute('field-of-view');
                initialCameraTarget = modelViewer.getAttribute('camera-target');
                initialCameraSet = true;
            }
            if (cleanViewer) {
                cleanViewer.setAttribute('camera-orbit', modelViewer.getAttribute('camera-orbit'));
                cleanViewer.setAttribute('field-of-view', modelViewer.getAttribute('field-of-view'));
                cleanViewer.setAttribute('camera-target', modelViewer.getAttribute('camera-target'));
            }
            modelViewer.removeEventListener('load', setInitialCamera);
        });

        console.log(`Loading model: ${currentModelSrc}`);

        if (productNameDisplay) productNameDisplay.textContent = model.name;
        if (dimensionHeightDisplay) dimensionHeightDisplay.textContent = `${(model.height * 100).toFixed(1)}cm`;
        if (dimensionWidthDisplay) dimensionWidthDisplay.textContent = `${(model.width * 100).toFixed(1)}cm`;
        if (dimensionDepthDisplay) dimensionDepthDisplay.textContent = `${(model.depth * 100).toFixed(1)}cm`;

        updateColors(model.colors);
        updateMaterials(model.materials);
    }

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

        if (colors.length > 0) {
            modelViewer.style.setProperty('--main-color', colors[0]);
        }
    }

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
            resetModelCamera(modelViewer);
            console.log("Refresh button clicked. Camera reset.");
        });
    }

    if (desktopQRButton) {
        desktopQRButton.addEventListener('click', () => {
            if (currentModelData) {
                if (qrcodeDiv) {
                    qrcodeDiv.innerHTML = '';
                } else {
                    console.error("QR Code div (#qrcode) not found in HTML. Cannot generate QR.");
                    alert("QR Code display area missing. Please check your HTML structure for an element with id='qrcode'.");
                    return;
                }

                const baseUrl = 'https://jontimi.github.io/JZS-AR-SHOWCASE/';
                const modelPath = currentModelData.src;
                const fullModelUrl = `${baseUrl}${modelPath}`;
                const arUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(fullModelUrl)}&mode=ar_only`;
                
                console.log("Final AR URL for QR Code:", arUrl);

                try {
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

    const cleanContainer = document.getElementById('cleanViewContainer');
    const cleanViewer = document.getElementById('cleanModelViewer');
    const toggleBtn = document.getElementById('toggleCleanViewBtn');

    let isClean = false;

    function syncCleanViewer() {
        if (modelViewer && cleanViewer) {
            cleanViewer.src = modelViewer.src;
            cleanViewer.setAttribute('camera-orbit', modelViewer.getAttribute('camera-orbit'));
            cleanViewer.setAttribute('field-of-view', modelViewer.getAttribute('field-of-view'));
            cleanViewer.setAttribute('camera-target', modelViewer.getAttribute('camera-target'));
        }
    }

    if (toggleBtn && cleanContainer) {
        toggleBtn.addEventListener('click', () => {
            isClean = !isClean;
            if (isClean) {
                modelViewer.style.display = 'none';
                cleanContainer.style.display = 'block';
                toggleBtn.textContent = "Advanced View";
                syncCleanViewer();
            } else {
                modelViewer.style.display = 'block';
                cleanContainer.style.display = 'none';
                toggleBtn.textContent = "Clean View";
            }
        });
    }

    if (modelViewer) {
        modelViewer.addEventListener('load', syncCleanViewer);
    }

    const cleanQRButton = cleanContainer ? cleanContainer.querySelector('.desktop-qr-button') : null;

    if (cleanQRButton) {
        cleanQRButton.addEventListener('click', () => {
            if (currentModelData) {
                if (qrcodeDiv) qrcodeDiv.innerHTML = '';
                const baseUrl = 'https://jontimi.github.io/JZS-AR-SHOWCASE/';
                const modelPath = currentModelData.src;
                const fullModelUrl = `${baseUrl}${modelPath}`;
                const arUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(fullModelUrl)}&mode=ar_only`;
                new QRCode(qrcodeDiv, {
                    text: arUrl,
                    width: 256,
                    height: 256,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
                qrModal.style.display = 'flex';
            } else {
                alert("Please select a product first to generate the AR QR code.");
            }
        });
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

    const cleanRefreshButton = cleanContainer ? cleanContainer.querySelector('.refresh-button') : null;
    if (cleanRefreshButton && cleanViewer) {
        cleanRefreshButton.addEventListener('click', () => {
            resetModelCamera(cleanViewer);
            console.log("Clean view refresh button clicked. Camera reset.");
        });
    }

    fetchModelsData();
};

function resetModelCamera(viewer) {
    if (viewer) {
        viewer.setAttribute('camera-orbit', initialCameraOrbit);
        viewer.setAttribute('field-of-view', initialFieldOfView);
        viewer.setAttribute('camera-target', initialCameraTarget);
    }
}

let initialCameraOrbit = '0deg 75deg 4m';
let initialFieldOfView = '45deg';
let initialCameraTarget = '0m 0m 0m';
let initialCameraSet = false;