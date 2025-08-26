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

    let allModelsData = [];
    let currentModelData = null;
    let currentModelSrc = '';
    let currentModelDefaultCamera = null;

    async function fetchModelsData() {
        try {
            const response = await fetch('./models.json');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            allModelsData = await response.json();
            
            if (allModelsData.length > 0) {
                populateProductDropdown();
                const defaultModel = allModelsData.find(m => m.name === "Dolton Armchair Hudson") || allModelsData[0];
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

        if (model.camera) {
            currentModelDefaultCamera = model.camera;
            updateCamera(currentModelDefaultCamera);
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

    function updateCamera(cameraSettings) {
        if (!modelViewer || !cameraSettings) return;
        modelViewer.cameraOrbit = cameraSettings.cameraOrbit;
        modelViewer.cameraTarget = cameraSettings.cameraTarget;
        modelViewer.fieldOfView = cameraSettings.fieldOfView;

        if (cleanViewer) {
            cleanViewer.cameraOrbit = cameraSettings.cameraOrbit;
            cleanViewer.cameraTarget = cameraSettings.cameraTarget;
            cleanViewer.fieldOfView = cameraSettings.fieldOfView;
        }
    }

    function updateModelViewer(src) {
        if (!modelViewer) return;
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

            if (model.variants && model.variants.length > 1) {
                swatch.addEventListener('click', () => {
                    currentModelSrc = data.src;
                    updateModelViewer(currentModelSrc);
                    setActiveSwatch(swatch);
                });
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

        qrcodeDiv.innerHTML = '';
        const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
        const modelUrl = new URL(currentModelSrc, baseUrl).href;

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
            if (currentModelDefaultCamera) {
                updateCamera(currentModelDefaultCamera);
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
             if(cleanViewer) cleanViewer.exposure = modelViewer.exposure;
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
                if(cleanViewer) {
                    cleanViewer.cameraOrbit = modelViewer.cameraOrbit;
                    cleanViewer.cameraTarget = modelViewer.cameraTarget;
                    cleanViewer.fieldOfView = modelViewer.fieldOfView;
                }
            }
        });
    }

    fetchModelsData();
};