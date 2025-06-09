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

            // Set the first model as default and fit it
            const firstModel = models[0];
            if (firstModel) {
                mainViewer.src = firstModel.path;
                mainViewer.addEventListener('load', function handler() {
                    mainViewer.reset();
                    mainViewer.removeEventListener('load', handler);
                });
            }
        });

    modelSelect.addEventListener('change', () => {
        mainViewer.src = modelSelect.value;
        mainViewer.addEventListener('load', function handler() {
            mainViewer.reset();
            mainViewer.removeEventListener('load', handler);
        });
    });

    nightModeToggle.addEventListener('click', () => {
        body.classList.toggle('night');
        nightModeToggle.textContent = body.classList.contains('night') ? 'Toggle Light Mode' : 'Toggle Night Mode';
    });

    // QR code AR button for desktop - always use the currently selected model
    document.getElementById('showQR').onclick = function() {
      const modelUrl = document.getElementById('modelSelect').value;
      const qrDiv = document.getElementById('qrCode');
      qrDiv.innerHTML = '';
      // Build the viewer URL using the current site base
      const basePath = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
      const viewerUrl = basePath + '/viewer.html?model=' + encodeURIComponent(modelUrl);
      const img = document.createElement('img');
      img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(viewerUrl);
      qrDiv.appendChild(img);
      qrDiv.style.display = 'block';
    };
});