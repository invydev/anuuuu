// Global Variables
let currentUser = null;
let stockData = {
    stock: { VIP7D: [], VIP30D: [] },
    prices: { VIP7D: 20000, VIP30D: 60000 }
};
let pendingPayments = {};
let purchaseHistory = [];

// Configuration
const CONFIG = {
    RUMAH_OTP_KEY: "otp_CNVfvtGNDqJKMQcf",
    API_BASE: "https://rumahotp.com/api/v1",
    STOCK_FILE: './database/stock.json',
    HISTORY_FILE: './database/history.json'
};

// DOM Elements
const sections = {
    home: document.getElementById('home'),
    products: document.getElementById('products'),
    history: document.getElementById('history'),
    admin: document.getElementById('admin')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initUser();
    loadData();
    setupEventListeners();
    updateUI();
    checkPendingPayments();
});

// Initialize User
function initUser() {
    // Generate or get user ID from localStorage
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user_id', userId);
    }
    currentUser = userId;
    document.getElementById('user-id').textContent = `User: ${userId.substr(0, 8)}`;
    
    // Check if user is admin (simplified check - in real app, use proper auth)
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    if (isAdmin) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'block';
        });
    }
}

// Load Data from Files/API
async function loadData() {
    try {
        // Load stock data
        const stockResponse = await fetch(CONFIG.STOCK_FILE);
        if (stockResponse.ok) {
            stockData = await stockResponse.json();
        }
        
        // Load history
        const historyResponse = await fetch(CONFIG.HISTORY_FILE);
        if (historyResponse.ok) {
            const allHistory = await historyResponse.json();
            purchaseHistory = allHistory.filter(h => h.userId === currentUser);
        }
        
        updateProductsDisplay();
        updateHistoryTable();
        updateAdminStats();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data', 'error');
    }
}

// Save Data
async function saveData() {
    try {
        // Save stock data
        await fetch('/api/save-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stockData)
        });
        
        // Note: In real implementation, you'd have a backend API
        // For now, we'll just update the UI
    } catch (error) {
        console.error('Error saving data:', error);
        showToast('Error saving data', 'error');
    }
}

// Update Products Display
function updateProductsDisplay() {
    const containers = [
        document.querySelector('#products-container'),
        document.querySelector('#products .products-grid.detailed')
    ];
    
    containers.forEach(container => {
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.entries(stockData.stock).forEach(([product, codes]) => {
            const card = createProductCard(product, codes.length);
            container.appendChild(card);
        });
    });
    
    // Update stats
    document.getElementById('total-sales').textContent = purchaseHistory.length;
    document.getElementById('online-now').textContent = Math.floor(Math.random() * 50) + 20; // Simulated
}

// Create Product Card
function createProductCard(product, stockCount) {
    const price = stockData.prices[product];
    const productName = product === 'VIP7D' ? 'VIP 7 Hari' : 'VIP 30 Hari';
    
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-header">
            <h3>${productName}</h3>
            <div class="product-price">Rp${price.toLocaleString()}</div>
            <div class="product-duration">
                <i class="far fa-clock"></i>
                ${product === 'VIP7D' ? '7 Days Access' : '30 Days Access'}
            </div>
        </div>
        <div class="product-body">
            <div class="stock-info">
                <div>
                    <div class="stock-label">Stock Available:</div>
                    <div class="stock-count">${stockCount} Codes</div>
                </div>
                <div class="stock-status ${getStockStatus(stockCount)}">
                    ${stockCount > 10 ? 'Available' : stockCount > 0 ? 'Low Stock' : 'Out of Stock'}
                </div>
            </div>
            <div class="features">
                <div class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    Full Android Games Access
                </div>
                <div class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    High Performance Cloud
                </div>
                <div class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    24/7 Support
                </div>
            </div>
            <button class="btn btn-primary buy-btn" 
                    data-product="${product}"
                    ${stockCount === 0 ? 'disabled' : ''}>
                <i class="fas fa-shopping-cart"></i>
                ${stockCount === 0 ? 'Out of Stock' : 'Buy Now'}
            </button>
        </div>
    `;
    
    return card;
}

function getStockStatus(count) {
    if (count > 10) return 'stock-available';
    if (count > 0) return 'stock-low';
    return 'stock-empty';
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            switchSection(target);
        });
    });
    
    // Theme Toggle
    document.getElementById('theme-toggle').addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
    });
    
    // Buy Buttons (delegated)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('buy-btn') || e.target.closest('.buy-btn')) {
            const btn = e.target.classList.contains('buy-btn') ? e.target : e.target.closest('.buy-btn');
            const product = btn.dataset.product;
            startPurchase(product);
        }
    });
    
    // Payment Modal
    document.querySelector('.close-modal').addEventListener('click', closePaymentModal);
    document.getElementById('check-status').addEventListener('click', checkPaymentStatus);
    document.getElementById('cancel-payment').addEventListener('click', cancelPayment);
}

// Switch Sections
function switchSection(sectionId) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
    
    // Show selected section
    Object.values(sections).forEach(section => {
        section.classList.remove('active');
    });
    sections[sectionId].classList.add('active');
}

// Start Purchase Process
async function startPurchase(product) {
    if (stockData.stock[product].length === 0) {
        showToast('Stock habis!', 'error');
        return;
    }
    
    const price = stockData.prices[product];
    showLoading(true);
    
    try {
        // Create payment request
        const response = await fetch(`${CONFIG.API_BASE}/deposit/create?amount=${price}&payment_id=qris`, {
            headers: {
                'x-apikey': CONFIG.RUMAH_OTP_KEY,
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const paymentData = data.data;
            
            // Store pending payment
            pendingPayments[currentUser] = {
                product,
                price,
                trxId: paymentData.id,
                status: 'pending',
                timestamp: Date.now()
            };
            
            // Show payment modal
            showPaymentModal(paymentData, product, price);
        } else {
            throw new Error(data.message || 'Payment creation failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showToast(`Payment error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Show Payment Modal
function showPaymentModal(paymentData, product, price) {
    const modal = document.getElementById('payment-modal');
    const infoDiv = document.getElementById('payment-info');
    
    infoDiv.innerHTML = `
        <div class="payment-details">
            <h4>Payment Details</h4>
            <div class="detail-item">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">${paymentData.id}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Product:</span>
                <span class="detail-value">${product === 'VIP7D' ? 'VIP 7 Hari' : 'VIP 30 Hari'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Amount:</span>
                <span class="detail-value">Rp${paymentData.amount.toLocaleString()}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Status:</span>
                <span class="detail-value status-pending">Pending</span>
            </div>
            <p class="instruction">
                Scan QR code below with your e-wallet (Dana, OVO, GoPay, etc)
            </p>
        </div>
    `;
    
    // Display QR Code
    const qrContainer = document.getElementById('qrcode-container');
    qrContainer.innerHTML = `<img src="data:image/png;base64,${paymentData.qr}" alt="QR Code">`;
    
    // Store current transaction ID
    modal.dataset.trxId = paymentData.id;
    
    modal.classList.add('active');
}

// Close Payment Modal
function closePaymentModal() {
    document.getElementById('payment-modal').classList.remove('active');
}

// Check Payment Status
async function checkPaymentStatus() {
    const modal = document.getElementById('payment-modal');
    const trxId = modal.dataset.trxId;
    
    if (!trxId) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${CONFIG.API_BASE}/deposit/get_status?deposit_id=${trxId}`, {
            headers: {
                'x-apikey': CONFIG.RUMAH_OTP_KEY,
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        const status = data.data?.status;
        
        if (status === 'success') {
            // Process successful payment
            await processSuccessfulPayment(trxId);
        } else if (status === 'pending') {
            showToast('Payment belum masuk, pastikan sudah membayar!', 'warning');
        } else {
            showToast('Transaksi expired atau dibatalkan', 'error');
        }
    } catch (error) {
        console.error('Status check error:', error);
        showToast('Error checking status', 'error');
    } finally {
        showLoading(false);
    }
}

// Process Successful Payment
async function processSuccessfulPayment(trxId) {
    const payment = pendingPayments[currentUser];
    if (!payment || payment.trxId !== trxId) return;
    
    const { product } = payment;
    
    // Get code from stock
    if (stockData.stock[product].length === 0) {
        showToast('Stock habis!', 'error');
        return;
    }
    
    const code = stockData.stock[product].shift();
    
    // Save updated stock
    await saveData();
    
    // Add to history
    const historyItem = {
        id: 'TX' + Date.now(),
        userId: currentUser,
        product,
        code,
        price: payment.price,
        date: new Date().toISOString(),
        status: 'success'
    };
    
    purchaseHistory.unshift(historyItem);
    updateHistoryTable();
    
    // Show success message with code
    showToast(`Pembelian berhasil! Kode: ${code}`, 'success');
    
    // Send notification (simulated)
    sendNotificationToAdmin(historyItem);
    
    // Close modal and update UI
    closePaymentModal();
    delete pendingPayments[currentUser];
    updateProductsDisplay();
    updateAdminStats();
}

// Cancel Payment
async function cancelPayment() {
    const modal = document.getElementById('payment-modal');
    const trxId = modal.dataset.trxId;
    
    if (!trxId) return;
    
    showLoading(true);
    
    try {
        await fetch(`${CONFIG.API_BASE}/deposit/cancel?deposit_id=${trxId}`, {
            headers: {
                'x-apikey': CONFIG.RUMAH_OTP_KEY
            }
        });
        
        delete pendingPayments[currentUser];
        closePaymentModal();
        showToast('Pembayaran dibatalkan', 'warning');
    } catch (error) {
        console.error('Cancel error:', error);
        showToast('Gagal membatalkan transaksi', 'error');
    } finally {
        showLoading(false);
    }
}

// Update History Table
function updateHistoryTable() {
    const tbody = document.getElementById('history-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    purchaseHistory.slice(0, 20).forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.product === 'VIP7D' ? 'VIP 7 Hari' : 'VIP 30 Hari'}</td>
            <td><code>${item.code}</code></td>
            <td>Rp${item.price.toLocaleString()}</td>
            <td>${new Date(item.date).toLocaleString()}</td>
            <td><span class="status-badge status-${item.status}">${item.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Update Admin Stats
function updateAdminStats() {
    document.getElementById('admin-vip7d-stock').textContent = stockData.stock.VIP7D.length;
    document.getElementById('admin-vip30d-stock').textContent = stockData.stock.VIP30D.length;
    document.getElementById('pending-payments').textContent = Object.keys(pendingPayments).length;
    
    // Calculate today's sales
    const today = new Date().toDateString();
    const todaySales = purchaseHistory.filter(h => 
        new Date(h.date).toDateString() === today
    ).length;
    document.getElementById('today-sales').textContent = todaySales;
}

// Check Pending Payments on Load
function checkPendingPayments() {
    const userPayment = pendingPayments[currentUser];
    if (userPayment) {
        // Check if payment is older than 1 hour
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (userPayment.timestamp < oneHourAgo) {
            delete pendingPayments[currentUser];
        } else {
            showToast('Anda memiliki pembayaran pending', 'warning');
        }
    }
}

// Send Notification to Admin (simulated)
function sendNotificationToAdmin(transaction) {
    console.log('Admin Notification:', transaction);
    // In real implementation, send to backend/email/telegram
}

// UI Helper Functions
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');
    
    // Set icon based on type
    icon.className = 'toast-icon';
    if (type === 'success') {
        icon.classList.add('fas', 'fa-check-circle');
        toast.className = 'toast success';
    } else if (type === 'error') {
        icon.classList.add('fas', 'fa-times-circle');
        toast.className = 'toast error';
    } else if (type === 'warning') {
        icon.classList.add('fas', 'fa-exclamation-triangle');
        toast.className = 'toast warning';
    } else {
        icon.classList.add('fas', 'fa-info-circle');
        toast.className = 'toast info';
    }
    
    messageEl.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    loading.classList.toggle('active', show);
}

function updateUI() {
    // Update user display
    document.getElementById('user-id').textContent = 
        `User: ${currentUser ? currentUser.substr(0, 8) : 'Guest'}`;
    
    // Update total users (simulated)
    document.getElementById('total-users').textContent = 
        Math.floor(Math.random() * 1000) + 500;
}