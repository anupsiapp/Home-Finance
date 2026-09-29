/**
 * Home Finance Pro - API Service Layer
 * Connects to Google Apps Script Web App Backend with Local Mock Fallback
 */

const ApiService = {
  // Mock In-Memory Data for instant preview before connecting Google Apps Script
  _mockData: {
    users: [
      { userId: "USR-1001", username: "admin", fullName: "Primary Administrator", role: "Admin", createdAt: "2026-09-01", lastLogin: "2026-09-29" }
    ],
    user: {
      userId: "USR-1001",
      username: "admin",
      fullName: "Primary Administrator",
      role: "Admin"
    },
    metrics: {
      totalIncome: 75000,
      totalExpense: 34550,
      netBalance: 40450,
      currentMonthIncome: 75000,
      currentMonthExpense: 34550,
      currentMonthBalance: 40450,
      totalLoanTakenRemaining: 50000,
      totalLoanGivenRemaining: 7000,
      monthlyEmiTotal: 3200,
      activeLoansCount: 2
    },
    categoryExpenses: {
      "Room Rent": 12000,
      "Groceries & Supplies": 6500,
      "Electricity Utility": 2100,
      "LPG & Cooking Gas": 1150,
      "Produce & Dairy": 3800,
      "Internet & Cellular": 800,
      "Dining & Entertainment": 2800,
      "Transportation & Fuel": 2200,
      "Loan Repayment & EMIs": 3200
    },
    monthlyTrends: [
      { monthLabel: "Apr 2026", income: 65000, expense: 31000 },
      { monthLabel: "May 2026", income: 68000, expense: 33500 },
      { monthLabel: "Jun 2026", income: 70000, expense: 29000 },
      { monthLabel: "Jul 2026", income: 72000, expense: 35000 },
      { monthLabel: "Aug 2026", income: 70000, expense: 32000 },
      { monthLabel: "Sep 2026", income: 75000, expense: 34550 }
    ],
    transactions: [
      {
        id: "TXN-1001",
        date: "2026-09-01",
        type: "Income",
        category: "Salary",
        subCategory: "Primary Job",
        amount: 65000,
        paymentMode: "Bank Transfer",
        paidToFrom: "Corporate Employer",
        description: "Monthly salary direct deposit",
        status: "Completed"
      },
      {
        id: "TXN-1002",
        date: "2026-09-03",
        type: "Expense",
        category: "Room Rent",
        subCategory: "Housing Rent",
        amount: 12000,
        paymentMode: "UPI",
        paidToFrom: "Property Landlord",
        description: "Monthly apartment lease payment",
        status: "Completed"
      },
      {
        id: "TXN-1003",
        date: "2026-09-05",
        type: "Expense",
        category: "Groceries & Supplies",
        subCategory: "Pantry Staples",
        amount: 6500,
        paymentMode: "UPI",
        paidToFrom: "Metro Supermarket",
        description: "Monthly kitchen provisions and staples",
        status: "Completed"
      },
      {
        id: "TXN-1004",
        date: "2026-09-08",
        type: "Expense",
        category: "Electricity Utility",
        subCategory: "Utilities",
        amount: 2100,
        paymentMode: "Online",
        paidToFrom: "Power Board",
        description: "Monthly electric utility tariff settlement",
        status: "Completed"
      },
      {
        id: "TXN-1005",
        date: "2026-09-10",
        type: "Expense",
        category: "LPG & Cooking Gas",
        subCategory: "Cooking Fuel",
        amount: 1150,
        paymentMode: "Cash",
        paidToFrom: "Gas Agency",
        description: "LPG cylinder delivery",
        status: "Completed"
      },
      {
        id: "TXN-1006",
        date: "2026-09-12",
        type: "Expense",
        category: "Loan Repayment & EMIs",
        subCategory: "Auto Loan",
        amount: 3200,
        paymentMode: "Bank Transfer",
        paidToFrom: "HDFC Bank",
        description: "Vehicle loan monthly installment auto-debit",
        status: "Completed"
      },
      {
        id: "TXN-1007",
        date: "2026-09-15",
        type: "Income",
        category: "Freelance & Consulting",
        subCategory: "Web Design",
        amount: 10000,
        paymentMode: "UPI",
        paidToFrom: "Client Consultation",
        description: "UI/UX design milestone payment",
        status: "Completed"
      },
      {
        id: "TXN-1008",
        date: "2026-09-18",
        type: "Expense",
        category: "Produce & Dairy",
        subCategory: "Daily Essentials",
        amount: 3800,
        paymentMode: "Cash",
        paidToFrom: "Local Market",
        description: "Fresh vegetables, fruits, and dairy supplies",
        status: "Completed"
      }
    ],
    loans: [
      {
        id: "LOAN-1001",
        title: "Vehicle Loan EMI",
        personOrBank: "HDFC Bank",
        type: "Loan Taken",
        totalAmount: 75000,
        paidAmount: 25000,
        remainingAmount: 50000,
        monthlyEMI: 3200,
        dueDay: 5,
        status: "Active",
        startDate: "2025-09-01",
        notes: "Two-wheeler auto financing for 24 months tenure"
      },
      {
        id: "LOAN-1002",
        title: "Personal Emergency Advance",
        personOrBank: "David Miller",
        type: "Loan Given",
        totalAmount: 10000,
        paidAmount: 3000,
        remainingAmount: 7000,
        monthlyEMI: 0,
        dueDay: 10,
        status: "Active",
        startDate: "2026-06-15",
        notes: "Short-term personal loan advance to a colleague"
      }
    ],
    categories: [
      { id: "CAT-01", name: "Room Rent", type: "Expense", icon: "home", color: "#3B82F6" },
      { id: "CAT-02", name: "Groceries & Supplies", type: "Expense", icon: "shopping-cart", color: "#10B981" },
      { id: "CAT-03", name: "Electricity Utility", type: "Expense", icon: "zap", color: "#F59E0B" },
      { id: "CAT-04", name: "LPG & Cooking Gas", type: "Expense", icon: "flame", color: "#EF4444" },
      { id: "CAT-05", name: "Water Utility", type: "Expense", icon: "droplet", color: "#06B6D4" },
      { id: "CAT-06", name: "Produce & Dairy", type: "Expense", icon: "apple", color: "#84CC16" },
      { id: "CAT-07", name: "Internet & Cellular", type: "Expense", icon: "wifi", color: "#6366F1" },
      { id: "CAT-08", name: "Healthcare & Medical", type: "Expense", icon: "heart-pulse", color: "#EC4899" },
      { id: "CAT-09", name: "Dining & Entertainment", type: "Expense", icon: "coffee", color: "#D97706" },
      { id: "CAT-10", name: "Transportation & Fuel", type: "Expense", icon: "car", color: "#64748B" },
      { id: "CAT-11", name: "Apparel & Shopping", type: "Expense", icon: "shirt", color: "#8B5CF6" },
      { id: "CAT-12", name: "Education & Upskilling", type: "Expense", icon: "graduation-cap", color: "#14B8A6" },
      { id: "CAT-13", name: "Home Maintenance", type: "Expense", icon: "wrench", color: "#F97316" },
      { id: "CAT-14", name: "Loan Repayment & EMIs", type: "Expense", icon: "credit-card", color: "#DC2626" },
      { id: "CAT-15", name: "Miscellaneous Expense", type: "Expense", icon: "more-horizontal", color: "#94A3B8" },
      { id: "CAT-20", name: "Salary", type: "Income", icon: "briefcase", color: "#10B981" },
      { id: "CAT-21", name: "Freelance & Consulting", type: "Income", icon: "laptop", color: "#3B82F6" },
      { id: "CAT-22", name: "Business Revenue", type: "Income", icon: "trending-up", color: "#8B5CF6" },
      { id: "CAT-23", name: "Rental Inflow", type: "Income", icon: "key", color: "#F59E0B" },
      { id: "CAT-24", name: "Loan Recovery / Refund", type: "Income", icon: "arrow-down-left", color: "#06B6D4" },
      { id: "CAT-25", name: "Investments & Dividends", type: "Income", icon: "plus-circle", color: "#64748B" }
    ],
    budgets: [
      { id: "BDG-1001", monthYear: "2026-09", category: "Room Rent", budgetAmount: 12000, spentAmount: 12000, remainingAmount: 0, percentage: 100 },
      { id: "BDG-1002", monthYear: "2026-09", category: "Groceries & Supplies", budgetAmount: 8000, spentAmount: 6500, remainingAmount: 1500, percentage: 81 },
      { id: "BDG-1003", monthYear: "2026-09", category: "Electricity Utility", budgetAmount: 2500, spentAmount: 2100, remainingAmount: 400, percentage: 84 },
      { id: "BDG-1004", monthYear: "2026-09", category: "Produce & Dairy", budgetAmount: 4500, spentAmount: 3800, remainingAmount: 700, percentage: 84 },
      { id: "BDG-1005", monthYear: "2026-09", category: "Dining & Entertainment", budgetAmount: 3500, spentAmount: 2800, remainingAmount: 700, percentage: 80 }
    ]
  },

  /**
   * Main Request Dispatcher
   */
  async request(action, payload = {}) {
    const apiUrl = CONFIG.getApiUrl();

    if (CONFIG.isLiveConnected()) {
      try {
        const bodyData = { action: action, ...payload };
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(bodyData)
        });

        if (!response.ok) {
          throw new Error("HTTP error " + response.status + ": " + response.statusText);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        console.warn("API request failed; operating in local simulation mode:", err);
        if (window.showToast) {
          window.showToast("Could not sync with Google Sheets (" + err.message + "). Operating in local mode.", "warning");
        }
        return this.mockHandler(action, payload);
      }
    }

    return this.mockHandler(action, payload);
  },

  /**
   * Test Connection to Google Apps Script
   */
  async testConnection(testUrl) {
    try {
      const urlToTest = testUrl || CONFIG.getApiUrl();
      if (!urlToTest) {
        return { success: false, error: "URL is empty. Please enter a valid Apps Script Web App URL." };
      }

      const pingUrl = urlToTest.includes("?") ? `${urlToTest}&action=ping` : `${urlToTest}?action=ping`;
      const response = await fetch(pingUrl, { method: "GET" });
      const data = await response.json();
      return data;
    } catch (e) {
      return { success: false, error: "Connection error: " + e.message };
    }
  },

  /**
   * Mock Data Handler (When testing locally before Google Sheet deployment)
   */
  mockHandler(action, payload) {
    return new Promise((resolve) => {
      setTimeout(() => {
        switch (action) {
          case "login":
            if (payload.username === "admin" && payload.password === "admin123") {
              resolve({
                success: true,
                message: "Authentication successful.",
                user: this._mockData.user
              });
            } else {
              resolve({
                success: false,
                error: "Invalid username or password. Default demo credentials: admin / admin123"
              });
            }
            break;

          case "getDashboard":
            this.recalculateMockMetrics();
            resolve({
              success: true,
              data: {
                metrics: this._mockData.metrics,
                categoryExpenses: this._mockData.categoryExpenses,
                monthlyTrends: this._mockData.monthlyTrends,
                recentTransactions: this._mockData.transactions.slice(0, 10),
                activeLoans: this._mockData.loans.filter(l => l.status === "Active")
              }
            });
            break;

          case "getTransactions":
            let txns = [...this._mockData.transactions];
            if (payload.type) {
              txns = txns.filter(t => t.type.toLowerCase() === payload.type.toLowerCase());
            }
            if (payload.category) {
              txns = txns.filter(t => t.category.toLowerCase() === payload.category.toLowerCase());
            }
            if (payload.search) {
              const q = payload.search.toLowerCase();
              txns = txns.filter(t =>
                t.category.toLowerCase().includes(q) ||
                (t.subCategory && t.subCategory.toLowerCase().includes(q)) ||
                (t.paidToFrom && t.paidToFrom.toLowerCase().includes(q)) ||
                (t.description && t.description.toLowerCase().includes(q))
              );
            }
            resolve({ success: true, transactions: txns });
            break;

          case "addTransaction":
            const parsedAmt = parseFloat(payload.amount) || 0;
            // Anti-duplicate protection in mock mode
            const firstTxn = this._mockData.transactions[0];
            if (
              firstTxn &&
              firstTxn.category.toLowerCase() === (payload.category || "").toLowerCase() &&
              firstTxn.type.toLowerCase() === (payload.type || "").toLowerCase() &&
              Math.abs(firstTxn.amount - parsedAmt) < 0.01 &&
              (firstTxn.paidToFrom || "").toLowerCase() === (payload.paidToFrom || "").toLowerCase()
            ) {
              resolve({ success: true, message: "Duplicate submission ignored.", transactionId: firstTxn.id });
              break;
            }

            const newTxn = {
              id: "TXN-" + (1000 + this._mockData.transactions.length + 1),
              date: payload.date || new Date().toISOString().split("T")[0],
              type: payload.type || "Expense",
              category: payload.category || "Miscellaneous Expense",
              subCategory: payload.subCategory || "",
              amount: parsedAmt,
              paymentMode: payload.paymentMode || "UPI",
              paidToFrom: payload.paidToFrom || "",
              description: payload.description || "",
              status: "Completed"
            };
            this._mockData.transactions.unshift(newTxn);
            this.recalculateMockMetrics();
            resolve({ success: true, message: "Transaction recorded successfully.", transactionId: newTxn.id });
            break;

          case "deleteTransaction":
            this._mockData.transactions = this._mockData.transactions.filter(t => t.id !== payload.id);
            this.recalculateMockMetrics();
            resolve({ success: true, message: "Transaction deleted successfully." });
            break;

          case "getLoans":
            resolve({ success: true, loans: this._mockData.loans });
            break;

          case "addLoan":
            const newLoan = {
              id: "LOAN-" + (1000 + this._mockData.loans.length + 1),
              title: payload.title,
              personOrBank: payload.personOrBank,
              type: payload.type || "Loan Taken",
              totalAmount: parseFloat(payload.totalAmount) || 0,
              paidAmount: parseFloat(payload.paidAmount) || 0,
              remainingAmount: (parseFloat(payload.totalAmount) || 0) - (parseFloat(payload.paidAmount) || 0),
              monthlyEMI: parseFloat(payload.monthlyEMI) || 0,
              dueDay: parseInt(payload.dueDay) || 1,
              status: "Active",
              startDate: payload.startDate || new Date().toISOString().split("T")[0],
              notes: payload.notes || ""
            };
            this._mockData.loans.push(newLoan);
            this.recalculateMockMetrics();
            resolve({ success: true, message: "Loan obligation created successfully.", loanId: newLoan.id });
            break;

          case "updateLoanRepayment":
            const loan = this._mockData.loans.find(l => l.id === payload.id);
            if (loan) {
              const amt = parseFloat(payload.paymentAmount) || 0;
              loan.paidAmount += amt;
              loan.remainingAmount = Math.max(0, loan.totalAmount - loan.paidAmount);
              if (loan.remainingAmount <= 0) loan.status = "Closed";

              if (payload.recordAsExpense !== false) {
                const isGiven = loan.type.toLowerCase().includes("given");
                this._mockData.transactions.unshift({
                  id: "TXN-" + (1000 + this._mockData.transactions.length + 1),
                  date: new Date().toISOString().split("T")[0],
                  type: isGiven ? "Income" : "Expense",
                  category: isGiven ? "Loan Recovery / Refund" : "Loan Repayment & EMIs",
                  subCategory: loan.title,
                  amount: amt,
                  paymentMode: payload.paymentMode || "UPI",
                  paidToFrom: loan.personOrBank,
                  description: "Installment payment for " + loan.title,
                  status: "Completed"
                });
              }
              this.recalculateMockMetrics();
              resolve({ success: true, message: "Repayment recorded successfully." });
            } else {
              resolve({ success: false, error: "Loan record could not be found." });
            }
            break;

          case "getCategories":
            resolve({ success: true, categories: this._mockData.categories });
            break;

          case "getBudgets":
            resolve({ success: true, budgets: this._mockData.budgets });
            break;

          case "setBudget":
            const existingBdg = this._mockData.budgets.find(b => b.category.toLowerCase() === (payload.category || "").toLowerCase());
            if (existingBdg) {
              existingBdg.budgetAmount = parseFloat(payload.budgetAmount) || 0;
            } else {
              this._mockData.budgets.push({
                id: "BDG-" + (1000 + this._mockData.budgets.length + 1),
                monthYear: payload.monthYear || "2026-09",
                category: payload.category,
                budgetAmount: parseFloat(payload.budgetAmount) || 0,
                spentAmount: 0,
                remainingAmount: parseFloat(payload.budgetAmount) || 0,
                percentage: 0
              });
            }
            resolve({ success: true, message: "Budget limit established successfully." });
            break;

          case "getUsers":
            resolve({ success: true, users: this._mockData.users || [
              { userId: "USR-1001", username: "admin", fullName: "Primary Administrator", role: "Admin", createdAt: "2026-09-01", lastLogin: "2026-09-29" }
            ]});
            break;

          case "addUser":
            const newUser = {
              userId: "USR-" + (1001 + (this._mockData.users || []).length),
              username: payload.username,
              fullName: payload.fullName,
              role: payload.role || "Viewer",
              createdAt: new Date().toISOString().split("T")[0],
              lastLogin: "-"
            };
            if (!this._mockData.users) this._mockData.users = [];
            this._mockData.users.push(newUser);
            resolve({ success: true, message: "User account created successfully.", userId: newUser.userId });
            break;

          case "updateUser":
            if (this._mockData.users) {
              const u = this._mockData.users.find(x => x.userId === payload.userId);
              if (u) {
                if (payload.fullName) u.fullName = payload.fullName;
                if (payload.role) u.role = payload.role;
                if (payload.username) u.username = payload.username;
              }
            }
            resolve({ success: true, message: "User profile updated successfully." });
            break;

          case "deleteUser":
            if (this._mockData.users) {
              this._mockData.users = this._mockData.users.filter(x => x.userId !== payload.userId);
            }
            resolve({ success: true, message: "User account deleted successfully." });
            break;

          default:
            resolve({ success: true, message: "Mock response for action: " + action });
        }
      }, 150);
    });
  },

  recalculateMockMetrics() {
    let inc = 0;
    let exp = 0;
    const catMap = {};

    this._mockData.transactions.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type.toLowerCase() === "income") {
        inc += amt;
      } else {
        exp += amt;
        catMap[t.category] = (catMap[t.category] || 0) + amt;
      }
    });

    let taken = 0;
    let given = 0;
    let emiTotal = 0;
    let activeCount = 0;

    this._mockData.loans.forEach(l => {
      if (l.status === "Active") {
        activeCount++;
        emiTotal += parseFloat(l.monthlyEMI) || 0;
        if (l.type.toLowerCase().includes("taken")) {
          taken += l.remainingAmount;
        } else if (l.type.toLowerCase().includes("given")) {
          given += l.remainingAmount;
        }
      }
    });

    this._mockData.metrics.totalIncome = inc;
    this._mockData.metrics.totalExpense = exp;
    this._mockData.metrics.netBalance = inc - exp;
    this._mockData.metrics.currentMonthIncome = inc;
    this._mockData.metrics.currentMonthExpense = exp;
    this._mockData.metrics.currentMonthBalance = inc - exp;
    this._mockData.metrics.totalLoanTakenRemaining = taken;
    this._mockData.metrics.totalLoanGivenRemaining = given;
    this._mockData.metrics.monthlyEmiTotal = emiTotal;
    this._mockData.metrics.activeLoansCount = activeCount;
    this._mockData.categoryExpenses = catMap;
  }
};
