// Wait for DOM and Chart.js to load
document.addEventListener('DOMContentLoaded', () => {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;

    window.applyThemeToCharts = function() {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light' || localStorage.getItem('theme') === 'light';
        const textColor = isLight ? '#1A1A2E' : 'rgba(255, 255, 255, 0.6)';
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
        const tooltipBg = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)';
        const tooltipTitle = isLight ? '#1A1A2E' : '#fff';
        const tooltipBody = isLight ? '#4A4A6A' : '#e2e8f0';

        Chart.defaults.color = textColor;
        Chart.defaults.plugins.tooltip.backgroundColor = tooltipBg;
        Chart.defaults.plugins.tooltip.titleColor = tooltipTitle;
        Chart.defaults.plugins.tooltip.bodyColor = tooltipBody;

        if (typeof Chart !== 'undefined' && Chart.instances) {
            for (let id in Chart.instances) {
                let chart = Chart.instances[id];
                if (chart.options.scales) {
                    if (chart.options.scales.x && chart.options.scales.x.grid && chart.options.scales.x.grid.color) {
                        chart.options.scales.x.grid.color = gridColor;
                    }
                    if (chart.options.scales.y && chart.options.scales.y.grid && chart.options.scales.y.grid.color) {
                        chart.options.scales.y.grid.color = gridColor;
                    }
                }
                chart.update();
            }
        }
    };
    
    window.applyThemeToCharts();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                window.applyThemeToCharts();
            }
        });
    });
    observer.observe(document.documentElement, { attributes: true });

    initRevenueTrendsChart();
    initWalletActivityChart();
    initBusPerformanceChart();
    initUserGrowthChart();
    initAgeDistributionChart();
    initPopularRoutesChart();
    initConductorPerformanceChart();
    initSettlementOverviewChart();
    
    // Attempt initial update if data loaded very fast
    setTimeout(window.updateAllDashboardCharts, 500);
});

// Update everything globally
window.updateAllDashboardCharts = function() {
    window.updateBusPerformanceChart();
    window.updateAgeDistributionChart();
    window.updateConductorPerformanceChart();
    if (window.updateRevenueTrendsChart) window.updateRevenueTrendsChart();
    if (window.updateWalletActivityChart) window.updateWalletActivityChart();
};

// Row 1: Revenue Trends (Area Chart)
function initRevenueTrendsChart() {
    const ctx = document.getElementById('revenueTrendsChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(108, 99, 255, 0.5)');   
    gradient.addColorStop(1, 'rgba(108, 99, 255, 0.0)');

    window.revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Revenue (₹)',
                data: [],
                borderColor: '#6C63FF',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#6C63FF',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false } },
                x: { grid: { display: false, drawBorder: false } }
            }
        }
    });
}

window.updateRevenueTrendsChart = function() {
    if (!window.revenueChart) return;
    const bookings = (typeof allBookingsData !== 'undefined') ? allBookingsData : [];
    
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }));
    }

    const revenueMap = {};
    last7Days.forEach(d => revenueMap[d] = 0);

    bookings.forEach(b => {
        if (b.status !== 'failed' && b.createdAt) {
            const d = new Date(b.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
            if (revenueMap[d] !== undefined) {
                revenueMap[d] += (b.totalPrice || 0);
            }
        }
    });

    window.revenueChart.data.labels = last7Days;
    window.revenueChart.data.datasets[0].data = last7Days.map(d => revenueMap[d]);
    window.revenueChart.update();
};

// Row 1: Wallet Activity (Doughnut Chart)
function initWalletActivityChart() {
    const ctx = document.getElementById('walletActivityChart').getContext('2d');
    window.walletChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Recharges', 'Fare Deductions'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#10b981', '#f43f5e'],
                borderWidth: 0, hoverOffset: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '75%',
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } }
        }
    });
}

window.updateWalletActivityChart = function() {
    if (!window.walletChart) return;
    const transactions = (typeof window.allTransactionsData !== 'undefined') ? window.allTransactionsData : [];
    const bookings = (typeof allBookingsData !== 'undefined') ? allBookingsData : [];
    
    // Sum of wallet recharges
    const totalRecharges = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    
    // Sum of wallet deductions (bookings paid by wallet)
    const totalDeductions = bookings.filter(b => b.paymentMethod === 'wallet' && b.status !== 'failed')
                                    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // If both are 0, chart.js won't render the doughnut segments. We can either leave it blank or show a tiny bit so it renders
    if (totalRecharges === 0 && totalDeductions === 0) {
        window.walletChart.data.datasets[0].data = [0.001, 0]; // just to force rendering an empty state
    } else {
        window.walletChart.data.datasets[0].data = [totalRecharges, totalDeductions];
    }
    window.walletChart.update();
};

// Row 2: Bus Performance (Horizontal Bar Chart)
function initBusPerformanceChart() {
    const ctx = document.getElementById('busPerformanceChart').getContext('2d');
    window.busPerfChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Revenue (₹)',
                data: [],
                backgroundColor: 'rgba(108, 99, 255, 0.8)',
                borderRadius: 6
            }, {
                label: 'Bookings Count',
                data: [],
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' } }, y: { grid: { display: false } } }
        }
    });
}

window.updateBusPerformanceChart = function() {
    if (!window.busPerfChart) return;
    const buses = (typeof allBusesData !== 'undefined') ? allBusesData : [];
    const bookings = (typeof allBookingsData !== 'undefined') ? allBookingsData : [];
    
    if (buses.length === 0) return;

    let busStats = buses.map(bus => {
        let revenue = 0, count = 0;
        bookings.forEach(b => {
            if (b.status !== 'failed' && b.busId && (b.busId._id === bus._id || b.busId === bus._id)) {
                revenue += (b.totalPrice || 0); count += 1;
            }
        });
        return { name: bus.busName, revenue, count };
    });

    busStats.sort((a, b) => b.revenue - a.revenue);
    busStats = busStats.slice(0, 5);

    window.busPerfChart.data.labels = busStats.map(b => b.name);
    window.busPerfChart.data.datasets[0].data = busStats.map(b => b.revenue);
    window.busPerfChart.data.datasets[1].data = busStats.map(b => b.count);
    window.busPerfChart.update();
};

// Row 2: User Growth (Line Chart)
function initUserGrowthChart() {
    const ctx = document.getElementById('userGrowthChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
                label: 'Active Users',
                data: [120, 190, 300, 500, 450, 700, 950],
                borderColor: '#10b981',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0
            }, {
                label: 'New Users',
                data: [50, 80, 150, 220, 100, 300, 400],
                borderColor: '#a855f7',
                borderDash: [5, 5],
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            }
        }
    });
}

// Row 3: Age Distribution (Doughnut Chart)
function initAgeDistributionChart() {
    const ctx = document.getElementById('ageDistributionChart').getContext('2d');
    window.ageDistChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: ['#f472b6', '#a855f7', '#6366f1', '#38bdf8', '#fbbf24'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'right', labels: { usePointStyle: true, padding: 15 } }
            }
        }
    });
}

window.updateAgeDistributionChart = function() {
    if (!window.ageDistChart) return;
    const groups = (typeof allUsersGrouped !== 'undefined') ? allUsersGrouped : {};
    const labels = Object.keys(groups);
    const data = labels.map(l => groups[l].length);
    if(labels.length > 0) {
        window.ageDistChart.data.labels = labels;
        window.ageDistChart.data.datasets[0].data = data;
        window.ageDistChart.update();
    }
};

// Row 3: Popular Routes (Vertical Bar Chart)
function initPopularRoutesChart() {
    const ctx = document.getElementById('popularRoutesChart').getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, '#a855f7');
    gradient.addColorStop(1, '#6366f1');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Route A', 'Route B', 'Route C', 'Route D', 'Route E', 'Route F'],
            datasets: [{
                label: 'Passengers',
                data: [1200, 950, 1400, 800, 1100, 600],
                backgroundColor: gradient,
                borderRadius: 8,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// Row 4: Conductor Performance (Bar Chart)
function initConductorPerformanceChart() {
    const ctx = document.getElementById('conductorPerformanceChart').getContext('2d');
    window.condPerfChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Fare Collected (₹)',
                data: [],
                backgroundColor: 'rgba(56, 189, 248, 0.8)',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

window.updateConductorPerformanceChart = function() {
    if (!window.condPerfChart) return;
    const conductors = (typeof allConductorsData !== 'undefined') ? allConductorsData : [];
    const bookings = (typeof allBookingsData !== 'undefined') ? allBookingsData : [];
    
    if (conductors.length === 0) return;

    let stats = conductors.map(c => {
        let rev = 0;
        bookings.forEach(b => {
            if (b.status !== 'failed' && b.scannedBy && (b.scannedBy._id === c._id || b.scannedBy === c._id)) {
                rev += (b.totalPrice || 0);
            }
        });
        return { name: c.name, rev };
    });

    stats.sort((a,b) => b.rev - a.rev);
    stats = stats.slice(0, 5);

    window.condPerfChart.data.labels = stats.map(s => s.name);
    window.condPerfChart.data.datasets[0].data = stats.map(s => s.rev);
    window.condPerfChart.update();
};

// Row 4: Settlement Overview (Stacked Bar Chart)
function initSettlementOverviewChart() {
    const ctx = document.getElementById('settlementOverviewChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Owner Settlement (₹)',
                data: [40000, 42000, 38000, 45000],
                backgroundColor: '#10b981',
                borderRadius: {topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4}
            }, {
                label: 'Platform Commission (₹)',
                data: [4000, 4200, 3800, 4500],
                backgroundColor: '#6C63FF',
                borderRadius: {topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0}
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}

function populateRecentActivity() {
    const feed = document.getElementById('recentActivityFeed');
    const activities = [
        { title: "Wallet Recharge", time: "2 minutes ago", icon: "fa-wallet", color: "var(--success)", bg: "rgba(16,185,129,0.15)" },
        { title: "Fare Deducted (Route A)", time: "15 minutes ago", icon: "fa-bus-simple", color: "var(--warning)", bg: "rgba(245,158,11,0.15)" },
        { title: "New User Registered", time: "1 hour ago", icon: "fa-user-plus", color: "var(--info)", bg: "rgba(14,165,233,0.15)" },
        { title: "Settlement Completed", time: "3 hours ago", icon: "fa-file-invoice-dollar", color: "var(--primary2)", bg: "rgba(168,85,247,0.15)" },
        { title: "New Bus Added (Bus 402)", time: "1 day ago", icon: "fa-bus", color: "var(--primary)", bg: "rgba(99,102,241,0.15)" }
    ];

    feed.innerHTML = activities.map(act => `
        <div class="activity-item">
            <div class="activity-icon" style="background:${act.bg}; color:${act.color}">
                <i class="fas ${act.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${act.title}</div>
                <div class="activity-time">${act.time}</div>
            </div>
        </div>
    `).join('');
}
