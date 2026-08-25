/* ============================================================
   SkyFare AI — Price Prediction Engine Module
   ============================================================ */

function initPredictionModule() {
    const predictBtn = document.getElementById('predictBtn');
    if (!predictBtn) return;

    predictBtn.addEventListener('click', async () => {
        const route     = document.getElementById('predRoute')?.value || 'DEL-BOM';
        const cls       = document.getElementById('predClass')?.value || 'Economy';
        const dateVal   = document.getElementById('predDate')?.value;
        const resultsEl = document.getElementById('predResults');

        if (!dateVal) {
            if (typeof showToast === 'function') showToast('Please select a travel date.', 'error');
            return;
        }

        predictBtn.disabled = true;
        predictBtn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Running AI Model...';
        if (resultsEl) resultsEl.style.display = 'none';

        // Call PredictFareAPI hook client
        const res = await PredictFareAPI.predict(route, cls, dateVal);
        predictBtn.disabled = false;
        predictBtn.innerHTML = '<i class="ph ph-magic-wand"></i> Predict Price';

        if (!res || !res.success) {
            if (typeof showToast === 'function') showToast('Failed to retrieve model prediction.', 'error');
            return;
        }

        // Populate DOM elements
        const fareValEl    = document.getElementById('resFareVal');
        const fareRangeEl  = document.getElementById('resFareRange');
        const confidenceEl = document.getElementById('resConfidence');
        const recBoxEl     = document.getElementById('resRecBox');

        if (fareValEl) fareValEl.textContent = `₹${res.predictedFare.toLocaleString('en-IN')}`;
        if (fareRangeEl) fareRangeEl.textContent = `Expected range: ₹${res.fareRange.min.toLocaleString('en-IN')} – ₹${res.fareRange.max.toLocaleString('en-IN')}`;
        if (confidenceEl) confidenceEl.textContent = res.confidence;
        if (recBoxEl) recBoxEl.textContent = res.recommendation;

        if (resultsEl) {
            resultsEl.style.display = 'block';
            resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        if (typeof showToast === 'function') showToast(`✓ Price forecast generated for ${route} (${res.optimalWindow})`, 'success');
    });
}
