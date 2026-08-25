/* ============================================================
   SkyFare AI — Chart.js Preset Configurations & Helper Utilities
   ============================================================ */

// Set global Chart.js aesthetic defaults
if (typeof Chart !== 'undefined') {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
    Chart.defaults.scale.grid.color = 'rgba(51,65,85,0.4)';
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15,23,42,0.95)';
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.titleFont = { size: 13, weight: 'bold' };
    Chart.defaults.plugins.tooltip.bodyFont  = { size: 12 };
}

// Global Dataset Benchmarks
const routeChartData = {
    'DEL-BOM': { t1:[7500,7200,6800,6900,6442], t7:[7000,6800,6500,6600,6442], t15:[6500,6300,6200,6100,6305], t30:[6100,5900,5800,5900,6057], t60:[5800,5600,5500,5400,5500] },
    'HYD-BOM': { t1:[7200,6900,6600,6800,6300], t7:[6800,6500,6300,6400,6100], t15:[6200,6000,5900,5800,6000], t30:[5900,5700,5600,5500,5700], t60:[5500,5300,5200,5100,5200] },
    'BLR-HYD': { t1:[5500,5300,5000,5100,4900], t7:[5200,5000,4800,4900,4700], t15:[4800,4600,4500,4400,4500], t30:[4500,4300,4200,4100,4200], t60:[4200,4000,3900,3800,3900] },
};

const routeChartLabels = ['10 Jul 2026', '14-10-2026', '21-10-2026', '28-10-2026', '30-09-2026'];

function makeRouteDatasets(key) {
    const d = routeChartData[key] || routeChartData['DEL-BOM'];
    return [
        { label:'T+1',  data:d.t1,  borderColor:'#ef4444', backgroundColor:'#ef4444', tension:.4, borderWidth:2, pointRadius:4 },
        { label:'T+7',  data:d.t7,  borderColor:'#f97316', backgroundColor:'#f97316', tension:.4, borderWidth:2, pointRadius:4 },
        { label:'T+15', data:d.t15, borderColor:'#3b82f6', backgroundColor:'#3b82f6', tension:.4, borderWidth:2, pointRadius:4 },
        { label:'T+30', data:d.t30, borderColor:'#a855f7', backgroundColor:'#a855f7', tension:.4, borderWidth:2, pointRadius:4 },
        { label:'T+60', data:d.t60, borderColor:'#14b8a6', backgroundColor:'#14b8a6', tension:.4, borderWidth:2, pointRadius:4 },
    ];
}
