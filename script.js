<script type="module" src="https://unpkg.com/@google/model-viewer@3.4.0/dist/model-viewer.min.js"></script>
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
            }
        });

    modelSelect.addEventListener('change', () => {
        mainViewer.src = modelSelect.value;
    });

    nightModeToggle.addEventListener('click', () => {
        body.classList.toggle('night');
        nightModeToggle.textContent = body.classList.contains('night') ? 'Toggle Light Mode' : 'Toggle Night Mode';
    });

    // Built-in model-viewer AR button: Show QR code on desktop
    if (mainViewer) {
        mainViewer.addEventListener('ar-button-click', (event) => {
            // Only show QR on desktop (not on mobile)
            if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                event.preventDefault();
                // Build the viewer URL for mobile AR
                const modelUrl = mainViewer.src;
                const basePath = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
                const viewerUrl = basePath + '/viewer.html?model=' + encodeURIComponent(modelUrl);
                const qrImg = document.createElement('img');
                qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(viewerUrl);
                const qrDiv = document.getElementById('arQrImage');
                qrDiv.innerHTML = '';
                qrDiv.appendChild(qrImg);
                document.getElementById('arQrPopup').style.display = 'flex';
            }
        });
    }
});