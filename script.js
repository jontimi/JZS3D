document.addEventListener('DOMContentLoaded', async () => {
  const select = document.getElementById('modelSelect');
  const viewer = document.getElementById('mainViewer');
  const nightModeToggle = document.getElementById('nightModeToggle');
  const arQrBtn = document.getElementById('arQrBtn');
  const qrModal = document.getElementById('qrModal');
  const qrCanvas = document.getElementById('qrCanvas');
  const closeQr = document.getElementById('closeQr');
  const body = document.body;

  // Load models list from models.json
  const response = await fetch('models.json');
  const categories = await response.json();

  // Populate dropdown with categories
  categories.forEach(category => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = category.category;
    category.models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.url;
      option.textContent = model.name;
      optgroup.appendChild(option);
    });
    select.appendChild(optgroup);
  });

  // Set initial model
  const firstCategory = categories[0];
  if (firstCategory && firstCategory.models.length > 0) {
    viewer.src = firstCategory.models[0].url;
  }

  // Change model on selection
  select.addEventListener('change', () => {
    viewer.src = select.value;
  });

  nightModeToggle.addEventListener('click', () => {
    body.classList.toggle('night');
    nightModeToggle.textContent = body.classList.contains('night') ? 'Toggle Light Mode' : 'Toggle Night Mode';
  });

  // AR QR Button logic
  arQrBtn.addEventListener('click', () => {
    const modelUrl = new URL(viewer.src, window.location.origin).href;
    // Always use Scene Viewer intent for Android and most devices
    const arLink = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}&mode=ar_only`;

    const qr = new QRious({
      element: qrCanvas,
      value: arLink,
      size: 256,
      level: 'H'
    });

    qrModal.style.display = 'flex';
  });

  closeQr.addEventListener('click', () => {
    qrModal.style.display = 'none';
  });

  // Optional: close modal on background click
  qrModal.addEventListener('click', (e) => {
    if (e.target === qrModal) qrModal.style.display = 'none';
  });
});