/* ============================================================
   SkyFare AI — API, Data Storage & Export Engine Module
   ============================================================ */

/**
 * Mock API & Data Persistence Engine
 */
const MockAPI = (() => {
    const STORAGE_KEY_PREFS  = 'skyfare_filter_prefs';
    const STORAGE_KEY_ALERTS = 'skyfare_price_alerts';

    const defaultPrefs = {
        lastSearch: '',
        chartRoute: 'DEL-BOM',
        filterWindow: 'ALL',
        filterClass: 'Economy',
        theme: 'dark'
    };

    const defaultAlerts = [
        { id: 'ALT-101', route: 'DEL-BOM', targetFare: 5500, currentFare: 6442, window: 'T+15', status: 'ACTIVE', created: '2026-08-20' },
        { id: 'ALT-102', route: 'HYD-BOM', targetFare: 4900, currentFare: 5800, window: 'T+30', status: 'TRIGGERED', created: '2026-08-18' },
        { id: 'ALT-103', route: 'BLR-HYD', targetFare: 3200, currentFare: 3900, window: 'T+60', status: 'ACTIVE', created: '2026-08-22' }
    ];

    function loadFilterPrefs() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_PREFS);
            return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : { ...defaultPrefs };
        } catch (e) {
            return { ...defaultPrefs };
        }
    }

    function saveFilterPref(key, value) {
        try {
            const current = loadFilterPrefs();
            current[key] = value;
            localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(current));
        } catch (e) {
            console.error('Failed to save filter preference:', e);
        }
    }

    function loadPriceAlerts() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_ALERTS);
            return raw ? JSON.parse(raw) : defaultAlerts;
        } catch (e) {
            return defaultAlerts;
        }
    }

    function savePriceAlert(alertData) {
        try {
            const alerts = loadPriceAlerts();
            const newAlert = {
                id: `ALT-${Math.floor(100 + Math.random() * 900)}`,
                ...alertData,
                status: 'ACTIVE',
                created: new Date().toISOString().split('T')[0]
            };
            alerts.unshift(newAlert);
            localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
            return newAlert;
        } catch (e) {
            console.error('Failed to save price alert:', e);
            return null;
        }
    }

    function fetchLiveDeals() {
        return [
            { route: 'DEL-BOM', current: 6442, drop: '12%', status: 'Price Drop' },
            { route: 'BLR-HYD', current: 3480, drop: '18%', status: 'Lowest in 30d' },
            { route: 'HYD-BOM', current: 5200, drop: '8%',  status: 'Good Value' },
            { route: 'DEL-GOA', current: 5950, drop: '15%', status: 'Best Pick' }
        ];
    }

    return {
        loadFilterPrefs,
        saveFilterPref,
        loadPriceAlerts,
        savePriceAlert,
        fetchLiveDeals
    };
})();

/**
 * AI Prediction API Integration Hook Client
 */
const PredictFareAPI = (() => {
    const BASE_URL = 'https://api.skyfare.ai/v1/predict';
    const USE_MOCK_FALLBACK = true;

    const routeBaseFares = {
        'DEL-BOM': 6200,
        'HYD-BOM': 5400,
        'BLR-HYD': 3800,
        'DEL-GOA': 6500,
        'AMD-DEL': 4600,
        'CCU-BOM': 6800
    };

    function simulateInference(route, cabinClass, travelDateStr) {
        const base = routeBaseFares[route] || 5500;
        const multiplier = cabinClass === 'Business' ? 2.6 : cabinClass === 'Premium Economy' ? 1.4 : 1.0;

        const travelDate = new Date(travelDateStr);
        const today = new Date();
        const daysDiff = Math.max(1, Math.round((travelDate - today) / (1000 * 60 * 60 * 24)));

        let windowKey = 'T+15';
        let windowMultiplier = 1.0;
        if (daysDiff <= 3)       { windowKey = 'T+1';  windowMultiplier = 1.25; }
        else if (daysDiff <= 10) { windowKey = 'T+7';  windowMultiplier = 1.12; }
        else if (daysDiff <= 20) { windowKey = 'T+15'; windowMultiplier = 1.0; }
        else if (daysDiff <= 45) { windowKey = 'T+30'; windowMultiplier = 0.90; }
        else                     { windowKey = 'T+60'; windowMultiplier = 0.82; }

        const predictedFare = Math.round(base * multiplier * windowMultiplier);
        const minRange = Math.round(predictedFare * 0.92);
        const maxRange = Math.round(predictedFare * 1.08);

        let confidence = 'High';
        if (daysDiff > 45) confidence = 'Very High';
        else if (daysDiff <= 3) confidence = 'Low (High Volatility)';

        return {
            success: true,
            model: 'SkyFare XGBoost v2.4 (Simulated)',
            route,
            cabinClass,
            daysPrior: daysDiff,
            optimalWindow: windowKey,
            predictedFare,
            fareRange: { min: minRange, max: maxRange },
            confidence,
            recommendation: windowKey === 'T+60' || windowKey === 'T+30'
                ? 'Book Now — Prices are expected to rise closer to departure date.'
                : 'High Demand Surge — Consider shifting dates by ±3 days for lower fares.'
        };
    }

    async function predict(route, cabinClass, travelDateStr) {
        if (USE_MOCK_FALLBACK) {
            await new Promise(resolve => setTimeout(resolve, 600));
            return simulateInference(route, cabinClass, travelDateStr);
        }

        try {
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ route, class: cabinClass, travelDate: travelDateStr })
            });

            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return await response.json();
        } catch (err) {
            console.warn('[PredictFareAPI] API endpoint unreachable, invoking model fallback logic:', err.message);
            return simulateInference(route, cabinClass, travelDateStr);
        }
    }

    return { predict };
})();

/**
 * Dynamic Data Export Engine (CSV, JSON, PDF Print)
 */
const ExportEngine = (() => {

    function exportToCSV(filename = 'skyfare_routes_export.csv') {
        const headers = ['Rank', 'Origin', 'Destination', 'Monthly Passenger Volume', 'Route Share (%)', 'Market Weight (%)'];
        const rows = [
            ['1',  'DELHI',     'MUMBAI',    '3,75,420', '10.02%', '4.35%'],
            ['2',  'BENGALURU', 'DELHI',     '2,45,180', '6.54%',  '2.84%'],
            ['3',  'HYDERABAD', 'MUMBAI',    '1,56,271', '4.17%',  '1.81%'],
            ['4',  'BENGALURU', 'HYDERABAD', '1,29,315', '3.45%',  '1.50%'],
            ['5',  'DELHI',     'GOA',       '1,50,718', '4.02%',  '1.75%'],
            ['6',  'AHMEDABAD', 'DELHI',     '1,46,690', '3.91%',  '1.70%'],
            ['7',  'CHENNAI',   'DELHI',     '1,82,340', '4.86%',  '2.11%'],
            ['8',  'DELHI',     'KOLKATA',   '2,10,500', '5.61%',  '2.44%'],
            ['9',  'DELHI',     'PUNE',      '1,95,400', '5.21%',  '2.26%'],
            ['10', 'DELHI',     'LUCKNOW',   '1,65,200', '4.41%',  '1.91%']
        ];

        let csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);

        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function exportToJSON(filename = 'skyfare_active_alerts.json') {
        const payload = {
            system: 'SkyFare AI Airfare Intelligence',
            exportedAt: new Date().toISOString(),
            metrics: {
                currentFare: 6442,
                averageFare: 6369,
                minimumFare: 5780,
                maximumFare: 6950,
                volatility: 301,
                priceChangePct: -4.99
            },
            activeAlerts: MockAPI.loadPriceAlerts(),
            liveDeals: MockAPI.fetchLiveDeals()
        };

        const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
        const link = document.createElement('a');
        link.setAttribute('href', jsonStr);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function triggerPrintPDF() {
        window.print();
    }

    return { exportToCSV, exportToJSON, triggerPrintPDF };
})();
