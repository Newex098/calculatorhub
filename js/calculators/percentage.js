/**
 * CalculatorHub - Percentage Calculator UI Controller
 * Handles interactive tabs for 5 core percentage modes,
 * plus Discount, Markup, and Reverse Discount calculation sections.
 */

document.addEventListener('DOMContentLoaded', () => {
  initPercentageCalculatorUI();
  initDiscountCalculatorUI();
  initMarkupCalculatorUI();
  initReverseDiscountUI();
  initPercentageFaqAccordion();
  initPercentageMobileDrawer();
});

/* ==========================================================================
   1. Primary Percentage Calculator (5 Modes)
   ========================================================================== */
function initPercentageCalculatorUI() {
  const engine = typeof PercentageCalculatorEngine !== 'undefined'
    ? new PercentageCalculatorEngine()
    : createFallbackPercentageEngine();

  // Mode Tabs
  const modeTabs = document.querySelectorAll('.pct-mode-tab');

  // Input Fields & Labels
  const inputA = document.getElementById('pct-input-a');
  const inputB = document.getElementById('pct-input-b');
  const labelA = document.getElementById('pct-label-a');
  const labelB = document.getElementById('pct-label-b');
  const suffixA = document.getElementById('pct-suffix-a');
  const suffixB = document.getElementById('pct-suffix-b');

  // Results
  const resultVal = document.getElementById('pct-result-val');
  const resultSummary = document.getElementById('pct-result-summary');
  const resultFormula = document.getElementById('pct-result-formula');
  const resultCalc = document.getElementById('pct-result-calc');

  // Actions
  const btnReset = document.getElementById('btn-pct-reset');
  const btnCopy = document.getElementById('btn-pct-copy');

  // Quick Examples
  const exampleChips = document.querySelectorAll('.example-chip');

  // Current State
  let currentMode = 'pct-of'; // 'pct-of', 'is-what', 'increase', 'decrease', 'difference'

  const MODE_CONFIGS = {
    'pct-of': {
      title: 'What is X% of Y?',
      labelA: 'Percentage (%)',
      labelB: 'Total Number (Y)',
      suffixA: '%',
      suffixB: '',
      prefixA: '',
      prefixB: '',
      defaultA: 20,
      defaultB: 500,
      calculate: (a, b) => engine.percentageOf(a, b),
      formatSummary: (res, a, b) => `${a}% of ${engine.formatNumber(b)} is equal to ${res.formattedResult}`
    },
    'is-what': {
      title: 'X is what % of Y?',
      labelA: 'Part Value (X)',
      labelB: 'Total Value (Y)',
      suffixA: '',
      suffixB: '',
      prefixA: '',
      prefixB: '',
      defaultA: 100,
      defaultB: 500,
      calculate: (a, b) => engine.whatPercentageIs(a, b),
      formatSummary: (res, a, b) => `${engine.formatNumber(a)} is ${res.formattedResult} of ${engine.formatNumber(b)}`
    },
    'increase': {
      title: 'Percentage Increase',
      labelA: 'Original Value',
      labelB: 'New Value',
      suffixA: '',
      suffixB: '',
      prefixA: '',
      prefixB: '',
      defaultA: 500,
      defaultB: 600,
      calculate: (a, b) => engine.percentageIncrease(a, b),
      formatSummary: (res, a, b) => `From ${engine.formatNumber(a)} to ${engine.formatNumber(b)} is a ${res.formattedResult} increase (Change: +${engine.formatNumber(res.difference)})`
    },
    'decrease': {
      title: 'Percentage Decrease',
      labelA: 'Original Value',
      labelB: 'New Value',
      suffixA: '',
      suffixB: '',
      prefixA: '',
      prefixB: '',
      defaultA: 500,
      defaultB: 400,
      calculate: (a, b) => engine.percentageDecrease(a, b),
      formatSummary: (res, a, b) => `From ${engine.formatNumber(a)} to ${engine.formatNumber(b)} is a ${res.formattedResult} decrease (Change: -${engine.formatNumber(res.difference)})`
    },
    'difference': {
      title: 'Percentage Difference',
      labelA: 'Value A',
      labelB: 'Value B',
      suffixA: '',
      suffixB: '',
      prefixA: '',
      prefixB: '',
      defaultA: 100,
      defaultB: 120,
      calculate: (a, b) => engine.percentageDifference(a, b),
      formatSummary: (res, a, b) => `Percentage difference between ${engine.formatNumber(a)} and ${engine.formatNumber(b)} is ${res.formattedResult}`
    }
  };

  /**
   * Switch active mode
   */
  function setMode(modeId, customValA, customValB) {
    if (!MODE_CONFIGS[modeId]) return;
    currentMode = modeId;

    modeTabs.forEach(tab => {
      if (tab.dataset.mode === modeId) {
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('is-active');
        tab.setAttribute('aria-selected', 'false');
      }
    });

    const cfg = MODE_CONFIGS[modeId];
    if (labelA) labelA.textContent = cfg.labelA;
    if (labelB) labelB.textContent = cfg.labelB;

    if (suffixA) {
      suffixA.textContent = cfg.suffixA;
      suffixA.style.display = cfg.suffixA ? 'block' : 'none';
      inputA.classList.toggle('has-suffix', Boolean(cfg.suffixA));
    }
    if (suffixB) {
      suffixB.textContent = cfg.suffixB;
      suffixB.style.display = cfg.suffixB ? 'block' : 'none';
      inputB.classList.toggle('has-suffix', Boolean(cfg.suffixB));
    }

    if (inputA) inputA.value = (customValA !== undefined) ? customValA : cfg.defaultA;
    if (inputB) inputB.value = (customValB !== undefined) ? customValB : cfg.defaultB;

    recalculate();
  }

  /**
   * Recalculate and update the UI
   */
  function recalculate() {
    const cfg = MODE_CONFIGS[currentMode];
    if (!cfg) return;

    const valA = engine.parseInput(inputA ? inputA.value : cfg.defaultA, true);
    const valB = engine.parseInput(inputB ? inputB.value : cfg.defaultB, true);

    const res = cfg.calculate(valA, valB);

    if (resultVal) {
      resultVal.textContent = res.formattedResult;
    }

    if (resultSummary) {
      resultSummary.textContent = cfg.formatSummary(res, valA, valB);
    }

    if (resultFormula) {
      resultFormula.textContent = res.formula;
    }

    if (resultCalc) {
      resultCalc.textContent = res.calculation;
    }
  }

  // Event Listeners for Mode Tabs
  modeTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const mode = tab.dataset.mode;
      if (mode) setMode(mode);
    });
  });

  // Inputs live change
  if (inputA) {
    inputA.addEventListener('input', recalculate);
  }
  if (inputB) {
    inputB.addEventListener('input', recalculate);
  }



  // Reset Button
  if (btnReset) {
    btnReset.addEventListener('click', (e) => {
      e.preventDefault();
      const cfg = MODE_CONFIGS[currentMode];
      if (inputA) inputA.value = cfg.defaultA;
      if (inputB) inputB.value = cfg.defaultB;
      recalculate();
    });
  }

  // Copy Summary Button
  if (btnCopy) {
    btnCopy.addEventListener('click', (e) => {
      e.preventDefault();
      const cfg = MODE_CONFIGS[currentMode];
      const valA = engine.parseInput(inputA ? inputA.value : cfg.defaultA, true);
      const valB = engine.parseInput(inputB ? inputB.value : cfg.defaultB, true);
      const res = cfg.calculate(valA, valB);

      const copyText = [
        `CalculatorHub - Percentage Calculation`,
        `• Mode: ${cfg.title}`,
        `• Calculation: ${res.formula} = ${res.formattedResult}`,
        `• Result: ${cfg.formatSummary(res, valA, valB)}`,
        `Calculated via CalculatorHub (https://calculatorhub.com/calculators/percentage/)`
      ].join('\n');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText).then(() => {
          const orig = btnCopy.innerHTML;
          btnCopy.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Copied!</span>
          `;
          setTimeout(() => { btnCopy.innerHTML = orig; }, 2000);
        }).catch(() => {
          prompt('Copy calculation summary:', copyText);
        });
      } else {
        prompt('Copy calculation summary:', copyText);
      }
    });
  }

  // Quick Examples Clicks
  exampleChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const targetMode = chip.dataset.mode;
      const targetSec = chip.dataset.section;

      if (targetSec === 'discount') {
        const p = chip.dataset.price;
        const d = chip.dataset.disc;
        const discPriceInput = document.getElementById('discount-input-price');
        const discPctInput = document.getElementById('discount-input-pct');
        if (discPriceInput) discPriceInput.value = p;
        if (discPctInput) discPctInput.value = d;
        const event = new Event('input', { bubbles: true });
        if (discPriceInput) discPriceInput.dispatchEvent(event);
        const card = document.getElementById('discount-card');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (targetSec === 'markup') {
        const c = chip.dataset.cost;
        const m = chip.dataset.markup;
        const markupCostInput = document.getElementById('markup-input-cost');
        const markupPctInput = document.getElementById('markup-input-pct');
        if (markupCostInput) markupCostInput.value = c;
        if (markupPctInput) markupPctInput.value = m;
        const event = new Event('input', { bubbles: true });
        if (markupCostInput) markupCostInput.dispatchEvent(event);
        const card = document.getElementById('markup-card');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (targetMode) {
        const a = chip.dataset.a;
        const b = chip.dataset.b;
        setMode(targetMode, a, b);
        const mainCard = document.getElementById('pct-calc-card');
        if (mainCard) mainCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Initial Calculation Run
  setMode('pct-of');
}

/* ==========================================================================
   2. Shopping / Discount Calculator
   ========================================================================== */
function initDiscountCalculatorUI() {
  const engine = typeof PercentageCalculatorEngine !== 'undefined'
    ? new PercentageCalculatorEngine()
    : createFallbackPercentageEngine();

  const priceInput = document.getElementById('discount-input-price');
  const pctInput = document.getElementById('discount-input-pct');
  const resultDiscountAmount = document.getElementById('discount-result-amount');
  const resultFinalPrice = document.getElementById('discount-result-final');
  const presetChips = document.querySelectorAll('.discount-preset-chip');
  const btnReset = document.getElementById('btn-discount-reset');

  function recalculate() {
    const price = engine.parseInput(priceInput ? priceInput.value : 2000);
    const pct = engine.parseInput(pctInput ? pctInput.value : 20);

    const res = engine.calculateDiscount(price, pct);

    if (resultDiscountAmount) resultDiscountAmount.textContent = res.formatted.discountAmount;
    if (resultFinalPrice) resultFinalPrice.textContent = res.formatted.finalPrice;
  }

  if (priceInput) priceInput.addEventListener('input', recalculate);
  if (pctInput) pctInput.addEventListener('input', recalculate);

  presetChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const p = parseFloat(chip.dataset.pct);
      if (!isNaN(p) && pctInput) {
        pctInput.value = p;
        presetChips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        recalculate();
      }
    });
  });

  if (btnReset) {
    btnReset.addEventListener('click', (e) => {
      e.preventDefault();
      if (priceInput) priceInput.value = 2000;
      if (pctInput) pctInput.value = 20;
      presetChips.forEach(c => {
        if (parseFloat(c.dataset.pct) === 20) c.classList.add('is-active');
        else c.classList.remove('is-active');
      });
      recalculate();
    });
  }

  recalculate();
}

/* ==========================================================================
   3. Markup Calculator
   ========================================================================== */
function initMarkupCalculatorUI() {
  const engine = typeof PercentageCalculatorEngine !== 'undefined'
    ? new PercentageCalculatorEngine()
    : createFallbackPercentageEngine();

  const costInput = document.getElementById('markup-input-cost');
  const pctInput = document.getElementById('markup-input-pct');
  const resultMarkupAmount = document.getElementById('markup-result-amount');
  const resultSellingPrice = document.getElementById('markup-result-selling');
  const presetChips = document.querySelectorAll('.markup-preset-chip');
  const btnReset = document.getElementById('btn-markup-reset');

  function recalculate() {
    const cost = engine.parseInput(costInput ? costInput.value : 1000);
    const pct = engine.parseInput(pctInput ? pctInput.value : 25);

    const res = engine.calculateMarkup(cost, pct);

    if (resultMarkupAmount) resultMarkupAmount.textContent = res.formatted.markupAmount;
    if (resultSellingPrice) resultSellingPrice.textContent = res.formatted.sellingPrice;
  }

  if (costInput) costInput.addEventListener('input', recalculate);
  if (pctInput) pctInput.addEventListener('input', recalculate);

  presetChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const p = parseFloat(chip.dataset.pct);
      if (!isNaN(p) && pctInput) {
        pctInput.value = p;
        presetChips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        recalculate();
      }
    });
  });

  if (btnReset) {
    btnReset.addEventListener('click', (e) => {
      e.preventDefault();
      if (costInput) costInput.value = 1000;
      if (pctInput) pctInput.value = 25;
      presetChips.forEach(c => {
        if (parseFloat(c.dataset.pct) === 25) c.classList.add('is-active');
        else c.classList.remove('is-active');
      });
      recalculate();
    });
  }

  recalculate();
}

/* ==========================================================================
   4. Reverse Discount Calculator (Original Price After Discount)
   ========================================================================== */
function initReverseDiscountUI() {
  const engine = typeof PercentageCalculatorEngine !== 'undefined'
    ? new PercentageCalculatorEngine()
    : createFallbackPercentageEngine();

  const finalInput = document.getElementById('revdisc-input-final');
  const pctInput = document.getElementById('revdisc-input-pct');
  const resultOriginal = document.getElementById('revdisc-result-original');
  const resultSaved = document.getElementById('revdisc-result-saved');
  const errorBox = document.getElementById('revdisc-error-msg');
  const btnReset = document.getElementById('btn-revdisc-reset');

  function recalculate() {
    const finalP = engine.parseInput(finalInput ? finalInput.value : 800);
    const pct = engine.parseInput(pctInput ? pctInput.value : 20);

    const res = engine.calculateReverseDiscount(finalP, pct);

    if (!res.isValid) {
      if (resultOriginal) resultOriginal.textContent = 'Undefined';
      if (resultSaved) resultSaved.textContent = '₹0';
      if (errorBox) {
        errorBox.textContent = res.error || 'Discount cannot be 100% or greater.';
        errorBox.style.display = 'block';
      }
    } else {
      if (resultOriginal) resultOriginal.textContent = res.formatted.originalPrice;
      if (resultSaved) resultSaved.textContent = res.formatted.discountSaved;
      if (errorBox) {
        errorBox.style.display = 'none';
      }
    }
  }

  if (finalInput) finalInput.addEventListener('input', recalculate);
  if (pctInput) pctInput.addEventListener('input', recalculate);

  if (btnReset) {
    btnReset.addEventListener('click', (e) => {
      e.preventDefault();
      if (finalInput) finalInput.value = 800;
      if (pctInput) pctInput.value = 20;
      if (errorBox) errorBox.style.display = 'none';
      recalculate();
    });
  }

  recalculate();
}

/* ==========================================================================
   5. Fallback Engine
   ========================================================================== */
function createFallbackPercentageEngine() {
  return {
    parseInput: (val) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      const num = parseFloat(String(val || '').replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? 0 : num;
    },
    formatNumber: (val) => String(Math.round(val * 100) / 100),
    formatINR: (val) => '₹' + Math.round(val).toLocaleString('en-IN'),
    percentageOf: (pct, tot) => ({ isValid: true, formattedResult: String((pct / 100) * tot), formula: `(${pct} ÷ 100) × ${tot}`, calculation: `${pct / 100} × ${tot}` }),
    whatPercentageIs: (part, tot) => ({ isValid: true, formattedResult: `${tot > 0 ? (part / tot) * 100 : 0}%`, formula: `(${part} ÷ ${tot}) × 100`, calculation: `${part / tot} × 100` }),
    percentageIncrease: (orig, n) => ({ isValid: true, difference: n - orig, formattedResult: `${orig > 0 ? ((n - orig) / orig) * 100 : 0}%`, formula: `((${n} − ${orig}) ÷ ${orig}) × 100`, calculation: `${n - orig} ÷ ${orig} × 100` }),
    percentageDecrease: (orig, n) => ({ isValid: true, difference: orig - n, formattedResult: `${orig > 0 ? ((orig - n) / orig) * 100 : 0}%`, formula: `((${orig} − ${n}) ÷ ${orig}) × 100`, calculation: `${orig - n} ÷ ${orig} × 100` }),
    percentageDifference: (a, b) => ({ isValid: true, formattedResult: `${(a + b) > 0 ? (Math.abs(a - b) / ((a + b) / 2)) * 100 : 0}%`, formula: `|${a} − ${b}| ÷ ((${a} + ${b}) ÷ 2) × 100`, calculation: `${Math.abs(a - b)} ÷ ${(a + b) / 2} × 100` }),
    calculateDiscount: (p, d) => ({ isValid: true, formatted: { discountAmount: '₹' + (p * d / 100), finalPrice: '₹' + (p - (p * d / 100)) } }),
    calculateMarkup: (c, m) => ({ isValid: true, formatted: { markupAmount: '₹' + (c * m / 100), sellingPrice: '₹' + (c + (c * m / 100)) } }),
    calculateReverseDiscount: (f, d) => ({ isValid: d < 100, formatted: { originalPrice: d < 100 ? '₹' + (f / (1 - d / 100)) : 'Undefined', discountSaved: '₹' + ((f / (1 - d / 100)) - f) } })
  };
}

/* ==========================================================================
   6. Expandable FAQ Accordion
   ========================================================================== */
function initPercentageFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isExpanded = item.classList.contains('is-expanded');

      faqItems.forEach(other => {
        if (other !== item && other.classList.contains('is-expanded')) {
          other.classList.remove('is-expanded');
          other.querySelector('.faq-trigger')?.setAttribute('aria-expanded', 'false');
        }
      });

      if (isExpanded) {
        item.classList.remove('is-expanded');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('is-expanded');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ==========================================================================
   7. Mobile Navigation Drawer
   ========================================================================== */
function initPercentageMobileDrawer() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const drawer = document.getElementById('mobile-nav-drawer');

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

  const links = drawer.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', () => {
      toggleBtn.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('hidden', '');
      drawer.classList.remove('is-open');
    });
  });
}
