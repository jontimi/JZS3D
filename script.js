document.addEventListener('DOMContentLoaded', () => {
    const modelSelect = document.getElementById('modelSelect');
    const mainViewer = document.getElementById('mainViewer');
    const nightModeToggle = document.getElementById('nightModeToggle');
    const LOCAL_STORAGE_THEME_KEY = 'theme';

    // Load models.json and populate dropdown
    fetch('models.json')
        .then(res => res.json())
        .then(models => {
            models.forEach((model, i) => {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = model.name;
                modelSelect.appendChild(option);
            });
            // Set initial model
            if (models.length > 0) {
                mainViewer.src = models[0].src;
            }
            modelSelect.addEventListener('change', () => {
                mainViewer.src = models[modelSelect.value].src;
            });
        });

    // Night mode toggle
    function applyTheme(theme) {
        if (theme === 'night') {
            document.body.classList.add('night');
            nightModeToggle.textContent = 'Toggle Light Mode';
        } else {
            document.body.classList.remove('night');
            nightModeToggle.textContent = 'Toggle Night Mode';
        }
    }
    function toggleTheme() {
        const currentTheme = document.body.classList.contains('night') ? 'night' : 'light';
        const newTheme = currentTheme === 'night' ? 'light' : 'night';
        localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme);
        applyTheme(newTheme);
    }
    nightModeToggle.addEventListener('click', toggleTheme);

    // Apply saved theme on load
    const savedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || 'light';
    applyTheme(savedTheme);
});