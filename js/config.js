/**
 * Home Finance Pro - Configuration & Storage Management
 */

const CONFIG = {
  // Key used to store the Google Apps Script Web App URL in browser localStorage
  STORAGE_GAS_URL_KEY: "home_finance_gas_url",
  STORAGE_USER_KEY: "home_finance_user_session",
  STORAGE_THEME_KEY: "home_finance_theme",

  // Default / Fallback Google Apps Script URL (Connected to Live Google Sheet)
  DEFAULT_GAS_URL: "https://script.google.com/macros/s/AKfycbykIdJeBUoDe_F0vejLFiDPGIY6zoYRefKqamEluJ15FOlZwHIyARuf1OXB_5x0pCB2eQ/exec",

  // Get current active API URL
  getApiUrl: function() {
    const savedUrl = localStorage.getItem(this.STORAGE_GAS_URL_KEY);
    return savedUrl ? savedUrl.trim() : this.DEFAULT_GAS_URL;
  },

  // Save new API URL
  setApiUrl: function(url) {
    if (url) {
      localStorage.setItem(this.STORAGE_GAS_URL_KEY, url.trim());
    } else {
      localStorage.removeItem(this.STORAGE_GAS_URL_KEY);
    }
  },

  // Check if live API is configured
  isLiveConnected: function() {
    const url = this.getApiUrl();
    return url && url.startsWith("https://script.google.com/macros/s/");
  }
};
