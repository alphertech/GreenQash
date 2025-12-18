// admin-mobile.js - Mobile Responsive Enhancements

document.addEventListener('DOMContentLoaded', function() {
        // Create the mobile menu toggle button
        createMobileMenuToggle();

        // Add responsive event listeners
        setupMobileEventListeners();

        // Handle window resize
        setupWindowResizeHandler();

        // Close sidebar when clicking outside on mobile
        setupOutsideClickHandler();

        // Update UI for mobile on load
        updateUIForMobile();
    });

// Create mobile menu toggle button
function createMobileMenuToggle() {
    // Create the toggle button
    const toggleBtn=document.createElement('button');
    toggleBtn.id='mobileMenuToggle';
    toggleBtn.className='menu-toggle';
    toggleBtn.innerHTML='<i class="fas fa-bars"></i>';
    toggleBtn.setAttribute('aria-label', 'Toggle menu');

    // Style the toggle button
    const style=document.createElement('style');

    style.textContent=` .menu-toggle {
        display: none;
        position: fixed;
        top: 20px;
        left: 20px;
        width: 44px;
        height: 44px;
        background: var(--secondary-color);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        z-index: 2000;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
        justify-content: center;
        align-items: center;
    }

    .menu-toggle:hover {
        background: var(--primary-color);
        transform: scale(1.05);
    }

    .menu-toggle i {
        font-size: 20px;
    }

    .menu-toggle.active {
        background: var(--primary-color);
        left: calc(var(--sidebar-width) + 20px);
    }

    @media (max-width: 1200px) {
        .menu-toggle {
            display: flex;
        }

        .sidebar.active {
            transform: translateX(0);
            box-shadow: 5px 0 20px rgba(0, 0, 0, 0.2);
        }

        .sidebar.active+.main-content {
            margin-left: 0;
            position: relative;
        }

        .sidebar.active+.main-content::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }
        }
    }

    @media (max-width: 768px) {
        .menu-toggle {
            top: 10px;
            left: 10px;
        }

        .menu-toggle.active {
            left: calc(var(--sidebar-width) + 10px);
        }

        .header {
            padding: 10px;
            margin-top: 60px;
        }

        .header h1 {
            font-size: 16px;
        }

        .admin-avatar {
            width: 40px;
            height: 40px;
            font-size: 14px;
        }

        .logout-btn {
            padding: 8px 15px;
            font-size: 12px;
        }

        .section-container {
            margin-top: 10px;
        }

        .section-header {
            flex-direction: column;
            gap: 15px;
        }

        .section-title {
            font-size: 14px;
        }

        .charts-grid {
            grid-template-columns: 1fr;
            gap: 15px;
        }

        .chart-container {
            padding: 15px;
        }

        .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }

        .stat-card {
            padding: 15px;
        }

        .stat-value {
            font-size: 20px;
        }

        table {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
        }

        th,
        td {
            padding: 6px 4px;
            font-size: 12px;
        }

        .modal {
            width: 95%;
            max-height: 85vh;
        }

        .form-row {
            flex-direction: column;
            gap: 0;
        }

        .filters {
            flex-direction: column;
            gap: 10px;
            padding: 10px;
        }

        .quick-actions {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }

        .quick-action-btn {
            padding: 15px;
        }

        .quick-action-btn i {
            font-size: 14px;
        }

        .stats-mini {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
    }

    @media (max-width: 480px) {
        .menu-toggle {
            width: 40px;
            height: 40px;
        }

        .header {
            flex-direction: column;
            gap: 10px;
            text-align: center;
        }

        .admin-info {
            justify-content: center;
        }

        .stats-grid {
            grid-template-columns: 1fr;
        }

        .quick-actions {
            grid-template-columns: 1fr;
        }

        .stats-mini {
            grid-template-columns: 1fr;
        }

        .action-buttons {
            flex-wrap: wrap;
            gap: 3px;
        }

        .action-btn {
            width: 30px;
            height: 30px;
        }

        .pagination {
            flex-wrap: wrap;
            gap: 3px;
        }

        .page-btn {
            padding: 3px 6px;
            font-size: 12px;
        }
    }

    /* Mobile search improvement */
    .search-box input {
        font-size: 14px;
        /* Prevents zoom on iOS */
    }

    /* Improve touch targets */
    .menu-item {
        min-height: 50px;
    }

    button,
    .action-btn,
    .page-btn {
        min-height: 44px;
        /* Minimum touch target size */
    }

    /* Scrollable tables with fade edges */
    .table-container {
        position: relative;
    }

    .table-container::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 30px;
        background: linear-gradient(90deg, transparent, white);
        pointer-events: none;
    }

    `;

    document.head.appendChild(style);
    document.body.appendChild(toggleBtn);
}

// Setup mobile event listeners
function setupMobileEventListeners() {
    const toggleBtn=document.getElementById('mobileMenuToggle');
    const sidebar=document.getElementById('sidebar');
    const menuItems=document.querySelectorAll('.menu-item');

    // Toggle sidebar
    toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleSidebar();
        });

    // Close sidebar when clicking on menu items (mobile)
    menuItems.forEach(item=> {
            item.addEventListener('click', function() {
                    if (window.innerWidth <=1200) {
                        closeSidebar();
                    }
                });
        });

    // Add touch events for better mobile interaction
    let touchStartX=0;
    let touchEndX=0;

    document.addEventListener('touchstart', function(e) {
            touchStartX=e.changedTouches[0].screenX;
        }

        , {
        passive: true
    });

document.addEventListener('touchend', function(e) {
        touchEndX=e.changedTouches[0].screenX;
        handleSwipeGesture();
    }

    , {
    passive: true
});

function handleSwipeGesture() {
    const swipeThreshold=50;
    const swipeDistance=touchEndX - touchStartX;

    // Swipe right to open sidebar (only on mobile)
    if (swipeDistance > swipeThreshold && window.innerWidth <=1200) {
        openSidebar();
    }

    // Swipe left to close sidebar
    else if (swipeDistance < -swipeThreshold && window.innerWidth <=1200) {
        closeSidebar();
    }
}
}

// Setup window resize handler
function setupWindowResizeHandler() {
    let resizeTimer;

    window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);

            resizeTimer=setTimeout(function() {
                    updateUIForMobile();

                    // Close sidebar if switching from mobile to desktop
                    if (window.innerWidth > 1200) {
                        closeSidebar();
                    }
                }

                , 250);
        });
}

// Setup outside click handler for mobile
function setupOutsideClickHandler() {
    document.addEventListener('click', function(e) {
            const sidebar=document.getElementById('sidebar');
            const toggleBtn=document.getElementById('mobileMenuToggle');

            // If sidebar is open on mobile and click is outside, close it
            if (window.innerWidth <=1200 && sidebar.classList.contains('active') && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                closeSidebar();
            }
        });
}

// Toggle sidebar visibility
function toggleSidebar() {
    const sidebar=document.getElementById('sidebar');
    const toggleBtn=document.getElementById('mobileMenuToggle');

    if (sidebar.classList.contains('active')) {
        closeSidebar();
    }

    else {
        openSidebar();
    }
}

// Open sidebar
function openSidebar() {
    const sidebar=document.getElementById('sidebar');
    const toggleBtn=document.getElementById('mobileMenuToggle');

    sidebar.classList.add('active');
    toggleBtn.classList.add('active');
    toggleBtn.innerHTML='<i class="fas fa-times"></i>';

    // Prevent body scroll when sidebar is open
    document.body.style.overflow='hidden';
}

// Close sidebar
function closeSidebar() {
    const sidebar=document.getElementById('sidebar');
    const toggleBtn=document.getElementById('mobileMenuToggle');

    sidebar.classList.remove('active');
    toggleBtn.classList.remove('active');
    toggleBtn.innerHTML='<i class="fas fa-bars"></i>';

    // Restore body scroll
    document.body.style.overflow='auto';
}

// Update UI based on screen size
function updateUIForMobile() {
    const sidebar=document.getElementById('sidebar');
    const mainContent=document.getElementById('mainContent');
    const toggleBtn=document.getElementById('mobileMenuToggle');

    if (window.innerWidth <=1200) {

        // Mobile/Tablet view
        if (sidebar) {
            sidebar.style.transform='translateX(-100%)';
        }

        if (mainContent) {
            mainContent.style.marginLeft='0';
        }

        if (toggleBtn) {
            toggleBtn.style.display='flex';
        }
    }

    else {

        // Desktop view
        if (sidebar) {
            sidebar.style.transform='translateX(0)';
        }

        if (mainContent) {
            mainContent.style.marginLeft='var(--sidebar-width)';
        }

        if (toggleBtn) {
            toggleBtn.style.display='none';
        }

        // Make sure sidebar is visible and body scroll is restored
        sidebar.classList.remove('active');
        document.body.style.overflow='auto';
    }

    // Update table responsiveness
    updateTablesForMobile();

    // Update charts for mobile
    updateChartsForMobile();
}

// Update tables for better mobile display
function updateTablesForMobile() {
    const tables=document.querySelectorAll('table');

    tables.forEach(table=> {
            if (window.innerWidth <=768) {
                table.style.minWidth='600px'; // Ensure tables are scrollable
            }

            else {
                table.style.minWidth='';
            }
        });
}

// Update charts for mobile
function updateChartsForMobile() {
    if (typeof AdminApp !=='undefined' && AdminApp.charts) {
        Object.values(AdminApp.charts).forEach(chart=> {
                if (chart && chart.options) {

                    // Adjust chart options for mobile
                    if (window.innerWidth <=768) {
                        chart.options.maintainAspectRatio=true;

                        if (chart.options.plugins && chart.options.plugins.legend) {
                            chart.options.plugins.legend.position='top';
                        }
                    }

                    else {
                        chart.options.maintainAspectRatio=false;

                        if (chart.options.plugins && chart.options.plugins.legend) {
                            chart.options.plugins.legend.position='bottom';
                        }
                    }

                    chart.resize();
                    chart.update();
                }
            });
    }
}

// Add this to your existing AdminApp object if you want to control from main JS
if (typeof AdminApp !=='undefined') {
    AdminApp.mobile= {
        toggleSidebar: toggleSidebar,
            openSidebar: openSidebar,
            closeSidebar: closeSidebar,
            updateUIForMobile: updateUIForMobile
    }

    ;
}