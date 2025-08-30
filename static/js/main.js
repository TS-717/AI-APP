/**
 * Main JavaScript file for FreelanceTax India
 * Handles UI interactions, form validations, and dynamic content
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeFeatherIcons();
    initializeTooltips();
    initializeForms();
    initializeFileUpload();
    initializeDashboardCharts();
    initializeNotifications();
    
    // Auto-hide alerts after 5 seconds
    autoHideAlerts();
});

/**
 * Initialize Feather Icons
 */
function initializeFeatherIcons() {
    if (typeof feather !== 'undefined') {
        feather.replace();
        
        // Re-initialize icons after dynamic content changes
        const observer = new MutationObserver(function(mutations) {
            let shouldReplace = false;
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && node.querySelector && node.querySelector('[data-feather]')) {
                            shouldReplace = true;
                        }
                    });
                }
            });
            if (shouldReplace) {
                feather.replace();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

/**
 * Initialize Bootstrap tooltips
 */
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Initialize form enhancements
 */
function initializeForms() {
    // Add loading state to forms on submission
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.disabled) {
                submitBtn.disabled = true;
                submitBtn.classList.add('loading');
                
                // Create loading spinner
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm me-2" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </span>
                    Processing...
                `;
                
                // Re-enable button after 30 seconds as fallback
                setTimeout(() => {
                    if (submitBtn.disabled) {
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('loading');
                        submitBtn.innerHTML = originalText;
                    }
                }, 30000);
            }
        });
    });
    
    // Add client-side validation
    addFormValidation();
}

/**
 * Add client-side form validation
 */
function addFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
                
                // Focus on first invalid field
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                }
            }
            form.classList.add('was-validated');
        });
    });
}

/**
 * Enhanced file upload functionality
 */
function initializeFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    if (!fileInput || !uploadArea) return;
    
    // File type validation
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (!validateFileType(file)) {
                showNotification('Invalid file type. Please upload PDF, PNG, JPG, JPEG, TIFF, or BMP files.', 'error');
                e.target.value = '';
                return;
            }
            
            if (!validateFileSize(file)) {
                showNotification('File too large. Maximum size is 16MB.', 'error');
                e.target.value = '';
                return;
            }
        }
    });
    
    // Enhanced drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        uploadArea.classList.add('border-primary', 'bg-light');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('border-primary', 'bg-light');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            
            if (validateFileType(file) && validateFileSize(file)) {
                fileInput.files = files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }
}

/**
 * Validate file type
 */
function validateFileType(file) {
    const allowedTypes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/tiff',
        'image/bmp'
    ];
    
    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'tiff', 'bmp'];
    const extension = file.name.split('.').pop().toLowerCase();
    
    return allowedTypes.includes(file.type) || allowedExtensions.includes(extension);
}

/**
 * Validate file size
 */
function validateFileSize(file) {
    const maxSize = 16 * 1024 * 1024; // 16MB
    return file.size <= maxSize;
}

/**
 * Initialize dashboard charts and visualizations
 */
function initializeDashboardCharts() {
    // Simple chart implementation using HTML/CSS
    createIncomeExpenseChart();
    createCategoryChart();
}

/**
 * Create income vs expense chart
 */
function createIncomeExpenseChart() {
    const chartContainer = document.getElementById('incomeExpenseChart');
    if (!chartContainer) return;
    
    const totalIncome = parseFloat(chartContainer.dataset.income || 0);
    const totalExpenses = parseFloat(chartContainer.dataset.expenses || 0);
    const total = totalIncome + totalExpenses;
    
    if (total > 0) {
        const incomePercentage = (totalIncome / total) * 100;
        const expensePercentage = (totalExpenses / total) * 100;
        
        chartContainer.innerHTML = `
            <div class="progress" style="height: 30px;">
                <div class="progress-bar bg-success" role="progressbar" 
                     style="width: ${incomePercentage}%" title="Income: ₹${totalIncome.toLocaleString()}">
                    <span class="text-white fw-bold">${incomePercentage.toFixed(1)}%</span>
                </div>
                <div class="progress-bar bg-warning" role="progressbar" 
                     style="width: ${expensePercentage}%" title="Expenses: ₹${totalExpenses.toLocaleString()}">
                    <span class="text-dark fw-bold">${expensePercentage.toFixed(1)}%</span>
                </div>
            </div>
            <div class="d-flex justify-content-between mt-2 small">
                <span class="text-success">Income: ₹${totalIncome.toLocaleString()}</span>
                <span class="text-warning">Expenses: ₹${totalExpenses.toLocaleString()}</span>
            </div>
        `;
    }
}

/**
 * Create category breakdown chart
 */
function createCategoryChart() {
    const chartContainer = document.getElementById('categoryChart');
    if (!chartContainer) return;
    
    try {
        const categoryData = JSON.parse(chartContainer.dataset.categories || '{}');
        const categories = Object.entries(categoryData)
            .sort(([,a], [,b]) => Math.abs(b.net) - Math.abs(a.net))
            .slice(0, 5); // Top 5 categories
        
        if (categories.length > 0) {
            const maxAmount = Math.max(...categories.map(([,data]) => Math.abs(data.net)));
            
            chartContainer.innerHTML = categories.map(([category, data]) => {
                const percentage = maxAmount > 0 ? (Math.abs(data.net) / maxAmount) * 100 : 0;
                const isPositive = data.net >= 0;
                
                return `
                    <div class="d-flex align-items-center mb-2">
                        <div class="flex-shrink-0" style="width: 120px;">
                            <small class="text-muted">${category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</small>
                        </div>
                        <div class="flex-grow-1 mx-2">
                            <div class="progress" style="height: 20px;">
                                <div class="progress-bar ${isPositive ? 'bg-success' : 'bg-danger'}" 
                                     role="progressbar" style="width: ${percentage}%">
                                </div>
                            </div>
                        </div>
                        <div class="flex-shrink-0" style="width: 80px; text-align: right;">
                            <small class="${isPositive ? 'text-success' : 'text-danger'}">
                                ₹${Math.abs(data.net).toLocaleString()}
                            </small>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (e) {
        console.warn('Error creating category chart:', e);
    }
}

/**
 * Initialize notification system
 */
function initializeNotifications() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notificationContainer')) {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    const iconName = {
        'success': 'check-circle',
        'error': 'alert-circle',
        'warning': 'alert-triangle',
        'info': 'info'
    }[type] || 'info';
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show`;
    notification.innerHTML = `
        <i data-feather="${iconName}" class="me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    container.appendChild(notification);
    feather.replace();
    
    // Auto-dismiss after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
}

/**
 * Auto-hide alerts
 */
function autoHideAlerts() {
    const alerts = document.querySelectorAll('.alert:not(.alert-dismissible)');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert && alert.style) {
                alert.style.opacity = '0';
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.remove();
                    }
                }, 300);
            }
        }, 5000);
    });
}

/**
 * Format currency for display
 */
function formatCurrency(amount, currency = 'INR') {
    const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
}

/**
 * Debounce function for search inputs
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard!', 'success', 2000);
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

/**
 * Fallback copy to clipboard for older browsers
 */
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('Copied to clipboard!', 'success', 2000);
    } catch (err) {
        showNotification('Failed to copy to clipboard', 'error', 3000);
    }
    
    document.body.removeChild(textArea);
}

/**
 * Smooth scroll to element
 */
function smoothScrollTo(element) {
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * Keyboard shortcuts
 */
document.addEventListener('keydown', function(e) {
    // Ctrl + U for upload
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        const uploadBtn = document.querySelector('a[href*="upload"]');
        if (uploadBtn) uploadBtn.click();
    }
    
    // Ctrl + D for dashboard
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        const dashboardBtn = document.querySelector('a[href*="dashboard"]');
        if (dashboardBtn) dashboardBtn.click();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) {
            const modalInstance = bootstrap.Modal.getInstance(openModal);
            if (modalInstance) modalInstance.hide();
        }
    }
});

/**
 * Handle offline/online status
 */
window.addEventListener('online', function() {
    showNotification('Connection restored', 'success', 3000);
});

window.addEventListener('offline', function() {
    showNotification('No internet connection', 'warning', 5000);
});

/**
 * Performance monitoring
 */
function trackPagePerformance() {
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(function() {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
                    console.log(`Page load time: ${loadTime}ms`);
                    
                    // Log slow page loads
                    if (loadTime > 3000) {
                        console.warn('Slow page load detected:', loadTime + 'ms');
                    }
                }
            }, 0);
        });
    }
}

// Initialize performance monitoring
trackPagePerformance();

/**
 * Export functions for global use
 */
window.FreelanceTaxApp = {
    formatCurrency,
    showNotification,
    copyToClipboard,
    smoothScrollTo,
    validateFileType,
    validateFileSize
};
