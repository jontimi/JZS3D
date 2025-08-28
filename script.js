window.onload = () => {
    const productSelect = document.querySelector('.category-select');
    const modelViewer = document.getElementById('product-model');
    const cleanViewer = document.getElementById('cleanModelViewer');
    const productNameDisplay = document.querySelector('.product-name');
    const dimensionHeightDisplay = document.querySelector('.dimension-height');
    const dimensionWidthDisplay = document.querySelector('.dimension-width');
    const dimensionDepthDisplay = document.querySelector('.dimension-depth');
    const colorOptionsContainer = document.querySelector('.color-options');
    const materialOptionsContainer = document.querySelector('.material-options');
    const brightnessSlider = document.querySelector('.brightness-slider');
    const qrModal = document.getElementById('qrModal');
    const qrcodeDiv = document.getElementById('qrcode');
    const closeButton = qrModal ? qrModal.querySelector('.close-button') : null;

    // Ensure QR modal is hidden on load
    if (qrModal) {
        qrModal.style.display = 'none';
    }

    let allModelsData = [];
    let currentModelData = null;
    let currentModelSrc = '';

    // Default camera settings
    let initialCameraOrbit = '0deg 75deg 4m';
    let initialFieldOfView = '45deg';
    let initialCameraTarget = '0m 0m 0m';
    let initialCameraSet = false;

    async function fetchModelsData() {
        try {
            const response = await fetch('./models.json');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            allModelsData = await response.json();

            if (allModelsData.length > 0) {
                populateProductDropdown();
                const defaultModel = allModelsData.find(m => m.name === "Mario Floor Lamp") || allModelsData[0];
                if (defaultModel) {
                    productSelect.value = defaultModel.name;
                    loadModel(defaultModel);
                }
            } else {
                console.error("models.json is empty or invalid.");
            }
        } catch (error) {
            console.error("Error fetching or parsing models.json:", error);
            alert("Failed to load model data. Please check the console for details.");
        }
    }

    function populateProductDropdown() {
        if (!productSelect) return;
        productSelect.innerHTML = '';
        allModelsData.forEach(model => {
            const option = document.createElement('option');
            option.value = model.name;
            option.textContent = model.name;
            productSelect.appendChild(option);
        });
    }

    function loadModel(model) {
        currentModelData = model;

        modelViewer.addEventListener('load', function setInitialCamera() {
            if (!initialCameraSet) {
                initialCameraOrbit = modelViewer.getAttribute('camera-orbit') || '0deg 75deg 4m';
                initialFieldOfView = modelViewer.getAttribute('field-of-view') || '45deg';
                initialCameraTarget = modelViewer.getAttribute('camera-target') || '0m 0m 0m';
                initialCameraSet = true;
            }

            if (cleanViewer) {
                cleanViewer.setAttribute('camera-orbit', modelViewer.getAttribute('camera-orbit'));
                cleanViewer.setAttribute('field-of-view', modelViewer.getAttribute('field-of-view'));
                cleanViewer.setAttribute('camera-target', modelViewer.getAttribute('camera-target'));
            }
            modelViewer.removeEventListener('load', setInitialCamera);
        });

        // Apply camera settings from models.json if available
        if (model.camera && model.camera.cameraOrbit) {
            modelViewer.cameraOrbit = model.camera.cameraOrbit;
        }

        // Apply scale settings from models.json if available
        if (model.scale) {
            modelViewer.scale = model.scale;
            if (cleanViewer) {
                cleanViewer.scale = model.scale;
            }
        } else {
            modelViewer.scale = "1 1 1";
            if (cleanViewer) {
                cleanViewer.scale = "1 1 1";
            }
        }

        if (model.variants && model.variants.length > 0) {
            currentModelSrc = model.variants[0].src;
        } else {
            currentModelSrc = model.src;
        }

        updateModelViewer(currentModelSrc);
        updateProductInfo(model);
        renderColorSwatches(model);
        updateMaterials(model.materials);
    }

    function updateModelViewer(src) {
        if (!modelViewer) return;
        console.log(`Updating model viewer with src: ${src}`); // Debug log
        modelViewer.src = src;
        if (cleanViewer) {
            cleanViewer.src = src;
        }
    }

    function updateProductInfo(model) {
        if (productNameDisplay) productNameDisplay.textContent = model.name;
        if (dimensionHeightDisplay) dimensionHeightDisplay.textContent = `${(model.height * 100).toFixed(1)}cm`;
        if (dimensionWidthDisplay) dimensionWidthDisplay.textContent = `${(model.width * 100).toFixed(1)}cm`;
        if (dimensionDepthDisplay) dimensionDepthDisplay.textContent = `${(model.depth * 100).toFixed(1)}cm`;
    }

    function renderColorSwatches(model) {
        if (!colorOptionsContainer) return;
        colorOptionsContainer.innerHTML = '';

        const swatchesData = model.variants || (model.colors ? model.colors.map(c => ({ color: c })) : []);

        swatchesData.forEach((data, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = data.color;
            swatch.title = data.name || data.color;

            // Only make swatches clickable if there are multiple variants
            if (model.variants && model.variants.length > 1) {
                swatch.style.cursor = 'pointer';
                swatch.addEventListener('click', () => {
                    console.log(`Swatch clicked! Changing model to: ${data.src}`);
                    console.log(`Model data:`, data); // Debug log
                    currentModelSrc = data.src;
                    updateModelViewer(currentModelSrc);
                    setActiveSwatch(swatch);
                });
            } else {
                swatch.style.cursor = 'default';
            }

            colorOptionsContainer.appendChild(swatch);

            if (index === 0) {
                setActiveSwatch(swatch);
            }
        });
    }

    function setActiveSwatch(activeSwatch) {
        const swatches = colorOptionsContainer.querySelectorAll('.color-swatch');
        swatches.forEach(s => s.classList.remove('active'));
        if (activeSwatch) {
            activeSwatch.classList.add('active');
        }
    }

    function updateMaterials(materials) {
        if (!materialOptionsContainer) return;
        materialOptionsContainer.innerHTML = '';
        if (materials && Array.isArray(materials)) {
            materials.forEach(material => {
                const tag = document.createElement('span');
                tag.className = 'material-tag';
                tag.textContent = material;
                materialOptionsContainer.appendChild(tag);
            });
        }
    }

    function generateAndShowQRCode() {
        if (!currentModelSrc) {
            alert("Please select a product first.");
            return;
        }
        if (!qrcodeDiv || !qrModal) return;

        console.log("Generating QR for model:", currentModelSrc); // Debug log

        qrcodeDiv.innerHTML = '';
        let base = window.location.href;
        // Check if the URL ends with a file name (e.g., index.html) and remove it
        if (base.endsWith('.html') || base.endsWith('.htm')) {
            base = base.substring(0, base.lastIndexOf('/') + 1);
        }
        const modelUrl = `${base}${currentModelSrc}`;

        console.log("Full AR URL:", modelUrl); // Debug log

        const arUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_only`;

        new QRCode(qrcodeDiv, {
            text: arUrl,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        qrModal.style.display = 'flex';
    }

    function resetModelCamera(viewer) {
        if (viewer) {
            // Use the camera settings from the model data if available, otherwise use default
            if (currentModelData && currentModelData.camera && currentModelData.camera.cameraOrbit) {
                viewer.cameraOrbit = currentModelData.camera.cameraOrbit;
            } else {
                viewer.setAttribute('camera-orbit', initialCameraOrbit);
            }
            viewer.setAttribute('field-of-view', initialFieldOfView);
            viewer.setAttribute('camera-target', initialCameraTarget);
        }
    }

    // Event Listeners
    if (productSelect) {
        productSelect.addEventListener('change', (event) => {
            const selectedModel = allModelsData.find(m => m.name === event.target.value);
            if (selectedModel) loadModel(selectedModel);
        });
    }

    document.querySelectorAll('.desktop-qr-button').forEach(button => {
        button.addEventListener('click', generateAndShowQRCode);
    });

    document.querySelectorAll('.refresh-button').forEach(button => {
        button.addEventListener('click', () => {
            resetModelCamera(modelViewer);
            if (cleanViewer.style.display !== 'none') {
                resetModelCamera(cleanViewer);
            }
        });
    });

    if (closeButton) {
        closeButton.addEventListener('click', () => qrModal.style.display = 'none');
    }

    window.addEventListener('click', (event) => {
        if (event.target === qrModal) {
            qrModal.style.display = 'none';
        }
    });

    if (brightnessSlider && modelViewer) {
        brightnessSlider.addEventListener('input', (event) => {
            modelViewer.exposure = parseFloat(event.target.value) / 50;
            if (cleanViewer) cleanViewer.exposure = modelViewer.exposure;
        });
    }

    // Clean View Toggle
    const toggleBtn = document.getElementById('toggleCleanViewBtn');
    const cleanContainer = document.getElementById('cleanViewContainer');
    const appContainer = document.querySelector('.app-container');

    if (toggleBtn && cleanContainer && appContainer) {
        toggleBtn.addEventListener('click', () => {
            const isClean = appContainer.style.display === 'none';
            if (isClean) {
                appContainer.style.display = '';
                cleanContainer.style.display = 'none';
                toggleBtn.textContent = "Clean View";
            } else {
                appContainer.style.display = 'none';
                cleanContainer.style.display = 'block';
                toggleBtn.textContent = "Advanced View";
                if (cleanViewer) {
                    cleanViewer.cameraOrbit = modelViewer.cameraOrbit;
                    cleanViewer.cameraTarget = modelViewer.cameraTarget;
                    cleanViewer.fieldOfView = modelViewer.fieldOfView;
                }
            }
        });
    }

    fetchModelsData();
};
