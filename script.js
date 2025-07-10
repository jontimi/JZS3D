window.onload = () => {
    // ... (rest of your existing constants and variables)

    let allModelsData = [];
    let currentModelSrc = ''; 
    let currentModelData = null; 

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
                // --- MODIFICATION STARTS HERE ---
                // Find the Mario Floor Lamp specifically
                const marioLampModel = allModelsData.find(model => model.name === "Mario Floor Lamp");
                let defaultModel = allModelsData[0]; // Fallback to the first model if Mario is not found

                if (marioLampModel) {
                    defaultModel = marioLampModel;
                    console.log("Setting Mario Floor Lamp as default.");
                } else {
                    console.warn("Mario Floor Lamp not found in models.json. Loading the first available model instead.");
                }
                // --- MODIFICATION ENDS HERE ---

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
            setupARButtons();
        } catch (error) {
            console.error("Error fetching or processing models data:", error);
            alert(`Error loading product models. Please check 'models.json' file content and browser console for details: ${error.message}`);
            if (productNameDisplay) productNameNameDisplay.textContent = "Error Loading Products";
        }
    }

    // ... (rest of your script.js code)
};