document.addEventListener('DOMContentLoaded', () => {
    const modelSelect = document.getElementById('model-select');
    const modelViewer = document.querySelector('.model-viewer');

    let models = [];

    // --- Fetch models.json ---
    fetch('models.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                console.error('models.json is empty or not an array:', data);
                alert('Error: models data is empty or invalid. Please check models.json.');
                return;
            }
            models = data;
            populateDropdown(models);
            // Initial model load after dropdown is populated
            if (models.length > 0) {
                updateModel(models[0].src, models[0].name);
            }
        })
        .catch(error => {
            console.error('Error loading models.json:', error);
            alert(`Error loading models data: ${error.message}. Please ensure models.json is valid and accessible.`);
        });

    // --- Dropdown Population ---
    function populateDropdown(modelsArray) {
        modelSelect.innerHTML = ''; // Clear existing options
        modelsArray.forEach(model => {
            const option = document.createElement('option');
            option.value = model.src;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });
    }

    // --- Model Update Function ---
    function updateModel(modelSrc, modelName) {
        if (modelViewer) { // Ensure modelViewer exists before trying to set src
            modelViewer.src = modelSrc;
            modelViewer.alt = `A 3D model of ${modelName}`;
            // Optional: You can still try to set a poster if you have them, but it's not critical for basic loading.
            // modelViewer.poster = `images/${modelSrc.split('/').pop().replace('.glb', '')}.webp`; 
        } else {
            console.error("model-viewer element not found!");
            alert("Error: 3D viewer not initialized. Page structure problem.");
        }
    }

    // --- Event Listener for Dropdown ---
    modelSelect.addEventListener('change', (event) => {
        const selectedSrc = event.target.value;
        const selectedModel = models.find(m => m.src === selectedSrc);
        if (selectedModel) {
            updateModel(selectedModel.src, selectedModel.name);
        }
    });
});
