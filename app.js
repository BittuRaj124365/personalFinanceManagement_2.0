// ==========================================================================
// === STATE STORE & INITIALIZATION ===
// ==========================================================================

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Bills', 'Others'];

const state = {
  currentUser: null,
  users: [],
  accounts: [],
  transactions: [],
  budgets: [],
  goals: [],
  settings: {
    theme: 'light',
    accentColor: '1',
    notifications: {
      budgetAlerts: true,
      goalReminders: true,
      weeklySummary: true
    }
  }
};

// Key names for LocalStorage
const STORAGE_KEYS = {
  STATE: 'fintrack_app_state',
  SESSION: 'fintrack_session_user'
};

// Budget category warnings tracking (to prevent duplicate alerts per session)
const triggeredBudgetAlerts = new Set();

// Centralized Currency Formatter
function formatCurrency(value, currencyCode = null) {
  if (!currencyCode) {
    currencyCode = state.currentUser ? state.currentUser.currency : 'INR';
  }
  let symbol = '₹';
  let locale = 'en-IN';

  switch (currencyCode) {
    case 'USD': symbol = '$'; locale = 'en-US'; break;
    case 'EUR': symbol = '€'; locale = 'de-DE'; break;
    case 'GBP': symbol = '£'; locale = 'en-GB'; break;
    default: symbol = '₹'; locale = 'en-IN'; break;
  }

  const sign = value < 0 ? '-' : '';
  const formattedNumber = Math.abs(value).toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  return `${sign}${symbol}${formattedNumber}`;
}

// Load state from localStorage
function loadState() {
  const savedState = localStorage.getItem(STORAGE_KEYS.STATE);
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      state.users = parsed.users || [];
      state.accounts = parsed.accounts || [];
      state.transactions = parsed.transactions || [];
      state.budgets = parsed.budgets || [];
      state.goals = parsed.goals || [];
      state.settings = parsed.settings || state.settings;
    } catch (e) {
      console.error("Error parsing localStorage state:", e);
    }
  }

  // Check active session
  const persistentSession = localStorage.getItem(STORAGE_KEYS.SESSION);
  const tempSession = sessionStorage.getItem(STORAGE_KEYS.SESSION);
  const activeSessionUsername = persistentSession || tempSession;

  if (activeSessionUsername) {
    state.currentUser = state.users.find(u => u.username === activeSessionUsername) || null;
  }

  if (state.users.length === 0) {
    prepopulateDummyData();
  }
}

// Save state to localStorage
function saveState() {
  localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify({
    users: state.users,
    accounts: state.accounts,
    transactions: state.transactions,
    budgets: state.budgets,
    goals: state.goals,
    settings: state.settings
  }));
}

// Prepopulate data on first load
function prepopulateDummyData() {
  // 1. User account
  const alexUser = {
    fullname: "Alex Johnson",
    username: "alexj",
    email: "alex@example.com",
    mobile: "9876543210",
    dob: "1995-03-15",
    password: "password123", // Keep plain for mock client-side validation simplicity
    currency: "INR",
    onboarded: true
  };
  state.users.push(alexUser);

  // 2. Bank Accounts
  state.accounts.push(
    { id: 'acc-hdfc', userId: 'alexj', name: 'HDFC Savings', type: 'Bank', balance: 45200 },
    { id: 'acc-icici', userId: 'alexj', name: 'ICICI Current', type: 'Bank', balance: 12800 },
    { id: 'acc-cash', userId: 'alexj', name: 'Cash Wallet', type: 'Cash', balance: 2500 }
  );

  // 3. Category Budgets
  state.budgets.push({
    userId: 'alexj',
    totalLimit: 30000,
    allocations: {
      Food: 6000,
      Transport: 3000,
      Entertainment: 4000,
      Health: 2000,
      Shopping: 5000,
      Bills: 7000,
      Others: 3000
    },
    rollovers: {
      Food: false,
      Transport: false,
      Entertainment: false,
      Health: false,
      Shopping: false,
      Bills: false,
      Others: false
    }
  });

  // 4. Financial Goals
  state.goals.push(
    { id: 'goal-emg', userId: 'alexj', name: 'Emergency Fund', targetAmount: 50000, currentSaved: 30000, deadline: '2026-07-15', icon: '🎯', completed: false },
    { id: 'goal-lap', userId: 'alexj', name: 'New Laptop', targetAmount: 80000, currentSaved: 20000, deadline: '2026-10-01', icon: '💻', completed: false }
  );

  // 5. 15 Transactions across last 2 months
  const now = new Date();
  const generateDate = (daysAgo) => {
    const d = new Date();
    d.setDate(now.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  state.transactions.push(
    { id: 'tx-1', userId: 'alexj', type: 'income', amount: 55000, category: 'Others', accountId: 'acc-hdfc', date: generateDate(45), note: 'Monthly Salary Paycheck', recurring: true },
    { id: 'tx-2', userId: 'alexj', type: 'expense', amount: 8000, category: 'Bills', accountId: 'acc-hdfc', date: generateDate(42), note: 'Electricity and Wi-Fi', recurring: true },
    { id: 'tx-3', userId: 'alexj', type: 'expense', amount: 1200, category: 'Food', accountId: 'acc-cash', date: generateDate(38), note: 'Dinner with friends', recurring: false },
    { id: 'tx-4', userId: 'alexj', type: 'expense', amount: 4500, category: 'Shopping', accountId: 'acc-icici', date: generateDate(35), note: 'Running Shoes purchase', recurring: false },
    { id: 'tx-5', userId: 'alexj', type: 'expense', amount: 1500, category: 'Transport', accountId: 'acc-cash', date: generateDate(32), note: 'Weekly Cab rides', recurring: false },
    { id: 'tx-6', userId: 'alexj', type: 'income', amount: 60000, category: 'Others', accountId: 'acc-hdfc', date: generateDate(15), note: 'Monthly Salary Paycheck', recurring: true },
    { id: 'tx-7', userId: 'alexj', type: 'expense', amount: 7200, category: 'Bills', accountId: 'acc-hdfc', date: generateDate(12), note: 'House Rent share', recurring: true },
    { id: 'tx-8', userId: 'alexj', type: 'expense', amount: 2400, category: 'Food', accountId: 'acc-cash', date: generateDate(10), note: 'Gourmet Pizza night', recurring: false },
    { id: 'tx-9', userId: 'alexj', type: 'expense', amount: 1800, category: 'Health', accountId: 'acc-icici', date: generateDate(8), note: 'Vitamins & Pharmacy supplies', recurring: false },
    { id: 'tx-10', userId: 'alexj', type: 'expense', amount: 3200, category: 'Entertainment', accountId: 'acc-icici', date: generateDate(6), note: 'Concert Tickets', recurring: false },
    { id: 'tx-11', userId: 'alexj', type: 'expense', amount: 950, category: 'Transport', accountId: 'acc-cash', date: generateDate(5), note: 'Gasoline refill', recurring: false },
    { id: 'tx-12', userId: 'alexj', type: 'expense', amount: 5000, category: 'Shopping', accountId: 'acc-icici', date: generateDate(4), note: 'Noise cancelling earphones', recurring: false },
    { id: 'tx-13', userId: 'alexj', type: 'income', amount: 3500, category: 'Others', accountId: 'acc-hdfc', date: generateDate(3), note: 'Freelance Design consulting', recurring: false },
    { id: 'tx-14', userId: 'alexj', type: 'expense', amount: 1100, category: 'Food', accountId: 'acc-cash', date: generateDate(2), note: 'Office lunches', recurring: false },
    { id: 'tx-15', userId: 'alexj', type: 'expense', amount: 2000, category: 'Others', accountId: 'acc-hdfc', date: generateDate(1), note: 'Gift for sibling birthday', recurring: false }
  );

  saveState();
}


// ==========================================================================
// === TOAST & NOTIFICATION SYSTEM ===
// ==========================================================================

const TOAST_ICONS = {
  success: '🟢',
  error: '🔴',
  warning: '🟡',
  info: '🔵'
};

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // Enforce max 3 toasts
  if (container.children.length >= 3) {
    const oldest = container.children[0];
    removeToast(oldest);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || '🔵'}</span>
    <div class="toast-content">${message}</div>
    <button type="button" class="toast-close-btn" aria-label="Close toast">×</button>
  `;

  // Bind close action
  toast.querySelector('.toast-close-btn').addEventListener('click', () => removeToast(toast));

  container.appendChild(toast);

  // Auto dismiss
  setTimeout(() => {
    if (toast.parentNode) {
      removeToast(toast);
    }
  }, 4000);
}

function removeToast(toast) {
  toast.classList.add('toast-exit');
  toast.addEventListener('animationend', () => {
    toast.remove();
  });
}


// ==========================================================================
// === ROUTER SYSTEM ===
// ==========================================================================

const views = {
  '#/index': { elementId: 'view-landing', authRequired: false, title: 'Welcome to FinTrack' },
  '#/login': { elementId: 'view-login', authRequired: false, title: 'Login — FinTrack' },
  '#/signup': { elementId: 'view-signup', authRequired: false, title: 'Create Account — FinTrack' },
  '#/setup': { elementId: 'view-setup', authRequired: true, title: 'Setup Onboarding' },
  '#/dashboard': { elementId: 'view-dashboard', authRequired: true, title: 'Dashboard — FinTrack' },
  '#/transactions': { elementId: 'view-transactions', authRequired: true, title: 'Transactions Ledger' },
  '#/budget': { elementId: 'view-budget', authRequired: true, title: 'Budget Planner' },
  '#/goals': { elementId: 'view-goals', authRequired: true, title: 'Financial Targets' },
  '#/reports': { elementId: 'view-reports', authRequired: true, title: 'Reports & Analytics' },
  '#/settings': { elementId: 'view-settings', authRequired: true, title: 'Settings Panel' },
  '#/about': { elementId: 'view-about', authRequired: false, title: 'About FinTrack' },
  '#/404': { elementId: 'view-404', authRequired: false, title: '404 Page Not Found' }
};

let currentActiveView = '#/index';

function handleRouting() {
  const hash = window.location.hash || '#/index';
  let route = views[hash];

  // Route matching or 404
  if (!route) {
    // If it starts with #/index but has parameters (like #features)
    if (hash.startsWith('#/index')) {
      route = views['#/index'];
    } else {
      route = views['#/404'];
    }
  }

  // Auth Protection Guards
  const loggedIn = !!state.currentUser;

  if (route.authRequired && !loggedIn) {
    showToast("Please sign in to access that page.", "warning");
    window.location.hash = '#/login';
    return;
  }

  if (loggedIn) {
    const onboarded = state.currentUser.onboarded;

    // Redirect unonboarded user to setup
    if (!onboarded && hash !== '#/setup') {
      showToast("Please finish setup first.", "info");
      window.location.hash = '#/setup';
      return;
    }

    // Redirect logged in & onboarded user away from guest screens
    if (onboarded && (hash === '#/login' || hash === '#/signup' || hash === '#/setup')) {
      window.location.hash = '#/dashboard';
      return;
    }
  }

  // Apply visual theme settings
  applyThemeAndAccent();

  // Route Page Transitions
  const prevSection = document.getElementById(views[currentActiveView]?.elementId);
  const nextSection = document.getElementById(route.elementId);

  if (prevSection) {
    prevSection.classList.remove('active');
  }

  if (nextSection) {
    nextSection.classList.add('active');
    document.title = route.title;
    currentActiveView = hash;
  }

  // UI elements visibility based on layout logic
  const sidebar = document.getElementById('app-sidebar');
  const navbar = document.getElementById('app-navbar');
  const mobileNav = document.getElementById('mobile-nav-bar');

  const showAppShell = loggedIn && state.currentUser.onboarded && hash !== '#/setup';

  if (showAppShell) {
    sidebar.style.display = 'flex';
    mobileNav.style.display = 'flex';
    navbar.style.display = 'none';

    // Update sidebar profiles
    document.getElementById('sidebar-avatar-img').src = state.currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop';
    document.getElementById('sidebar-username-lbl').textContent = state.currentUser.fullname;
  } else {
    sidebar.style.display = 'none';
    mobileNav.style.display = 'none';
    navbar.style.display = 'flex';

    // Adjust navbar button visibility
    const guestBtns = document.getElementById('nav-auth-buttons');
    const userBtns = document.getElementById('nav-user-actions');
    if (loggedIn) {
      guestBtns.style.display = 'none';
      userBtns.style.display = 'block';
    } else {
      guestBtns.style.display = 'flex';
      userBtns.style.display = 'none';
    }
  }

  // Highlight active link markers in navigations
  highlightActiveLinks(hash);

  // Initialize view scripts
  initializePageView(hash);

  // Close hamburger menu toggles or modals on route
  closeAllModals();
  window.scrollTo(0, 0);
}

function highlightActiveLinks(hash) {
  // Sidebar links
  document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
  const sidebarMatch = {
    '#/dashboard': 'sidebar-dashboard',
    '#/transactions': 'sidebar-transactions',
    '#/budget': 'sidebar-budget',
    '#/goals': 'sidebar-goals',
    '#/reports': 'sidebar-reports',
    '#/settings': 'sidebar-settings'
  }[hash];
  if (sidebarMatch) {
    const link = document.getElementById(sidebarMatch);
    if (link) link.classList.add('active');
  }

  // Mobile Bottom bar
  document.querySelectorAll('.mobile-nav-link').forEach(el => el.classList.remove('active'));
  const mobileMatch = {
    '#/dashboard': 'mobile-nav-dashboard',
    '#/transactions': 'mobile-nav-transactions',
    '#/budget': 'mobile-nav-budget',
    '#/goals': 'mobile-nav-goals',
    '#/reports': 'mobile-nav-reports'
  }[hash];
  if (mobileMatch) {
    const link = document.getElementById(mobileMatch);
    if (link) link.classList.add('active');
  }

  // Navbar headers
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  if (hash === '#/about') {
    document.getElementById('nav-about')?.classList.add('active');
  }
}

// Global active charts registry to destroy instances on redraw
window.activeCharts = {};

function initializePageView(hash) {
  // Safe destroy helper
  const destroyChart = (key) => {
    if (window.activeCharts[key]) {
      window.activeCharts[key].destroy();
      delete window.activeCharts[key];
    }
  };

  switch (hash) {
    case '#/index':
      initLandingPage();
      break;
    case '#/dashboard':
      destroyChart('dashLine');
      destroyChart('dashDoughnut');
      // Simulated Skeleton loader
      renderDashboardSkeleton();
      setTimeout(() => {
        initDashboard();
      }, 700);
      break;
    case '#/transactions':
      initTransactionsPage();
      break;
    case '#/budget':
      destroyChart('budgetHistory');
      initBudgetPage();
      break;
    case '#/goals':
      initGoalsPage();
      break;
    case '#/reports':
      destroyChart('repFlow');
      destroyChart('repCat');
      destroyChart('repTrend');
      initReportsPage();
      break;
    case '#/settings':
      initSettingsPage();
      break;
    case '#/about':
      initAboutPage();
      break;
  }
}


// ==========================================================================
// === CONFIRMATION MODAL CLIENT ===
// ==========================================================================

let confirmModalCallback = null;

function showConfirmModal(title, message, onConfirm) {
  const modal = document.getElementById('confirm-modal');
  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-message').textContent = message;

  confirmModalCallback = onConfirm;
  modal.classList.add('active');
}

function initConfirmationModal() {
  const modal = document.getElementById('confirm-modal');
  const closeBtn = document.getElementById('confirm-modal-close');
  const cancelBtn = document.getElementById('confirm-modal-cancel');
  const confirmBtn = document.getElementById('confirm-modal-confirm');

  const closeModal = () => {
    modal.classList.remove('active');
    confirmModalCallback = null;
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  confirmBtn.addEventListener('click', () => {
    if (confirmModalCallback) {
      confirmModalCallback();
    }
    closeModal();
  });
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}


// ==========================================================================
// === AUTH ENGINE (LOGIN/SIGNUP) ===
// ==========================================================================

function initAuth() {
  // Password visible toggle switches
  document.querySelectorAll('.toggle-password-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetInput = document.getElementById(btn.getAttribute('data-target'));
      if (targetInput) {
        if (targetInput.type === 'password') {
          targetInput.type = 'text';
          btn.textContent = '🙈';
        } else {
          targetInput.type = 'password';
          btn.textContent = '👁️';
        }
      }
    });
  });

  // Forgot password triggers
  const forgotTrigger = document.getElementById('forgot-password-trigger');
  const forgotModal = document.getElementById('forgot-modal');
  const forgotClose = document.getElementById('forgot-modal-close');
  const forgotCancel = document.getElementById('forgot-modal-cancel-btn');
  const forgotForm = document.getElementById('forgot-form');

  forgotTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    forgotModal.classList.add('active');
  });

  const closeForgot = () => {
    forgotModal.classList.remove('active');
    forgotForm.reset();
    document.getElementById('forgot-email-error').textContent = '';
    document.getElementById('forgot-email-input').classList.remove('is-invalid');
  };

  forgotClose.addEventListener('click', closeForgot);
  forgotCancel.addEventListener('click', closeForgot);
  forgotForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('forgot-email-input');
    const errorMsg = document.getElementById('forgot-email-error');
    const email = emailInput.value.trim();

    // simple validations
    if (!email) {
      emailInput.classList.add('is-invalid');
      errorMsg.textContent = "Please fill out this field.";
      emailInput.parentElement.classList.add('shake');
      setTimeout(() => emailInput.parentElement.classList.remove('shake'), 400);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInput.classList.add('is-invalid');
      errorMsg.textContent = "Please enter a valid email address.";
      return;
    }

    showToast("Password reset link sent to your email!", "success");
    closeForgot();
  });

  // SIGN UP form submissions
  const signupForm = document.getElementById('signup-form');
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Clear errors
    document.querySelectorAll('#signup-form .form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('#signup-form .form-input').forEach(el => el.classList.remove('is-invalid'));

    const fullname = document.getElementById('signup-fullname').value.trim();
    const username = document.getElementById('signup-username').value.trim().toLowerCase();
    const email = document.getElementById('signup-email').value.trim();
    const mobile = document.getElementById('signup-mobile').value.trim();
    const dob = document.getElementById('signup-dob').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;

    let hasErrors = false;

    const setError = (id, msg) => {
      const input = document.getElementById(id);
      const error = document.getElementById(`${id}-error`);
      if (input && error) {
        input.classList.add('is-invalid');
        error.textContent = msg;
        input.parentElement.classList.add('shake');
        setTimeout(() => input.parentElement.classList.remove('shake'), 400);
      }
      hasErrors = true;
    };

    if (!fullname) setError('signup-fullname', 'Full Name is required.');
    if (!username) {
      setError('signup-username', 'Username is required.');
    } else if (username.includes(' ')) {
      setError('signup-username', 'Username cannot contain spaces.');
    } else if (state.users.some(u => u.username === username)) {
      setError('signup-username', 'This username is already taken.');
    }

    if (!email) {
      setError('signup-email', 'Email address is required.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('signup-email', 'Please enter a valid email address.');
    } else if (state.users.some(u => u.email === email)) {
      setError('signup-email', 'This email is already registered.');
    }

    if (!mobile) {
      setError('signup-mobile', 'Mobile number is required.');
    } else if (!/^\d{10}$/.test(mobile)) {
      setError('signup-mobile', 'Mobile number must be exactly 10 digits.');
    }

    if (!dob) setError('signup-dob', 'Date of birth is required.');

    if (!password) {
      setError('signup-password', 'Password is required.');
    } else if (password.length < 8) {
      setError('signup-password', 'Password must be at least 8 characters.');
    }

    if (!confirm) {
      setError('signup-confirm', 'Please confirm your password.');
    } else if (password !== confirm) {
      setError('signup-confirm', 'Passwords do not match.');
    }

    if (hasErrors) return;

    // Spinner state simulation
    const btn = document.getElementById('signup-submit-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> <span>Registering...</span>`;

    setTimeout(() => {
      const newUser = {
        fullname,
        username,
        email,
        mobile,
        dob,
        password,
        currency: 'INR',
        onboarded: false
      };

      state.users.push(newUser);
      state.currentUser = newUser;
      saveState();

      // Session start
      sessionStorage.setItem(STORAGE_KEYS.SESSION, username);

      btn.disabled = false;
      btn.innerHTML = originalText;
      signupForm.reset();

      showToast("Account created successfully! Let's set up.", "success");
      window.location.hash = '#/setup';
    }, 800);
  });

  // LOGIN Form submissions
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Clear errors
    document.querySelectorAll('#login-form .form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('#login-form .form-input').forEach(el => el.classList.remove('is-invalid'));

    const identifier = document.getElementById('login-identifier').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('login-remember').checked;

    let hasErrors = false;

    const setError = (id, msg) => {
      const input = document.getElementById(id);
      const error = document.getElementById(`${id}-error`);
      if (input && error) {
        input.classList.add('is-invalid');
        error.textContent = msg;
        input.parentElement.classList.add('shake');
        setTimeout(() => input.parentElement.classList.remove('shake'), 400);
      }
      hasErrors = true;
    };

    if (!identifier) setError('login-identifier', 'Please enter email or username.');
    if (!password) setError('login-password', 'Please enter your password.');

    if (hasErrors) return;

    // Spinner animation
    const btn = document.getElementById('login-submit-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> <span>Signing in...</span>`;

    setTimeout(() => {
      const user = state.users.find(u => u.username === identifier || u.email === identifier);

      if (!user || user.password !== password) {
        btn.disabled = false;
        btn.innerHTML = originalText;
        setError('login-password', 'Invalid credentials, please try again.');
        return;
      }

      // Establish session
      state.currentUser = user;
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.SESSION, user.username);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.SESSION, user.username);
      }

      btn.disabled = false;
      btn.innerHTML = originalText;
      loginForm.reset();

      showToast(`Welcome back, ${user.fullname}!`, "success");

      if (user.onboarded) {
        window.location.hash = '#/dashboard';
      } else {
        window.location.hash = '#/setup';
      }
    }, 800);
  });

  // Sidebar Logout triggers
  document.getElementById('sidebar-logout-btn').addEventListener('click', () => {
    showConfirmModal("Confirm Logout", "Are you sure you wish to log out from FinTrack?", () => {
      state.currentUser = null;
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
      triggeredBudgetAlerts.clear();
      showToast("Logged out successfully.", "info");
      window.location.hash = '#/index';
    });
  });
}


// ==========================================================================
// === ONBOARDING WIZARD CONTROL (/setup) ===
// ==========================================================================

let wizardStep = 1;
let onboardingAccounts = [];
let onboardingGoals = [];
let setupBudgetChart = null;

function initOnboardingWizard() {
  wizardStep = 1;
  onboardingAccounts = [
    { name: 'My Bank Account', type: 'Bank', balance: 10000 }
  ];
  onboardingGoals = [
    { name: 'Holiday Fund', targetAmount: 20000, deadline: '2026-12-31', icon: '✈️' }
  ];

  updateWizardUI();

  // Avatar Upload readers
  const avatarFile = document.getElementById('setup-avatar-file');
  avatarFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('avatar-preview-img').src = event.target.result;
        document.getElementById('avatar-preview-img').style.display = 'block';
        document.getElementById('avatar-placeholder-svg').style.display = 'none';

        // Save avatar string to transient storage
        state.currentUser.avatar = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Step 2 categories budget building
  buildOnboardingBudgetsList();

  // Step 3 Add account
  document.getElementById('setup-add-account-btn').addEventListener('click', () => {
    onboardingAccounts.push({ name: 'New Wallet', type: 'Cash', balance: 0 });
    renderOnboardingAccounts();
  });

  // Step 4 Add goal
  document.getElementById('setup-add-goal-btn').addEventListener('click', () => {
    if (onboardingGoals.length >= 3) {
      showToast("Onboarding setup allows max 3 goals. You can add more later!", "warning");
      return;
    }
    onboardingGoals.push({ name: 'New Goal', targetAmount: 10000, deadline: '2026-12-31', icon: '🎯' });
    renderOnboardingGoals();
  });

  // Wizard Navigation
  const nextBtn = document.getElementById('setup-next-btn');
  const backBtn = document.getElementById('setup-back-btn');

  backBtn.addEventListener('click', () => {
    if (wizardStep > 1) {
      wizardStep--;
      updateWizardUI();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (validateWizardStep()) {
      if (wizardStep < 4) {
        wizardStep++;
        updateWizardUI();
      } else {
        finishOnboarding();
      }
    }
  });
}

function updateWizardUI() {
  // Toggle screens active class
  document.querySelectorAll('.setup-step-section').forEach((el, index) => {
    if (index + 1 === wizardStep) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Step node nodes colors active state
  document.querySelectorAll('.setup-step-node').forEach((node, index) => {
    node.classList.remove('active', 'completed');
    if (index + 1 === wizardStep) {
      node.classList.add('active');
    } else if (index + 1 < wizardStep) {
      node.classList.add('completed');
    }
  });

  // Progress Bar Width
  const progressFill = document.getElementById('setup-progress-fill');
  progressFill.style.width = `${wizardStep * 25}%`;

  // Buttons Configuration
  const backBtn = document.getElementById('setup-back-btn');
  const nextBtn = document.getElementById('setup-next-btn');

  backBtn.disabled = wizardStep === 1;
  nextBtn.textContent = wizardStep === 4 ? 'Finish' : 'Next';

  // Load specific step lists
  if (wizardStep === 2) {
    updateBudgetChart();
  } else if (wizardStep === 3) {
    renderOnboardingAccounts();
  } else if (wizardStep === 4) {
    renderOnboardingGoals();
  }
}

function validateWizardStep() {
  if (wizardStep === 1) {
    const displayNameInput = document.getElementById('setup-displayname');
    const err = document.getElementById('setup-displayname-error');
    err.textContent = '';
    displayNameInput.classList.remove('is-invalid');

    const name = displayNameInput.value.trim();
    if (!name) {
      displayNameInput.classList.add('is-invalid');
      err.textContent = 'Display Name is required.';
      return false;
    }

    // Save displayName to temp state
    state.currentUser.fullname = name;
    state.currentUser.currency = document.getElementById('setup-currency').value;
    return true;
  }

  if (wizardStep === 2) {
    const totalBudgetInput = document.getElementById('setup-total-budget');
    const totalBudget = parseFloat(totalBudgetInput.value) || 0;

    if (totalBudget <= 0) {
      showToast("Please enter a total monthly budget amount greater than 0.", "error");
      return false;
    }

    // Sum category allocations
    let allocatedSum = 0;
    DEFAULT_CATEGORIES.forEach(cat => {
      const val = parseFloat(document.getElementById(`setup-budget-cat-${cat}`).value) || 0;
      allocatedSum += val;
    });

    if (allocatedSum > totalBudget) {
      showToast("Your category allocations exceed the total budget amount!", "error");
      return false;
    }
    return true;
  }

  if (wizardStep === 3) {
    // Validate accounts inputs
    if (onboardingAccounts.length === 0) {
      showToast("Please add at least one account to track finances.", "warning");
      return false;
    }

    let isValid = true;
    onboardingAccounts.forEach((acc, idx) => {
      const name = document.getElementById(`setup-acc-name-${idx}`).value.trim();
      const bal = parseFloat(document.getElementById(`setup-acc-bal-${idx}`).value);
      if (!name) {
        showToast(`Account #${idx + 1} Name cannot be blank.`, "error");
        isValid = false;
      }
      if (isNaN(bal) || bal < 0) {
        showToast(`Account #${idx + 1} Balance must be a valid positive number.`, "error");
        isValid = false;
      }
    });
    return isValid;
  }

  if (wizardStep === 4) {
    // Validate goals
    let isValid = true;
    onboardingGoals.forEach((goal, idx) => {
      const name = document.getElementById(`setup-goal-name-${idx}`).value.trim();
      const target = parseFloat(document.getElementById(`setup-goal-target-${idx}`).value);
      const deadline = document.getElementById(`setup-goal-date-${idx}`).value;

      if (!name) {
        showToast(`Goal #${idx + 1} Name cannot be empty.`, "error");
        isValid = false;
      }
      if (isNaN(target) || target <= 0) {
        showToast(`Goal #${idx + 1} Target must be greater than 0.`, "error");
        isValid = false;
      }
      if (!deadline) {
        showToast(`Goal #${idx + 1} Deadline must be set.`, "error");
        isValid = false;
      }
    });
    return isValid;
  }

  return true;
}

function buildOnboardingBudgetsList() {
  const container = document.getElementById('setup-budget-categories-list');
  container.innerHTML = '';

  DEFAULT_CATEGORIES.forEach(cat => {
    const defaultVal = cat === 'Others' ? 6000 : 4000; // split placeholder budget allocations
    const div = document.createElement('div');
    div.className = 'budget-cat-row';
    div.innerHTML = `
      <div class="budget-cat-icon" style="background-color: var(--border-color);">${getCategoryEmoji(cat)}</div>
      <div class="form-group">
        <label class="form-label">${cat}</label>
        <input type="number" id="setup-budget-cat-${cat}" class="form-input setup-budget-cat-input" value="${defaultVal}" min="0">
      </div>
    `;
    container.appendChild(div);
  });

  // Hook inputs to update chart dynamically
  container.querySelectorAll('.setup-budget-cat-input').forEach(input => {
    input.addEventListener('input', updateBudgetChart);
  });
  document.getElementById('setup-total-budget').addEventListener('input', updateBudgetChart);
}

function updateBudgetChart() {
  const total = parseFloat(document.getElementById('setup-total-budget').value) || 0;

  let allocated = 0;
  const data = [];
  const labels = [];

  DEFAULT_CATEGORIES.forEach(cat => {
    const val = parseFloat(document.getElementById(`setup-budget-cat-${cat}`).value) || 0;
    allocated += val;
    data.push(val);
    labels.push(cat);
  });

  const remaining = Math.max(0, total - allocated);
  data.push(remaining);
  labels.push('Remaining');

  const formattedRem = formatCurrency(remaining, document.getElementById('setup-currency').value);
  document.getElementById('setup-budget-remaining-lbl').textContent = `Remaining: ${formattedRem}`;

  const colors = ['#6C63FF', '#00C49A', '#FF5C5C', '#FFAB40', '#4CAF82', '#9C27B0', '#00BCD4', '#9CA3AF'];

  // Initialize or update Chart.js
  const ctx = document.getElementById('setup-budget-chart').getContext('2d');
  if (setupBudgetChart) {
    setupBudgetChart.data.datasets[0].data = data;
    setupBudgetChart.data.labels = labels;
    setupBudgetChart.update();
  } else {
    setupBudgetChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, data.length)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

function renderOnboardingAccounts() {
  const container = document.getElementById('setup-accounts-list-container');
  container.innerHTML = '';

  onboardingAccounts.forEach((acc, idx) => {
    const item = document.createElement('div');
    item.className = 'setup-account-item animate-fade';
    item.innerHTML = `
      <input type="text" id="setup-acc-name-${idx}" class="form-input" placeholder="Account Name (e.g. HDFC)" value="${acc.name}">
      <select id="setup-acc-type-${idx}" class="form-input">
        <option value="Bank" ${acc.type === 'Bank' ? 'selected' : ''}>Bank</option>
        <option value="Cash" ${acc.type === 'Cash' ? 'selected' : ''}>Cash</option>
        <option value="Credit Card" ${acc.type === 'Credit Card' ? 'selected' : ''}>Credit Card</option>
      </select>
      <input type="number" id="setup-acc-bal-${idx}" class="form-input" placeholder="Balance" value="${acc.balance}">
      <button type="button" class="delete-row-btn" data-index="${idx}" title="Delete account">✕</button>
    `;

    // Bind deletes
    item.querySelector('.delete-row-btn').addEventListener('click', () => {
      onboardingAccounts.splice(idx, 1);
      renderOnboardingAccounts();
    });

    // Save inputs value state on change
    item.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('change', () => {
        onboardingAccounts[idx] = {
          name: document.getElementById(`setup-acc-name-${idx}`).value,
          type: document.getElementById(`setup-acc-type-${idx}`).value,
          balance: parseFloat(document.getElementById(`setup-acc-bal-${idx}`).value) || 0
        };
      });
    });

    container.appendChild(item);
  });
}

function renderOnboardingGoals() {
  const container = document.getElementById('setup-goals-list-container');
  container.innerHTML = '';

  onboardingGoals.forEach((goal, idx) => {
    const item = document.createElement('div');
    item.className = 'setup-goal-item animate-fade';
    item.innerHTML = `
      <input type="text" id="setup-goal-name-${idx}" class="form-input" placeholder="Goal Name (e.g. Laptop)" value="${goal.name}">
      <input type="number" id="setup-goal-target-${idx}" class="form-input" placeholder="Target Amount" value="${goal.targetAmount}">
      <input type="date" id="setup-goal-date-${idx}" class="form-input" value="${goal.deadline}">
      
      <!-- Icon selector display button -->
      <button type="button" class="icon-picker-btn" id="setup-goal-picker-${idx}">${goal.icon}</button>
      
      <button type="button" class="delete-row-btn" data-index="${idx}" title="Delete goal">✕</button>
    `;

    // Icon button selector cycler
    const icons = ['🎯', '💻', '🚗', '🏠', '✈️', '🎒'];
    item.querySelector(`#setup-goal-picker-${idx}`).addEventListener('click', (e) => {
      let curIdx = icons.indexOf(goal.icon);
      let nextIdx = (curIdx + 1) % icons.length;
      goal.icon = icons[nextIdx];
      e.target.textContent = goal.icon;
    });

    // Delete binding
    item.querySelector('.delete-row-btn').addEventListener('click', () => {
      onboardingGoals.splice(idx, 1);
      renderOnboardingGoals();
    });

    // Save inputs value state on change
    item.querySelectorAll('input').forEach(el => {
      el.addEventListener('change', () => {
        onboardingGoals[idx].name = document.getElementById(`setup-goal-name-${idx}`).value;
        onboardingGoals[idx].targetAmount = parseFloat(document.getElementById(`setup-goal-target-${idx}`).value) || 0;
        onboardingGoals[idx].deadline = document.getElementById(`setup-goal-date-${idx}`).value;
      });
    });

    container.appendChild(item);
  });
}

function finishOnboarding() {
  const user = state.currentUser;

  // Set user onboard status
  user.onboarded = true;

  // Save allocations to State budgets
  const totalLimit = parseFloat(document.getElementById('setup-total-budget').value) || 0;
  const allocations = {};
  const rollovers = {};
  DEFAULT_CATEGORIES.forEach(cat => {
    allocations[cat] = parseFloat(document.getElementById(`setup-budget-cat-${cat}`).value) || 0;
    rollovers[cat] = false;
  });

  state.budgets.push({
    userId: user.username,
    totalLimit,
    allocations,
    rollovers
  });

  // Save onboarding accounts
  onboardingAccounts.forEach((acc, index) => {
    state.accounts.push({
      id: `acc-${user.username}-${Date.now()}-${index}`,
      userId: user.username,
      name: acc.name,
      type: acc.type,
      balance: acc.balance
    });
  });

  // Save onboarding goals
  onboardingGoals.forEach((goal, index) => {
    state.goals.push({
      id: `goal-${user.username}-${Date.now()}-${index}`,
      userId: user.username,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentSaved: 0,
      deadline: goal.deadline,
      icon: goal.icon,
      completed: false
    });
  });

  saveState();

  // Destroy transient budget chart references
  if (setupBudgetChart) {
    setupBudgetChart.destroy();
    setupBudgetChart = null;
  }

  showToast("Onboarding completed successfully!", "success");
  window.location.hash = '#/dashboard';
}


// ==========================================================================
// === LANDING PAGE CONTROLLER (/index) ===
// ==========================================================================

function initLandingPage() {
  // Counters Count Up animations
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-target'));
    const isCurrency = el.id === 'counter-funds';
    const duration = 2000; // ms
    const stepTime = 30;
    const steps = duration / stepTime;
    const valPerStep = target / steps;

    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += valPerStep;
      if (step >= steps) {
        current = target;
        clearInterval(timer);
      }

      if (isCurrency) {
        el.textContent = formatCurrency(Math.floor(current), 'INR');
      } else {
        el.textContent = Math.floor(current).toLocaleString();
      }
    }, stepTime);
  };

  document.querySelectorAll('.counter-value').forEach(el => animateCounter(el));

  // Reviews Testimonial Carousel Auto-scrolling
  const track = document.getElementById('carousel-track');
  const dots = document.getElementById('carousel-dots');
  let currentSlide = 0;
  let autoScrollTimer = null;

  const updateCarousel = (index) => {
    currentSlide = index;
    track.style.transform = `translateX(-${index * 100}%)`;

    // update dots
    dots.querySelectorAll('.carousel-dot').forEach((dot, idx) => {
      if (idx === index) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  };

  // Dot clicks
  dots.querySelectorAll('.carousel-dot').forEach((dot, index) => {
    dot.addEventListener('click', () => {
      clearInterval(autoScrollTimer);
      updateCarousel(index);
      startAutoScroll();
    });
  });

  const startAutoScroll = () => {
    autoScrollTimer = setInterval(() => {
      const nextSlide = (currentSlide + 1) % 3;
      updateCarousel(nextSlide);
    }, 5000);
  };

  startAutoScroll();
}


// ==========================================================================
// === DASHBOARD CONTROLLER (/dashboard) ===
// ==========================================================================

function renderDashboardSkeleton() {
  // Replace value items with shimmers
  const setSkeleton = (id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="skeleton-shimmer skeleton-value"></div>`;
  };
  setSkeleton('dash-stat-balance');
  setSkeleton('dash-stat-income');
  setSkeleton('dash-stat-expense');
  setSkeleton('dash-stat-savings');

  document.getElementById('dash-budget-list').innerHTML = `
    <div class="skeleton-shimmer skeleton-text" style="width: 40%"></div>
    <div class="skeleton-shimmer skeleton-value" style="height: 12px; border-radius: 6px;"></div>
  `;
  document.getElementById('dash-recent-transactions-list').innerHTML = `
    <div class="skeleton-shimmer skeleton-value" style="height: 50px; margin-bottom: 8px;"></div>
    <div class="skeleton-shimmer skeleton-value" style="height: 50px;"></div>
  `;
}

function initDashboard() {
  const user = state.currentUser;
  if (!user) return;

  // Header Welcome Label & Date
  const hr = new Date().getHours();
  let greet = "Good morning";
  if (hr >= 12 && hr < 17) greet = "Good afternoon";
  else if (hr >= 17) greet = "Good evening";

  document.getElementById('dashboard-greeting-lbl').textContent = `${greet}, ${user.fullname}!`;

  const now = new Date();
  document.getElementById('dashboard-date-lbl').textContent = now.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  document.getElementById('dashboard-avatar-img').src = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop';

  // Extract variables
  const userAccounts = state.accounts.filter(a => a.userId === user.username);
  const userTxs = state.transactions.filter(t => t.userId === user.username);
  const userBudget = state.budgets.find(b => b.userId === user.username) || { totalLimit: 0, allocations: {} };

  // Calculate stats values
  // Total Balance
  const totalBalance = userAccounts.reduce((sum, a) => sum + a.balance, 0);
  document.getElementById('dash-stat-balance').textContent = formatCurrency(totalBalance);

  // Month values
  const currentMonthStr = now.toISOString().slice(0, 7); // "YYYY-MM"

  const lastMonth = new Date();
  lastMonth.setMonth(now.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7);

  const getMonthStats = (monthStr) => {
    const txs = userTxs.filter(t => t.date.startsWith(monthStr));
    const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense };
  };

  const currStats = getMonthStats(currentMonthStr);
  const prevStats = getMonthStats(lastMonthStr);

  document.getElementById('dash-stat-income').textContent = formatCurrency(currStats.income);
  document.getElementById('dash-stat-expense').textContent = formatCurrency(currStats.expense);

  // Savings rate
  const savingsRate = currStats.income > 0 ? ((currStats.income - currStats.expense) / currStats.income) * 100 : 0;
  const prevSavingsRate = prevStats.income > 0 ? ((prevStats.income - prevStats.expense) / prevStats.income) * 100 : 0;
  document.getElementById('dash-stat-savings').textContent = `${Math.max(0, Math.floor(savingsRate))}%`;

  // Draw trend indicators
  const renderTrend = (elementId, currentVal, prevVal, isHigherBetter) => {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (prevVal === 0) {
      el.innerHTML = `<span>— vs last month</span>`;
      el.className = 'stat-card-trend';
      return;
    }

    const pctChange = ((currentVal - prevVal) / prevVal) * 100;
    const pctStr = Math.abs(pctChange).toFixed(0);
    const isGood = isHigherBetter ? pctChange >= 0 : pctChange <= 0;

    const arrow = pctChange >= 0 ? '▲' : '▼';
    el.innerHTML = `
      <span class="trend-${isGood ? 'up' : 'down'}">${arrow} ${pctStr}%</span>
      <span>vs last month</span>
    `;
  };

  renderTrend('dash-stat-balance-trend', totalBalance, (totalBalance - currStats.income + currStats.expense), true);
  renderTrend('dash-stat-income-trend', currStats.income, prevStats.income, true);
  renderTrend('dash-stat-expense-trend', currStats.expense, prevStats.expense, false);
  renderTrend('dash-stat-savings-trend', savingsRate, prevSavingsRate, true);

  // Category Budgets Progress Bars
  renderDashboardBudgets(userBudget, userTxs, currentMonthStr);

  // Recent Transactions
  renderDashboardRecentTransactions(userTxs);

  // Render Analytics Charts
  renderDashboardCharts(userTxs, userBudget, currentMonthStr);

  // Floating Action Button
  document.getElementById('dashboard-add-tx-btn').onclick = () => openTransactionModal();
}

function renderDashboardBudgets(userBudget, userTxs, currentMonthStr) {
  const container = document.getElementById('dash-budget-list');
  container.innerHTML = '';

  const allocations = userBudget.allocations || {};
  const currentMonthTxs = userTxs.filter(t => t.date.startsWith(currentMonthStr) && t.type === 'expense');

  let activeBudgetsCount = 0;

  for (const cat in allocations) {
    const limit = allocations[cat];
    if (limit <= 0) continue;

    activeBudgetsCount++;
    const spent = currentMonthTxs.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0);
    const pct = Math.min(100, Math.round((spent / limit) * 100));

    // Check Alerts warnings
    checkBudgetExceedWarning(cat, spent, limit);

    // Color code rules
    let colorClass = 'success';
    if (pct >= 90) colorClass = 'danger';
    else if (pct >= 75) colorClass = 'warning';

    const item = document.createElement('div');
    item.className = 'budget-progress-item animate-fade';
    item.innerHTML = `
      <div class="budget-progress-info">
        <span class="budget-progress-label">${getCategoryEmoji(cat)} <b>${cat}</b></span>
        <span>${formatCurrency(spent)} of ${formatCurrency(limit)} (${pct}%)</span>
      </div>
      <div class="budget-progress-bar-outer">
        <div class="budget-progress-bar-inner ${colorClass}" style="width: ${pct}%"></div>
      </div>
    `;
    container.appendChild(item);
  }

  if (activeBudgetsCount === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-title">No Active Budgets</div>
        <div class="empty-state-desc">Head to the Budgets Planner to configure allocations limits.</div>
      </div>
    `;
  }
}

function checkBudgetExceedWarning(category, spent, limit) {
  if (!state.settings.notifications.budgetAlerts) return;

  const ratio = spent / limit;
  const alertId75 = `${state.currentUser.username}_${category}_75`;
  const alertId100 = `${state.currentUser.username}_${category}_100`;

  if (ratio >= 1.0 && !triggeredBudgetAlerts.has(alertId100)) {
    triggeredBudgetAlerts.add(alertId100);
    showToast(`ALERT: You have exceeded 100% of your ${category} budget!`, "error");
  } else if (ratio >= 0.75 && ratio < 1.0 && !triggeredBudgetAlerts.has(alertId75)) {
    triggeredBudgetAlerts.add(alertId75);
    showToast(`WARNING: You have spent over 75% of your ${category} budget!`, "warning");
  }
}

function renderDashboardRecentTransactions(userTxs) {
  const container = document.getElementById('dash-recent-transactions-list');
  container.innerHTML = '';

  // Sort descending and get top 5
  const recent = [...userTxs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💸</div>
        <div class="empty-state-title">No Transactions Found</div>
        <div class="empty-state-desc">Use the floating action button + to record your first transaction.</div>
      </div>
    `;
    return;
  }

  recent.forEach(tx => {
    const item = document.createElement('div');
    item.className = 'transaction-item animate-fade';
    item.innerHTML = `
      <div class="tx-icon-info">
        <div class="tx-icon" style="background-color: var(--border-color);">${getCategoryEmoji(tx.category)}</div>
        <div class="tx-info">
          <div class="tx-name">${tx.note || 'Transaction'}</div>
          <div class="tx-meta">
            <span>${tx.date}</span>
            <span class="tx-category-badge">${tx.category}</span>
          </div>
        </div>
      </div>
      <div class="tx-amount ${tx.type}">${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}</div>
    `;
    container.appendChild(item);
  });
}

function renderDashboardCharts(userTxs, userBudget, currentMonthStr) {
  // Chart 1: Line Chart - Last 6 Months (Income vs Expense)
  const lineCtx = document.getElementById('dash-line-chart').getContext('2d');

  const monthsData = [];
  const incomeValues = [];
  const expenseValues = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toISOString().slice(0, 7);

    // Label name (e.g. "Jun")
    const label = d.toLocaleString('default', { month: 'short' });
    monthsData.push(label);

    const txs = userTxs.filter(t => t.date.startsWith(monthKey));
    const inc = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const exp = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    incomeValues.push(inc);
    expenseValues.push(exp);
  }

  window.activeCharts.dashLine = new Chart(lineCtx, {
    type: 'line',
    data: {
      labels: monthsData,
      datasets: [
        {
          label: 'Income',
          data: incomeValues,
          borderColor: '#4CAF82',
          backgroundColor: 'rgba(76, 175, 130, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Expenses',
          data: expenseValues,
          borderColor: '#FF5C5C',
          backgroundColor: 'rgba(255, 92, 92, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } },
        y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } }
      }
    }
  });

  // Chart 2: Doughnut Chart - Spending by Category This Month
  const doughnutCtx = document.getElementById('dash-doughnut-chart').getContext('2d');

  const currentMonthExpenses = userTxs.filter(t => t.date.startsWith(currentMonthStr) && t.type === 'expense');
  const catData = [];
  const catLabels = [];

  DEFAULT_CATEGORIES.forEach(cat => {
    const sum = currentMonthExpenses.filter(t => t.category === cat).reduce((total, t) => total + t.amount, 0);
    if (sum > 0) {
      catData.push(sum);
      catLabels.push(cat);
    }
  });

  if (catData.length === 0) {
    // Show placeholders if empty
    catData.push(1);
    catLabels.push('No Expenses');
  }

  const colors = ['#6C63FF', '#00C49A', '#FF5C5C', '#FFAB40', '#4CAF82', '#9C27B0', '#00BCD4'];

  window.activeCharts.dashDoughnut = new Chart(doughnutCtx, {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets: [{
        data: catData,
        backgroundColor: colors.slice(0, catLabels.length)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') }
        }
      }
    }
  });
}


// ==========================================================================
// === TRANSACTION MODAL ENGINE ===
// ==========================================================================

let activeTxEditId = null;

function openTransactionModal(editId = null) {
  const modal = document.getElementById('transaction-modal');
  const form = document.getElementById('transaction-form');

  // Clean inputs errors
  document.querySelectorAll('#transaction-form .form-error').forEach(el => el.textContent = '');
  document.querySelectorAll('#transaction-form .form-input').forEach(el => el.classList.remove('is-invalid'));

  // Load account selections
  const accountsSelect = document.getElementById('tx-account-input');
  accountsSelect.innerHTML = '';
  state.accounts.filter(a => a.userId === state.currentUser.username).forEach(acc => {
    accountsSelect.innerHTML += `<option value="${acc.id}">${acc.name} (${formatCurrency(acc.balance)})</option>`;
  });

  if (state.accounts.length === 0) {
    showToast("Please add at least one account in Settings first.", "error");
    return;
  }

  // Pre-fill fields for creation default
  activeTxEditId = editId;
  const nowStr = new Date().toISOString().split('T')[0];

  if (editId) {
    document.getElementById('tx-modal-title').textContent = 'Edit Transaction';
    const tx = state.transactions.find(t => t.id === editId);

    if (tx) {
      if (tx.type === 'income') {
        document.getElementById('tx-type-income').checked = true;
        setTxTypeTabStyle('income');
      } else {
        document.getElementById('tx-type-expense').checked = true;
        setTxTypeTabStyle('expense');
      }

      document.getElementById('tx-amount-input').value = tx.amount;
      document.getElementById('tx-description-input').value = tx.note;
      document.getElementById('tx-category-input').value = tx.category;
      document.getElementById('tx-account-input').value = tx.accountId;
      document.getElementById('tx-date-input').value = tx.date;
      document.getElementById('tx-recurring-input').checked = tx.recurring;
    }
  } else {
    document.getElementById('tx-modal-title').textContent = 'Add Transaction';
    form.reset();
    document.getElementById('tx-type-expense').checked = true;
    setTxTypeTabStyle('expense');
    document.getElementById('tx-date-input').value = nowStr;
  }

  modal.classList.add('active');
}

function setTxTypeTabStyle(type) {
  const incTab = document.getElementById('tx-type-income-btn');
  const expTab = document.getElementById('tx-type-expense-btn');
  if (type === 'income') {
    incTab.style.borderColor = 'var(--success)';
    incTab.style.backgroundColor = 'rgba(76, 175, 130, 0.1)';
    expTab.style.borderColor = 'var(--border-color-strong)';
    expTab.style.backgroundColor = 'transparent';
  } else {
    expTab.style.borderColor = 'var(--danger)';
    expTab.style.backgroundColor = 'rgba(255, 92, 92, 0.1)';
    incTab.style.borderColor = 'var(--border-color-strong)';
    incTab.style.backgroundColor = 'transparent';
  }
}

function initTransactionModalController() {
  const form = document.getElementById('transaction-form');
  const modal = document.getElementById('transaction-modal');
  const cancelBtn = document.getElementById('tx-modal-cancel-btn');
  const closeBtn = document.getElementById('tx-modal-close');

  const closeTx = () => {
    modal.classList.remove('active');
    activeTxEditId = null;
  };

  cancelBtn.addEventListener('click', closeTx);
  closeBtn.addEventListener('click', closeTx);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeTx();
  });

  // Type clicks toggles styling
  document.getElementById('tx-type-income').addEventListener('change', () => setTxTypeTabStyle('income'));
  document.getElementById('tx-type-expense').addEventListener('change', () => setTxTypeTabStyle('expense'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validations
    document.querySelectorAll('#transaction-form .form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('#transaction-form .form-input').forEach(el => el.classList.remove('is-invalid'));

    const amount = parseFloat(document.getElementById('tx-amount-input').value);
    const note = document.getElementById('tx-description-input').value.trim();
    const category = document.getElementById('tx-category-input').value;
    const accountId = document.getElementById('tx-account-input').value;
    const date = document.getElementById('tx-date-input').value;
    const type = document.querySelector('input[name="tx-type"]:checked').value;
    const recurring = document.getElementById('tx-recurring-input').checked;

    let hasErrors = false;

    const setError = (id, msg) => {
      const input = document.getElementById(id);
      const error = document.getElementById(`${id.replace('-input', '')}-error`);
      if (input && error) {
        input.classList.add('is-invalid');
        error.textContent = msg;
        input.parentElement.classList.add('shake');
        setTimeout(() => input.parentElement.classList.remove('shake'), 400);
      }
      hasErrors = true;
    };

    if (isNaN(amount) || amount <= 0) setError('tx-amount-input', 'Amount must be greater than 0.');
    if (!note) setError('tx-description-input', 'Please provide a brief description.');
    if (!date) setError('tx-date-input', 'Please pick a transaction date.');

    if (hasErrors) return;

    // Spinner state
    const submitBtn = document.getElementById('tx-modal-submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner"></span> <span>Saving...</span>`;

    setTimeout(() => {
      const account = state.accounts.find(a => a.id === accountId);

      if (activeTxEditId) {
        // Rollback old transaction balance adjustments first
        const oldTx = state.transactions.find(t => t.id === activeTxEditId);
        const oldAccount = state.accounts.find(a => a.id === oldTx.accountId);
        if (oldAccount) {
          if (oldTx.type === 'income') {
            oldAccount.balance -= oldTx.amount;
          } else {
            oldAccount.balance += oldTx.amount;
          }
        }

        // Apply new values
        oldTx.type = type;
        oldTx.amount = amount;
        oldTx.note = note;
        oldTx.category = category;
        oldTx.accountId = accountId;
        oldTx.date = date;
        oldTx.recurring = recurring;

        // Reapply new account balances
        if (account) {
          if (type === 'income') {
            account.balance += amount;
          } else {
            account.balance -= amount;
          }
        }

        showToast("Transaction updated successfully!", "success");
      } else {
        // Create new transaction
        const newTx = {
          id: `tx-${Date.now()}`,
          userId: state.currentUser.username,
          type,
          amount,
          category,
          accountId,
          date,
          note,
          recurring
        };

        state.transactions.push(newTx);

        // Adjust balance
        if (account) {
          if (type === 'income') {
            account.balance += amount;
          } else {
            account.balance -= amount;
          }
        }

        showToast("Transaction logged successfully!", "success");
      }

      saveState();
      closeTx();

      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;

      // Refresh view dynamically
      handleRouting();
    }, 800);
  });
}


// ==========================================================================
// === TRANSACTIONS MANAGER (/transactions) ===
// ==========================================================================

let txSortField = 'date';
let txSortOrder = 'desc'; // 'asc' | 'desc'
let txCurrentPage = 1;
const txRowsPerPage = 10;

function initTransactionsPage() {
  txCurrentPage = 1;
  renderTransactionsTable();

  // Filter triggers
  document.getElementById('tx-filter-search').oninput = () => { txCurrentPage = 1; renderTransactionsTable(); };
  document.getElementById('tx-filter-category').onchange = () => { txCurrentPage = 1; renderTransactionsTable(); };
  document.getElementById('tx-filter-type').onchange = () => { txCurrentPage = 1; renderTransactionsTable(); };
  document.getElementById('tx-filter-daterange').onchange = () => { txCurrentPage = 1; renderTransactionsTable(); };

  // Clear filters
  document.getElementById('tx-filter-reset').onclick = () => {
    document.getElementById('tx-filter-search').value = '';
    document.getElementById('tx-filter-category').value = 'All';
    document.getElementById('tx-filter-type').value = 'All';
    document.getElementById('tx-filter-daterange').value = 'All';
    txCurrentPage = 1;
    renderTransactionsTable();
  };

  // Add transaction
  document.getElementById('transactions-add-btn').onclick = () => openTransactionModal();

  // Export CSV
  document.getElementById('transactions-export-btn').onclick = triggerCSVExport;

  // Sorting columns
  const registerSort = (thId, field) => {
    const el = document.getElementById(thId);
    if (el) {
      el.onclick = () => {
        if (txSortField === field) {
          txSortOrder = txSortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          txSortField = field;
          txSortOrder = 'desc';
        }

        // Update th UI carets
        document.querySelectorAll('.data-table th span').forEach(s => s.textContent = '');
        el.querySelector('span').textContent = txSortOrder === 'asc' ? '▲' : '▼';

        renderTransactionsTable();
      };
    }
  };

  registerSort('th-sort-date', 'date');
  registerSort('th-sort-desc', 'description');
  registerSort('th-sort-cat', 'category');
  registerSort('th-sort-acc', 'account');
  registerSort('th-sort-amt', 'amount');
}

function getFilteredTransactions() {
  const user = state.currentUser;
  let txs = state.transactions.filter(t => t.userId === user.username);

  // Filters inputs
  const search = document.getElementById('tx-filter-search').value.trim().toLowerCase();
  const category = document.getElementById('tx-filter-category').value;
  const type = document.getElementById('tx-filter-type').value;
  const daterange = document.getElementById('tx-filter-daterange').value;

  if (search) {
    txs = txs.filter(t => (t.note || '').toLowerCase().includes(search));
  }

  if (category !== 'All') {
    txs = txs.filter(t => t.category === category);
  }

  if (type !== 'All') {
    txs = txs.filter(t => t.type === type);
  }

  if (daterange !== 'All') {
    const now = new Date();
    txs = txs.filter(t => {
      const txDate = new Date(t.date);
      if (daterange === 'ThisMonth') {
        return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
      } else if (daterange === 'LastMonth') {
        const lastM = new Date();
        lastM.setMonth(now.getMonth() - 1);
        return txDate.getFullYear() === lastM.getFullYear() && txDate.getMonth() === lastM.getMonth();
      } else if (daterange === 'Last90Days') {
        const boundary = new Date();
        boundary.setDate(now.getDate() - 90);
        return txDate >= boundary;
      }
      return true;
    });
  }

  // Apply Sorting
  txs.sort((a, b) => {
    let aVal = '', bVal = '';

    switch (txSortField) {
      case 'date':
        aVal = a.date; bVal = b.date;
        break;
      case 'description':
        aVal = a.note || ''; bVal = b.note || '';
        break;
      case 'category':
        aVal = a.category; bVal = b.category;
        break;
      case 'account':
        const accA = state.accounts.find(x => x.id === a.accountId);
        const accB = state.accounts.find(x => x.id === b.accountId);
        aVal = accA ? accA.name : ''; bVal = accB ? accB.name : '';
        break;
      case 'amount':
        aVal = a.amount; bVal = b.amount;
        break;
    }

    if (typeof aVal === 'string') {
      return txSortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    } else {
      return txSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
  });

  return txs;
}

function renderTransactionsTable() {
  const container = document.getElementById('transactions-table-rows');
  const infoLabel = document.getElementById('transactions-pagination-info');
  const pagBtns = document.getElementById('transactions-pagination-btns');

  container.innerHTML = '';

  const filtered = getFilteredTransactions();

  if (filtered.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-state-icon">📂</div>
            <div class="empty-state-title">No Transactions Recorded</div>
            <div class="empty-state-desc">Try adjusting filters or log a new transaction entry.</div>
          </div>
        </td>
      </tr>
    `;
    infoLabel.textContent = "Showing 0 transactions";
    pagBtns.innerHTML = '';
    return;
  }

  // Calculate pagination window limits
  const total = filtered.length;
  const totalPages = Math.ceil(total / txRowsPerPage);

  if (txCurrentPage > totalPages) txCurrentPage = totalPages;
  if (txCurrentPage < 1) txCurrentPage = 1;

  const startIdx = (txCurrentPage - 1) * txRowsPerPage;
  const endIdx = Math.min(startIdx + txRowsPerPage, total);

  const pageItems = filtered.slice(startIdx, endIdx);

  pageItems.forEach(tx => {
    const tr = document.createElement('tr');
    tr.className = 'animate-fade';

    const account = state.accounts.find(a => a.id === tx.accountId);
    const accName = account ? account.name : 'Unknown Account';

    tr.innerHTML = `
      <td>${tx.date}</td>
      <td>
        <div style="font-weight:600;">${tx.note || 'Transaction'}</div>
        ${tx.recurring ? '<span style="font-size:0.75rem; color:var(--primary); font-weight:500;">🔁 Recurring Monthly</span>' : ''}
      </td>
      <td><span class="tx-category-badge">${tx.category}</span></td>
      <td>${accName}</td>
      <td style="text-align: right; font-weight:700;" class="tx-amount ${tx.type}">
        ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
      </td>
      <td>
        <div class="actions-cell">
          <button type="button" class="action-btn edit-btn" title="Edit row" data-id="${tx.id}">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button type="button" class="action-btn delete-btn" title="Delete row" data-id="${tx.id}">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </td>
    `;

    // Row Operations Bindings
    tr.querySelector('.edit-btn').onclick = () => openTransactionModal(tx.id);
    tr.querySelector('.delete-btn').onclick = () => {
      showConfirmModal("Confirm Deletion", `Are you sure you wish to delete transaction "${tx.note || 'this transaction'}"? This will modify account balances.`, () => {
        // Rollback balance adjustment
        const acc = state.accounts.find(a => a.id === tx.accountId);
        if (acc) {
          if (tx.type === 'income') {
            acc.balance -= tx.amount;
          } else {
            acc.balance += tx.amount;
          }
        }

        // Remove item from state
        state.transactions = state.transactions.filter(t => t.id !== tx.id);
        saveState();
        showToast("Transaction deleted successfully.", "success");
        renderTransactionsTable();
      });
    };

    container.appendChild(tr);
  });

  // Update numbers indicators
  infoLabel.textContent = `Showing ${startIdx + 1}-${endIdx} of ${total} transactions`;

  // Draw pagination buttons
  pagBtns.innerHTML = '';

  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination-btn';
  prevBtn.disabled = txCurrentPage === 1;
  prevBtn.textContent = '◀';
  prevBtn.onclick = () => { if (txCurrentPage > 1) { txCurrentPage--; renderTransactionsTable(); } };
  pagBtns.appendChild(prevBtn);

  // Index buttons
  for (let i = 1; i <= totalPages; i++) {
    const pBtn = document.createElement('button');
    pBtn.className = `pagination-btn ${i === txCurrentPage ? 'active' : ''}`;
    pBtn.textContent = i;
    pBtn.onclick = () => { txCurrentPage = i; renderTransactionsTable(); };
    pagBtns.appendChild(pBtn);
  }

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination-btn';
  nextBtn.disabled = txCurrentPage === totalPages;
  nextBtn.textContent = '▶';
  nextBtn.onclick = () => { if (txCurrentPage < totalPages) { txCurrentPage++; renderTransactionsTable(); } };
  pagBtns.appendChild(nextBtn);
}

function triggerCSVExport() {
  const list = getFilteredTransactions();
  if (list.length === 0) {
    showToast("No data matches current filters to export.", "warning");
    return;
  }

  // Headers columns
  let csv = "Date,Description,Category,Account,Type,Amount\n";

  list.forEach(tx => {
    const acc = state.accounts.find(a => a.id === tx.accountId);
    const accName = acc ? acc.name : '';
    const noteClean = (tx.note || '').replace(/"/g, '""');
    csv += `"${tx.date}","${noteClean}","${tx.category}","${accName}","${tx.type}",${tx.amount}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `FinTrack_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("CSV file downloaded successfully!", "success");
}


// ==========================================================================
// === BUDGET PAGE CONTROLLER (/budget) ===
// ==========================================================================

function initBudgetPage() {
  const user = state.currentUser;
  const userBudget = state.budgets.find(b => b.userId === user.username);

  if (!userBudget) return;

  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7);

  // Set month titles
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  document.getElementById('budget-heading-month').textContent = `Planner limits for ${monthName}`;

  const txs = state.transactions.filter(t => t.userId === user.username && t.date.startsWith(currentMonthStr) && t.type === 'expense');
  const spentSum = txs.reduce((sum, t) => sum + t.amount, 0);

  document.getElementById('budget-summary-total').textContent = formatCurrency(userBudget.totalLimit);

  const pct = userBudget.totalLimit > 0 ? Math.round((spentSum / userBudget.totalLimit) * 100) : 0;
  document.getElementById('budget-desc-text').textContent = `Total spent this month: ${formatCurrency(spentSum)} representing ${pct}% of overall monthly budget limit.`;

  // Draw category budget card items
  renderBudgetCategoriesCards(userBudget, txs);

  // Draw mini history comparisons
  renderBudgetHistoryChart(user.username);
}

function renderBudgetCategoriesCards(userBudget, currentMonthExpenses) {
  const container = document.getElementById('budget-categories-cards-container');
  container.innerHTML = '';

  const allocations = userBudget.allocations || {};
  const rollovers = userBudget.rollovers || {};

  for (const cat in allocations) {
    const limit = allocations[cat];
    const spent = currentMonthExpenses.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0);
    const rem = limit - spent;
    const isRollover = !!rollovers[cat];

    const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

    let barColor = 'success';
    if (pct >= 90) barColor = 'danger';
    else if (pct >= 75) barColor = 'warning';

    const card = document.createElement('div');
    card.className = 'card budget-card animate-fade';
    card.innerHTML = `
      <div class="budget-card-top">
        <div class="budget-category-title">
          <span style="font-size:1.5rem;">${getCategoryEmoji(cat)}</span>
          <span>${cat}</span>
        </div>
        
        <!-- Editable inline limit inputs -->
        <div>
          <span style="font-size:0.75rem; color:var(--text-secondary);">Limit:</span>
          <input type="number" class="budget-input-inline" id="budget-edit-input-${cat}" value="${limit}" min="0">
        </div>
      </div>

      <div class="budget-progress-bar-outer" style="margin-bottom: 1rem;">
        <div class="budget-progress-bar-inner ${barColor}" style="width: ${pct}%"></div>
      </div>

      <div class="budget-card-stats">
        <div>
          <div>Spent</div>
          <div class="budget-stat-val" style="color:var(--danger);">${formatCurrency(spent)}</div>
        </div>
        <div style="text-align: right;">
          <div>Remaining</div>
          <div class="budget-stat-val" style="color:${rem >= 0 ? 'var(--success)' : 'var(--danger)'};">
            ${formatCurrency(rem)}
          </div>
        </div>
      </div>

      <div class="budget-rollover-wrapper">
        <span>Rollover surplus next month</span>
        <label class="switch">
          <input type="checkbox" id="budget-rollover-toggle-${cat}" ${isRollover ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>
    `;

    // Hook inline edit save actions on focusout or enter press
    const input = card.querySelector(`#budget-edit-input-${cat}`);
    const saveBudgetLimit = () => {
      const newLimit = parseFloat(input.value) || 0;

      // Update budgets limits
      userBudget.allocations[cat] = newLimit;

      // Compute total sum
      let sum = 0;
      for (const k in userBudget.allocations) {
        sum += userBudget.allocations[k];
      }
      userBudget.totalLimit = sum;

      saveState();
      initBudgetPage(); // Redraw UI
      showToast(`${cat} budget limit saved.`, "success");
    };

    input.addEventListener('focusout', saveBudgetLimit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      }
    });

    // Hook rollover switch
    card.querySelector(`#budget-rollover-toggle-${cat}`).addEventListener('change', (e) => {
      userBudget.rollovers[cat] = e.target.checked;
      saveState();
      showToast(`${cat} rollover status updated.`, "info");
    });

    container.appendChild(card);
  }
}

function renderBudgetHistoryChart(username) {
  const ctx = document.getElementById('budget-history-chart').getContext('2d');

  const monthsData = [];
  const budgetLimits = [];
  const actualSpends = [];

  const userBudget = state.budgets.find(b => b.userId === username);
  const userTxs = state.transactions.filter(t => t.userId === username && t.type === 'expense');

  for (let i = 2; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toISOString().slice(0, 7);
    monthsData.push(d.toLocaleString('default', { month: 'long' }));

    const spentVal = userTxs.filter(t => t.date.startsWith(monthKey)).reduce((sum, t) => sum + t.amount, 0);
    actualSpends.push(spentVal);

    budgetLimits.push(userBudget ? userBudget.totalLimit : 0);
  }

  window.activeCharts.budgetHistory = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: monthsData,
      datasets: [
        {
          label: 'Planned Limit',
          data: budgetLimits,
          backgroundColor: 'rgba(108, 99, 255, 0.4)',
          borderColor: '#6C63FF',
          borderWidth: 1
        },
        {
          label: 'Actual Spent',
          data: actualSpends,
          backgroundColor: 'rgba(255, 92, 92, 0.8)',
          borderColor: '#FF5C5C',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } },
        y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } }
      },
      plugins: {
        legend: {
          labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') }
        }
      }
    }
  });
}


// ==========================================================================
// === GOALS PAGE CONTROLLER (/goals) ===
// ==========================================================================

function initGoalsPage() {
  renderGoalsGrid();

  // Create Goal trigger
  document.getElementById('goals-add-btn').onclick = () => openGoalEditorModal();
}

function renderGoalsGrid() {
  const user = state.currentUser;
  const activeContainer = document.getElementById('goals-active-container');
  const achievedContainer = document.getElementById('goals-achieved-container');
  const achievedSection = document.getElementById('goals-achieved-section');

  activeContainer.innerHTML = '';
  achievedContainer.innerHTML = '';

  const goals = state.goals.filter(g => g.userId === user.username);

  let activeCount = 0;
  let achievedCount = 0;

  goals.forEach(goal => {
    const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentSaved / goal.targetAmount) * 100)) : 0;

    // Countdown days remaining
    const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysLeft < 0;
    const deadlineText = isOverdue ? 'Overdue' : `${daysLeft} days left`;

    const card = document.createElement('div');
    card.className = 'card goal-card animate-fade';

    const isCompleted = pct >= 100;

    card.innerHTML = `
      <div>
        <div class="goal-header">
          <div class="goal-title-box">
            <div class="goal-icon-box">${goal.icon || '🎯'}</div>
            <div>
              <div class="goal-name">${goal.name}</div>
              <div class="goal-deadline" style="color: ${isOverdue && !isCompleted ? 'var(--danger)' : 'var(--text-secondary)'};">
                ${isCompleted ? 'Achieved Milestone' : `${deadlineText} (${goal.deadline})`}
              </div>
            </div>
          </div>
          ${isCompleted ? '<span class="completed-badge">✓ Complete</span>' : ''}
        </div>

        <div class="goal-progress-numbers">
          <span class="goal-saved">${formatCurrency(goal.currentSaved)}</span>
          <span class="goal-target">of ${formatCurrency(goal.targetAmount)} (${pct}%)</span>
        </div>

        <div class="budget-progress-bar-outer">
          <div class="budget-progress-bar-inner ${isCompleted ? 'success' : ''}" style="width: ${pct}%"></div>
        </div>
      </div>

      <div class="goal-actions-row">
        ${!isCompleted ? `<button type="button" class="btn btn-primary deposit-btn" data-id="${goal.id}">Add Funds</button>` : ''}
        <button type="button" class="btn btn-secondary edit-goal-btn" data-id="${goal.id}">Edit</button>
        <button type="button" class="btn btn-ghost delete-goal-btn" style="color:var(--danger);" data-id="${goal.id}">Delete</button>
      </div>
    `;

    // Event hooks
    if (!isCompleted) {
      card.querySelector('.deposit-btn').onclick = () => openGoalDepositModal(goal.id);
    }

    card.querySelector('.edit-goal-btn').onclick = () => openGoalEditorModal(goal.id);

    card.querySelector('.delete-goal-btn').onclick = () => {
      showConfirmModal("Delete Goal", `Are you sure you wish to delete saving goal "${goal.name}"? Savings totals will not be returned to balances.`, () => {
        state.goals = state.goals.filter(g => g.id !== goal.id);
        saveState();
        showToast("Goal deleted.", "success");
        renderGoalsGrid();
      });
    };

    if (isCompleted) {
      achievedContainer.appendChild(card);
      achievedCount++;
    } else {
      activeContainer.appendChild(card);
      activeCount++;
    }
  });

  // Display achieved wrapper block conditionally
  if (achievedCount > 0) {
    achievedSection.style.display = 'block';
  } else {
    achievedSection.style.display = 'none';
  }

  // Active empty state
  if (activeCount === 0) {
    activeContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">🎯</div>
        <div class="empty-state-title">No Active Targets</div>
        <div class="empty-state-desc">Establish long term saving targets and fund them through account allocations.</div>
      </div>
    `;
  }
}

// Deposit Goal funds triggers
function openGoalDepositModal(goalId) {
  const modal = document.getElementById('goal-funds-modal');
  const form = document.getElementById('goal-funds-form');

  form.reset();
  document.getElementById('goal-funds-id-input').value = goalId;
  document.getElementById('goal-funds-amount-error').textContent = '';
  document.getElementById('goal-funds-amount-input').classList.remove('is-invalid');

  // Load accounts
  const accSel = document.getElementById('goal-funds-account-input');
  accSel.innerHTML = '';
  state.accounts.filter(a => a.userId === state.currentUser.username).forEach(acc => {
    accSel.innerHTML += `<option value="${acc.id}">${acc.name} (${formatCurrency(acc.balance)})</option>`;
  });

  if (state.accounts.length === 0) {
    showToast("Please create a wallet account first.", "error");
    return;
  }

  modal.classList.add('active');
}

function initGoalModals() {
  // Goal funds contribution modal
  const fundsModal = document.getElementById('goal-funds-modal');
  const fundsForm = document.getElementById('goal-funds-form');

  const closeFunds = () => fundsModal.classList.remove('active');
  document.getElementById('goal-funds-close').onclick = closeFunds;
  document.getElementById('goal-funds-cancel-btn').onclick = closeFunds;

  fundsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const goalId = document.getElementById('goal-funds-id-input').value;
    const amountInput = document.getElementById('goal-funds-amount-input');
    const err = document.getElementById('goal-funds-amount-error');
    const accId = document.getElementById('goal-funds-account-input').value;

    const amount = parseFloat(amountInput.value);

    if (isNaN(amount) || amount <= 0) {
      amountInput.classList.add('is-invalid');
      err.textContent = "Deposit must be greater than 0.";
      amountInput.parentElement.classList.add('shake');
      setTimeout(() => amountInput.parentElement.classList.remove('shake'), 400);
      return;
    }

    const account = state.accounts.find(a => a.id === accId);
    if (account && account.balance < amount) {
      amountInput.classList.add('is-invalid');
      err.textContent = "Insufficient funds in chosen source account.";
      return;
    }

    // Process Transfer Mutate Balances
    const goal = state.goals.find(g => g.id === goalId);
    if (goal && account) {
      account.balance -= amount;
      goal.currentSaved += amount;

      // Log transactional expense record
      state.transactions.push({
        id: `tx-${Date.now()}`,
        userId: state.currentUser.username,
        type: 'expense',
        amount,
        category: 'Others',
        accountId: accId,
        date: new Date().toISOString().split('T')[0],
        note: `Goal Funding: ${goal.name}`,
        recurring: false
      });

      showToast(`Deposited ${formatCurrency(amount)} into "${goal.name}".`, "success");

      // Verify milestone completions
      if (goal.currentSaved >= goal.targetAmount && !goal.completed) {
        goal.completed = true;
        showToast(`Congratulations! You've achieved your "${goal.name}" target! 🏆`, "success");
        triggerConfettiEffect();
      }

      saveState();
      closeFunds();
      renderGoalsGrid();
    }
  });

  // Goal Editor Creators modals
  const editorModal = document.getElementById('goal-editor-modal');
  const editorForm = document.getElementById('goal-editor-form');
  const closeEditor = () => editorModal.classList.remove('active');

  document.getElementById('goal-editor-close').onclick = closeEditor;
  document.getElementById('goal-editor-cancel-btn').onclick = closeEditor;

  // Icons picks triggers
  const iconPicker = document.getElementById('goal-editor-icon-picker');
  iconPicker.querySelectorAll('.icon-picker-btn').forEach(btn => {
    btn.onclick = () => {
      iconPicker.querySelectorAll('.icon-picker-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  editorForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Clear errors
    document.querySelectorAll('#goal-editor-form .form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('#goal-editor-form .form-input').forEach(el => el.classList.remove('is-invalid'));

    const editId = document.getElementById('goal-editor-id-input').value;
    const name = document.getElementById('goal-editor-name-input').value.trim();
    const target = parseFloat(document.getElementById('goal-editor-amount-input').value);
    const date = document.getElementById('goal-editor-date-input').value;
    const icon = iconPicker.querySelector('.icon-picker-btn.active').getAttribute('data-icon') || '🎯';

    let hasErrors = false;
    const setError = (id, msg) => {
      const input = document.getElementById(id);
      const error = document.getElementById(`${id.replace('-input', '')}-error`);
      if (input && error) {
        input.classList.add('is-invalid');
        error.textContent = msg;
        input.parentElement.classList.add('shake');
        setTimeout(() => input.parentElement.classList.remove('shake'), 400);
      }
      hasErrors = true;
    };

    if (!name) setError('goal-editor-name-input', 'Name cannot be empty.');
    if (isNaN(target) || target <= 0) setError('goal-editor-amount-input', 'Target amount must be greater than 0.');
    if (!date) setError('goal-editor-date-input', 'Please set a target deadline date.');

    if (hasErrors) return;

    if (editId) {
      const goal = state.goals.find(g => g.id === editId);
      if (goal) {
        goal.name = name;
        goal.targetAmount = target;
        goal.deadline = date;
        goal.icon = icon;

        // Re-check completed status
        if (goal.currentSaved >= target && !goal.completed) {
          goal.completed = true;
          showToast(`Milestone completed!`, "success");
          triggerConfettiEffect();
        } else if (goal.currentSaved < target) {
          goal.completed = false;
        }

        showToast("Goal saved.", "success");
      }
    } else {
      state.goals.push({
        id: `goal-${Date.now()}`,
        userId: state.currentUser.username,
        name,
        targetAmount: target,
        currentSaved: 0,
        deadline: date,
        icon,
        completed: false
      });
      showToast("New Saving Goal created!", "success");
    }

    saveState();
    closeEditor();
    renderGoalsGrid();
  });
}

function openGoalEditorModal(editId = null) {
  const modal = document.getElementById('goal-editor-modal');
  const form = document.getElementById('goal-editor-form');
  const picker = document.getElementById('goal-editor-icon-picker');

  document.querySelectorAll('#goal-editor-form .form-error').forEach(el => el.textContent = '');
  document.querySelectorAll('#goal-editor-form .form-input').forEach(el => el.classList.remove('is-invalid'));

  if (editId) {
    document.getElementById('goal-editor-title').textContent = 'Edit Saving Goal';
    document.getElementById('goal-editor-id-input').value = editId;

    const goal = state.goals.find(g => g.id === editId);
    if (goal) {
      document.getElementById('goal-editor-name-input').value = goal.name;
      document.getElementById('goal-editor-amount-input').value = goal.targetAmount;
      document.getElementById('goal-editor-date-input').value = goal.deadline;

      // select icon
      picker.querySelectorAll('.icon-picker-btn').forEach(btn => {
        if (btn.getAttribute('data-icon') === goal.icon) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  } else {
    document.getElementById('goal-editor-title').textContent = 'Create Saving Target';
    form.reset();
    document.getElementById('goal-editor-id-input').value = '';

    picker.querySelectorAll('.icon-picker-btn').forEach(btn => btn.classList.remove('active'));
    picker.querySelector('[data-icon="🎯"]').classList.add('active');
  }

  modal.classList.add('active');
}


// Confetti Canvas Animation Script
function triggerConfettiEffect() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#6C63FF', '#00C49A', '#FF5C5C', '#FFAB40', '#4CAF82'];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    });
  }

  let animationFrameId;
  const start = Date.now();

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p, idx) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(p.tiltAngle);
      p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();

      // Recycle particles falling off bottom
      if (p.y > canvas.height) {
        particles[idx] = {
          ...p,
          x: Math.random() * canvas.width,
          y: -20,
          tilt: Math.random() * 10 - 5
        };
      }
    });

    // Run for 3.5 seconds
    if (Date.now() - start < 3500) {
      animationFrameId = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrameId);
    }
  }

  draw();
}


// ==========================================================================
// === REPORTS PAGE CONTROLLER (/reports) ===
// ==========================================================================

let reportsRangePreset = 'ThisMonth';

function initReportsPage() {
  reportsRangePreset = 'ThisMonth';
  updateReportsUI();

  // Hook presets links
  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const preset = btn.getAttribute('data-preset');
      reportsRangePreset = preset;

      const customPicker = document.getElementById('reports-custom-dates');
      if (preset === 'Custom') {
        customPicker.style.display = 'flex';
      } else {
        customPicker.style.display = 'none';
        updateReportsUI();
      }
    };
  });

  // Apply custom dates
  document.getElementById('reports-apply-custom').onclick = () => {
    updateReportsUI();
  };
}

function getReportsDateRange() {
  const now = new Date();
  let start = new Date(), end = new Date();

  switch (reportsRangePreset) {
    case 'ThisMonth':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'LastMonth':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'Last3Months':
      start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case 'ThisYear':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'Custom':
      const s = document.getElementById('reports-start-date').value;
      const e = document.getElementById('reports-end-date').value;
      if (s) start = new Date(s);
      if (e) end = new Date(e);
      break;
  }

  // Format to standard comparison string
  return {
    startStr: start.toISOString().split('T')[0],
    endStr: end.toISOString().split('T')[0]
  };
}

function updateReportsUI() {
  const user = state.currentUser;
  const userTxs = state.transactions.filter(t => t.userId === user.username);

  const { startStr, endStr } = getReportsDateRange();

  // Filter inside range
  const filtered = userTxs.filter(t => t.date >= startStr && t.date <= endStr);

  const incSum = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expSum = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const net = incSum - expSum;
  const savingsRate = incSum > 0 ? (net / incSum) * 100 : 0;

  // Write stats widgets
  document.getElementById('reports-stat-income').textContent = formatCurrency(incSum);
  document.getElementById('reports-stat-expense').textContent = formatCurrency(expSum);

  const netEl = document.getElementById('reports-stat-netsavings');
  netEl.textContent = formatCurrency(net);
  netEl.style.color = net >= 0 ? 'var(--success)' : 'var(--danger)';

  document.getElementById('reports-stat-savingsrate').textContent = `${Math.max(0, Math.floor(savingsRate))}%`;

  // Determine Biggest Expense outflow category
  const expenses = filtered.filter(t => t.type === 'expense');
  let maxCat = 'None', maxAmt = 0;

  DEFAULT_CATEGORIES.forEach(cat => {
    const sum = expenses.filter(t => t.category === cat).reduce((total, t) => total + t.amount, 0);
    if (sum > maxAmt) {
      maxAmt = sum;
      maxCat = cat;
    }
  });

  const percentOfAll = expSum > 0 ? Math.round((maxAmt / expSum) * 100) : 0;

  document.getElementById('reports-biggest-expense-title').textContent = `${getCategoryEmoji(maxCat)} ${maxCat}`;
  document.getElementById('reports-biggest-expense-desc').textContent = `You spent ${formatCurrency(maxAmt)} in this period representing ${percentOfAll}% of all recorded expenses.`;

  // Render Charts
  renderReportsCharts(filtered, expenses);

  // Generate Insight Tips Diagnostic Texts
  generateReportsInsights(incSum, expSum, maxCat, maxAmt, percentOfAll);
}

function renderReportsCharts(rangeTxs, rangeExpenses) {
  // Safe destroy helper
  const destroyChart = (key) => {
    if (window.activeCharts[key]) {
      window.activeCharts[key].destroy();
      delete window.activeCharts[key];
    }
  };

  destroyChart('repFlow');
  destroyChart('repCat');
  destroyChart('repTrend');

  // Chart 1: Bar Chart Flow (Comparison income vs expense monthly)
  const flowCtx = document.getElementById('reports-flow-chart').getContext('2d');

  const inc = rangeTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const exp = rangeTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  window.activeCharts.repFlow = new Chart(flowCtx, {
    type: 'bar',
    data: {
      labels: ['Inflow / Outflow'],
      datasets: [
        { label: 'Income', data: [inc], backgroundColor: '#4CAF82' },
        { label: 'Expenses', data: [exp], backgroundColor: '#FF5C5C' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } }
      },
      plugins: {
        legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } }
      }
    }
  });

  // Chart 2: Category Pie chart
  const pieCtx = document.getElementById('reports-category-chart').getContext('2d');
  const pieData = [];
  const pieLabels = [];

  DEFAULT_CATEGORIES.forEach(cat => {
    const sum = rangeExpenses.filter(t => t.category === cat).reduce((total, t) => total + t.amount, 0);
    if (sum > 0) {
      pieData.push(sum);
      pieLabels.push(cat);
    }
  });

  if (pieData.length === 0) {
    pieData.push(1);
    pieLabels.push('No Expenses');
  }

  const colors = ['#6C63FF', '#00C49A', '#FF5C5C', '#FFAB40', '#4CAF82', '#9C27B0', '#00BCD4'];

  window.activeCharts.repCat = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: pieLabels,
      datasets: [{
        data: pieData,
        backgroundColor: colors.slice(0, pieLabels.length)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') }
        }
      }
    }
  });

  // Chart 3: Daily Line Chart (Trend)
  const lineCtx = document.getElementById('reports-trend-chart').getContext('2d');

  // Sort dates asc
  const daysMap = {};
  rangeExpenses.forEach(tx => {
    daysMap[tx.date] = (daysMap[tx.date] || 0) + tx.amount;
  });

  const sortedDays = Object.keys(daysMap).sort();
  const sortedValues = sortedDays.map(d => daysMap[d]);

  window.activeCharts.repTrend = new Chart(lineCtx, {
    type: 'line',
    data: {
      labels: sortedDays.map(d => d.slice(5)), // MM-DD format shortener
      datasets: [{
        label: 'Expenses Volume',
        data: sortedValues,
        borderColor: '#6C63FF',
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        tension: 0.1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } },
        y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } }
      },
      plugins: {
        legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } }
      }
    }
  });
}

function generateReportsInsights(income, expense, maxCat, maxAmt, pct) {
  const container = document.getElementById('reports-insights-container');
  container.innerHTML = '';

  const insights = [];

  // Insight 1: Net cashflow health check
  if (income === 0 && expense > 0) {
    insights.push({
      text: "You have recorded cash outflows without any incoming paycheck salary this period.",
      type: "warning",
      icon: "⚠️"
    });
  } else if (expense > income) {
    insights.push({
      text: `Your spending exceeds incoming cash flows by ${formatCurrency(expense - income)}. Consider reviewing luxury category lines.`,
      type: "warning",
      icon: "🚨"
    });
  } else {
    const rate = Math.round(((income - expense) / income) * 100);
    insights.push({
      text: `Excellent job! You saved ${rate}% of your earnings representing ${formatCurrency(income - expense)} surplus.`,
      type: "success",
      icon: "✅"
    });
  }

  // Insight 2: Biggest Outflow analysis
  if (maxAmt > 0) {
    if (pct > 40) {
      insights.push({
        text: `Your ${maxCat} bills represent ${pct}% of all outflows. Diversifying spending or budgeting tighter on this category might help.`,
        type: "warning",
        icon: "💡"
      });
    } else {
      insights.push({
        text: `Outflows appear well-balanced. Your biggest spending category is ${maxCat} at ${pct}% of total expense.`,
        type: "success",
        icon: "ℹ️"
      });
    }
  }

  // Insight 3: Tip note
  insights.push({
    text: "Tip: Allocate unspent category cash directly into one of your Target Goals to hit savings milestones faster.",
    type: "info",
    icon: "🎯"
  });

  // Render items
  insights.forEach(ins => {
    const item = document.createElement('div');
    item.className = `insight-item ${ins.type || 'info'} animate-fade`;
    item.innerHTML = `
      <span class="insight-icon">${ins.icon}</span>
      <div>${ins.text}</div>
    `;
    container.appendChild(item);
  });
}


// ==========================================================================
// === SETTINGS PANEL (/settings) ===
// ==========================================================================

let activeSettingsTab = 'settings-pane-profile';

function initSettingsPage() {
  const user = state.currentUser;

  // Set default form values
  document.getElementById('settings-profile-avatar-preview').src = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop';
  document.getElementById('settings-profile-name').value = user.fullname;
  document.getElementById('settings-profile-email').value = user.email;
  document.getElementById('settings-profile-currency').value = user.currency;

  // Toggle Tab switching
  document.querySelectorAll('[data-pane]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-pane]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const paneId = btn.getAttribute('data-pane');
      activeSettingsTab = paneId;

      document.querySelectorAll('.settings-pane').forEach(p => {
        p.classList.remove('active');
        if (p.id === paneId) p.classList.add('active');
      });
    };
  });

  // Image Avatar upload triggers
  const avatarInput = document.getElementById('settings-avatar-input');
  avatarInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('settings-profile-avatar-preview').src = event.target.result;
        user.avatar = event.target.result;
        saveState();
        showToast("Profile avatar uploaded successfully.", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Profile Form
  document.getElementById('settings-profile-form').onsubmit = (e) => {
    e.preventDefault();
    user.fullname = document.getElementById('settings-profile-name').value.trim();
    user.email = document.getElementById('settings-profile-email').value.trim();

    const oldCurrency = user.currency;
    user.currency = document.getElementById('settings-profile-currency').value;

    if (oldCurrency !== user.currency) {
      triggeredBudgetAlerts.clear(); // reset alerts warning limits since format change
    }

    saveState();
    showToast("Profile details updated successfully!", "success");
  };

  // Security password change with strength indicators
  const newPassInput = document.getElementById('settings-pass-new');
  const strengthMeter = document.getElementById('password-strength-fill');
  const strengthLabel = document.getElementById('password-strength-label');

  newPassInput.oninput = () => {
    const val = newPassInput.value;

    // clear classes
    strengthMeter.className = 'strength-meter-fill';

    if (!val) {
      strengthLabel.textContent = 'Password strength';
      return;
    }

    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    if (score <= 1) {
      strengthMeter.classList.add('weak');
      strengthLabel.textContent = 'Weak Password';
    } else if (score === 2 || score === 3) {
      strengthMeter.classList.add('medium');
      strengthLabel.textContent = 'Medium Strength';
    } else if (score >= 4) {
      strengthMeter.classList.add('strong');
      strengthLabel.textContent = 'Strong Password';
    }
  };

  // Change password form
  const secForm = document.getElementById('settings-security-form');
  secForm.onsubmit = (e) => {
    e.preventDefault();

    document.querySelectorAll('#settings-security-form .form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('#settings-security-form .form-input').forEach(el => el.classList.remove('is-invalid'));

    const oldP = document.getElementById('settings-pass-old').value;
    const newP = document.getElementById('settings-pass-new').value;
    const confP = document.getElementById('settings-pass-confirm').value;

    let hasErrors = false;
    const setError = (id, msg) => {
      const input = document.getElementById(id);
      const error = document.getElementById(`${id}-error`);
      if (input && error) {
        input.classList.add('is-invalid');
        error.textContent = msg;
        input.parentElement.classList.add('shake');
        setTimeout(() => input.parentElement.classList.remove('shake'), 400);
      }
      hasErrors = true;
    };

    if (oldP !== user.password) {
      setError('settings-pass-old', 'Current password is incorrect.');
    }
    if (newP.length < 8) {
      setError('settings-pass-new', 'Password must be at least 8 characters long.');
    }
    if (newP !== confP) {
      setError('settings-pass-confirm', 'Passwords do not match.');
    }

    if (hasErrors) return;

    user.password = newP;
    saveState();
    secForm.reset();
    strengthMeter.className = 'strength-meter-fill';
    strengthLabel.textContent = 'Password strength';

    showToast("Password updated successfully!", "success");
  };

  // Toggles triggers
  document.getElementById('settings-notify-budget').onchange = (e) => {
    state.settings.notifications.budgetAlerts = e.target.checked;
    saveState();
  };
  document.getElementById('settings-notify-goals').onchange = (e) => {
    state.settings.notifications.goalReminders = e.target.checked;
    saveState();
  };
  document.getElementById('settings-notify-weekly').onchange = (e) => {
    state.settings.notifications.weeklySummary = e.target.checked;
    saveState();
  };

  // Theme selector toggle inside settings tab
  const settingsThemeBtn = document.getElementById('settings-theme-toggle');
  settingsThemeBtn.onclick = () => {
    toggleTheme();
    document.getElementById('settings-theme-toggle-icon').textContent = state.settings.theme === 'dark' ? '☀️' : '🌙';
  };
  document.getElementById('settings-theme-toggle-icon').textContent = state.settings.theme === 'dark' ? '☀️' : '🌙';

  // Presets picker colors triggers
  const accentPicker = document.getElementById('appearance-accent-picker');
  accentPicker.querySelectorAll('.accent-circle').forEach(circle => {
    circle.onclick = () => {
      accentPicker.querySelectorAll('.accent-circle').forEach(c => c.classList.remove('active'));
      circle.classList.add('active');

      const num = circle.getAttribute('data-accent');
      state.settings.accentColor = num;
      saveState();
      applyThemeAndAccent();
      showToast("Color preset applied.", "success");
    };

    // select active circle
    if (circle.getAttribute('data-accent') === state.settings.accentColor) {
      accentPicker.querySelectorAll('.accent-circle').forEach(c => c.classList.remove('active'));
      circle.classList.add('active');
    }
  });

  // DB Backup Operations
  // Export JSON
  document.getElementById('settings-data-export').onclick = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `FinTrack_Database_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
    showToast("JSON database backup downloaded.", "success");
  };

  // Import JSON
  const importInput = document.getElementById('settings-data-import-input');
  importInput.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.users && parsed.accounts && parsed.transactions) {
            state.users = parsed.users;
            state.accounts = parsed.accounts;
            state.transactions = parsed.transactions;
            state.budgets = parsed.budgets || [];
            state.goals = parsed.goals || [];
            state.settings = parsed.settings || state.settings;

            saveState();
            showToast("Database restored successfully!", "success");

            // Reload page view
            handleRouting();
          } else {
            showToast("Invalid JSON schema file formatting.", "error");
          }
        } catch (err) {
          showToast("Failed to parse JSON backup copy.", "error");
        }
      };
      reader.readAsText(file);
    }
  };

  // Reset database completely
  document.getElementById('settings-data-reset').onclick = () => {
    showConfirmModal("Format Database Reset", "Are you absolutely sure you wish to reset all transaction records and user accounts? This wipes the local cache and restarts onboarding.", () => {
      localStorage.clear();
      sessionStorage.clear();
      state.users = [];
      state.accounts = [];
      state.transactions = [];
      state.budgets = [];
      state.goals = [];
      state.settings = {
        theme: 'light',
        accentColor: '1',
        notifications: { budgetAlerts: true, goalReminders: true, weeklySummary: true }
      };

      triggeredBudgetAlerts.clear();
      prepopulateDummyData();
      state.currentUser = null;
      showToast("Database reset. Back to landing page.", "warning");
      window.location.hash = '#/index';
    });
  };
}


// ==========================================================================
// === ABOUT PAGE FAQ ACCORDION (/about) ===
// ==========================================================================

function initAboutPage() {
  // Accordion triggers
  const accordion = document.getElementById('faq-accordion-box');
  accordion.querySelectorAll('.faq-question-btn').forEach(btn => {
    btn.onclick = () => {
      const item = btn.parentElement;
      const isActive = item.classList.contains('active');

      // close others
      accordion.querySelectorAll('.faq-item').forEach(x => x.classList.remove('active'));

      if (!isActive) {
        item.classList.add('active');
      }
    };
  });

  // Contact form validation triggers
  const form = document.getElementById('about-contact-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    showToast("Feedback submitted successfully!", "success");
    form.reset();
  };
}


// ==========================================================================
// === THEME ENGINE & VISUAL UTILS ===
// ==========================================================================

function toggleTheme() {
  const isDark = state.settings.theme === 'dark';
  state.settings.theme = isDark ? 'light' : 'dark';
  saveState();
  applyThemeAndAccent();

  // Update theme icons
  const icon = state.settings.theme === 'dark' ? '☀️' : '🌙';
  const navBtn = document.getElementById('theme-toggle-icon');
  if (navBtn) navBtn.textContent = icon;
}

function applyThemeAndAccent() {
  // Theme check
  if (state.settings.theme === 'dark') {
    document.body.classList.add('dark-mode');
    document.getElementById('theme-toggle-icon').textContent = '☀️';
  } else {
    document.body.classList.remove('dark-mode');
    document.getElementById('theme-toggle-icon').textContent = '🌙';
  }

  // Accent pick overrides class
  document.body.classList.remove('accent-1', 'accent-2', 'accent-3', 'accent-4', 'accent-5');
  const index = state.settings.accentColor || '1';
  document.body.classList.add(`accent-${index}`);
}

function getCategoryEmoji(category) {
  const emojis = {
    Food: '🍔',
    Transport: '🚗',
    Entertainment: '🎬',
    Health: '💊',
    Shopping: '🛍️',
    Bills: '🧾',
    Others: '🏷️'
  };
  return emojis[category] || '🏷️';
}


// ==========================================================================
// === GLOBAL SERVICES INITS ===
// ==========================================================================

// Global DOM hooks
document.addEventListener('DOMContentLoaded', () => {
  // Load local state schemas
  loadState();

  // Router listeners hooks
  window.addEventListener('hashchange', handleRouting);
  window.addEventListener('load', handleRouting);

  // Global navbar theme toggle trigger
  document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);

  // Keyboard shortcut listener: "N" anywhere on dashboard opens Add Transaction modal
  window.addEventListener('keydown', (e) => {
    const isDashboard = window.location.hash === '#/dashboard';
    const isInputActive = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName);

    if (isDashboard && e.key.toLowerCase() === 'n' && !isInputActive) {
      e.preventDefault();
      openTransactionModal();
    }
  });

  // Scroll to top button visibility check
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Initialize modular global forms and modals triggers
  initConfirmationModal();
  initAuth();
  initTransactionModalController();
  initGoalModals();

  // Setup onboarding if route is setup on initial load
  if (window.location.hash === '#/setup') {
    initOnboardingWizard();
  }

  // Router bootstrap trigger
  handleRouting();
});

// Intercept window setup onboarding wizard entry hook
window.addEventListener('hashchange', () => {
  if (window.location.hash === '#/setup' && state.currentUser && !state.currentUser.onboarded) {
    initOnboardingWizard();
  }
});
