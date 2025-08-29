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

                <!-- 3D Viewer will go here in Phase 2 -->
                <div style="width: 100%; height: 250px; background: #eee; text-align: center; line-height: 250px; margin-bottom: 1rem;">3D Model Placeholder</div>

                <div class="color-swatches">
                    <!-- Color swatches will be rendered here in Phase 3 -->
                </div>

                <button class="ar-button">View in AR</button>
            </div>
        `).join('');
    }

    loadProducts();
});
