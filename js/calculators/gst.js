/**
 * CalculatorHub - GST Calculator UI Controller
 * Bridges user inputs, mode toggles, rate chips, tax splits, and quick examples
 * with GstCalculatorEngine.
 */

document.addEventListener('DOMContentLoaded', () => {
  initGstCalculatorUI();
  initGstFaqAccordion();
  initGstMobileDrawer();
});

function initGstCalculatorUI() {
  const engine = typeof GstCalculatorEngine !== 'undefined'
    ? new GstCalculatorEngine()
    : createFallbackGstEngine();

  // Mode buttons
  const btnModeAdd = document.getElementById('btn-mode-add');
  const btnModeRemove = document.getElementById('btn-mode-remove');

  // Input elements
  const amountInput = document.getElementById('gst-input-amount');
  const amountLabel = document.getElementById('gst-amount-label');
  const amountHint = document.getElementById('gst-amount-hint');
  const amountPill = document.getElementById('gst-pill-amount');

  const rateInput = document.getElementById('gst-input-rate');
  const ratePill = document.getElementById('gst-pill-rate');
  const rateChips = document.querySelectorAll('.rate-chip');

  // Tax Split radios/buttons
  const splitIntraBtn = document.getElementById('split-btn-intra');
  const splitInterBtn = document.getElementById('split-btn-inter');

  // Quick Example chips
  const exampleChips = document.querySelectorAll('.example-chip');

  // Action buttons
  const btnReset = document.getElementById('btn-gst-reset');
  const btnCopy = document.getElementById('btn-gst-copy');

  // Result display elements
  const resultMainLabel = document.getElementById('result-main-label');
  const resultMainAmount = document.getElementById('result-main-amount');
  const resultMainSubtitle = document.getElementById('result-main-subtitle');

  const resultStatBase = document.getElementById('result-stat-base');
  const resultStatGst = document.getElementById('result-stat-gst');
  const resultStatGstLabel = document.getElementById('result-stat-gst-label');
  const resultStatFinal = document.getElementById('result-stat-final');

  // Split breakdown display elements
  const splitBreakdownIntra = document.getElementById('breakdown-intra-rows');
  const splitBreakdownInter = document.getElementById('breakdown-inter-rows');
  const valCgst = document.getElementById('result-cgst-amount');
  const labelCgst = document.getElementById('result-cgst-label');
  const valSgst = document.getElementById('result-sgst-amount');
  const labelSgst = document.getElementById('result-sgst-label');
  const valIgst = document.getElementById('result-igst-amount');
  const labelIgst = document.getElementById('result-igst-label');

  // Visual bar
  const barBase = document.getElementById('bar-base');
  const barGst = document.getElementById('bar-gst');
  const pctBase = document.getElementById('pct-base');
  const pctGst = document.getElementById('pct-gst');

  // State
  let currentMode = 'add'; // 'add' | 'remove'
  let isIntraState = true;  // true = CGST + SGST, false = IGST

  const DEFAULTS = {
    amount: 10000,
    rate: 18,
    mode: 'add',
    isIntraState: true
  };

  /**
   * Set active calculation mode ('add' or 'remove')
   */
  function setMode(mode) {
    currentMode = mode === 'remove' ? 'remove' : 'add';

    if (currentMode === 'add') {
      if (btnModeAdd) {
        btnModeAdd.classList.add('is-active');
        btnModeAdd.setAttribute('aria-pressed', 'true');
      }
      if (btnModeRemove) {
        btnModeRemove.classList.remove('is-active');
        btnModeRemove.setAttribute('aria-pressed', 'false');
      }

      if (amountLabel) amountLabel.textContent = 'Net Amount (Excl. GST)';
      if (amountHint) amountHint.textContent = 'Original price before GST is added';
      if (resultMainLabel) resultMainLabel.textContent = 'Total Amount (Incl. GST)';
    } else {
      if (btnModeRemove) {
        btnModeRemove.classList.add('is-active');
        btnModeRemove.setAttribute('aria-pressed', 'true');
      }
      if (btnModeAdd) {
        btnModeAdd.classList.remove('is-active');
        btnModeAdd.setAttribute('aria-pressed', 'false');
      }

      if (amountLabel) amountLabel.textContent = 'Gross Amount (Incl. GST)';
      if (amountHint) amountHint.textContent = 'Invoice total including GST';
      if (resultMainLabel) resultMainLabel.textContent = 'Net Base Amount (Excl. GST)';
    }

    recalculate();
  }

  /**
   * Set tax split type (Intra-State vs Inter-State)
   */
  function setSplit(intra) {
    isIntraState = Boolean(intra);

    if (splitIntraBtn && splitInterBtn) {
      if (isIntraState) {
        splitIntraBtn.classList.add('is-active');
        splitIntraBtn.setAttribute('aria-pressed', 'true');
        splitInterBtn.classList.remove('is-active');
        splitInterBtn.setAttribute('aria-pressed', 'false');
        if (splitBreakdownIntra) splitBreakdownIntra.style.display = 'block';
        if (splitBreakdownInter) splitBreakdownInter.style.display = 'none';
      } else {
        splitInterBtn.classList.add('is-active');
        splitInterBtn.setAttribute('aria-pressed', 'true');
        splitIntraBtn.classList.remove('is-active');
        splitIntraBtn.setAttribute('aria-pressed', 'false');
        if (splitBreakdownIntra) splitBreakdownIntra.style.display = 'none';
        if (splitBreakdownInter) splitBreakdownInter.style.display = 'block';
      }
    }

    recalculate();
  }

  /**
   * Set rate from chip or input
   */
  function setRate(rateValue) {
    const numericRate = parseFloat(rateValue);
    if (!isNaN(numericRate) && rateInput) {
      rateInput.value = numericRate;
    }

    // Sync chip active styles
    rateChips.forEach(chip => {
      const chipRate = parseFloat(chip.dataset.rate);
      if (chipRate === numericRate) {
        chip.classList.add('is-active');
        chip.setAttribute('aria-pressed', 'true');
      } else {
        chip.classList.remove('is-active');
        chip.setAttribute('aria-pressed', 'false');
      }
    });

    recalculate();
  }

  /**
   * Main recalculate function
   */
  function recalculate() {
    const rawAmount = engine.parseInput(amountInput ? amountInput.value : DEFAULTS.amount);
    const rawRate = engine.parseInput(rateInput ? rateInput.value : DEFAULTS.rate);

    const result = engine.calculate(rawAmount, rawRate, currentMode, isIntraState);

    // Update pill tags
    if (amountPill) amountPill.textContent = engine.formatINR(rawAmount);
    if (ratePill) ratePill.textContent = `${result.gstRate}%`;

    // Update Main Result Card
    if (resultMainAmount) {
      resultMainAmount.textContent = (currentMode === 'add') 
        ? result.formatted.finalAmount 
        : result.formatted.baseAmount;
    }

    if (resultMainSubtitle) {
      if (currentMode === 'add') {
        resultMainSubtitle.textContent = `Includes ${result.formatted.gstAmount} GST (${result.gstRate}%) added to base`;
      } else {
        resultMainSubtitle.textContent = `Extracted ${result.formatted.gstAmount} GST (${result.gstRate}%) from gross total`;
      }
    }

    // Update Stats
    if (resultStatBase) resultStatBase.textContent = result.formatted.baseAmount;
    if (resultStatGst) resultStatGst.textContent = result.formatted.gstAmount;
    if (resultStatGstLabel) resultStatGstLabel.textContent = `Total GST (${result.gstRate}%)`;
    if (resultStatFinal) resultStatFinal.textContent = result.formatted.finalAmount;

    // Update Breakdown
    if (valCgst) valCgst.textContent = result.formatted.cgstAmount;
    if (labelCgst) labelCgst.textContent = `CGST (${result.cgstRate}%)`;

    if (valSgst) valSgst.textContent = result.formatted.sgstAmount;
    if (labelSgst) labelSgst.textContent = `SGST (${result.sgstRate}%)`;

    if (valIgst) valIgst.textContent = result.formatted.igstAmount;
    if (labelIgst) labelIgst.textContent = `IGST (${result.igstRate}%)`;

    // Visual Ratio Progress Bar
    let basePct = 100;
    let gstPct = 0;
    if (result.finalAmount > 0) {
      basePct = Math.round((result.baseAmount / result.finalAmount) * 100);
      gstPct = Math.max(0, 100 - basePct);
    }

    if (barBase) barBase.style.width = `${basePct}%`;
    if (barGst) barGst.style.width = `${gstPct}%`;
    if (pctBase) pctBase.textContent = `${basePct}%`;
    if (pctGst) pctGst.textContent = `${gstPct}%`;
  }

  // --- Event Listeners ---

  // Mode toggles
  if (btnModeAdd) {
    btnModeAdd.addEventListener('click', (e) => {
      e.preventDefault();
      setMode('add');
    });
  }

  if (btnModeRemove) {
    btnModeRemove.addEventListener('click', (e) => {
      e.preventDefault();
      setMode('remove');
    });
  }

  // Split toggles
  if (splitIntraBtn) {
    splitIntraBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setSplit(true);
    });
  }

  if (splitInterBtn) {
    splitInterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setSplit(false);
    });
  }

  // Amount input
  if (amountInput) {
    amountInput.addEventListener('input', () => {
      recalculate();
    });
    amountInput.addEventListener('change', () => {
      recalculate();
    });
  }

  // Rate input
  if (rateInput) {
    rateInput.addEventListener('input', () => {
      const val = parseFloat(rateInput.value);
      // Sync chips
      rateChips.forEach(chip => {
        if (parseFloat(chip.dataset.rate) === val) {
          chip.classList.add('is-active');
          chip.setAttribute('aria-pressed', 'true');
        } else {
          chip.classList.remove('is-active');
          chip.setAttribute('aria-pressed', 'false');
        }
      });
      recalculate();
    });
  }

  // Rate preset chips
  rateChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const rateVal = chip.dataset.rate;
      if (rateVal) setRate(rateVal);
    });
  });

  // Quick Examples
  exampleChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const exAmount = chip.dataset.amount;
      const exRate = chip.dataset.rate;
      const exMode = chip.dataset.mode || 'add';

      if (amountInput && exAmount) {
        amountInput.value = exAmount;
      }
      if (exRate) {
        setRate(exRate);
      }
      setMode(exMode);

      // Visual feedback highlight
      chip.style.transform = 'scale(0.96)';
      setTimeout(() => {
        chip.style.transform = '';
      }, 150);
    });
  });



  // Reset Button
  if (btnReset) {
    btnReset.addEventListener('click', (e) => {
      e.preventDefault();
      if (amountInput) amountInput.value = DEFAULTS.amount;
      setRate(DEFAULTS.rate);
      setSplit(DEFAULTS.isIntraState);
      setMode(DEFAULTS.mode);
    });
  }

  // Copy Summary Button
  if (btnCopy) {
    btnCopy.addEventListener('click', (e) => {
      e.preventDefault();
      const rawAmount = engine.parseInput(amountInput ? amountInput.value : DEFAULTS.amount);
      const rawRate = engine.parseInput(rateInput ? rateInput.value : DEFAULTS.rate);
      const result = engine.calculate(rawAmount, rawRate, currentMode, isIntraState);

      const copyText = [
        `CalculatorHub GST Calculation Summary:`,
        `• Mode: ${currentMode === 'add' ? 'Add GST (Exclusive)' : 'Remove GST (Inclusive)'}`,
        `• Base Net Amount: ${result.formatted.baseAmount}`,
        `• GST Rate: ${result.gstRate}%`,
        `• GST Amount: ${result.formatted.gstAmount} (${isIntraState ? `CGST: ${result.formatted.cgstAmount} + SGST: ${result.formatted.sgstAmount}` : `IGST: ${result.formatted.igstAmount}`})`,
        `• Final Gross Amount: ${result.formatted.finalAmount}`,
        `Calculated via CalculatorHub (https://calcuface.co.in/calculators/gst/)`
      ].join('\n');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText).then(() => {
          const origText = btnCopy.innerHTML;
          btnCopy.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Copied!</span>
          `;
          setTimeout(() => {
            btnCopy.innerHTML = origText;
          }, 2000);
        }).catch(() => {
          // Fallback
          prompt('Copy calculation summary:', copyText);
        });
      } else {
        prompt('Copy calculation summary:', copyText);
      }
    });
  }

  // Initial Calculation Run
  setMode('add');
  setRate('18');
  setSplit(true);
}

/**
 * Fallback engine if external file failed to load
 */
function createFallbackGstEngine() {
  return {
    formatINR: function(val) {
      if (val === null || val === undefined || isNaN(val)) return '₹0';
      const absVal = Math.abs(val);
      const hasFractions = (absVal % 1 !== 0);
      let formatted = hasFractions
        ? Number(absVal.toFixed(2)).toLocaleString('en-IN')
        : Math.round(absVal).toLocaleString('en-IN');
      return (val < 0 ? '-₹' : '₹') + formatted;
    },
    parseInput: function(input) {
      if (typeof input === 'number') return isNaN(input) ? 0 : Math.max(0, input);
      if (!input || typeof input !== 'string') return 0;
      const clean = input.replace(/[^0-9.-]/g, '');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : Math.max(0, num);
    },
    calculate: function(amount, rate, mode, isIntraState) {
      const a = this.parseInput(amount);
      const r = this.parseInput(rate);
      const isAdd = mode !== 'remove';

      let baseAmount = 0;
      let gstAmount = 0;
      let finalAmount = 0;

      if (isAdd) {
        baseAmount = a;
        gstAmount = (baseAmount * r) / 100;
        finalAmount = baseAmount + gstAmount;
      } else {
        finalAmount = a;
        baseAmount = r > 0 ? (finalAmount / (1 + r / 100)) : finalAmount;
        gstAmount = finalAmount - baseAmount;
      }

      const cgstRate = isIntraState ? (r / 2) : 0;
      const cgstAmount = isIntraState ? (gstAmount / 2) : 0;
      const sgstRate = isIntraState ? (r / 2) : 0;
      const sgstAmount = isIntraState ? (gstAmount / 2) : 0;
      const igstRate = !isIntraState ? r : 0;
      const igstAmount = !isIntraState ? gstAmount : 0;

      return {
        isValid: true,
        mode: isAdd ? 'add' : 'remove',
        inputAmount: a,
        gstRate: r,
        baseAmount: Number(baseAmount.toFixed(2)),
        gstAmount: Number(gstAmount.toFixed(2)),
        finalAmount: Number(finalAmount.toFixed(2)),
        isIntraState: Boolean(isIntraState),
        cgstRate: Number(cgstRate.toFixed(2)),
        cgstAmount: Number(cgstAmount.toFixed(2)),
        sgstRate: Number(sgstRate.toFixed(2)),
        sgstAmount: Number(sgstAmount.toFixed(2)),
        igstRate: Number(igstRate.toFixed(2)),
        igstAmount: Number(igstAmount.toFixed(2)),
        formatted: {
          inputAmount: this.formatINR(a),
          baseAmount: this.formatINR(baseAmount),
          gstAmount: this.formatINR(gstAmount),
          finalAmount: this.formatINR(finalAmount),
          cgstAmount: this.formatINR(cgstAmount),
          sgstAmount: this.formatINR(sgstAmount),
          igstAmount: this.formatINR(igstAmount)
        }
      };
    }
  };
}

/* ==========================================================================
   2. Expandable FAQ Accordion
   ========================================================================== */
function initGstFaqAccordion() {
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
   3. Mobile Navigation Drawer
   ========================================================================== */
function initGstMobileDrawer() {
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
