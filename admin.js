// Admin Functions
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    if (!isAdmin) return;
    
    setupAdminListeners();
    loadAdminData();
});

function setupAdminListeners() {
    // Stock Management
    document.getElementById('stock-submit').addEventListener('click', handleStockManagement);
    
    // Price Management
    document.getElementById('update-price').addEventListener('click', updatePrice);
    
    // Refresh Stats
    document.getElementById('refresh-stats').addEventListener('click', loadAdminData);
    
    // Admin login/logout (simplified)
    const adminToggle = document.createElement('button');
    adminToggle.className = 'btn btn-secondary';
    adminToggle.innerHTML = '<i class="fas fa-sign-out-alt"></i> Admin Logout';
    adminToggle.addEventListener('click', function() {
        localStorage.removeItem('is_admin');
        location.reload();
    });
    
    document.querySelector('.user-info').appendChild(adminToggle);
}

function loadAdminData() {
    updateAdminStats();
    
    // Load recent transactions
    fetch(CONFIG.HISTORY_FILE)
        .then(res => res.json())
        .then(allHistory => {
            const recent = allHistory.slice(0, 10);
            displayRecentTransactions(recent);
        })
        .catch(console.error);
}

async function handleStockManagement() {
    const product = document.getElementById('product-select').value;
    const action = document.getElementById('stock-action').value;
    const codesInput = document.getElementById('codes-input').value.trim();
    
    if (action === 'add') {
        if (!codesInput) {
            showToast('Masukkan kode terlebih dahulu', 'warning');
            return;
        }
        
        const codes = codesInput.split(',').map(c => c.trim()).filter(c => c);
        if (codes.length === 0) {
            showToast('Format kode salah', 'error');
            return;
        }
        
        // Add codes to stock
        stockData.stock[product].push(...codes);
        await saveData();
        
        showToast(`${codes.length} kode ${product} berhasil ditambahkan`, 'success');
        document.getElementById('codes-input').value = '';
        
    } else if (action === 'view') {
        const codes = stockData.stock[product];
        document.getElementById('codes-input').value = codes.join('\n');
    }
    
    updateAdminStats();
    updateProductsDisplay();
}

async function updatePrice() {
    const product = document.getElementById('price-product').value;
    const newPrice = parseInt(document.getElementById('new-price').value);
    
    if (isNaN(newPrice) || newPrice < 1000) {
        showToast('Harga tidak valid', 'error');
        return;
    }
    
    stockData.prices[product] = newPrice;
    await saveData();
    
    showToast(`Harga ${product} diubah menjadi Rp${newPrice.toLocaleString()}`, 'success');
    document.getElementById('new-price').value = '';
    
    updateProductsDisplay();
}

function displayRecentTransactions(transactions) {
    // You can add a transaction log table in the admin panel
    console.log('Recent transactions:', transactions);
}

// Export data function
function exportData() {
    const data = {
        stock: stockData,
        history: purchaseHistory,
        pending: pendingPayments,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loukys-store-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Data berhasil diexport', 'success');
}

// Import data function
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            // Validate and merge data
            if (data.stock) {
                Object.assign(stockData, data.stock);
            }
            if (data.history) {
                // Merge history
            }
            
            saveData();
            showToast('Data berhasil diimport', 'success');
            location.reload();
        } catch (error) {
            showToast('File tidak valid', 'error');
        }
    };
    reader.readAsText(file);
}

// Add export/import buttons to admin panel
function addExportImportButtons() {
    const adminCard = document.querySelector('.admin-card:nth-child(3)');
    if (!adminCard) return;
    
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-secondary mt-1';
    exportBtn.innerHTML = '<i class="fas fa-download"></i> Export Data';
    exportBtn.addEventListener('click', exportData);
    
    const importLabel = document.createElement('label');
    importLabel.className = 'btn btn-secondary mt-1';
    importLabel.innerHTML = '<i class="fas fa-upload"></i> Import Data';
    importLabel.style.cursor = 'pointer';
    
    const importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.json';
    importInput.style.display = 'none';
    importInput.addEventListener('change', importData);
    
    importLabel.appendChild(importInput);
    importLabel.addEventListener('click', () => importInput.click());
    
    adminCard.appendChild(exportBtn);
    adminCard.appendChild(importLabel);
}
