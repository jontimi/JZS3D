document.addEventListener('DOMContentLoaded', () => {
    const modelSelect = document.getElementById('modelSelect');
    const mainViewer = document.getElementById('mainViewer');
    const nightModeToggle = document.getElementById('nightModeToggle');
    const body = document.body;

    fetch('models.json')
        .then(res => res.json())
        .then(models => {
            // Group models by category
            const categories = {};
            models.forEach(model => {
                if (!categories[model.category]) categories[model.category] = [];
                categories[model.category].push(model);
            });

            // Populate dropdown with optgroups
            for (const category in categories) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = category;
                categories[category].forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.path;
                    option.textContent = model.name;
                    optgroup.appendChild(option);
                });
                modelSelect.appendChild(optgroup);
            }

            // Set the first model as default
            const firstModel = models[0];
            if (firstModel) {
                mainViewer.src = firstModel.path;
            }
        });

    modelSelect.addEventListener('change', () => {
        mainViewer.src = modelSelect.value;
    });

    nightModeToggle.addEventListener('click', () => {
        body.classList.toggle('night');
        nightModeToggle.textContent = body.classList.contains('night') ? 'Toggle Light Mode' : 'Toggle Night Mode';
    });
});