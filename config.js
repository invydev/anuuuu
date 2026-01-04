// Website Configuration
const CONFIG = {
    // API Configuration
    RUMAH_OTP_KEY: "otp_nBLBVpwDGmjVeHTW",
    API_BASE: "https://rumahotp.com/api/v1",
    
    // File paths (for development - in production these would be API endpoints)
    STOCK_FILE: './database/stock.json',
    HISTORY_FILE: './database/history.json',
    USERS_FILE: './database/users.json',
    
    // Website Settings
    SITE_NAME: "Loukys Store",
    SITE_DESCRIPTION: "Redfinger Cloud Gaming Code Store",
    ADMIN_ID: "7849193740", // Your Telegram ID for admin notifications
    
    // Payment Settings
    CURRENCY: "Rp",
    PAYMENT_TIMEOUT: 3600, // 1 hour in seconds
    
    // Theme Settings
    DEFAULT_THEME: "light", // light or dark
    
    // Features
    ENABLE_HISTORY: true,
    ENABLE_ADMIN_PANEL: true,
    ENABLE_QRCODE: true,
    
    // Notification Settings
    NOTIFY_ADMIN_ON_SALE: true,
    AUTO_CHECK_PAYMENT: false, // Auto-check payment status every 30 seconds
};

// Initialize configuration
(function() {
    // Set theme
    const savedTheme = localStorage.getItem('theme') || CONFIG.DEFAULT_THEME;
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }
    }
    
    // Set page title
    document.title = CONFIG.SITE_NAME;
    
    // Set meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', CONFIG.SITE_DESCRIPTION);
    }
})();
