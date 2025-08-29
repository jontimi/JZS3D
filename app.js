document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');

    async function loadProducts() {
        try {
            const response = await fetch('products.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            renderProducts(products);
        } catch (error) {
            console.error("Could not load products:", error);
            productGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
        }
    }

    function renderProducts(products) {
        if (!products || products.length === 0) {
            productGrid.innerHTML = '<p>No products found.</p>';
            return;
        }

        productGrid.innerHTML = products.map(product => `
            <div class="product-card" id="product-${product.id}">
                <h2>${product.name}</h2>
                <div class="dimensions">
                    <strong>Dimensions:</strong>
                    ${product.dimensions.width}m (W) &times;
                    ${product.dimensions.height}m (H) &times;
                    ${product.dimensions.depth}m (D)
                </div>
                <div class="materials">
                    <strong>Materials:</strong> ${product.materials.join(', ')}
                </div>

                <model-viewer
                    src="${product.variants[0].src}"
                    alt="${product.name}"
                    camera-controls
                    auto-rotate
                    camera-orbit="${product.camera.orbit}"
                    camera-target="${product.camera.target}"
                    id="viewer-${product.id}">
                </model-viewer>

                <div class="controls">
                    <button class="reset-view-button" data-product-id="${product.id}">Reset View</button>
                </div>

                <div class="color-swatches" id="swatches-${product.id}">
                    ${product.variants.map(variant => `
                        <div class="color-swatch"
                             style="background-color: ${variant.color};"
                             data-src="${variant.src}"
                             data-product-id="${product.id}">
                        </div>
                    `).join('')}
                </div>

                <button class="ar-button" data-product-id="${product.id}">View in AR</button>
            </div>
        `).join('');

        addEventListeners();
    }

    function addEventListeners() {
        document.querySelectorAll('.reset-view-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.productId;
                const viewer = document.getElementById(`viewer-${productId}`);
                const product = getProductById(productId);
                if (viewer && product) {
                    viewer.cameraOrbit = product.camera.orbit;
                    viewer.cameraTarget = product.camera.target;
                }
            });
        });

        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (event) => {
                const swatchEl = event.target;
                const productId = swatchEl.dataset.productId;
                const viewer = document.getElementById(`viewer-${productId}`);
                if (viewer) {
                    viewer.src = swatchEl.dataset.src;
                }
            });
        });

        document.querySelectorAll('.ar-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = event.target.dataset.productId;
                const viewer = document.getElementById(`viewer-${productId}`);
                if (viewer) {
                    const modelSrc = viewer.src;
                    window.open(`viewer.html?model=${encodeURIComponent(modelSrc)}`, '_blank');
                }
            });
        });

        const viewModeToggle = document.getElementById('view-mode-toggle');
        viewModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('advanced-view');
            const isAdvanced = document.body.classList.contains('advanced-view');
            viewModeToggle.textContent = isAdvanced ? 'Clean View' : 'Advanced View';
        });
    }

    let allProducts = [];
    function getProductById(id) {
        return allProducts.find(p => p.id === id);
    }

    async function loadProducts() {
        try {
            const response = await fetch('products.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allProducts = await response.json();
            renderProducts(allProducts);
        } catch (error) {
            console.error("Could not load products:", error);
            productGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
        }
    }

    loadProducts();
});
