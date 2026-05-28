// Expense & Budget Visualizer - Application State & Logic

// State management
let state = {
    budget: 1000,
    transactions: []
};

// Chart instance reference
let expenseChart = null;

// DOM Elements
const budgetInput = document.getElementById('budget-input');
const totalBudgetEl = document.getElementById('total-budget');
const totalExpensesEl = document.getElementById('total-expenses');
const remainingBalanceEl = document.getElementById('remaining-balance');
const remainingBalanceCard = document.getElementById('kpi-balance-card');

const progressPercentText = document.getElementById('progress-percent');
const progressFill = document.getElementById('progress-fill');
const progressLabel = document.getElementById('progress-label');

const transactionForm = document.getElementById('transaction-form');
const itemNameInput = document.getElementById('item-name');
const itemAmountInput = document.getElementById('item-amount');
const itemDateInput = document.getElementById('item-date');

const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const transactionListContainer = document.getElementById('transaction-list');

// Quick Stats elements
const topCategoryEl = document.getElementById('top-category');
const topCategoryValEl = document.getElementById('top-category-value');
const maxExpenseItemEl = document.getElementById('max-expense-item');
const totalCountEl = document.getElementById('total-count');

// Category details
const CATEGORIES = {
    food: { name: 'Food', color: '#06b6d4', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>` },
    rent: { name: 'Rent', color: '#3b82f6', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>` },
    leisure: { name: 'Leisure', color: '#ec4899', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>` },
    transport: { name: 'Transport', color: '#eab308', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>` },
    utilities: { name: 'Utilities', color: '#10b981', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>` },
    other: { name: 'Other', color: '#a855f7', icon: `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>` }
};

// Initialize Application
function init() {
    // Load state from LocalStorage
    const storedState = localStorage.getItem('expense_tracker_state');
    if (storedState) {
        try {
            state = JSON.parse(storedState);
        } catch (e) {
            console.error('Error loading state from localStorage:', e);
        }
    }

    // Set budget input display
    budgetInput.value = state.budget;

    // Setup input date default to today
    const today = new Date().toISOString().split('T')[0];
    itemDateInput.value = today;

    // Bind event listeners
    budgetInput.addEventListener('change', handleBudgetChange);
    budgetInput.addEventListener('input', handleBudgetInputLimit);
    transactionForm.addEventListener('submit', handleAddTransaction);
    searchInput.addEventListener('input', handleFilterChange);
    categoryFilter.addEventListener('change', handleFilterChange);

    // Initial render
    render();
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

// Format Date for Display
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Calculate summary totals
function getTotals() {
    const totalExpenses = state.transactions.reduce((sum, item) => sum + item.amount, 0);
    const remainingBalance = state.budget - totalExpenses;
    const percentUsed = state.budget > 0 ? (totalExpenses / state.budget) * 100 : 0;
    
    return {
        totalExpenses,
        remainingBalance,
        percentUsed
    };
}

// Save state to local storage and update UI
function saveState() {
    localStorage.setItem('expense_tracker_state', JSON.stringify(state));
    render();
}

// Handle dynamic input restrictions for budget
function handleBudgetInputLimit(e) {
    let val = parseFloat(e.target.value);
    if (val < 0) e.target.value = 0;
}

// Handle budget updates
function handleBudgetChange(e) {
    let value = parseFloat(e.target.value);
    if (isNaN(value) || value < 0) {
        value = 0;
    }
    state.budget = value;
    budgetInput.value = value;
    saveState();
}

// Dynamic Input validation indicators helper
function setInputError(element, message) {
    const group = element.closest('.form-group');
    let errorEl = group.querySelector('.error-msg');
    
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'error-msg';
        group.appendChild(errorEl);
    }
    
    if (message) {
        errorEl.innerText = message;
        errorEl.style.display = 'block';
        element.classList.add('invalid');
    } else {
        errorEl.style.display = 'none';
        element.classList.remove('invalid');
    }
}

// Validate individual inputs
function validateInputs() {
    let isValid = true;

    // Item name
    if (!itemNameInput.value.trim()) {
        setInputError(itemNameInput, 'Item name is required');
        isValid = false;
    } else {
        setInputError(itemNameInput, null);
    }

    // Amount
    const amountVal = parseFloat(itemAmountInput.value);
    if (isNaN(amountVal) || amountVal <= 0) {
        setInputError(itemAmountInput, 'Amount must be greater than 0');
        isValid = false;
    } else {
        setInputError(itemAmountInput, null);
    }

    // Category checked
    const checkedCategory = document.querySelector('input[name="category-pill"]:checked');
    const categoryContainer = document.getElementById('category-pills-container');
    if (!checkedCategory) {
        setInputError(categoryContainer, 'Please select a category');
        isValid = false;
    } else {
        setInputError(categoryContainer, null);
    }

    return isValid;
}

// Handle Adding a transaction
function handleAddTransaction(e) {
    e.preventDefault();

    if (!validateInputs()) return;

    const name = itemNameInput.value.trim();
    const amount = parseFloat(itemAmountInput.value);
    const category = document.querySelector('input[name="category-pill"]:checked').value;
    const date = itemDateInput.value || new Date().toISOString().split('T')[0];

    const newTransaction = {
        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name,
        amount,
        category,
        date
    };

    state.transactions.unshift(newTransaction);
    
    // Clear fields
    itemNameInput.value = '';
    itemAmountInput.value = '';
    const checkedCategory = document.querySelector('input[name="category-pill"]:checked');
    if (checkedCategory) checkedCategory.checked = false;
    itemDateInput.value = new Date().toISOString().split('T')[0];

    saveState();
}

// Handle deleting a transaction with smooth CSS animation
function handleDeleteTransaction(id) {
    const itemEl = document.querySelector(`[data-id="${id}"]`);
    if (itemEl) {
        itemEl.classList.add('deleting');
        // Let transition complete (300ms) before actual state removal
        setTimeout(() => {
            state.transactions = state.transactions.filter(tx => tx.id !== id);
            saveState();
        }, 300);
    } else {
        state.transactions = state.transactions.filter(tx => tx.id !== id);
        saveState();
    }
}

// Handle filtering change
function handleFilterChange() {
    renderTransactionList();
}

// Render main components
function render() {
    const totals = getTotals();

    // Render KPI Dashboard Values
    totalBudgetEl.innerText = formatCurrency(state.budget);
    totalExpensesEl.innerText = formatCurrency(totals.totalExpenses);
    remainingBalanceEl.innerText = formatCurrency(totals.remainingBalance);

    // Dynamic classes for remaining balance
    remainingBalanceCard.className = 'glass-panel kpi-card';
    if (totals.remainingBalance >= 0) {
        remainingBalanceCard.classList.add('kpi-balance-positive');
    } else {
        remainingBalanceCard.classList.add('kpi-balance-negative');
    }

    // Render Progress Bar
    renderProgressBar(totals);

    // Render Transaction History (Search & Category filters applied)
    renderTransactionList();

    // Update Chart
    renderChart();

    // Update Quick Stats
    renderQuickStats(totals);
}

// Render the progress bar
function renderProgressBar(totals) {
    const percent = totals.percentUsed;
    progressPercentText.innerText = percent.toFixed(1) + '%';
    
    // Cap visual display width at 100%
    const visualWidth = Math.min(percent, 100);
    progressFill.style.width = visualWidth + '%';

    // Remove old coloring classes
    progressFill.classList.remove('green', 'orange', 'red', 'pulse');

    if (percent < 70) {
        progressFill.classList.add('green');
        progressLabel.innerText = 'Good Standing';
        progressLabel.style.color = 'var(--success)';
    } else if (percent >= 70 && percent < 90) {
        progressFill.classList.add('orange');
        progressLabel.innerText = 'Approaching Limit';
        progressLabel.style.color = 'var(--warning)';
    } else {
        progressFill.classList.add('red');
        progressLabel.innerText = percent >= 100 ? 'Budget Exceeded!' : 'Critical Budget Limit';
        progressLabel.style.color = 'var(--danger)';
        if (percent >= 100) {
            progressFill.classList.add('pulse');
        }
    }
}

// Filter and render list of transactions
function renderTransactionList() {
    const query = searchInput.value.toLowerCase().trim();
    const filterCat = categoryFilter.value;

    const filtered = state.transactions.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(query);
        const matchesCategory = filterCat === 'all' || item.category === filterCat;
        return matchesSearch && matchesCategory;
    });

    if (filtered.length === 0) {
        transactionListContainer.innerHTML = `
            <div class="empty-state">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p>No transactions found.</p>
            </div>
        `;
        return;
    }

    transactionListContainer.innerHTML = '';
    filtered.forEach(tx => {
        const categoryData = CATEGORIES[tx.category] || CATEGORIES.other;

        const row = document.createElement('div');
        row.className = 'transaction-item';
        row.setAttribute('data-id', tx.id);
        row.innerHTML = `
            <div class="transaction-item-left">
                <div class="category-icon cat-${tx.category}">
                    ${categoryData.icon}
                </div>
                <div class="transaction-item-details">
                    <div class="transaction-item-name" title="${escapeHtml(tx.name)}">${escapeHtml(tx.name)}</div>
                    <div class="transaction-item-meta">
                        <span class="transaction-item-category" style="color: ${categoryData.color}">${categoryData.name}</span>
                        <span>•</span>
                        <span>${formatDate(tx.date)}</span>
                    </div>
                </div>
            </div>
            <div class="transaction-item-right">
                <span class="transaction-item-amount">${formatCurrency(tx.amount)}</span>
                <button class="btn-delete" title="Delete transaction" onclick="handleDeleteTransaction('${tx.id}')">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        `;
        transactionListContainer.appendChild(row);
    });
}

// Render/Update Chart.js Doughnut visual
function renderChart() {
    const canvas = document.getElementById('expense-doughnut-chart');
    if (!canvas) return;

    // Calculate totals by category
    const catTotals = {};
    Object.keys(CATEGORIES).forEach(c => catTotals[c] = 0);
    
    let totalSpent = 0;
    state.transactions.forEach(tx => {
        if (catTotals[tx.category] !== undefined) {
            catTotals[tx.category] += tx.amount;
            totalSpent += tx.amount;
        } else {
            catTotals.other += tx.amount;
            totalSpent += tx.amount;
        }
    });

    // Extract categories with spending > 0
    const labels = [];
    const data = [];
    const colors = [];

    if (totalSpent === 0) {
        // Render single gray doughnut for empty state representation
        labels.push('No Expenses');
        data.push(1);
        colors.push('#1e293b'); // slate-800
    } else {
        Object.keys(CATEGORIES).forEach(c => {
            if (catTotals[c] > 0) {
                labels.push(CATEGORIES[c].name);
                data.push(catTotals[c]);
                colors.push(CATEGORIES[c].color);
            }
        });
    }

    if (expenseChart) {
        // Update Chart data dynamically
        expenseChart.data.labels = labels;
        expenseChart.data.datasets[0].data = data;
        expenseChart.data.datasets[0].backgroundColor = colors;
        
        // Custom empty state configuration toggle
        if (totalSpent === 0) {
            expenseChart.options.plugins.tooltip.enabled = false;
            expenseChart.options.plugins.legend.onClick = null; // disable clicking
        } else {
            expenseChart.options.plugins.tooltip.enabled = true;
            delete expenseChart.options.plugins.legend.onClick; // restore
        }
        
        expenseChart.update();
    } else {
        // Initialize Chart.js Doughnut
        try {
            const ctx = canvas.getContext('2d');
            expenseChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors,
                        borderWidth: 1,
                        borderColor: '#0f172a',
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#9ca3af',
                                font: {
                                    family: "'Outfit', sans-serif",
                                    size: 11,
                                    weight: '500'
                                },
                                boxWidth: 12,
                                padding: 12
                            }
                        },
                        tooltip: {
                            enabled: totalSpent > 0,
                            callbacks: {
                                label: function(context) {
                                    if (totalSpent === 0) return ' No Expenses';
                                    const value = context.parsed;
                                    const pct = ((value / totalSpent) * 100).toFixed(1);
                                    return ` ${context.label}: ${formatCurrency(value)} (${pct}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (e) {
            console.error('Error initializing Chart.js:', e);
        }
    }
}

// Render dynamic statistical insights
function renderQuickStats(totals) {
    // 1. Top Category
    const catTotals = {};
    state.transactions.forEach(tx => {
        catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount;
    });

    let topCat = 'None';
    let topCatVal = 0;
    
    Object.keys(catTotals).forEach(c => {
        if (catTotals[c] > topCatVal) {
            topCatVal = catTotals[c];
            topCat = CATEGORIES[c].name;
        }
    });

    if (topCatVal > 0) {
        const pct = totals.totalExpenses > 0 ? ((topCatVal / totals.totalExpenses) * 100).toFixed(0) : 0;
        topCategoryEl.innerText = topCat;
        topCategoryValEl.innerText = `${formatCurrency(topCatVal)} (${pct}%)`;
        topCategoryEl.classList.add('highlight');
    } else {
        topCategoryEl.innerText = '—';
        topCategoryValEl.innerText = '—';
        topCategoryEl.classList.remove('highlight');
    }

    // 2. Most Expensive single Item
    let maxItemName = '—';
    let maxItemVal = 0;

    state.transactions.forEach(tx => {
        if (tx.amount > maxItemVal) {
            maxItemVal = tx.amount;
            maxItemName = tx.name;
        }
    });

    if (maxItemVal > 0) {
        maxExpenseItemEl.innerHTML = `<span style="font-weight: 500">${escapeHtml(maxItemName)}</span> (${formatCurrency(maxItemVal)})`;
    } else {
        maxExpenseItemEl.innerText = '—';
    }

    // 3. Count
    totalCountEl.innerText = state.transactions.length;
}

// Simple HTML escaping helper for display safety
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Start app once DOM is ready
document.addEventListener('DOMContentLoaded', init);
window.handleDeleteTransaction = handleDeleteTransaction;
