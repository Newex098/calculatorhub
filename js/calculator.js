/**
 * CalculatorHub - Interactive Calculator UI Controller
 * Orchestrates user interaction, keypad events, history DOM, and connects to calculation engines.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCalculatorUI();
  initModeTabs();
  initMobileDrawer();
  initHistoryControls();
});

/* ==========================================================================
   1. Calculator UI Controller
   ========================================================================== */
function initCalculatorUI() {
  const mainDisplay = document.getElementById('calc-main-display');
  const subDisplay = document.getElementById('calc-sub-display');
  const historyContainer = document.getElementById('history-items-container');

  if (!mainDisplay || !subDisplay) return;

  // Instantiate the decoupled computation engine
  const engine = typeof StandardCalculatorEngine !== 'undefined' 
    ? new StandardCalculatorEngine() 
    : createFallbackEngine();

  function renderDisplay() {
    const state = engine.getState();
    mainDisplay.textContent = state.displayValue;
    subDisplay.textContent = state.expressionValue;
  }

  function handleEquals() {
    const record = engine.compute();
    if (record) {
      addHistoryRecord(record.equation, record.result, 'STD');
    }
    renderDisplay();
  }

  function addHistoryRecord(equation, resultVal, modeBadge = 'STD') {
    if (!historyContainer) return;

    // Remove empty notice if present
    const emptyNotice = historyContainer.querySelector('.empty-history-notice');
    if (emptyNotice) {
      emptyNotice.remove();
    }

    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div>
        <div class="history-equation">${equation}</div>
        <div class="history-result">${resultVal}</div>
      </div>
      <span class="history-badge ${modeBadge.toLowerCase()}">${modeBadge}</span>
    `;
    historyContainer.prepend(item);
  }

  // Keypad Button Clicks
  document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const val = btn.dataset.val;

      switch (action) {
        case 'num':
          engine.inputDigit(val);
          break;
        case 'decimal':
          engine.inputDecimal();
          break;
        case 'operator':
          engine.setOperation(val);
          break;
        case 'equals':
          handleEquals();
          break;
        case 'clear':
          engine.clear();
          break;
        case 'toggle-sign':
          engine.toggleSign();
          break;
        case 'percent':
          engine.computePercent();
          break;
      }
      renderDisplay();
    });
  });

  // Physical & Touch Keyboard Support
  window.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') {
      engine.inputDigit(e.key);
    } else if (e.key === '.') {
      engine.inputDecimal();
    } else if (e.key === '+' || e.key === '-') {
      engine.setOperation(e.key);
    } else if (e.key === '*') {
      engine.setOperation('*');
    } else if (e.key === '/') {
      e.preventDefault();
      engine.setOperation('/');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      handleEquals();
    } else if (e.key === 'Backspace') {
      if (typeof engine.backspace === 'function') {
        engine.backspace();
      } else {
        if (engine.currentInput && engine.currentInput.length > 1 && engine.currentInput !== '0') {
          engine.currentInput = engine.currentInput.slice(0, -1);
          if (engine.currentInput === '-' || engine.currentInput === '-0') engine.currentInput = '0';
        } else {
          engine.currentInput = '0';
        }
      }
    } else if (e.key === 'Escape') {
      engine.clear();
    }
    renderDisplay();
  });

  // Initial render
  renderDisplay();
}

/**
 * Fallback engine in case StandardCalculatorEngine script is loaded out of order
 */
function createFallbackEngine() {
  return {
    currentInput: '0',
    previousInput: '',
    operation: null,
    shouldResetScreen: false,
    inputDigit(d) {
      if (this.currentInput === '0' || this.shouldResetScreen) {
        this.currentInput = d === '00' ? '0' : String(d);
        this.shouldResetScreen = false;
      } else if (this.currentInput.length < 14) {
        this.currentInput += String(d);
      }
    },
    inputDecimal() {
      if (this.shouldResetScreen) { this.currentInput = '0.'; this.shouldResetScreen = false; return; }
      if (!this.currentInput.includes('.')) this.currentInput += '.';
    },
    setOperation(op) {
      if (this.currentInput === 'Error') return;
      if (this.operation && !this.shouldResetScreen) this.compute();
      this.previousInput = this.currentInput;
      this.operation = op;
      this.shouldResetScreen = true;
    },
    compute() {
      if (!this.operation || this.shouldResetScreen) return null;
      const p = parseFloat(this.previousInput), c = parseFloat(this.currentInput);
      if (isNaN(p) || isNaN(c)) return null;
      let res = 0;
      if (this.operation === '+') res = p + c;
      else if (this.operation === '-') res = p - c;
      else if (this.operation === '*') res = p * c;
      else if (this.operation === '/') res = c === 0 ? 'Error' : p / c;
      const eq = `${this.previousInput} ${this.operation} ${this.currentInput}`;
      if (res !== 'Error') {
        if (!Number.isInteger(res)) {
          res = parseFloat(res.toPrecision(12));
        }
        this.currentInput = String(res);
        this.operation = null;
        this.shouldResetScreen = true;
        return { equation: eq, result: String(res) };
      }
      this.currentInput = 'Error';
      this.operation = null;
      this.shouldResetScreen = true;
      return { equation: eq, result: 'Error' };
    },
    backspace() {
      if (this.currentInput === 'Error' || this.shouldResetScreen) {
        this.currentInput = '0';
        this.shouldResetScreen = false;
        return;
      }
      if (this.currentInput.length > 1) {
        this.currentInput = this.currentInput.slice(0, -1);
        if (this.currentInput === '-' || this.currentInput === '-0') this.currentInput = '0';
      } else {
        this.currentInput = '0';
      }
    },
    toggleSign() {
      if (this.currentInput === '0' || this.currentInput === 'Error') return;
      this.currentInput = this.currentInput.startsWith('-') ? this.currentInput.slice(1) : '-' + this.currentInput;
    },
    computePercent() {
      const v = parseFloat(this.currentInput);
      if (!isNaN(v)) this.currentInput = String(v / 100);
    },
    clear() {
      this.currentInput = '0';
      this.previousInput = '';
      this.operation = null;
      this.shouldResetScreen = false;
    },
    getState() {
      return {
        displayValue: this.currentInput,
        expressionValue: this.operation ? `${this.previousInput} ${this.operation}` : ''
      };
    }
  };
}

/* ==========================================================================
   2. Mode Selector Tabs (Architecture Ready for Finance & Scientific)
   ========================================================================== */
function initModeTabs() {
  const modeButtons = document.querySelectorAll('.mode-tab-btn');
  const statusBadge = document.getElementById('calc-status-badge');

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      const mode = btn.dataset.mode;
      if (statusBadge) {
        statusBadge.textContent = mode.toUpperCase();
      }
    });
  });
}

/* ==========================================================================
   3. Calculation History Controls
   ========================================================================== */
function initHistoryControls() {
  const clearBtn = document.getElementById('clear-history-btn');
  const historyContainer = document.getElementById('history-items-container');
  const jumpHistoryBtn = document.getElementById('jump-history-btn');

  if (clearBtn && historyContainer) {
    clearBtn.addEventListener('click', () => {
      historyContainer.innerHTML = `
        <div class="empty-history-notice" style="text-align: center; color: var(--text-muted); font-size: 0.8125rem; font-style: italic; padding: 1.5rem 0;">
          Calculation history cleared.
        </div>
      `;
    });
  }

  // Jump to history panel (mobile convenience)
  if (jumpHistoryBtn) {
    jumpHistoryBtn.addEventListener('click', () => {
      const historyCard = document.getElementById('history-panel-card');
      if (historyCard) {
        historyCard.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

/* ==========================================================================
   4. Mobile Navigation Drawer
   ========================================================================== */
function initMobileDrawer() {
  const toggleBtn = document.getElementById('mobile-menu-toggle') || document.getElementById('stitch-mobile-toggle');
  const drawer = document.getElementById('mobile-nav-drawer') || document.getElementById('stitch-mobile-drawer');

  if (!toggleBtn || !drawer) return;
  if (toggleBtn.dataset.menuInitialized === 'true') return;
  toggleBtn.dataset.menuInitialized = 'true';

  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    const nextState = !isExpanded;

    toggleBtn.setAttribute('aria-expanded', String(nextState));
    if (nextState) {
      drawer.removeAttribute('hidden');
      drawer.classList.add('is-open');
    } else {
      drawer.setAttribute('hidden', '');
      drawer.classList.remove('is-open');
    }
  });

  // Close drawer on link click
  const drawerLinks = drawer.querySelectorAll('a');
  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggleBtn.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('hidden', '');
      drawer.classList.remove('is-open');
    });
  });
}
