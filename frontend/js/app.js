/* ============================================================
   SkyFare AI — Core Application Bootstrap & Navigation Router
   ============================================================ */

// ── Toast Notification Helper ─────────────────────────────
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'ph-check-circle', error: 'ph-warning-circle', info: 'ph-info' };
    toast.innerHTML = `<i class="ph ${icons[type] || 'ph-info'}"></i><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// ── Skeleton Loader Helpers ───────────────────────────────
function showTableSkeleton(tbody) {
    const noResultsRow = document.getElementById('noResultsRow');
    const dataRows = tbody.querySelectorAll('tr:not(#noResultsRow)');
    dataRows.forEach(r => r.style.display = 'none');
    if (noResultsRow) noResultsRow.style.display = 'none';

    const skeletons = Array.from({ length: 5 }, (_, i) => {
        const tr = document.createElement('tr');
        tr.className = 'skeleton-table-row';
        tr.id = `skel-${i}`;
        tr.innerHTML = `<td><div class="skeleton-cell short"></div></td>
                        <td><div class="skeleton-cell long"></div></td>
                        <td><div class="skeleton-cell medium"></div></td>
                        <td><div class="skeleton-cell short"></div></td>
                        <td><div class="skeleton-cell short"></div></td>`;
        tbody.appendChild(tr);
        return tr;
    });
    return skeletons;
}

function removeTableSkeleton(skeletons) {
    skeletons.forEach(s => s.remove());
}

// ── Mobile Sidebar Controls ───────────────────────────────
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
}

// ── Theme Switcher & Settings ─────────────────────────────
function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
}

function loadSavedSettings() {
    const prefs = MockAPI.loadFilterPrefs();
    if (prefs.theme) {
        applyTheme(prefs.theme);
        const themeSelect = document.getElementById('themeModeSelect');
        if (themeSelect) themeSelect.value = prefs.theme;
    }
}

// ── Global Error Boundary Handler ─────────────────────────
function setupErrorBoundary() {
    window.onerror = function (message, source, lineno, colno, error) {
        console.error('[SkyFare Global Error Boundary caught]:', { message, source, lineno, colno, error });
        renderErrorOverlay(`${message} (Line ${lineno}:${colno})`);
        return true; // Prevents app crash from breaking state silently
    };

    window.onunhandledrejection = function (event) {
        console.error('[SkyFare Unhandled Promise Rejection]:', event.reason);
        renderErrorOverlay(event.reason?.message || String(event.reason));
    };
}

function renderErrorOverlay(errMsg) {
    let overlay = document.getElementById('errorBoundaryOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'errorBoundaryOverlay';
        overlay.className = 'error-boundary-overlay';
        overlay.innerHTML = `
            <div class="error-boundary-card">
                <i class="ph ph-warning-diamond error-boundary-icon"></i>
                <h2>Something went wrong</h2>
                <p>SkyFare AI caught an unexpected runtime error. Your session data is preserved.</p>
                <div class="error-log-box" id="errorBoundaryLog"></div>
                <button class="primary-btn" onclick="location.reload()">
                    <i class="ph ph-arrow-counter-clockwise"></i> Reload Dashboard
                </button>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    const logBox = document.getElementById('errorBoundaryLog');
    if (logBox) logBox.textContent = errMsg;
}

// ── Application Initialization Bootstrap ──────────────────
document.addEventListener('DOMContentLoaded', () => {
    setupErrorBoundary();
    loadSavedSettings();

    // ── Sidebar Navigation Router ─────────────────────────
    const navMap = {
        'Dashboard':        'view-dashboard',
        'Airfare Analysis': 'view-airfare',
        'Route Analysis':   'view-route',
        'Booking Window':   'view-booking',
        'Price Prediction': 'view-prediction',
        'Price Alerts':     'view-alerts',
        'Reports':          'view-reports',
    };

    const navItems = document.querySelectorAll('.sidebar-nav li');

    navItems.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const label = item.textContent.trim();
            const viewId = navMap[label];
            if (!viewId) return;

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
            const target = document.getElementById(viewId);
            if (target) target.classList.add('active');

            // Lazy load view initializers
            if (viewId === 'view-airfare' && typeof initAirfareAnalysisView === 'function') {
                initAirfareAnalysisView();
            }
            if (viewId === 'view-route' && typeof initRouteAnalysisView === 'function') {
                initRouteAnalysisView();
            }
            if (viewId === 'view-booking' && typeof initBookingWindowView === 'function') {
                initBookingWindowView();
            }

            closeSidebar();
        });
    });

    // Mobile sidebar triggers
    const toggleBtn  = document.getElementById('sidebarToggle');
    const closeBtn   = document.getElementById('sidebarClose');
    const overlayBtn = document.getElementById('sidebarOverlay');

    if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
    if (closeBtn)  closeBtn.addEventListener('click', closeSidebar);
    if (overlayBtn) overlayBtn.addEventListener('click', closeSidebar);

    // Settings Modal Handlers
    const settingsBtn   = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettingsModal');
    const themeSelect   = document.getElementById('themeModeSelect');

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
    }
    if (closeSettings && settingsModal) {
        closeSettings.addEventListener('click', () => settingsModal.classList.remove('active'));
    }
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            applyTheme(theme);
            MockAPI.saveFilterPref('theme', theme);
            showToast(`Theme switched to ${theme.toUpperCase()}`, 'info');
        });
    }

    // Initialize View Modules
    if (typeof initDashboardModule === 'function') initDashboardModule();
    if (typeof initPredictionModule === 'function') initPredictionModule();
    if (typeof initRouteAnalysisModule === 'function') initRouteAnalysisModule();
    if (typeof initBookingWindowModule === 'function') initBookingWindowModule();
});
