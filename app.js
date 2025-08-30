document.addEventListener('DOMContentLoaded', () => {
    const productViewerContainer = document.getElementById('product-viewer-container');
    const productSelect = document.getElementById('product-select');
    const viewModeToggle = document.getElementById('view-mode-toggle');

    let allProducts = [];
    let currentProduct = null;

    async function initializeApp() {
        try {
            const response = await fetch('products.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allProducts = await response.json();

            populateProductSelect();

            if (allProducts.length > 0) {
                const urlParams = new URLSearchParams(window.location.search);
                const productId = urlParams.get('product');
                const variantSrc = urlParams.get('variant');

                let productToLoad = allProducts[0];
                if (productId) {
                    const foundProduct = allProducts.find(p => p.id === productId);
                    if (foundProduct) {
                        productToLoad = foundProduct;
                    }
                }

                renderProduct(productToLoad);

                if (variantSrc) {
                    const viewer = productViewerContainer.querySelector('model-viewer');
                    const swatch = productViewerContainer.querySelector(`.color-swatch[data-src="${variantSrc}"]`);
                    if (viewer && swatch) {
                        viewer.src = variantSrc;
                        productViewerContainer.querySelector('.color-swatch.active').classList.remove('active');
                        swatch.classList.add('active');
                    }
                }
            }

            addEventListeners();
        } catch (error) {
            console.error("Could not initialize app:", error);
            productViewerContainer.innerHTML = '<p>Error loading products. Please try again later.</p>';
        }
    }

    function populateProductSelect() {
        allProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            productSelect.appendChild(option);
        });
    }

    function renderProduct(product) {
        currentProduct = product;
        productViewerContainer.innerHTML = `
            <div class="viewer-column">
                <model-viewer
                    src="${product.variants[0].src}"
                    alt="${product.name}"
                    camera-controls
                    auto-rotate
                    camera-orbit="${product.camera.orbit}"
                    camera-target="${product.camera.target}"
                    id="viewer-${product.id}"
                    loading="eager"
                    reveal="auto">
                    <div class="loading-indicator" slot="progress-bar"></div>
                </model-viewer>
            </div>
            <div class="info-column">
                <h2>${product.name}</h2>
                <div class="advanced-info">
                    <div class="dimensions">
                        <strong>Dimensions:</strong>
                        ${(product.dimensions.width * 100).toFixed(0)}cm (W) &times;
                        ${(product.dimensions.height * 100).toFixed(0)}cm (H) &times;
                        ${(product.dimensions.depth * 100).toFixed(0)}cm (D)
                    </div>
                    <div class="materials">
                        <strong>Materials:</strong> ${product.materials.join(', ')}
                    </div>
                </div>
                <div class="color-swatches">
                    ${product.variants.map((variant, index) => `
                        <div class="color-swatch ${index === 0 ? 'active' : ''}"
                             style="background-color: ${variant.color};"
                             data-src="${variant.src}">
                        </div>
                    `).join('')}
                </div>
                <div class="controls">
                    <button class="reset-view-button">Reset View</button>
                    <button class="qr-code-button">Show QR Code</button>
                    <button class="share-button">Share</button>
                    <div class="environment-controls">
                        <label for="environment-select">Environment:</label>
                        <select id="environment-select">
                            <option value="neutral_lightroom_128.hdr">Neutral</option>
                            <option value="https://modelviewer.dev/shared-assets/environments/spruit_sunrise_1k_HDR.hdr">Sunrise</option>
                            <option value="">Default</option>
                        </select>
                    </div>
                </div>
                <button class="ar-button">View in AR</button>
            </div>
        `;
        addProductSpecificEventListeners();
    }

    function addEventListeners() {
        productSelect.addEventListener('change', (event) => {
            const selectedProductId = event.target.value;
            const product = allProducts.find(p => p.id === selectedProductId);
            if (product) {
                renderProduct(product);
            }
        });

        viewModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('advanced-view');
            const isAdvanced = document.body.classList.contains('advanced-view');
            viewModeToggle.textContent = isAdvanced ? 'Clean View' : 'Advanced View';
        });
    }

    function addProductSpecificEventListeners() {
        const viewer = productViewerContainer.querySelector('model-viewer');

        productViewerContainer.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (event) => {
                viewer.src = event.target.dataset.src;
                productViewerContainer.querySelector('.color-swatch.active').classList.remove('active');
                event.target.classList.add('active');
            });
        });

        const resetButton = productViewerContainer.querySelector('.reset-view-button');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                viewer.cameraOrbit = currentProduct.camera.orbit;
                viewer.cameraTarget = currentProduct.camera.target;
            });
        }

        const arButton = productViewerContainer.querySelector('.ar-button');
        if (arButton) {
            arButton.addEventListener('click', () => {
                // A simple check for AR support.
                if (navigator.xr) {
                    const modelSrc = viewer.src;
                    window.open(`viewer.html?model=${encodeURIComponent(modelSrc)}`, '_blank');
                } else {
                    generateAndShowQRCode();
                }
            });
        }

        const qrButton = productViewerContainer.querySelector('.qr-code-button');
        if (qrButton) {
            qrButton.addEventListener('click', generateAndShowQRCode);
        }

        const shareButton = productViewerContainer.querySelector('.share-button');
        if (shareButton) {
            shareButton.addEventListener('click', () => {
                const modelSrc = viewer.src;
                const url = new URL(window.location.href);
                url.searchParams.set('product', currentProduct.id);
                url.searchParams.set('variant', modelSrc);
                navigator.clipboard.writeText(url.href).then(() => {
                    alert('Link copied to clipboard!');
                });
            });
        }

        const environmentSelect = productViewerContainer.querySelector('#environment-select');
        if (environmentSelect) {
            environmentSelect.addEventListener('change', (event) => {
                viewer.environmentImage = event.target.value;
            });
        }

        const modal = document.getElementById('qr-modal');
        const closeButton = modal.querySelector('.close-button');
        closeButton.addEventListener('click', () => modal.style.display = 'none');
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    function generateAndShowQRCode() {
        const viewer = productViewerContainer.querySelector('model-viewer');
        const modelSrc = viewer.src;
        const arUrl = `${window.location.href.replace('index.html', '')}viewer.html?model=${encodeURIComponent(modelSrc)}`;

        const qrcodeContainer = document.getElementById('qrcode');
        qrcodeContainer.innerHTML = ''; // Clear previous QR code
        new QRCode(qrcodeContainer, {
            text: arUrl,
            width: 256,
            height: 256,
        });

        document.getElementById('qr-modal').style.display = 'flex';
    }

    initializeApp();
});
