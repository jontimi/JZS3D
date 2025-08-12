window.onload = () => {
    const productSelect = document.querySelector('.category-select');
    const modelViewer = document.getElementById('product-model');
    const refreshButton = document.querySelector('.refresh-button');
    const desktopQRButton = document.querySelector('.desktop-qr-button'); 

    const productNameDisplay = document.querySelector('.product-name');
    const brightnessSlider = document.querySelector('.brightness-slider');
    const colorOptionsContainer = document.querySelector('.color-options');
    const materialOptionsContainer = document.querySelector('.material-options');

    const dimensionHeightDisplay = document.querySelector('.dimension-height');
    const dimensionWidthDisplay = document.querySelector('.dimension-width');
    const dimensionDepthDisplay = document.querySelector('.dimension-depth');

    const qrModal = document.getElementById('qrModal');
    const closeButton = document.querySelector('.close-button');
    const qrcodeDiv = document.getElementById('qrcode'); 

    let allModelsData = [];
    let currentModelSrc = ''; 
    let currentModelData = null; // Store the full data of the currently selected model

    if (qrModal) {
        qrModal.style.display = 'none';
    }

    // Function to fetch model data from models.json
    async function fetchModelsData() {
        console.log("Attempting to fetch models.json...");
        try {
            const response = await fetch('./models.json');
            
            if (!response.ok) {
                console.error(`HTTP error! Status: ${response.status} when fetching models.json. ` + 
                              `Please check if 'models.json' exists at the root and your live server is running correctly.`);
                alert(`Error loading model data: Server responded with status ${response.status}. Please check your browser's console for details (F12).`);
                return; // Stop execution if response is not OK
            }

            // Attempt to parse JSON
            let jsonData = await response.json();
            allModelsData = jsonData;
            
            console.log("Fetched models data (allModelsData):", allModelsData); 

            if (allModelsData.length > 0) {
                console.log("Model data loaded successfully. Populating dropdown and loading default model.");
                populateProductDropdown();
                
                const marioLamp = allModelsData.find(model => model.name === "Mario Floor Lamp");
                if (marioLamp) {
                    loadModel(marioLamp);
                    if (productSelect) {
                        productSelect.value = "Mario Floor Lamp";
                    }
                    console.log("Mario Floor Lamp set as the default model.");
                } else {
                    console.warn("Mario Floor Lamp not found in models.json, loading the first available model.");
                    const defaultModel = allModelsData[0];
                    if (defaultModel) {
                        loadModel(defaultModel);
                        if (productSelect) {
                            productSelect.value = defaultModel.name;
                        }
                    } else {
                        console.error("No default model (first model) found in models.json array.");
                    }
                }

            } else {
                console.warn("models.json was fetched successfully but contains no model data (it's an empty array or invalid structure after parsing).");
                alert("No model data found in models.json or file is empty/invalid. Please check the content of 'models.json'.");
            }
        } catch (error) {
            console.error("Error fetching or parsing models.json:", error);
            alert("Failed to load model data due to a network or parsing error. See your browser's console (F12) for details.");
        }
    }

    function populateProductDropdown() {
        if (!productSelect) {
            console.warn("Product select dropdown (.category-select) not found in HTML.");
            return;
        }
        productSelect.innerHTML = ''; // Clear existing options
        allModelsData.forEach(model => {
            const option = document.createElement('option');
            option.value = model.name;
            option.textContent = model.name;
            productSelect.appendChild(option);
        });

        if (allModelsData.length > 0) {
            console.log("Product dropdown populated successfully.");
        } else {
            console.warn("No models data to populate product dropdown.");
        }
    }

    function loadModel(model) {
        if (!modelViewer) {
            console.warn("Model viewer element (#product-model) not found in HTML.");
            return;
        }
        if (!model || !model.src) {
            console.error("Attempted to load an invalid model object:", model);
            alert("Error: Model data is incomplete. Cannot load model.");
            return;
        }
        currentModelData = model;
        currentModelSrc = model.src;
        modelViewer.src = currentModelSrc; // Update the model-viewer src

        modelViewer.addEventListener('load', function setInitialCamera() {
            if (!initialCameraSet) {
                initialCameraOrbit = modelViewer.getAttribute('camera-orbit');
                initialFieldOfView = modelViewer.getAttribute('field-of-view');
                initialCameraTarget = modelViewer.getAttribute('camera-target');
                initialCameraSet = true;
            }
            if (cleanViewer) {
                cleanViewer.setAttribute('camera-orbit', modelViewer.getAttribute('camera-orbit'));
                cleanViewer.setAttribute('field-of-view', modelViewer.getAttribute('field-of-view'));
                cleanViewer.setAttribute('camera-target', modelViewer.getAttribute('camera-target'));
            }
            modelViewer.removeEventListener('load', setInitialCamera);
        });

        console.log(`Loading model: ${currentModelSrc}`);

        if (productNameDisplay) productNameDisplay.textContent = model.name;
        if (dimensionHeightDisplay) dimensionHeightDisplay.textContent = `${(model.height * 100).toFixed(1)}cm`;
        if (dimensionWidthDisplay) dimensionWidthDisplay.textContent = `${(model.width * 100).toFixed(1)}cm`;
        if (dimensionDepthDisplay) dimensionDepthDisplay.textContent = `${(model.depth * 100).toFixed(1)}cm`;

        // After the model loads, detect GLB variants; fallback to JSON colors only if none
        modelViewer.addEventListener('load', async function onModelLoadedForColors() {
            try {
                await renderColorOptionsForCurrentModel();
                scheduleVariantsRefresh();
            } catch (err) {
                console.warn('Error rendering color options:', err);
            } finally {
                modelViewer.removeEventListener('load', onModelLoadedForColors);
            }
        });
        // Fire again when the scene-graph is parsed (variants/materials available)
        const onSceneGraphReady = async () => {
            try { await renderColorOptionsForCurrentModel(); } catch {}
            modelViewer.removeEventListener('scene-graph-ready', onSceneGraphReady);
        };
        modelViewer.addEventListener('scene-graph-ready', onSceneGraphReady);
        // Also react to variant changes to keep selection highlighted
        modelViewer.addEventListener('variantchange', () => {
            try { setActiveVariantChip(modelViewer.variantName); } catch {}
        });
        updateMaterials(model.materials);
    }

    async function renderColorOptionsForCurrentModel() {
        if (!modelViewer || !colorOptionsContainer) return;
        const variants = await getVariantsWithRetry(modelViewer, 12, 120);
        console.log('Detected variants:', variants);
        let toShow = variants;
        // Hudson-specific: hide any 'light' variant and de-duplicate 'black'
        const isHudson = /dolton armchair hudson/i.test(currentModelData?.name || '') || /dolton_armchair_hudson/i.test(currentModelData?.src || '');
        if (isHudson) {
            const seen = new Set();
            toShow = variants.filter((v) => {
                const key = String(v || '').trim().toLowerCase();
                if (key.includes('light')) return false; // hide test light
                if (key === 'black') {
                    if (seen.has('black')) return false; // drop subsequent 'black'
                    seen.add('black');
                    return true;
                }
                if (!seen.has(key)) seen.add(key);
                return true;
            });
        }
        if (toShow.length >= 1) {
            renderVariantOptions(toShow, { append: false });
        } else {
            // No variants present: render a single default swatch (no header)
            colorOptionsContainer.innerHTML = '';
            const wrapper = ensureVariantWrapper();
            wrapper.innerHTML = '';
            const modelOverride = getModelColorOverride(currentModelData);
            const colorHex = modelOverride && modelOverride.colorHex ? modelOverride.colorHex : await sampleViewerMainColor(modelViewer);
            const label = modelOverride && modelOverride.label ? modelOverride.label : labelFromHex(colorHex);
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch variant-swatch active';
            swatch.style.backgroundColor = colorHex;
            swatch.title = label;
            wrapper.appendChild(swatch);
        }
    }

    function scheduleVariantsRefresh() {
        // Defensive: refresh variants a few times post-load in case they appear late
        const attempts = [250, 500, 1000, 1500];
        attempts.forEach(ms => {
            setTimeout(() => {
                try { renderColorOptionsForCurrentModel(); } catch {}
            }, ms);
        });
    }

    function renderVariantOptions(variants, options = { append: false }) {
        // Colors section shows variant circles only (no header)
        colorOptionsContainer.innerHTML = '';
        const variantWrapper = ensureVariantWrapper();
        variantWrapper.innerHTML = '';

        // Build swatches with colors sampled from each variant's materials
        const build = async () => {
            const previous = modelViewer.variantName;
            let hudsonCreamAdded = false;
            for (const variantName of variants) {
                let sampled;
                const isHudson = /dolton armchair hudson/i.test(currentModelData?.name || '') || /dolton_armchair_hudson/i.test(currentModelData?.src || '');
                const vName = String(variantName || '').trim().toLowerCase();
                if (isHudson) {
                    if (vName.includes('dark')) {
                        sampled = { label: 'Dark', colorHex: '#2A2A2A' };
                    } else if (!hudsonCreamAdded) {
                        sampled = { label: 'Cream', colorHex: '#F5EAD6' };
                        hudsonCreamAdded = true;
                    } else {
                        // Skip any extra non-dark entries (e.g., duplicate black/light)
                        continue;
                    }
                }
                if (!sampled) {
                    try {
                        sampled = await getVariantColorInfo(modelViewer, variantName);
                    } catch (e) {
                        const fallback = getVariantDisplay(variantName);
                        sampled = { label: fallback.label, colorHex: fallback.colorHex };
                    }
                }
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch variant-swatch';
                swatch.style.backgroundColor = sampled.colorHex;
                swatch.setAttribute('data-variant', variantName);
                swatch.title = sampled.label; // tooltip on hover
                swatch.addEventListener('click', () => {
                    try {
                        modelViewer.variantName = variantName;
                        if (cleanViewer) {
                            cleanViewer.variantName = variantName;
                        }
                        setActiveVariantChip(variantName);
                    } catch (err) {
                        console.warn('Failed to switch variant:', err);
                    }
                });
                variantWrapper.appendChild(swatch);
            }
            // restore previous selection in case we changed during sampling
            try { modelViewer.variantName = previous; if (cleanViewer) cleanViewer.variantName = previous; } catch {}
        };
        build();

        // Set initial variant to current or first option
        try {
            const current = modelViewer.variantName || variants[0];
            modelViewer.variantName = current;
            if (cleanViewer) {
                cleanViewer.variantName = current;
            }
            setActiveVariantChip(current);
        } catch (err) {
            console.warn('Failed to set initial variant:', err);
        }
    }

    function setActiveVariantChip(activeName) {
        const chips = colorOptionsContainer.querySelectorAll('[data-variant]');
        chips.forEach(chip => {
            if (chip.getAttribute('data-variant') === activeName) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
    }

    function getVariantDisplay(rawName) {
        const name = String(rawName || '').toLowerCase();
        if (/black|dark/i.test(name)) return { label: 'Dark', colorHex: '#000000' };
        if (/brown|tan|camel|chestnut|walnut/i.test(name)) return { label: 'Brown', colorHex: '#8B6B4A' };
        if (/grey|gray|ash/i.test(name)) return { label: 'Grey', colorHex: '#888888' };
        if (/beige|cream|sand/i.test(name)) return { label: 'Beige', colorHex: '#D2B48C' };
        if (/white|light/i.test(name)) return { label: 'Light', colorHex: '#E5E5E5' };
        // Default: use the original name capitalized and a neutral color
        const label = rawName ? String(rawName) : 'Variant';
        return { label, colorHex: '#777777' };
    }

    function ensureVariantWrapper() {
        let wrapper = colorOptionsContainer.querySelector('.variant-options');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'variant-options';
            wrapper.style.display = 'flex';
            wrapper.style.flexWrap = 'wrap';
            wrapper.style.gap = '8px';
            colorOptionsContainer.appendChild(wrapper);
        }
        return wrapper;
    }

    function getVariantNames(viewer) {
        // Prefer the public API, but fallback to model.variants if needed
        let names = [];
        try {
            const a = viewer && viewer.availableVariants ? viewer.availableVariants : [];
            if (Array.isArray(a) && a.length > 0) names = a.slice();
        } catch {}
        if (names.length === 0) {
            try {
                const v = viewer && viewer.model && viewer.model.variants ? viewer.model.variants : [];
                if (Array.isArray(v) && v.length > 0) names = v.map(x => x && (x.name || x)).filter(Boolean);
            } catch {}
        }
        return names;
    }

    function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

    async function getVariantsWithRetry(viewer, attempts = 10, intervalMs = 100) {
        for (let i = 0; i < attempts; i += 1) {
            const names = getVariantNames(viewer);
            if (Array.isArray(names) && names.length > 0) return names;
            await delay(intervalMs);
        }
        return [];
    }

    async function getVariantColorInfo(viewer, variantName) {
        // Per-model overrides (e.g., Hudson: variant named "black" should be labeled Light and sampled from fabric only)
        const override = getVariantOverride(currentModelData, variantName);
        if (override) {
            const previous = viewer.variantName;
            try { viewer.variantName = variantName; } catch {}
            try {
                if (viewer.updateComplete && typeof viewer.updateComplete.then === 'function') {
                    await viewer.updateComplete;
                } else {
                    await delay(50);
                }
            } catch {}
            await ensureAllMaterialsLoaded(viewer);
            const hex = override.colorHex || await sampleViewerMainColor(viewer, override.sample);
            try { viewer.variantName = previous; } catch {}
            return { label: override.label || labelFromHex(hex), colorHex: override.colorHex || hex };
        }

        // Prefer a clean mapping from variant names -> colors & labels
        // But for Hudson we force our override regardless of generic mapping
        const mapped = (/dolton armchair hudson/i.test(currentModelData?.name || '') || /dolton_armchair_hudson/i.test(currentModelData?.src || ''))
            ? null
            : getVariantDisplay(variantName);
        if (mapped && mapped.colorHex !== '#777777') {
            return { label: mapped.label, colorHex: mapped.colorHex };
        }
        // Fallback: sample PBR color from this variant and infer a label
        const previous = viewer.variantName;
        try { viewer.variantName = variantName; } catch {}
        // Wait a frame and ensure materials are loaded for this variant
        try {
            if (viewer.updateComplete && typeof viewer.updateComplete.then === 'function') {
                await viewer.updateComplete;
            } else {
                await delay(50);
            }
        } catch {}
        await ensureAllMaterialsLoaded(viewer);
        const hex = await sampleViewerMainColor(viewer);
        try { viewer.variantName = previous; } catch {}
        return { label: labelFromHex(hex), colorHex: hex };
    }

    async function sampleViewerMainColor(viewer, sampleMode) {
        const materials = (viewer && viewer.model && viewer.model.materials) ? viewer.model.materials : [];
        await ensureAllMaterialsLoaded(viewer);
        const candidates = [];
        for (const mat of materials) {
            const lower = (mat.name || '').toLowerCase();
            const skip = /(metal|steel|chrome|aluminum|aluminium|wood|oak|walnut|leg|base|frame|glass|environment)/i.test(lower);
            if (sampleMode === 'fabric' && !/fabric/i.test(lower)) {
                continue; // only use materials that look like fabric
            }
            const pbr = mat && mat.pbrMetallicRoughness;
            let factor = null;
            try {
                factor = pbr && (typeof pbr.getBaseColorFactor === 'function' ? pbr.getBaseColorFactor() : pbr.baseColorFactor);
            } catch {}
            if (!skip && factor && Array.isArray(factor) && factor.length >= 3) {
                const [r,g,b] = factor;
                candidates.push({ r, g, b });
            }
        }
        if (candidates.length === 0) return '#000000';
        const avg = candidates.reduce((acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }), { r:0,g:0,b:0 });
        avg.r /= candidates.length; avg.g /= candidates.length; avg.b /= candidates.length;
        const to255 = (x) => Math.max(0, Math.min(255, Math.round(x * 255)));
        return `#${to255(avg.r).toString(16).padStart(2,'0')}${to255(avg.g).toString(16).padStart(2,'0')}${to255(avg.b).toString(16).padStart(2,'0')}`;
    }

    function getVariantOverride(modelData, variantName) {
        try {
            const modelName = (modelData && modelData.name) ? modelData.name : '';
            const modelSrc = (modelData && modelData.src) ? modelData.src : '';
            const vName = String(variantName || '').trim().toLowerCase();
            if (/dolton armchair hudson/i.test(modelName) || /dolton_armchair_hudson/i.test(modelSrc)) {
                if (vName === 'black') {
                    // Cream fabric
                    return { label: 'Cream', colorHex: '#F5EAD6', sample: 'fabric' };
                }
                if (vName === 'dark') {
                    // Dark grey fabric
                    return { label: 'Dark', colorHex: '#2A2A2A', sample: 'fabric' };
                }
            }
        } catch {}
        return null;
    }

    function getModelColorOverride(modelData) {
        try {
            const name = (modelData && modelData.name) ? modelData.name : '';
            if (/mario floor lamp/i.test(name)) return { label: 'Black', colorHex: '#1E1E1E' };
            if (/oluce.*coup.+3321/i.test(name)) return { label: 'Black', colorHex: '#000000' };
            if (/wasily chair/i.test(name)) return { label: 'Black', colorHex: '#111111' };
            if (/leather sofa/i.test(name)) return { label: 'Black', colorHex: '#101010' };
            if (/wood frame sofa/i.test(name)) return { label: 'Black', colorHex: '#111111' };
            if (/kumo.*coffee table/i.test(name)) return { label: 'White', colorHex: '#F8F8F8' };
            if (/sweep floor lamp/i.test(name)) return { label: 'Dark Gray', colorHex: '#2E2E2E' };
            if (/bookcase/i.test(name)) return { label: 'Wood', colorHex: '#C19A6B' };
            if (/oak wardrobe/i.test(name)) return { label: 'Beige', colorHex: '#F5F5DC' };
            if (/ikea alex drawer/i.test(name)) return { label: 'Teal', colorHex: '#7FBCC3' };
        } catch {}
        return null;
    }

    async function ensureAllMaterialsLoaded(viewer) {
        try {
            const materials = (viewer && viewer.model && viewer.model.materials) ? viewer.model.materials : [];
            await Promise.all(materials.map(m => (m && m.ensureLoaded) ? m.ensureLoaded() : Promise.resolve()));
        } catch {}
    }

    function labelFromHex(hex) {
        // Convert to normalized RGB and derive a simple color name
        const m = hex.replace('#','');
        const r = parseInt(m.substring(0,2),16)/255;
        const g = parseInt(m.substring(2,4),16)/255;
        const b = parseInt(m.substring(4,6),16)/255;
        const max = Math.max(r,g,b), min = Math.min(r,g,b);
        const l = (max + min) / 2; // lightness
        const s = max === min ? 0 : (max - min) / (1 - Math.abs(2*l - 1) + 1e-6);
        let h = 0;
        if (max !== min) {
            if (max === r) h = (60 * ((g - b) / (max - min)) + 360) % 360;
            else if (max === g) h = 60 * ((b - r) / (max - min)) + 120;
            else h = 60 * ((r - g) / (max - min)) + 240;
        }
        // Greyscale
        if (s < 0.12) {
            if (l < 0.22) return 'Black';
            if (l > 0.85) return 'White';
            return 'Grey';
        }
        // Browns / Beiges roughly between orange/yellow
        if (h >= 20 && h <= 50) {
            if (l >= 0.70) return 'Beige';
            return 'Brown';
        }
        // Fallback
        return 'Color';
    }

    function updateColors(colors) {
        if (!colorOptionsContainer) {
            console.warn("Color options container not found.");
            return;
        }
        colorOptionsContainer.innerHTML = ''; // Clear previous colors
        if (!colors || !Array.isArray(colors)) {
            console.warn("Invalid colors data provided:", colors);
            return;
        }
        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.addEventListener('click', () => {
                setActiveColorSwatch(color);
                applyColorToModel(color);
            });
            colorOptionsContainer.appendChild(swatch);
        });

        if (colors.length > 0) {
            // Apply the first color as initial tint when no variants are present
            // Delay until model is fully loaded to access materials
            const initialColor = colors[0];
            const onFirstLoadApply = () => {
                try { applyColorToModel(initialColor); } catch (e) { /* noop */ }
                modelViewer.removeEventListener('load', onFirstLoadApply);
            };
            if (modelViewer) {
                if (modelViewer.model) {
                    applyColorToModel(initialColor);
                } else {
                    modelViewer.addEventListener('load', onFirstLoadApply);
                }
            }
            setActiveColorSwatch(initialColor);
        }
    }

    function setActiveColorSwatch(activeHex) {
        const swatches = colorOptionsContainer.querySelectorAll('.color-swatch');
        swatches.forEach(el => {
            const bg = el.style.backgroundColor;
            // Create a temp element to normalize hex to rgb format
            const temp = document.createElement('div');
            temp.style.color = activeHex;
            document.body.appendChild(temp);
            const activeRgb = getComputedStyle(temp).color; // e.g., rgb(136, 136, 136)
            document.body.removeChild(temp);
            if (bg === activeRgb) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    function applyColorToModel(hexColor) {
        if (!modelViewer) return;
        const factor = hexToRgbaFactor(hexColor);

        const applyToViewer = (viewer) => {
            if (!viewer || !viewer.model) return;
            const materials = viewer.model.materials || [];
            materials.forEach(material => {
                const materialName = (material.name || '').toLowerCase();
                const skip = /(metal|steel|chrome|aluminum|aluminium|wood|oak|walnut|leg|base|frame)/i.test(materialName);
                if (!skip && material.pbrMetallicRoughness && material.pbrMetallicRoughness.setBaseColorFactor) {
                    try {
                        material.pbrMetallicRoughness.setBaseColorFactor(factor);
                    } catch (e) {
                        // Ignore materials that do not support color factor adjustment
                    }
                }
            });
        };

        // Prefer variants if available; otherwise tint materials
        const variants = modelViewer.availableVariants || [];
        if (Array.isArray(variants) && variants.length > 1) {
            // Variants will be handled by renderVariantOptions()
            return;
        }

        applyToViewer(modelViewer);
        if (cleanViewer) applyToViewer(cleanViewer);
    }

    function hexToRgbaFactor(hex) {
        const val = hex.trim();
        let r = 0, g = 0, b = 0;
        if (/^#?[0-9a-f]{3}$/i.test(val)) {
            const h = val.replace('#','');
            r = parseInt(h[0] + h[0], 16);
            g = parseInt(h[1] + h[1], 16);
            b = parseInt(h[2] + h[2], 16);
        } else if (/^#?[0-9a-f]{6}$/i.test(val)) {
            const h = val.replace('#','');
            r = parseInt(h.substring(0,2), 16);
            g = parseInt(h.substring(2,4), 16);
            b = parseInt(h.substring(4,6), 16);
        } else if (/^rgb\(/i.test(val)) {
            const nums = val.replace(/rgba?\(|\)/g,'').split(',').map(n=>parseFloat(n));
            r = nums[0]; g = nums[1]; b = nums[2];
        }
        return [r/255, g/255, b/255, 1];
    }

    function normalizeCssColor(input) {
        const el = document.createElement('div');
        el.style.color = '';
        el.style.color = input;
        if (!el.style.color) return null;
        document.body.appendChild(el);
        const computed = getComputedStyle(el).color;
        document.body.removeChild(el);
        return computed; // rgb(r,g,b)
    }

    function cssColorToHex(cssRgb) {
        const match = cssRgb.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
        if (!match) return '#000000';
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        const toHex = (n) => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function updateMaterials(materials) {
        if (!materialOptionsContainer) {
            console.warn("Material options container not found.");
            return;
        }
        materialOptionsContainer.innerHTML = ''; // Clear previous materials
        if (!materials || !Array.isArray(materials)) {
            console.warn("Invalid materials data provided:", materials);
            return;
        }
        materials.forEach(material => {
            const tag = document.createElement('span');
            tag.className = 'material-tag';
            tag.textContent = material;
            materialOptionsContainer.appendChild(tag);
        });
    }

    if (productSelect) {
        productSelect.addEventListener('change', (event) => {
            const selectedModelName = event.target.value;
            const selectedModel = allModelsData.find(model => model.name === selectedModelName);
            if (selectedModel) {
                loadModel(selectedModel);
            } else {
                console.warn(`Selected model '${selectedModelName}' not found in allModelsData.`);
            }
        });
    } else {
        console.warn("Product select dropdown not available for event listener setup.");
    }

    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            resetModelCamera(modelViewer);
            console.log("Refresh button clicked. Camera reset.");
        });
    }

    if (desktopQRButton) {
        desktopQRButton.addEventListener('click', () => {
            if (currentModelData) {
                if (qrcodeDiv) {
                    qrcodeDiv.innerHTML = '';
                } else {
                    console.error("QR Code div (#qrcode) not found in HTML. Cannot generate QR.");
                    alert("QR Code display area missing. Please check your HTML structure for an element with id='qrcode'.");
                    return;
                }

                const baseUrl = 'https://jontimi.github.io/JZS-AR-SHOWCASE/';
                const modelPath = currentModelData.src;
                const fullModelUrl = `${baseUrl}${modelPath}`;
                const arUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(fullModelUrl)}&mode=ar_only`;
                
                console.log("Final AR URL for QR Code:", arUrl);

                try {
                    new QRCode(qrcodeDiv, {
                        text: arUrl,
                        width: 256,
                        height: 256,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });
                    console.log("QR Code successfully generated for URL:", arUrl);
                } catch (error) {
                    console.error("Error generating QR code:", error);
                    alert("An error occurred while generating the QR code. See console for details (F12).");
                    return; 
                }
                
                qrModal.style.display = 'flex';
            } else {
                console.warn("No current model data available. Cannot generate QR code.");
                alert("Please select a product first to generate the AR QR code.");
            }
        });
    } else {
        console.warn("Desktop QR button not found.");
    }

    const cleanContainer = document.getElementById('cleanViewContainer');
    const cleanViewer = document.getElementById('cleanModelViewer');
    const toggleBtn = document.getElementById('toggleCleanViewBtn');

    let isClean = false;

    function syncCleanViewer() {
        if (modelViewer && cleanViewer) {
            cleanViewer.src = modelViewer.src;
            cleanViewer.setAttribute('camera-orbit', modelViewer.getAttribute('camera-orbit'));
            cleanViewer.setAttribute('field-of-view', modelViewer.getAttribute('field-of-view'));
            cleanViewer.setAttribute('camera-target', modelViewer.getAttribute('camera-target'));
        }
    }

    if (toggleBtn && cleanContainer) {
        toggleBtn.addEventListener('click', () => {
            isClean = !isClean;
            if (isClean) {
                modelViewer.style.display = 'none';
                cleanContainer.style.display = 'block';
                toggleBtn.textContent = "Advanced View";
                syncCleanViewer();
            } else {
                modelViewer.style.display = 'block';
                cleanContainer.style.display = 'none';
                toggleBtn.textContent = "Clean View";
            }
        });
    }

    if (modelViewer) {
        modelViewer.addEventListener('load', syncCleanViewer);
    }

    const cleanQRButton = cleanContainer ? cleanContainer.querySelector('.desktop-qr-button') : null;

    if (cleanQRButton) {
        cleanQRButton.addEventListener('click', () => {
            if (currentModelData) {
                if (qrcodeDiv) qrcodeDiv.innerHTML = '';
                const baseUrl = 'https://jontimi.github.io/JZS-AR-SHOWCASE/';
                const modelPath = currentModelData.src;
                const fullModelUrl = `${baseUrl}${modelPath}`;
                const arUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(fullModelUrl)}&mode=ar_only`;
                new QRCode(qrcodeDiv, {
                    text: arUrl,
                    width: 256,
                    height: 256,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
                qrModal.style.display = 'flex';
            } else {
                alert("Please select a product first to generate the AR QR code.");
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            qrModal.style.display = 'none';
            console.log("QR Modal closed.");
        });
    } else {
        console.warn("Close button for QR modal not found.");
    }

    window.addEventListener('click', (event) => {
        if (event.target == qrModal) {
            qrModal.style.display = 'none';
            console.log("QR Modal closed by clicking outside.");
        }
    });
    
    if (brightnessSlider && modelViewer) {
        brightnessSlider.addEventListener('input', (event) => {
            const sliderValue = parseFloat(event.target.value);
            modelViewer.exposure = sliderValue / 50; 
            console.log("Brightness set to:", modelViewer.exposure);
        });
    } else {
        console.warn("Brightness slider or model-viewer not found for brightness control.");
    }

    const cleanRefreshButton = cleanContainer ? cleanContainer.querySelector('.refresh-button') : null;
    if (cleanRefreshButton && cleanViewer) {
        cleanRefreshButton.addEventListener('click', () => {
            resetModelCamera(cleanViewer);
            console.log("Clean view refresh button clicked. Camera reset.");
        });
    }

    fetchModelsData();
};

function resetModelCamera(viewer) {
    if (viewer) {
        viewer.setAttribute('camera-orbit', initialCameraOrbit);
        viewer.setAttribute('field-of-view', initialFieldOfView);
        viewer.setAttribute('camera-target', initialCameraTarget);
    }
}

let initialCameraOrbit = '0deg 75deg 4m';
let initialFieldOfView = '45deg';
let initialCameraTarget = '0m 0m 0m';
let initialCameraSet = false;