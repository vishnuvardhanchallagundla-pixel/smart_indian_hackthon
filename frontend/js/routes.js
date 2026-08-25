/* ============================================================
   SkyFare AI — Route Analysis & Traffic Volume Module
   ============================================================ */

const routeAnalysisData = {
    'DEL-BOM': { avg: 6369, min: 5780, max: 6950, vol: 301, records: 5, traffic: 245000, name: 'Delhi - Mumbai' },
    'HYD-BOM': { avg: 5200, min: 4850, max: 5800, vol: 240, records: 8, traffic: 156271, name: 'Hyderabad - Mumbai' },
    'BLR-HYD': { avg: 3480, min: 3050, max: 3900, vol: 180, records: 6, traffic: 129315, name: 'Bengaluru - Hyderabad' },
    'DEL-GOA': { avg: 5950, min: 5200, max: 6800, vol: 320, records: 7, traffic: 150718, name: 'Delhi - Goa' },
    'DEL-KOL': { avg: 6100, min: 5400, max: 6700, vol: 290, records: 6, traffic: 210000, name: 'Delhi - Kolkata' },
    'AMD-DEL': { avg: 4700, min: 4000, max: 5400, vol: 210, records: 5, traffic: 146690, name: 'Ahmedabad - Delhi' }
};

let raAvgFareChartInstance   = null;
let raVolatilityChartInstance= null;
let raTrafficChartInstance   = null;

function initRouteAnalysisView() {
    const routePicker = document.getElementById('raRoutePicker');
    if (!routePicker) return;

    const routeKey = routePicker.value || 'DEL-BOM';
    const dataObj  = routeAnalysisData[routeKey] || routeAnalysisData['DEL-BOM'];

    // Update Summary Metric Cards
    const avgFareEl  = document.getElementById('raAvgFare');
    const minFareEl  = document.getElementById('raMinFare');
    const maxFareEl  = document.getElementById('raMaxFare');
    const volEl      = document.getElementById('raVolatility');
    const badgeEl    = document.getElementById('raOverviewBadge');

    if (avgFareEl) avgFareEl.textContent = `₹${dataObj.avg.toLocaleString('en-IN')}`;
    if (minFareEl) minFareEl.textContent = `₹${dataObj.min.toLocaleString('en-IN')}`;
    if (maxFareEl) maxFareEl.textContent = `₹${dataObj.max.toLocaleString('en-IN')}`;
    if (volEl)     volEl.textContent     = `₹${dataObj.vol.toLocaleString('en-IN')}`;
    if (badgeEl)   badgeEl.textContent   = `${routeKey} • ${dataObj.records} records loaded`;

    // Highlight active row in Route Comparison table
    const tableRows = document.querySelectorAll('#raTableBody tr.ra-row');
    tableRows.forEach(row => {
        if (row.getAttribute('data-route') === routeKey) {
            row.classList.add('active-route-row');
        } else {
            row.classList.remove('active-route-row');
        }
    });

    // 1. Chart 1: Average Fare by Route (Horizontal Bar Chart)
    const ctxBar = document.getElementById('raAvgFareByRouteChart')?.getContext('2d');
    if (ctxBar) {
        const routes = ['DEL-BOM', 'DEL-KOL', 'DEL-GOA', 'HYD-BOM', 'AMD-DEL', 'BLR-HYD'];
        const fareVals = routes.map(r => routeAnalysisData[r].avg);
        const barColors = routes.map(r => r === routeKey ? '#3b82f6' : 'rgba(71, 85, 105, 0.7)');

        if (raAvgFareChartInstance) {
            raAvgFareChartInstance.data.datasets[0].backgroundColor = barColors;
            raAvgFareChartInstance.update();
        } else {
            raAvgFareChartInstance = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: routes,
                    datasets: [{
                        label: 'Average Fare (₹)',
                        data: fareVals,
                        backgroundColor: barColors,
                        borderRadius: 6,
                        barThickness: 22
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { min: 0, max: 8000, ticks: { callback: v => '₹' + (v / 1000).toFixed(0) + 'k' } },
                        y: { grid: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    }

    // 2. Chart 2: Volatility vs Average Fare (Scatter / Bubble Plot)
    const ctxScatter = document.getElementById('raVolatilityScatterChart')?.getContext('2d');
    if (ctxScatter) {
        const bubbleData = Object.keys(routeAnalysisData).map(k => {
            const item = routeAnalysisData[k];
            return {
                x: item.avg,
                y: item.vol,
                r: k === routeKey ? 14 : 9,
                label: k
            };
        });

        const bubbleColors = Object.keys(routeAnalysisData).map(k => k === routeKey ? 'rgba(59, 130, 246, 0.85)' : 'rgba(148, 163, 184, 0.5)');

        if (raVolatilityChartInstance) {
            raVolatilityChartInstance.data.datasets[0].data = bubbleData;
            raVolatilityChartInstance.data.datasets[0].backgroundColor = bubbleColors;
            raVolatilityChartInstance.update();
        } else {
            raVolatilityChartInstance = new Chart(ctxScatter, {
                type: 'bubble',
                data: {
                    datasets: [{
                        label: 'Route Volatility vs Average Fare',
                        data: bubbleData,
                        backgroundColor: bubbleColors
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Average Fare (₹)' }, ticks: { callback: v => '₹' + v } },
                        y: { title: { display: true, text: 'Volatility Spread (₹)' }, ticks: { callback: v => '₹' + v } }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: ctx => `${ctx.raw.label}: Avg ₹${ctx.raw.x}, Volatility ₹${ctx.raw.y}`
                            }
                        }
                    }
                }
            });
        }
    }

    // 3. Chart 3: Top City Pairs by Passenger Traffic
    const ctxTraffic = document.getElementById('raTrafficBarChart')?.getContext('2d');
    if (ctxTraffic) {
        const trafficLabels = ['BEN-DEL', 'DEL-KOL', 'DEL-PUN', 'CHE-DEL', 'DEL-LUC'];
        const trafficValues = [245000, 210000, 195000, 182000, 165000];

        if (!raTrafficChartInstance) {
            raTrafficChartInstance = new Chart(ctxTraffic, {
                type: 'bar',
                data: {
                    labels: trafficLabels,
                    datasets: [{
                        label: 'Monthly Passengers',
                        data: trafficValues,
                        backgroundColor: 'rgba(20, 184, 166, 0.85)',
                        borderRadius: 6,
                        barThickness: 24
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { ticks: { callback: v => (v / 100000).toFixed(1) + 'L' } },
                        x: { grid: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    }
}

function initRouteAnalysisModule() {
    const raRoutePicker = document.getElementById('raRoutePicker');
    const raResetBtn    = document.getElementById('raResetBtn');

    if (raRoutePicker) {
        raRoutePicker.addEventListener('change', () => {
            initRouteAnalysisView();
            if (typeof showToast === 'function') showToast(`Inspecting route: ${raRoutePicker.value}`, 'info');
        });
    }

    if (raResetBtn) {
        raResetBtn.addEventListener('click', () => {
            if (raRoutePicker) raRoutePicker.value = 'DEL-BOM';
            initRouteAnalysisView();
            if (typeof showToast === 'function') showToast('Route analysis reset to default overview', 'info');
        });
    }

    // Row click listeners for comparison table
    const tableRows = document.querySelectorAll('#raTableBody tr.ra-row');
    tableRows.forEach(row => {
        row.addEventListener('click', () => {
            const routeCode = row.getAttribute('data-route');
            if (raRoutePicker && routeCode) {
                raRoutePicker.value = routeCode;
                initRouteAnalysisView();
                if (typeof showToast === 'function') showToast(`Inspecting route: ${routeCode}`, 'info');
            }
        });
    });
}
