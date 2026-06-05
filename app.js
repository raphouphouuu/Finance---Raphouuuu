// ============================================================
// FINANCE TRACKER — app.js
// ============================================================

const CATEGORIES = {
    expense: [
        { id: 'food',          name: 'Alimentation', icon: '🛒', color: '#ff6b6b' },
        { id: 'transport',     name: 'Transport',    icon: '🚗', color: '#ffa502' },
        { id: 'housing',       name: 'Logement',     icon: '🏠', color: '#ff7f50' },
        { id: 'health',        name: 'Santé',        icon: '💊', color: '#ff4757' },
        { id: 'entertainment', name: 'Loisirs',      icon: '🎬', color: '#a55eea' },
        { id: 'shopping',      name: 'Shopping',     icon: '🛍️', color: '#fd79a8' },
        { id: 'bills',         name: 'Factures',     icon: '📄', color: '#636e72' },
        { id: 'education',     name: 'Éducation',    icon: '📚', color: '#0984e3' },
        { id: 'restaurant',    name: 'Restaurant',   icon: '🍽️', color: '#e17055' },
        { id: 'other_expense', name: 'Autre',        icon: '📦', color: '#95a5a6' }
    ],
    income: [
        { id: 'salary',       name: 'Salaire',         icon: '💼', color: '#00d09c' },
        { id: 'freelance',    name: 'Freelance',        icon: '💻', color: '#00b894' },
        { id: 'investment',   name: 'Investissement',   icon: '📈', color: '#00cec9' },
        { id: 'gift',         name: 'Cadeau',           icon: '🎁', color: '#55efc4' },
        { id: 'refund',       name: 'Remboursement',    icon: '↩️', color: '#81ecec' },
        { id: 'other_income', name: 'Autre revenu',     icon: '💰', color: '#74b9ff' }
    ]
};

// ── État global ──────────────────────────────────────────────
let state = {
    transactions: [],
    budgets: [],
    savings: [],
    currentTransactionType: 'expense'
};

let expenseChart = null;
let monthlyChart = null;

// ── Démarrage ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initApp();
    renderAll();
});

function initApp() {
    // Date du jour dans le formulaire
    document.getElementById('t-date').valueAsDate = new Date();

    // Mois courant dans le header
    updateCurrentMonth();

    // Navigation onglets
    document.querySelectorAll('.tab').forEach(tab =>
        tab.addEventListener('click', () => switchTab(tab.dataset.tab))
    );

    // Boutons d'ouverture de modales
    document.getElementById('add-transaction-btn').addEventListener('click', () => openModal('transaction-modal'));
    document.getElementById('add-budget-btn').addEventListener('click',      () => openModal('budget-modal'));
    document.getElementById('add-savings-btn').addEventListener('click',     () => openModal('savings-modal'));

    // Fermeture des modales
    document.querySelectorAll('.modal-close').forEach(btn =>
        btn.addEventListener('click', closeAllModals)
    );
    document.querySelectorAll('.modal').forEach(modal =>
        modal.addEventListener('click', e => { if (e.target === modal) closeAllModals(); })
    );

    // Toggle Dépense / Revenu
    document.querySelectorAll('.toggle[data-type]').forEach(toggle =>
        toggle.addEventListener('click', () => {
            document.querySelectorAll('.toggle[data-type]').forEach(t => t.classList.remove('active'));
            toggle.classList.add('active');
            state.currentTransactionType = toggle.dataset.type;
            populateCategorySelect('t-category', state.currentTransactionType);
        })
    );

    // Formulaires
    document.getElementById('transaction-form').addEventListener('submit',    handleTransactionSubmit);
    document.getElementById('budget-form').addEventListener('submit',         handleBudgetSubmit);
    document.getElementById('savings-form').addEventListener('submit',        handleSavingsSubmit);
    document.getElementById('add-to-savings-form').addEventListener('submit', handleAddToSavings);

    // Peupler les selects initiaux
    populateCategorySelect('t-category', 'expense');
    populateCategorySelect('b-category', 'expense');
}

// ── Persistance ──────────────────────────────────────────────
function loadState() {
    try {
        const saved = localStorage.getItem('financeTrackerState');
        if (saved) state = { ...state, ...JSON.parse(saved) };
    } catch (e) {
        console.warn('Impossible de charger les données locales.', e);
    }
}

function saveState() {
    try {
        localStorage.setItem('financeTrackerState', JSON.stringify(state));
    } catch (e) {
        console.warn('Impossible de sauvegarder les données.', e);
    }
}

// ── Navigation ───────────────────────────────────────────────
function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');

    if (tabId === 'stats') setTimeout(renderCharts, 50);
}

// ── Modales ──────────────────────────────────────────────────
function openModal(id) {
    document.getElementById(id).classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
    document.querySelectorAll('form').forEach(f => f.reset());
    document.getElementById('t-date').valueAsDate = new Date();
    // Remettre le toggle sur "Dépense"
    document.querySelectorAll('.toggle[data-type]').forEach(t => t.classList.remove('active'));
    const expenseToggle = document.querySelector('.toggle[data-type="expense"]');
    if (expenseToggle) expenseToggle.classList.add('active');
    state.currentTransactionType = 'expense';
    populateCategorySelect('t-category', 'expense');
}

// ── Utilitaires ──────────────────────────────────────────────
function updateCurrentMonth() {
    const now = new Date();
    document.getElementById('current-month').textContent =
        now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getCategory(id, type) {
    return CATEGORIES[type].find(c => c.id === id) || CATEGORIES[type].at(-1);
}

function populateCategorySelect(selectId, type) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = CATEGORIES[type]
        .map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`)
        .join('');
}

function getCurrentMonthTransactions() {
    const now  = new Date();
    const month = now.getMonth();
    const year  = now.getFullYear();
    return state.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });
}

// ── Transactions ─────────────────────────────────────────────
function handleTransactionSubmit(e) {
    e.preventDefault();
    const tx = {
        id:          generateId(),
        type:        state.currentTransactionType,
        amount:      parseFloat(document.getElementById('t-amount').value),
        category:    document.getElementById('t-category').value,
        description: document.getElementById('t-description').value.trim(),
        date:        document.getElementById('t-date').value
    };
    state.transactions.unshift(tx);
    saveState();
    closeAllModals();
    renderAll();
}

function deleteTransaction(id) {
    if (!confirm('Supprimer cette transaction ?')) return;
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveState();
    renderAll();
}

function renderTransactions() {
    const container = document.getElementById('transactions-list');
    const list = getCurrentMonthTransactions()
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!list.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <p>Aucune transaction ce mois-ci.<br>Appuie sur <strong>+ Ajouter</strong> pour commencer.</p>
            </div>`;
        return;
    }

    container.innerHTML = list.map(t => {
        const cat = getCategory(t.category, t.type);
        const isExpense = t.type === 'expense';
        return `
        <div class="list-item">
            <button class="delete-btn" onclick="deleteTransaction('${t.id}')" aria-label="Supprimer">&times;</button>
            <div class="list-item-icon" style="background:${cat.color}22">${cat.icon}</div>
            <div class="list-item-content">
                <div class="list-item-title">${t.description || cat.name}</div>
                <div class="list-item-subtitle">${cat.name}</div>
            </div>
            <div>
                <div class="list-item-amount ${isExpense ? 'negative' : 'positive'}">
                    ${isExpense ? '−' : '+'}${formatCurrency(t.amount)}
                </div>
                <div class="list-item-date">${formatDate(t.date)}</div>
            </div>
        </div>`;
    }).join('');
}

// ── Budgets ──────────────────────────────────────────────────
function handleBudgetSubmit(e) {
    e.preventDefault();
    const catId  = document.getElementById('b-category').value;
    const amount = parseFloat(document.getElementById('b-amount').value);
    const idx    = state.budgets.findIndex(b => b.category === catId);

    if (idx >= 0) {
        state.budgets[idx].amount = amount;
    } else {
        state.budgets.push({ id: generateId(), category: catId, amount });
    }
    saveState();
    closeAllModals();
    renderAll();
}

function deleteBudget(id) {
    if (!confirm('Supprimer ce budget ?')) return;
    state.budgets = state.budgets.filter(b => b.id !== id);
    saveState();
    renderAll();
}

function renderBudgets() {
    const container = document.getElementById('budget-list');
    if (!state.budgets.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <p>Aucun budget défini.<br>Crée-en un pour suivre tes dépenses.</p>
            </div>`;
        return;
    }

    const monthTx = getCurrentMonthTransactions();

    container.innerHTML = state.budgets.map(b => {
        const cat   = getCategory(b.category, 'expense');
        const spent = monthTx
            .filter(t => t.type === 'expense' && t.category === b.category)
            .reduce((s, t) => s + t.amount, 0);
        const pct       = Math.min((spent / b.amount) * 100, 100);
        const remaining = b.amount - spent;
        const cls       = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'safe';

        return `
        <div class="list-item" style="flex-direction:column;align-items:stretch;">
            <button class="delete-btn" onclick="deleteBudget('${b.id}')" aria-label="Supprimer">&times;</button>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                <div class="list-item-icon" style="background:${cat.color}22">${cat.icon}</div>
                <div class="list-item-content">
                    <div class="list-item-title">${cat.name}</div>
                    <div class="list-item-subtitle">Budget : ${formatCurrency(b.amount)}</div>
                </div>
            </div>
            <div class="budget-progress">
                <div class="progress-bar">
                    <div class="progress-fill ${cls}" style="width:${pct}%"></div>
                </div>
                <div class="progress-text">
                    <span>Dépensé : ${formatCurrency(spent)}</span>
                    <span>${remaining >= 0
                        ? 'Reste : ' + formatCurrency(remaining)
                        : '⚠️ Dépassé de ' + formatCurrency(Math.abs(remaining))}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ── Épargne ──────────────────────────────────────────────────
function handleSavingsSubmit(e) {
    e.preventDefault();
    state.savings.push({
        id:       generateId(),
        name:     document.getElementById('s-name').value.trim(),
        target:   parseFloat(document.getElementById('s-target').value),
        current:  parseFloat(document.getElementById('s-current').value) || 0,
        deadline: document.getElementById('s-deadline').value || null,
        color:    document.getElementById('s-color').value
    });
    saveState();
    closeAllModals();
    renderAll();
}

function openAddToSavings(id) {
    document.getElementById('ats-id').value = id;
    openModal('add-to-savings-modal');
}

function handleAddToSavings(e) {
    e.preventDefault();
    const id     = document.getElementById('ats-id').value;
    const amount = parseFloat(document.getElementById('ats-amount').value);
    const item   = state.savings.find(s => s.id === id);
    if (item) {
        item.current = Math.min(item.current + amount, item.target);
        saveState();
    }
    closeAllModals();
    renderAll();
}

function deleteSavings(id) {
    if (!confirm("Supprimer cet objectif d'épargne ?")) return;
    state.savings = state.savings.filter(s => s.id !== id);
    saveState();
    renderAll();
}

function renderSavings() {
    const container = document.getElementById('savings-list');
    if (!state.savings.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <p>Aucun objectif d'épargne.<br>Définis un objectif pour te motiver !</p>
            </div>`;
        return;
    }

    container.innerHTML = state.savings.map(s => {
        const pct       = Math.min((s.current / s.target) * 100, 100);
        const remaining = s.target - s.current;

        let deadlineText = '';
        if (s.deadline) {
            const daysLeft = Math.ceil((new Date(s.deadline) - new Date()) / 86400000);
            deadlineText = daysLeft > 0
                ? `⏰ ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`
                : '⚠️ Échéance dépassée';
        }

        return `
        <div class="savings-card" style="border-left-color:${s.color}">
            <div class="savings-header">
                <div>
                    <div class="savings-name">${s.name}</div>
                    ${deadlineText ? `<div class="savings-deadline">${deadlineText}</div>` : ''}
                </div>
            </div>
            <div class="savings-amounts">
                <span class="savings-current" style="color:${s.color}">${formatCurrency(s.current)}</span>
                <span class="savings-target">/ ${formatCurrency(s.target)}</span>
            </div>
            <div class="budget-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${pct}%;background:${s.color}"></div>
                </div>
                <div class="progress-text">
                    <span>${pct.toFixed(0)} %</span>
                    <span>${remaining > 0
                        ? 'Reste : ' + formatCurrency(remaining)
                        : '🎉 Objectif atteint !'}</span>
                </div>
            </div>
            <div class="savings-actions">
                <button class="btn-small btn-add" onclick="openAddToSavings('${s.id}')">+ Ajouter</button>
                <button class="btn-small btn-delete" onclick="deleteSavings('${s.id}')">🗑️</button>
            </div>
        </div>`;
    }).join('');
}

// ── Résumé ───────────────────────────────────────────────────
function updateSummary() {
    const monthTx  = getCurrentMonthTransactions();
    const income   = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance  = income - expenses;

    document.getElementById('total-income').textContent   = '+' + formatCurrency(income);
    document.getElementById('total-expenses').textContent = '−' + formatCurrency(expenses);

    const balanceEl = document.getElementById('total-balance');
    balanceEl.textContent   = formatCurrency(balance);
    balanceEl.style.color   = balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
}

// ── Graphiques ───────────────────────────────────────────────
function renderCharts() {
    renderExpenseChart();
    renderMonthlyChart();
}

function renderExpenseChart() {
    const ctx = document.getElementById('expense-chart');
    if (!ctx) return;

    const monthTx = getCurrentMonthTransactions();
    const byCategory = {};

    monthTx.filter(t => t.type === 'expense').forEach(t => {
        const cat = getCategory(t.category, 'expense');
        if (!byCategory[t.category]) byCategory[t.category] = { name: cat.name, color: cat.color, total: 0 };
        byCategory[t.category].total += t.amount;
    });

    const data = Object.values(byCategory);

    if (expenseChart) { expenseChart.destroy(); expenseChart = null; }

    if (!data.length) {
        ctx.parentElement.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:32px 0;">Aucune dépense ce mois-ci</p>';
        return;
    }

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.name),
            datasets: [{ data: data.map(d => d.total), backgroundColor: data.map(d => d.color), borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#a0a0b8', padding: 12, usePointStyle: true } },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(ctx.raw)}`
                    }
                }
            }
        }
    });
}

function renderMonthlyChart() {
    const ctx = document.getElementById('monthly-chart');
    if (!ctx) return;

    const months = [], incomeData = [], expenseData = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);

        months.push(d.toLocaleDateString('fr-FR', { month: 'short' }));

        const txs = state.transactions.filter(t => {
            const td = new Date(t.date);
            return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
        });

        incomeData.push(txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
        expenseData.push(txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
    }

    if (monthlyChart) { monthlyChart.destroy(); monthlyChart = null; }

    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                { label: 'Revenus',   data: incomeData,  backgroundColor: '#00d09c', borderRadius: 6 },
                { label: 'Dépenses',  data: expenseData, backgroundColor: '#ff6b6b', borderRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: { grid: { display: false }, ticks: { color: '#a0a0b8' } },
                y: { grid: { color: '#1a1a2e' }, ticks: { color: '#a0a0b8' } }
            },
            plugins: {
                legend: { position: 'bottom', labels: { color: '#a0a0b8', padding: 12, usePointStyle: true } },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(ctx.raw)}`
                    }
                }
            }
        }
    });
}

// ── Rendu global ─────────────────────────────────────────────
function renderAll() {
    updateSummary();
    renderTransactions();
    renderBudgets();
    renderSavings();
}
