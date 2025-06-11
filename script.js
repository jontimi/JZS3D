document.addEventListener('DOMContentLoaded', async () => {
  const select = document.getElementById('modelSelect');
  const viewer = document.getElementById('mainViewer');
  const nightModeToggle = document.getElementById('nightModeToggle');
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
});