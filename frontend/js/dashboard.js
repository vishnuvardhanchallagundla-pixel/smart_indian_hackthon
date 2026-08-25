/* ============================================================
   SkyFare AI — Dashboard View & Overview Analytics Module
   ============================================================ */

function initDashboardModule() {
    // ── Table Search Memoization Cache ───────────────────────
    const filterCache = new Map();

    const searchInput  = document.getElementById('globalSearch');
    const tableBody    = document.getElementById('routesTableBody');
    const noResultsRow = document.getElementById('noResultsRow');

    if (searchInput && tableBody) {
        const prefs = MockAPI.loadFilterPrefs();
        if (prefs.lastSearch) searchInput.value = prefs.lastSearch;

        let searchDebounce;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchDebounce);
            const query = searchInput.value.trim().toLowerCase();
            MockAPI.saveFilterPref('lastSearch', query);

            searchDebounce = setTimeout(() => {
                const skeletons = typeof showTableSkeleton === 'function' ? showTableSkeleton(tableBody) : [];
                setTimeout(() => {
                    if (typeof removeTableSkeleton === 'function') removeTableSkeleton(skeletons);
                    filterTableRows(query);
                }, 220);
            }, 180);
        });

        function filterTableRows(query) {
            if (filterCache.has(query)) {
                applyVisibilityMap(filterCache.get(query));
                return;
            }

            const rows = tableBody.querySelectorAll('tr:not(#noResultsRow)');
            const visibilityMap = [];
            let matchCount = 0;

            rows.forEach((row, idx) => {
                const text = row.textContent.toLowerCase();
                const isMatch = !query || text.includes(query);
                visibilityMap[idx] = isMatch;
                if (isMatch) matchCount++;
            });

            filterCache.set(query, visibilityMap);
            applyVisibilityMap(visibilityMap);

            if (noResultsRow) {
                noResultsRow.style.display = (matchCount === 0 && query !== '') ? 'table-row' : 'none';
            }
        }

        function applyVisibilityMap(visibilityMap) {
            const rows = tableBody.querySelectorAll('tr:not(#noResultsRow)');
            rows.forEach((row, idx) => {
                row.style.display = visibilityMap[idx] ? '' : 'none';
            });
        }
    }

    // ── Overview Charts Initialization ────────────────────────
    const ctxMain = document.getElementById('mainTrendChart')?.getContext('2d');
    if (ctxMain) {
        const prefs = MockAPI.loadFilterPrefs();
        const savedRoute = prefs.chartRoute || 'DEL-BOM';
        const routeChartFilterEl = document.getElementById('routeChartFilter');
        if (routeChartFilterEl) routeChartFilterEl.value = savedRoute;

        const mainChart = new Chart(ctxMain, {
            type: 'line',
            data: { labels: routeChartLabels, datasets: makeRouteDatasets(savedRoute) },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: { y: { min: 0, max: 8000, ticks: { callback: v => '₹' + (v / 1000).toFixed(0) + 'k' } } },
                plugins: { legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8 } } }
            }
        });

        if (routeChartFilterEl) {
            routeChartFilterEl.addEventListener('change', function () {
                MockAPI.saveFilterPref('chartRoute', this.value);
                mainChart.data.datasets = makeRouteDatasets(this.value);
                mainChart.update('active');
                if (typeof showToast === 'function') showToast(`Chart updated: ${this.value}`, 'info');
            });
        }
    }

    // Secondary Doughnut & Bar Charts
    const ctxDist = document.getElementById('distributionChart')?.getContext('2d');
    if (ctxDist) {
        new Chart(ctxDist, {
            type: 'doughnut',
            data: {
                labels: ['T+1', 'T+7', 'T+15', 'T+30', 'T+60'],
                datasets: [{ data: [15, 25, 30, 20, 10], backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#a855f7', '#14b8a6'], borderWidth: 0, hoverOffset: 6 }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } } }
        });
    }

    const ctxAvg = document.getElementById('avgFareChart')?.getContext('2d');
    if (ctxAvg) {
        new Chart(ctxAvg, {
            type: 'bar',
            data: { labels: ['T+1', 'T+7', 'T+15', 'T+30', 'T+60'], datasets: [{ label: 'Avg Fare (₹)', data: [7000, 6500, 6000, 5500, 5200], backgroundColor: ['#ef4444', '#f97316', '#3b82f6', '#a855f7', '#14b8a6'], borderRadius: 6, barThickness: 28 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 8000, ticks: { callback: v => '₹' + (v / 1000) + 'k' } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } }
        });
    }

    const ctxCpi = document.getElementById('cpiChart')?.getContext('2d');
    if (ctxCpi) {
        new Chart(ctxCpi, {
            type: 'line',
            data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], datasets: [{ label: 'CPI Index', data: [100, 105, 110, 108, 115, 120, 125], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)', fill: true, tension: 0.4, borderWidth: 2, pointBackgroundColor: '#10b981', pointRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 140 }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } }
        });
    }

    // ── Export Actions Wiring ─────────────────────────────────
    const exportCsvBtn  = document.getElementById('exportCsvBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const exportPdfBtn  = document.getElementById('exportPdfBtn');

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            ExportEngine.exportToCSV('skyfare_route_basket.csv');
            if (typeof showToast === 'function') showToast('✓ Downloading Route Basket rankings (.csv)', 'success');
        });
    }

    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', () => {
            ExportEngine.exportToJSON('skyfare_active_alerts.json');
            if (typeof showToast === 'function') showToast('✓ Downloading Active Alerts JSON payload', 'success');
        });
    }

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            if (typeof showToast === 'function') showToast('Preparing PDF print preview...', 'info');
            setTimeout(() => ExportEngine.triggerPrintPDF(), 400);
        });
    }

    // ── Live Refresh Data Sync Hook ───────────────────────────
    const refreshDataBtn = document.getElementById('refreshDataBtn');
    if (refreshDataBtn) {
        refreshDataBtn.addEventListener('click', () => {
            refreshDataBtn.classList.add('ph-spin');
            if (typeof showToast === 'function') showToast('Syncing real-time fare data with DGCA providers...', 'info');
            setTimeout(() => {
                refreshDataBtn.classList.remove('ph-spin');
                if (typeof showToast === 'function') showToast('✓ Live airfare data updated across all 10 corridors', 'success');
            }, 850);
        });
    }
}
