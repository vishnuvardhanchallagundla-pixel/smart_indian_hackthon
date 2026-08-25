/* ============================================================
   SkyFare AI — Booking Window & DPD Matrix Module
   ============================================================ */

const bookingWindowData = {
    'ALL':     { t1: 6124, t7: 5807, t15: 5484, t30: 5175, t60: 4813, best: 'T+60', worst: 'T+1' },
    'DEL-BOM': { t1: 6950, t7: 6442, t15: 6305, t30: 6057, t60: 5780, best: 'T+60', worst: 'T+1' },
    'HYD-BOM': { t1: 5800, t7: 5650, t15: 5400, t30: 5100, t60: 4850, best: 'T+60', worst: 'T+1' },
    'BLR-HYD': { t1: 3900, t7: 3750, t15: 3500, t30: 3200, t60: 3050, best: 'T+60', worst: 'T+1' },
    'DEL-GOA': { t1: 7800, t7: 7300, t15: 6900, t30: 6500, t60: 6000, best: 'T+60', worst: 'T+1' },
    'AMD-DEL': { t1: 5400, t7: 5000, t15: 4700, t30: 4400, t60: 4000, best: 'T+60', worst: 'T+1' },
    'CCU-BOM': { t1: 7200, t7: 6700, t15: 6300, t30: 5900, t60: 5500, best: 'T+60', worst: 'T+1' }
};

let bwDpdBarChartInstance = null;

function initBookingWindowView() {
    const routeSelect = document.getElementById('bwRouteSelect');
    const monthSelect = document.getElementById('bwMonthSelect');
    if (!routeSelect) return;

    const routeKey = routeSelect.value || 'DEL-BOM';
    const data = bookingWindowData[routeKey] || bookingWindowData['DEL-BOM'];

    // Seasonal month multiplier
    let monthFactor = 1.0;
    if (monthSelect) {
        if (monthSelect.value === 'NOV') monthFactor = 1.06;
        if (monthSelect.value === 'DEC') monthFactor = 1.14;
    }

    const fares = {
        t1:  Math.round(data.t1 * monthFactor),
        t7:  Math.round(data.t7 * monthFactor),
        t15: Math.round(data.t15 * monthFactor),
        t30: Math.round(data.t30 * monthFactor),
        t60: Math.round(data.t60 * monthFactor)
    };

    const savings = fares.t1 - fares.t60;
    const savingPct = ((savings / fares.t1) * 100).toFixed(1);

    // Update 4 Metric Cards
    const bestWinEl  = document.getElementById('bwBestWindow');
    const bestWinSub = document.getElementById('bwBestWindowSub');
    const worstWinEl = document.getElementById('bwWorstWindow');
    const worstWinSub= document.getElementById('bwWorstWindowSub');
    const savingsEl  = document.getElementById('bwSavingsPotential');
    const savingsSub = document.getElementById('bwSavingsSub');

    if (bestWinEl)  bestWinEl.textContent = 'T+60';
    if (bestWinSub) bestWinSub.textContent = `Lowest average fare of ₹${fares.t60.toLocaleString('en-IN')}`;
    if (worstWinEl) worstWinEl.textContent = 'T+1';
    if (worstWinSub) worstWinSub.textContent = `Peak last-minute fare of ₹${fares.t1.toLocaleString('en-IN')}`;
    if (savingsEl)  savingsEl.textContent = `₹${savings.toLocaleString('en-IN')}`;
    if (savingsSub) savingsSub.textContent = `Save up to ${savingPct}% by booking early`;

    // Update / Initialize Comparative Bar Chart
    const ctxBar = document.getElementById('bwDpdBarChart')?.getContext('2d');
    if (ctxBar) {
        const chartLabels = ['T+1 (1 Day)', 'T+7 (1 Week)', 'T+15 (2 Weeks)', 'T+30 (1 Month)', 'T+60 (2 Months)'];
        const chartData = [fares.t1, fares.t7, fares.t15, fares.t30, fares.t60];
        const barColors = [
            'rgba(239, 68, 68, 0.85)',   // T+1 Warning Red (Peak)
            'rgba(249, 115, 22, 0.85)',  // T+7 Orange
            'rgba(59, 130, 246, 0.85)',  // T+15 Blue
            'rgba(168, 85, 247, 0.85)',  // T+30 Purple
            'rgba(52, 211, 153, 0.95)'   // T+60 Emerald Green (Best)
        ];

        if (bwDpdBarChartInstance) {
            bwDpdBarChartInstance.data.datasets[0].data = chartData;
            bwDpdBarChartInstance.data.datasets[0].backgroundColor = barColors;
            bwDpdBarChartInstance.update();
        } else {
            bwDpdBarChartInstance = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: 'Average Fare by Booking Tier (₹)',
                        data: chartData,
                        backgroundColor: barColors,
                        borderRadius: 8,
                        barThickness: 38
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            min: 0,
                            max: 9000,
                            ticks: { callback: v => '₹' + (v / 1000).toFixed(0) + 'k' }
                        },
                        x: { grid: { display: false } }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: ctx => `Avg Fare: ₹${ctx.parsed.y.toLocaleString('en-IN')}`
                            }
                        }
                    }
                }
            });
        }
    }
}

function initBookingWindowModule() {
    const bwRouteSelect = document.getElementById('bwRouteSelect');
    const bwMonthSelect = document.getElementById('bwMonthSelect');
    const bwResetBtn    = document.getElementById('bwResetBtn');

    if (bwRouteSelect) {
        bwRouteSelect.addEventListener('change', () => {
            initBookingWindowView();
            if (typeof showToast === 'function') showToast(`Booking window analysis updated for ${bwRouteSelect.value}`, 'info');
        });
    }

    if (bwMonthSelect) {
        bwMonthSelect.addEventListener('change', () => {
            initBookingWindowView();
            if (typeof showToast === 'function') showToast(`Seasonality adjusted: ${bwMonthSelect.options[bwMonthSelect.selectedIndex].text}`, 'info');
        });
    }

    if (bwResetBtn) {
        bwResetBtn.addEventListener('click', () => {
            if (bwRouteSelect) bwRouteSelect.value = 'DEL-BOM';
            if (bwMonthSelect) bwMonthSelect.value = 'ALL';
            initBookingWindowView();
            if (typeof showToast === 'function') showToast('Booking window filters reset to defaults', 'info');
        });
    }
}
