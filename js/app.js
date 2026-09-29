/**
 * =========================================================================
 * Home Finance Pro - Main Application Logic
 * =========================================================================
 */

const App = {
  state: {
    user: null,
    users: [],
    currentView: "dashboard",
    categories: [],
    transactions: [],
    loans: [],
    budgets: [],
    dashboard: null,
    selectedMonth: new Date().toISOString().slice(0, 7) // "YYYY-MM"
  },

  charts: {
    cashFlow: null,
    categoryDonut: null
  },

  // Anti-double-click submission lock
  isSubmitting: false,

  /**
   * Helper: Toggle Button Busy / Loading State
   */
  setButtonBusy(btn, isBusy, loadingText = "Processing...") {
    if (!btn) return;
    if (isBusy) {
      if (!btn.dataset.originalHtml) {
        btn.dataset.originalHtml = btn.innerHTML;
      }
      btn.disabled = true;
      btn.style.pointerEvents = "none";
      btn.classList.add("btn-busy");
      btn.innerHTML = `<span class="spinner-inline"></span> <span>${loadingText}</span>`;
    } else {
      btn.disabled = false;
      btn.style.pointerEvents = "";
      btn.classList.remove("btn-busy");
      if (btn.dataset.originalHtml) {
        btn.innerHTML = btn.dataset.originalHtml;
        delete btn.dataset.originalHtml;
      }
      if (window.lucide) lucide.createIcons();
    }
  },

  /**
   * Application Bootstrapping
   */
  async init() {
    this.initMonthPicker();
    this.bindEvents();
    this.updateConnectionBadge();

    // Check user session
    const savedUser = localStorage.getItem(CONFIG.STORAGE_USER_KEY);
    if (savedUser) {
      try {
        this.state.user = JSON.parse(savedUser);
        this.updateUserUI();
        await this.loadAllData();
      } catch (e) {
        this.showLoginModal();
      }
    } else {
      this.showLoginModal();
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  /**
   * Initialize Global Month Picker
   */
  initMonthPicker() {
    const picker = document.getElementById("globalMonthPicker");
    if (picker) {
      picker.value = this.state.selectedMonth;
      picker.addEventListener("change", (e) => {
        this.state.selectedMonth = e.target.value;
        this.loadDashboard();
        this.loadTransactions();
        this.loadBudgets();
      });
    }
  },

  /**
   * Event Listeners Registration
   */
  bindEvents() {
    // Mobile Sidebar & Backdrop Toggle
    const menuBtn = document.getElementById("menuToggleBtn");
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    const mobileMenuBtn = document.getElementById("mobileMenuOpenBtn");

    const toggleSidebar = (open) => {
      if (!sidebar) return;
      const willOpen = open !== undefined ? open : !sidebar.classList.contains("open");
      if (willOpen) {
        sidebar.classList.add("open");
        if (backdrop) backdrop.classList.add("active");
      } else {
        sidebar.classList.remove("open");
        if (backdrop) backdrop.classList.remove("active");
      }
    };

    if (menuBtn) {
      menuBtn.addEventListener("click", () => toggleSidebar());
    }

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleSidebar();
      });
    }

    if (backdrop) {
      backdrop.addEventListener("click", () => toggleSidebar(false));
    }

    // Desktop & Sidebar Navigation Items
    document.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const view = item.getAttribute("data-view");
        this.switchView(view);
        toggleSidebar(false);
      });
    });

    // Mobile Bottom Dock Navigation Items
    document.querySelectorAll(".mobile-nav-item[data-view]").forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const view = item.getAttribute("data-view");
        this.switchView(view);
        toggleSidebar(false);
      });
    });

    // Connection badge click -> Go to settings
    const badge = document.getElementById("connStatusBadge");
    if (badge) {
      badge.addEventListener("click", () => this.switchView("settings"));
    }

    // Quick Add Transaction Button
    const addTxnBtn = document.getElementById("openAddTxnBtn");
    if (addTxnBtn) {
      addTxnBtn.addEventListener("click", () => this.openAddTransactionModal());
    }

    // Logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.logout();
      });
    }

    // Login Form Submit
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }

    // Transaction Form Submit
    const txnForm = document.getElementById("txnForm");
    if (txnForm) {
      txnForm.addEventListener("submit", (e) => this.handleSaveTransaction(e));
    }

    // Transaction Type Change inside Modal -> dynamically filter categories
    const formTxnType = document.getElementById("formTxnType");
    if (formTxnType) {
      formTxnType.addEventListener("change", () => {
        this.populateCategoryDropdown(formTxnType.value);
      });
    }

    // Loan Form Submit
    const loanForm = document.getElementById("loanForm");
    if (loanForm) {
      loanForm.addEventListener("submit", (e) => this.handleSaveLoan(e));
    }

    // Repay Form Submit
    const repayForm = document.getElementById("repayForm");
    if (repayForm) {
      repayForm.addEventListener("submit", (e) => this.handleRepayLoan(e));
    }

    // Budget Form Submit
    const budgetForm = document.getElementById("budgetForm");
    if (budgetForm) {
      budgetForm.addEventListener("submit", (e) => this.handleSaveBudget(e));
    }

    const userForm = document.getElementById("userForm");
    if (userForm) {
      userForm.addEventListener("submit", (e) => this.handleSaveUser(e));
    }

    // Settings GAS URL Save
    const saveGasUrlBtn = document.getElementById("saveGasUrlBtn");
    if (saveGasUrlBtn) {
      saveGasUrlBtn.addEventListener("click", () => this.handleSaveGasUrl());
    }

    // Settings GAS URL Test
    const testGasUrlBtn = document.getElementById("testGasUrlBtn");
    if (testGasUrlBtn) {
      testGasUrlBtn.addEventListener("click", () => this.handleTestGasUrl());
    }

    // Transactions Table Filter & Search
    const txnSearchInput = document.getElementById("txnSearchInput");
    if (txnSearchInput) {
      txnSearchInput.addEventListener("input", () => this.filterAndRenderTransactions());
    }

    const txnTypeFilter = document.getElementById("txnTypeFilter");
    if (txnTypeFilter) {
      txnTypeFilter.addEventListener("change", () => this.filterAndRenderTransactions());
    }

    const txnCategoryFilter = document.getElementById("txnCategoryFilter");
    if (txnCategoryFilter) {
      txnCategoryFilter.addEventListener("change", () => this.filterAndRenderTransactions());
    }

    // CSV Export
    const exportCsvBtn = document.getElementById("exportCsvBtn");
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", () => this.exportTransactionsToCSV());
    }
  },

  /**
   * Switch Active View (Dashboard, Transactions, Loans, etc.)
   */
  switchView(viewName) {
    this.state.currentView = viewName;

    // Update Nav Link styling (Desktop Sidebar & Mobile Dock)
    document.querySelectorAll(".nav-item").forEach(item => {
      if (item.getAttribute("data-view") === viewName) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    document.querySelectorAll(".mobile-nav-item[data-view]").forEach(item => {
      if (item.getAttribute("data-view") === viewName) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Update View Sections
    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.remove("active-view");
    });

    const activeSec = document.getElementById(`view-${viewName}`);
    if (activeSec) {
      activeSec.classList.add("active-view");
    }

    // Update Topbar Title
    const titleMap = {
      dashboard: "Financial Dashboard",
      transactions: "All Transactions",
      income: "Income & Inflows",
      expenses: "Household Expenses & Housing",
      loans: "Loans & Liabilities Tracker",
      budgets: "Monthly Budgets",
      users: "User Management",
      settings: "Settings & Cloud Sync"
    };
    const pageTitle = document.getElementById("pageTitle");
    if (pageTitle) pageTitle.textContent = titleMap[viewName] || "Home Finance";

    // View specific refreshes
    if (viewName === "dashboard") {
      this.loadDashboard();
    } else if (viewName === "transactions" || viewName === "income" || viewName === "expenses") {
      this.loadTransactions();
    } else if (viewName === "loans") {
      this.loadLoans();
    } else if (viewName === "budgets") {
      this.loadBudgets();
    } else if (viewName === "users") {
      this.loadUsers();
    } else if (viewName === "settings") {
      const input = document.getElementById("settingsGasUrlInput");
      if (input) input.value = CONFIG.getApiUrl();
    }

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Update Connection Status Badge
   */
  updateConnectionBadge() {
    const dot = document.getElementById("statusDot");
    const text = document.getElementById("connStatusText");
    if (!dot || !text) return;

    if (CONFIG.isLiveConnected()) {
      dot.className = "status-dot online";
      text.textContent = "Google Sheet: Connected";
    } else {
      dot.className = "status-dot demo";
      text.textContent = "Mode: Local Demo";
    }
  },

  /**
   * Load All Data in Parallel
   */
  async loadAllData() {
    await Promise.all([
      this.loadCategories(),
      this.loadDashboard(),
      this.loadTransactions(),
      this.loadLoans(),
      this.loadBudgets()
    ]);
  },

  /**
   * 1. Load Categories
   */
  async loadCategories() {
    try {
      const res = await ApiService.request("getCategories");
      if (res.success && res.categories) {
        this.state.categories = res.categories;
        this.populateCategoryFilters();
      }
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  },

  /**
   * 2. Load Dashboard Metrics & Charts
   */
  async loadDashboard() {
    try {
      const res = await ApiService.request("getDashboard", {
        month: this.state.selectedMonth
      });

      if (res.success && res.data) {
        this.state.dashboard = res.data;
        const metrics = res.data.metrics || {};

        const netBal = document.getElementById("kpiNetBalance");
        const moInc = document.getElementById("kpiMonthIncome");
        const moExp = document.getElementById("kpiMonthExpense");
        const actLoan = document.getElementById("kpiActiveLoans");
        const loanSub = document.getElementById("kpiLoanSubtitle");

        if (netBal) netBal.textContent = this.formatCurrency(metrics.netBalance);
        if (moInc) moInc.textContent = this.formatCurrency(metrics.currentMonthIncome);
        if (moExp) moExp.textContent = this.formatCurrency(metrics.currentMonthExpense);
        if (actLoan) actLoan.textContent = this.formatCurrency(metrics.totalLoanTakenRemaining);
        if (loanSub) loanSub.textContent = `${metrics.activeLoansCount || 0} Active Obligations | Monthly Installment: ${this.formatCurrency(metrics.monthlyEmiTotal)}`;

        this.renderRecentTransactions(res.data.recentTransactions || []);
        this.renderCashFlowChart(res.data.monthlyTrends || []);
        this.renderCategoryChart(res.data.categoryExpenses || {});
      }
    } catch (e) {
      console.error("Dashboard data load error:", e);
    }
  },

  /**
   * 3. Load Transactions
   */
  async loadTransactions() {
    try {
      const res = await ApiService.request("getTransactions");
      if (res.success && res.transactions) {
        this.state.transactions = res.transactions;
        this.filterAndRenderTransactions();
        this.renderIncomeView();
        this.renderExpenseView();
      }
    } catch (e) {
      console.error("Transactions data load error:", e);
    }
  },

  /**
   * 4. Load Loans
   */
  async loadLoans() {
    try {
      const res = await ApiService.request("getLoans");
      if (res.success && res.loans) {
        this.state.loans = res.loans;
        this.renderLoans();
      }
    } catch (e) {
      console.error("Loans data load error:", e);
    }
  },

  /**
   * 5. Load Budgets
   */
  async loadBudgets() {
    try {
      const res = await ApiService.request("getBudgets", {
        monthYear: this.state.selectedMonth
      });
      if (res.success && res.budgets) {
        this.state.budgets = res.budgets;
        this.renderBudgets();
      }
    } catch (e) {
      console.error("Budgets data load error:", e);
    }
  },

  /**
   * Render Recent Transactions on Dashboard
   */
  renderRecentTransactions(list) {
    const tbody = document.getElementById("dashboardRecentTxnTable");
    if (!tbody) return;

    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 24px;">No transactions recorded yet. Click 'Add Transaction' to begin!</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(item => {
      const isInc = item.type.toLowerCase() === "income";
      const badgeClass = isInc ? "badge-income" : (item.type.toLowerCase() === "rent" ? "badge-rent" : "badge-expense");
      const amtClass = isInc ? "amt-income" : "amt-expense";
      const sign = isInc ? "+" : "-";

      return `
        <tr>
          <td>${item.date}</td>
          <td><span class="badge ${badgeClass}">${item.type}</span></td>
          <td><strong>${item.category}</strong> ${item.subCategory ? `<span style="color:var(--text-dim);">(${item.subCategory})</span>` : ""}</td>
          <td>${item.paymentMode || "UPI"}</td>
          <td>${item.paidToFrom || "-"}</td>
          <td class="${amtClass}">${sign} ${this.formatCurrency(item.amount)}</td>
        </tr>
      `;
    }).join("");
  },

  /**
   * Filter & Render All Transactions Table
   */
  filterAndRenderTransactions() {
    const tbody = document.getElementById("allTxnTableBody");
    if (!tbody) return;

    const searchQ = (document.getElementById("txnSearchInput")?.value || "").toLowerCase();
    const typeFilter = document.getElementById("txnTypeFilter")?.value || "";
    const catFilter = document.getElementById("txnCategoryFilter")?.value || "";

    const filtered = this.state.transactions.filter(t => {
      if (typeFilter && t.type.toLowerCase() !== typeFilter.toLowerCase()) return false;
      if (catFilter && t.category.toLowerCase() !== catFilter.toLowerCase()) return false;
      if (searchQ) {
        const str = `${t.category} ${t.subCategory || ""} ${t.paidToFrom || ""} ${t.description || ""} ${t.paymentMode || ""}`.toLowerCase();
        if (!str.includes(searchQ)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 30px;">No matching records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(item => {
      const isInc = item.type.toLowerCase() === "income";
      const badgeClass = isInc ? "badge-income" : (item.type.toLowerCase() === "rent" ? "badge-rent" : "badge-expense");
      const amtClass = isInc ? "amt-income" : "amt-expense";
      const sign = isInc ? "+" : "-";

      return `
        <tr>
          <td>${item.date}</td>
          <td><span class="badge ${badgeClass}">${item.type}</span></td>
          <td>
            <strong>${item.category}</strong>
            ${item.subCategory ? `<br><small style="color:var(--text-dim);">${item.subCategory}</small>` : ""}
          </td>
          <td>${item.paidToFrom || "-"}</td>
          <td>${item.paymentMode || "UPI"}</td>
          <td style="max-width: 200px; color: var(--text-muted);">${item.description || "-"}</td>
          <td class="${amtClass}">${sign} ${this.formatCurrency(item.amount)}</td>
          <td>
            <div class="action-btn-group">
              <button class="btn-icon-subtle delete" onclick="App.deleteTransaction('${item.id}')" title="Delete record">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Render Income View
   */
  renderIncomeView() {
    const tbody = document.getElementById("incomeTableBody");
    const totalEl = document.getElementById("incomeViewTotal");
    if (!tbody) return;

    const incomeTxns = this.state.transactions.filter(t => t.type.toLowerCase() === "income");
    const total = incomeTxns.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    if (totalEl) totalEl.textContent = this.formatCurrency(total);

    if (incomeTxns.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-dim); padding: 24px;">No income entries recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = incomeTxns.map(item => `
      <tr>
        <td>${item.date}</td>
        <td><strong>${item.category}</strong> ${item.subCategory ? `(${item.subCategory})` : ""}</td>
        <td>${item.paidToFrom || "-"}</td>
        <td>${item.paymentMode || "Bank Transfer"}</td>
        <td style="color: var(--text-muted);">${item.description || "-"}</td>
        <td class="amt-income">+ ${this.formatCurrency(item.amount)}</td>
      </tr>
    `).join("");
  },

  /**
   * Render Expenses & Housing View
   */
  renderExpenseView() {
    const tbody = document.getElementById("expenseTableBody");
    const expTotalEl = document.getElementById("expenseViewTotal");
    const rentTotalEl = document.getElementById("rentViewTotal");
    if (!tbody) return;

    const expenseTxns = this.state.transactions.filter(t => t.type.toLowerCase() === "expense" || t.type.toLowerCase() === "rent");
    const rentTxns = this.state.transactions.filter(t => t.category.toLowerCase().includes("rent") || t.type.toLowerCase() === "rent");

    const totalExp = expenseTxns.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const totalRent = rentTxns.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    if (expTotalEl) expTotalEl.textContent = this.formatCurrency(totalExp);
    if (rentTotalEl) rentTotalEl.textContent = this.formatCurrency(totalRent);

    if (expenseTxns.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 24px;">No expenditure entries recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = expenseTxns.map(item => {
      const isRent = item.category.toLowerCase().includes("rent") || item.type.toLowerCase() === "rent";
      return `
        <tr>
          <td>${item.date}</td>
          <td>
            <span class="badge ${isRent ? 'badge-rent' : 'badge-expense'}">${item.category}</span>
            ${item.subCategory ? `<br><small style="color:var(--text-dim);">${item.subCategory}</small>` : ""}
          </td>
          <td>${item.paidToFrom || "-"}</td>
          <td>${item.paymentMode || "UPI"}</td>
          <td style="color: var(--text-muted);">${item.description || "-"}</td>
          <td class="amt-expense">- ${this.formatCurrency(item.amount)}</td>
          <td>
            <button class="btn-icon-subtle delete" onclick="App.deleteTransaction('${item.id}')" title="Delete record">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Render Loans Cards
   */
  renderLoans() {
    const container = document.getElementById("loansCardsContainer");
    if (!container) return;

    if (this.state.loans.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No active debt or liability records found. Clean balance sheet! 🎉</div>`;
      return;
    }

    container.innerHTML = this.state.loans.map(loan => {
      const total = parseFloat(loan.totalAmount) || 0;
      const paid = parseFloat(loan.paidAmount) || 0;
      const remaining = parseFloat(loan.remainingAmount) || Math.max(0, total - paid);
      const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
      const isGiven = loan.type.toLowerCase().includes("given");
      const badgeStyle = isGiven ? "badge-income" : "badge-loan";

      return `
        <div class="loan-card">
          <div class="loan-header">
            <div>
              <div class="loan-title">${loan.title}</div>
              <div class="loan-bank">${loan.personOrBank}</div>
            </div>
            <span class="badge ${badgeStyle}">${loan.type}</span>
          </div>

          <div class="progress-bar-wrap" title="${pct}% Repaid">
            <div class="progress-bar-fill" style="width: ${pct}%;"></div>
          </div>

          <div class="loan-details-row">
            <div class="loan-detail-item">
              <span class="loan-detail-label">Principal Amount</span>
              <span class="loan-detail-val">${this.formatCurrency(total)}</span>
            </div>
            <div class="loan-detail-item">
              <span class="loan-detail-label">Outstanding Balance</span>
              <span class="loan-detail-val" style="color: ${remaining > 0 ? 'var(--accent-warning)' : 'var(--accent-success)'};">${this.formatCurrency(remaining)}</span>
            </div>
            <div class="loan-detail-item">
              <span class="loan-detail-label">Monthly Installment (EMI)</span>
              <span class="loan-detail-val">${loan.monthlyEMI ? this.formatCurrency(loan.monthlyEMI) : "N/A"}</span>
            </div>
            <div class="loan-detail-item">
              <span class="loan-detail-label">Due Date</span>
              <span class="loan-detail-val">${loan.dueDay ? 'Day ' + loan.dueDay + ' of month' : "Anytime"}</span>
            </div>
          </div>

          ${loan.notes ? `<div style="font-size: 0.8rem; color: var(--text-dim);">${loan.notes}</div>` : ""}

          <div style="display: flex; gap: 8px; margin-top: auto;">
            ${loan.status === 'Active' ? `
              <button class="btn-primary" style="flex: 1; justify-content: center; padding: 7px 12px; font-size: 0.82rem;" onclick="App.openRepayLoanModal('${loan.id}')">
                <i data-lucide="check-circle-2" style="width: 14px; height: 14px;"></i>
                <span>Record Repayment</span>
              </button>
            ` : `<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--accent-success); width: 100%; justify-content: center; padding: 8px;">Settled & Closed</span>`}
            
            <button class="btn-icon-subtle delete" onclick="App.deleteLoan('${loan.id}')" title="Delete record">
              <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>
      `;
    }).join("");

    if (window.lucide) lucide.createIcons();
  },

  /**
   * Render Budgets Progress
   */
  renderBudgets() {
    const container = document.getElementById("budgetListContainer");
    if (!container) return;

    if (this.state.budgets.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">No category budgets established for this period. Click 'Establish Budget Limit' to set targets.</div>`;
      return;
    }

    container.innerHTML = this.state.budgets.map(b => {
      const budget = parseFloat(b.budgetAmount) || 0;
      const spent = parseFloat(b.spentAmount) || 0;
      const pct = b.percentage || (budget > 0 ? Math.round((spent / budget) * 100) : 0);
      const isOver = pct > 100;
      const color = isOver ? "var(--accent-danger)" : (pct > 80 ? "var(--accent-warning)" : "var(--accent-success)");

      return `
        <div style="margin-bottom: 22px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div>
              <strong style="font-size: 0.95rem;">${b.category}</strong>
              ${isOver ? `<span class="badge badge-expense" style="margin-left: 8px;">Threshold Exceeded</span>` : ""}
            </div>
            <div style="font-size: 0.88rem;">
              <span style="font-weight: 600; color: ${color};">${this.formatCurrency(spent)}</span>
              <span style="color: var(--text-dim);">/ ${this.formatCurrency(budget)} (${pct}%)</span>
            </div>
          </div>
          <div class="progress-bar-wrap" style="height: 10px;">
            <div class="progress-bar-fill" style="width: ${Math.min(100, pct)}%; background: ${color};"></div>
          </div>
        </div>
      `;
    }).join("");
  },

  /**
   * Charts Rendering using Chart.js
   */
  renderCashFlowChart(trends) {
    const ctx = document.getElementById("cashFlowChart");
    if (!ctx) return;

    if (this.charts.cashFlow) {
      this.charts.cashFlow.destroy();
    }

    const labels = trends.map(t => t.monthLabel);
    const incomeData = trends.map(t => t.income);
    const expenseData = trends.map(t => t.expense);

    this.charts.cashFlow = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Inflows (Income)",
            data: incomeData,
            backgroundColor: "rgba(16, 185, 129, 0.75)",
            borderColor: "#10B981",
            borderRadius: 6,
            borderWidth: 1
          },
          {
            label: "Outflows (Expenditure)",
            data: expenseData,
            backgroundColor: "rgba(239, 68, 68, 0.75)",
            borderColor: "#EF4444",
            borderRadius: 6,
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#94A3B8", font: { family: "Inter", size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString("en-IN")}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#94A3B8" }
          },
          y: {
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: {
              color: "#94A3B8",
              callback: (val) => "₹" + (val >= 1000 ? (val / 1000) + "k" : val)
            }
          }
        }
      }
    });
  },

  renderCategoryChart(categoryMap) {
    const ctx = document.getElementById("categoryDonutChart");
    if (!ctx) return;

    if (this.charts.categoryDonut) {
      this.charts.categoryDonut.destroy();
    }

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);

    const colors = [
      "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
      "#06B6D4", "#EC4899", "#14B8A6", "#F97316", "#64748B"
    ];

    if (labels.length === 0) {
      labels.push("No Expenses Recorded");
      data.push(1);
    }

    this.charts.categoryDonut = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: "#1E293B"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: {
            position: "right",
            labels: { color: "#94A3B8", boxWidth: 12, font: { family: "Inter", size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ₹${ctx.parsed.toLocaleString("en-IN")}`
            }
          }
        }
      }
    });
  },

  /**
   * Dropdown Populator
   */
  populateCategoryDropdown(selectedType) {
    const select = document.getElementById("formTxnCategory");
    if (!select) return;

    const filtered = this.state.categories.filter(c => {
      if (selectedType === "Rent") return c.name.toLowerCase().includes("rent");
      return c.type.toLowerCase() === selectedType.toLowerCase();
    });

    select.innerHTML = filtered.map(c => `
      <option value="${c.name}">${c.name}</option>
    `).join("");
  },

  populateCategoryFilters() {
    const select = document.getElementById("txnCategoryFilter");
    const budgetSelect = document.getElementById("formBudgetCategory");
    if (!select) return;

    const options = this.state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join("");
    select.innerHTML = `<option value="">All Categories</option>` + options;

    if (budgetSelect) {
      const expCats = this.state.categories.filter(c => c.type === "Expense");
      budgetSelect.innerHTML = expCats.map(c => `<option value="${c.name}">${c.name}</option>`).join("");
    }
  },

  /**
   * Modal Handlers
   */
  openAddTransactionModal(defaultType = "Expense") {
    const modal = document.getElementById("addTxnModal");
    const form = document.getElementById("txnForm");
    if (!modal || !form) return;

    form.reset();
    document.getElementById("txnEditId").value = "";
    document.getElementById("formTxnDate").value = new Date().toISOString().split("T")[0];
    document.getElementById("formTxnType").value = defaultType;

    this.populateCategoryDropdown(defaultType);
    modal.classList.add("active");
  },

  openAddLoanModal() {
    const modal = document.getElementById("addLoanModal");
    if (modal) {
      document.getElementById("loanForm")?.reset();
      modal.classList.add("active");
    }
  },

  openRepayLoanModal(loanId) {
    const loan = this.state.loans.find(l => l.id === loanId);
    if (!loan) return;

    const modal = document.getElementById("repayLoanModal");
    const idInput = document.getElementById("repayLoanId");
    const infoEl = document.getElementById("repayLoanInfo");
    const amtInput = document.getElementById("repayAmount");

    if (modal && idInput && infoEl) {
      idInput.value = loan.id;
      infoEl.innerHTML = `<strong>${loan.title}</strong> (${loan.personOrBank})<br>Outstanding Balance: <span style="color:var(--accent-warning); font-weight:700;">₹${loan.remainingAmount.toLocaleString("en-IN")}</span>`;
      amtInput.value = loan.monthlyEMI > 0 ? loan.monthlyEMI : "";
      modal.classList.add("active");
    }
  },

  openSetBudgetModal() {
    const modal = document.getElementById("setBudgetModal");
    if (modal) {
      this.populateCategoryFilters();
      modal.classList.add("active");
    }
  },

  closeModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => {
      m.classList.remove("active");
    });
    // Only hide login screen if user is logged in
    const loginScreen = document.getElementById("loginModal");
    if (loginScreen && this.state.user) {
      loginScreen.classList.remove("active");
    }
  },

  /**
   * Save Transaction
   */
  async handleSaveTransaction(e) {
    e.preventDefault();
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const btn = document.getElementById("saveTxnBtn") || e.target.querySelector("button[type='submit']");
    this.setButtonBusy(btn, true, "Saving...");

    const payload = {
      type: document.getElementById("formTxnType").value,
      date: document.getElementById("formTxnDate").value,
      category: document.getElementById("formTxnCategory").value,
      amount: document.getElementById("formTxnAmount").value,
      paymentMode: document.getElementById("formTxnPayMode").value,
      paidToFrom: document.getElementById("formTxnPaidToFrom").value,
      subCategory: document.getElementById("formTxnSubCategory").value,
      description: document.getElementById("formTxnDesc").value
    };

    try {
      const res = await ApiService.request("addTransaction", payload);
      if (res.success) {
        this.showToast("Transaction successfully recorded.", "success");
        this.closeModals();
        await this.loadAllData();
      } else {
        this.showToast(res.error || "Failed to record transaction.", "error");
      }
    } catch (err) {
      this.showToast("Network error: " + err.message, "error");
    } finally {
      this.setButtonBusy(btn, false);
      setTimeout(() => { this.isSubmitting = false; }, 400);
    }
  },

  /**
   * Delete Transaction
   */
  async deleteTransaction(id) {
    if (this.isSubmitting) return;
    if (!confirm("Are you sure you want to permanently delete this transaction?")) return;

    this.isSubmitting = true;
    try {
      const res = await ApiService.request("deleteTransaction", { id: id });
      if (res.success) {
        this.showToast("Transaction deleted successfully.", "success");
        await this.loadAllData();
      } else {
        this.showToast(res.error || "Deletion failed.", "error");
      }
    } catch (e) {
      this.showToast(e.message, "error");
    } finally {
      setTimeout(() => { this.isSubmitting = false; }, 400);
    }
  },

  /**
   * Save Loan
   */
  async handleSaveLoan(e) {
    e.preventDefault();
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const btn = e.target.querySelector("button[type='submit']");
    this.setButtonBusy(btn, true, "Saving Obligation...");

    const payload = {
      title: document.getElementById("formLoanTitle").value,
      personOrBank: document.getElementById("formLoanBank").value,
      type: document.getElementById("formLoanType").value,
      totalAmount: document.getElementById("formLoanTotal").value,
      paidAmount: document.getElementById("formLoanPaid").value || 0,
      monthlyEMI: document.getElementById("formLoanEmi").value || 0,
      dueDay: document.getElementById("formLoanDueDay").value || 5,
      notes: document.getElementById("formLoanNotes").value || ""
    };

    try {
      const res = await ApiService.request("addLoan", payload);
      if (res.success) {
        this.showToast("Loan obligation recorded successfully.", "success");
        this.closeModals();
        await this.loadLoans();
        await this.loadDashboard();
      } else {
        this.showToast(res.error, "error");
      }
    } catch (err) {
      this.showToast(err.message, "error");
    } finally {
      this.setButtonBusy(btn, false);
      setTimeout(() => { this.isSubmitting = false; }, 400);
    }
  },

  /**
   * Repay Loan
   */
  async handleRepayLoan(e) {
    e.preventDefault();
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const btn = e.target.querySelector("button[type='submit']");
    this.setButtonBusy(btn, true, "Recording Payment...");

    const payload = {
      id: document.getElementById("repayLoanId").value,
      paymentAmount: document.getElementById("repayAmount").value,
      paymentMode: document.getElementById("repayPaymentMode").value,
      recordAsExpense: document.getElementById("repayRecordExpense").checked
    };

    try {
      const res = await ApiService.request("updateLoanRepayment", payload);
      if (res.success) {
        this.showToast("Installment payment recorded successfully.", "success");
        this.closeModals();
        await this.loadAllData();
      } else {
        this.showToast(res.error, "error");
      }
    } catch (err) {
      this.showToast(err.message, "error");
    } finally {
      this.setButtonBusy(btn, false);
      setTimeout(() => { this.isSubmitting = false; }, 400);
    }
  },

  /**
   * Delete Loan
   */
  async deleteLoan(id) {
    if (this.isSubmitting) return;
    if (!confirm("Are you sure you want to delete this loan record?")) return;

    this.isSubmitting = true;
    try {
      const res = await ApiService.request("deleteLoan", { id: id });
      if (res.success) {
        this.showToast("Loan record deleted successfully.", "success");
        await this.loadLoans();
        await this.loadDashboard();
      } else {
        this.showToast(res.error, "error");
      }
    } catch (e) {
      this.showToast(e.message, "error");
    } finally {
      setTimeout(() => { this.isSubmitting = false; }, 400);
    }
  },

  /**
   * Save Budget
   */
  async handleSaveBudget(e) {
    e.preventDefault();
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const btn = e.target.querySelector("button[type='submit']");
    this.setButtonBusy(btn, true, "Saving Budget...");

    const payload = {
      category: document.getElementById("formBudgetCategory").value,
      budgetAmount: document.getElementById("formBudgetAmount").value,
      notes: document.getElementById("formBudgetNotes").value,
      monthYear: this.state.selectedMonth
    };

    try {
      const res = await ApiService.request("setBudget", payload);
      if (res.success) {
        this.showToast("Budget threshold established successfully.", "success");
        this.closeModals();
        await this.loadBudgets();
      } else {
        this.showToast(res.error, "error");
      }
    } catch (err) {
      this.showToast(err.message, "error");
    } finally {
      this.setButtonBusy(btn, false);
      setTimeout(() => { this.isSubmitting = false; }, 400);
    }
  },

  /**
   * Settings: Save Google Apps Script URL
   */
  handleSaveGasUrl() {
    const input = document.getElementById("settingsGasUrlInput");
    if (!input) return;

    const url = input.value.trim();
    if (url && !url.startsWith("https://script.google.com/macros/s/")) {
      this.showToast("Please enter a valid Google Apps Script Web App URL (https://script.google.com/macros/s/...)", "warning");
      return;
    }

    CONFIG.setApiUrl(url);
    this.updateConnectionBadge();
    this.showToast("Google Apps Script URL saved. Synchronizing database...", "success");
    this.loadAllData();
  },

  /**
   * Settings: Test GAS URL Connection
   */
  async handleTestGasUrl() {
    const input = document.getElementById("settingsGasUrlInput");
    const url = input ? input.value.trim() : CONFIG.getApiUrl();

    this.showToast("Verifying connection to Google Sheets backend...", "info");
    const res = await ApiService.testConnection(url);

    if (res.success) {
      this.showToast("Connection Successful! Google Sheet database is fully operational.", "success");
    } else {
      this.showToast("Connection Failed: " + (res.error || "Please verify your Web App deployment permissions."), "error");
    }
  },

  /**
   * Authentication Handlers
   */
  showLoginModal() {
    const modal = document.getElementById("loginModal");
    if (modal) {
      modal.classList.add("active");
      // Spawn floating particles once
      if (!modal._particlesCreated) {
        this.spawnLoginParticles();
        modal._particlesCreated = true;
      }
    }
  },

  spawnLoginParticles() {
    const container = document.getElementById("loginParticles");
    if (!container) return;
    const count = 30;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      const size = Math.random() * 3 + 1;
      p.style.cssText = `
        position: absolute;
        width: ${size}px; height: ${size}px;
        background: rgba(${Math.random() > 0.5 ? '96,165,250' : '167,139,250'}, ${Math.random() * 0.4 + 0.1});
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: particleDrift ${Math.random() * 20 + 15}s linear infinite;
        animation-delay: -${Math.random() * 20}s;
      `;
      container.appendChild(p);
    }
    // Inject keyframe if not already present
    if (!document.getElementById("particleDriftStyle")) {
      const style = document.createElement("style");
      style.id = "particleDriftStyle";
      style.textContent = `
        @keyframes particleDrift {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(${Math.random() > 0.5 ? '' : '-'}60px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const btn = document.getElementById("loginSubmitBtn") || e.target.querySelector("button[type='submit']");
    this.setButtonBusy(btn, true, "Signing in...");

    const uInput = document.getElementById("loginUsername");
    const pInput = document.getElementById("loginPassword");

    const payload = {
      username: uInput.value.trim(),
      password: pInput.value.trim()
    };

    try {
      const res = await ApiService.request("login", payload);
      if (res.success && res.user) {
        this.state.user = res.user;
        localStorage.setItem(CONFIG.STORAGE_USER_KEY, JSON.stringify(res.user));
        this.updateUserUI();
        document.getElementById("loginModal")?.classList.remove("active");
        this.showToast(`Welcome back, ${res.user.fullName || res.user.username}!`, "success");
        await this.loadAllData();
      } else {
        this.showToast(res.error || "Authentication failed.", "error");
      }
    } catch (err) {
      this.showToast("Login error: " + err.message, "error");
    } finally {
      this.setButtonBusy(btn, false);
      setTimeout(() => { this.isSubmitting = false; }, 400);
    }
  },

  logout() {
    localStorage.removeItem(CONFIG.STORAGE_USER_KEY);
    this.state.user = null;
    this.updateUserUI();
    this.showToast("You have been signed out successfully.", "info");
    this.showLoginModal();
  },

  updateUserUI() {
    const nameEl = document.getElementById("userNameDisplay");
    const avatarEl = document.getElementById("userAvatar");
    if (this.state.user) {
      if (nameEl) nameEl.textContent = this.state.user.fullName || this.state.user.username;
      if (avatarEl) avatarEl.textContent = (this.state.user.username || "A").charAt(0).toUpperCase();
    } else {
      if (nameEl) nameEl.textContent = "Guest";
      if (avatarEl) avatarEl.textContent = "?";
    }
  },

  /**
   * Export Transactions to CSV
   */
  exportTransactionsToCSV() {
    if (!this.state.transactions || this.state.transactions.length === 0) {
      this.showToast("No transaction records available to export.", "warning");
      return;
    }

    const headers = ["Transaction ID", "Date", "Type", "Category", "Sub Category", "Amount", "Payment Mode", "Counterparty", "Description"];
    const rows = this.state.transactions.map(t => [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.type}"`,
      `"${t.category}"`,
      `"${t.subCategory || ""}"`,
      t.amount,
      `"${t.paymentMode || ""}"`,
      `"${t.paidToFrom || ""}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Home_Finance_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast("Transactions CSV exported successfully.", "success");
  },

  // Load Users
  async loadUsers() {
    try {
      const res = await ApiService.request("getUsers");
      if (res.success && res.users) {
        this.state.users = res.users;
        this.renderUsersTable();
      }
    } catch (e) {
      console.error("Users data load error:", e);
    }
  },

  // Render Users Table
  renderUsersTable() {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    if (this.state.users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 30px;">No registered user accounts found.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.state.users.map(user => {
      const roleBadge = user.role === 'Admin' ? 'badge-income' : (user.role === 'Manager' ? 'badge-rent' : 'badge-expense');
      return `
        <tr>
          <td><code style="font-size: 0.82rem; color: var(--text-muted);">${user.userId}</code></td>
          <td><strong>${user.username}</strong></td>
          <td>${user.fullName}</td>
          <td><span class="badge ${roleBadge}">${user.role}</span></td>
          <td style="color: var(--text-muted);">${user.createdAt || '-'}</td>
          <td style="color: var(--text-muted);">${user.lastLogin || '-'}</td>
          <td>
            <div class="action-btn-group">
              <button class="btn-icon-subtle" onclick="App.openEditUserModal('${user.userId}')" title="Edit user">
                <i data-lucide="pencil" style="width: 14px; height: 14px;"></i>
              </button>
              <button class="btn-icon-subtle delete" onclick="App.deleteUser('${user.userId}')" title="Delete user">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    if (window.lucide) lucide.createIcons();
  },

  // Open Add User Modal
  openAddUserModal() {
    const modal = document.getElementById("addUserModal");
    const form = document.getElementById("userForm");
    const title = document.getElementById("userModalTitle");
    const pwField = document.getElementById("formUserPassword");
    if (!modal || !form) return;
    form.reset();
    document.getElementById("userEditId").value = "";
    if (title) title.textContent = "Add New User";
    if (pwField) pwField.required = true;
    modal.classList.add("active");
  },

  // Open Edit User Modal
  openEditUserModal(userId) {
    const user = this.state.users.find(u => u.userId === userId);
    if (!user) return;
    const modal = document.getElementById("addUserModal");
    const title = document.getElementById("userModalTitle");
    const pwField = document.getElementById("formUserPassword");
    if (!modal) return;

    document.getElementById("userEditId").value = user.userId;
    document.getElementById("formUserUsername").value = user.username;
    document.getElementById("formUserFullName").value = user.fullName;
    document.getElementById("formUserRole").value = user.role;
    if (pwField) {
      pwField.value = "";
      pwField.required = false;
      pwField.placeholder = "Leave blank to keep current";
    }
    if (title) title.textContent = "Edit User";
    modal.classList.add("active");
  },

  // Save User (Add or Update)
  async handleSaveUser(e) {
    e.preventDefault();
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const btn = e.target.querySelector("button[type='submit']");
    this.setButtonBusy(btn, true, "Saving User...");

    const editId = document.getElementById("userEditId").value;
    const payload = {
      username: document.getElementById("formUserUsername").value,
      password: document.getElementById("formUserPassword").value,
      fullName: document.getElementById("formUserFullName").value,
      role: document.getElementById("formUserRole").value
    };

    try {
      let res;
      if (editId) {
        payload.userId = editId;
        res = await ApiService.request("updateUser", payload);
      } else {
        res = await ApiService.request("addUser", payload);
      }
      if (res.success) {
        this.showToast(res.message || "User saved successfully.", "success");
        this.closeModals();
        await this.loadUsers();
      } else {
        this.showToast(res.error || "Failed to save user.", "error");
      }
    } catch (err) {
      this.showToast("Network error: " + err.message, "error");
    } finally {
      this.setButtonBusy(btn, false);
      setTimeout(() => { this.isSubmitting = false; }, 400);
    }
  },

  // Delete User
  async deleteUser(userId) {
    if (this.isSubmitting) return;
    if (!confirm("Are you sure you want to permanently delete this user account?")) return;

    this.isSubmitting = true;
    try {
      const res = await ApiService.request("deleteUser", { userId: userId });
      if (res.success) {
        this.showToast("User account deleted successfully.", "success");
        await this.loadUsers();
      } else {
        this.showToast(res.error || "Failed to delete user.", "error");
      }
    } catch (e) {
      this.showToast(e.message, "error");
    } finally {
      setTimeout(() => { this.isSubmitting = false; }, 400);
    }
  },

  /**
   * Utilities
   */
  formatCurrency(val) {
    const num = parseFloat(val) || 0;
    return "₹ " + num.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });
  },

  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

// Global exposure
window.App = App;
window.showToast = App.showToast.bind(App);

// Initialize App when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
