/**
 * CalculatorHub - General-Purpose Loan Calculator UI Controller
 * Binds DOM inputs, sliders, tenure unit switches, frequency selectors, and presets
 * to the LoanCalculatorEngine.
 * Handles live automatic calculation, clipboard export, and amortization schedule expansion.
 */

document.addEventListener('DOMContentLoaded', () => {
  initLoanCalculator();
  initFaqAccordion();
  initMobileNav();
});

function initLoanCalculator() {
  const engine = new LoanCalculatorEngine();

  // Inputs & Sliders
  const inputAmount = document.getElementById('loan-input-amount');
  const sliderAmount = document.getElementById('loan-slider-amount');
  const pillAmount = document.getElementById('loan-pill-amount');

  const inputRate = document.getElementById('loan-input-rate');
  const sliderRate = document.getElementById('loan-slider-rate');
  const pillRate = document.getElementById('loan-pill-rate');

  const inputTenure = document.getElementById('loan-input-tenure');
  const sliderTenure = document.getElementById('loan-slider-tenure');
  const pillTenure = document.getElementById('loan-pill-tenure');
  const tenureUnitLabel = document.getElementById('loan-tenure-unit-label');
  const btnTenureYears = document.getElementById('loan-tenure-years-btn');
  const btnTenureMonths = document.getElementById('loan-tenure-months-btn');

  // Repayment Frequency Controls
  const freqButtons = document.querySelectorAll('.loan-freq-btn');
  const pillFreq = document.getElementById('loan-pill-freq');

  // Presets & Quick Examples
  const presetChips = document.querySelectorAll('.loan-preset-chip');

  // Action Buttons
  const btnReset = document.getElementById('btn-loan-reset');
  const btnCopy = document.getElementById('btn-loan-copy');

  // Outputs (Results Card)
  const resultPayment = document.getElementById('result-loan-payment');
  const resultPaymentLabel = document.getElementById('result-loan-payment-label');
  const resultPaymentSubtitle = document.getElementById('result-loan-payment-subtitle');
  const resultPrincipal = document.getElementById('result-loan-principal');
  const resultInterest = document.getElementById('result-loan-interest');
  const resultTotal = document.getElementById('result-loan-total');
  const resultRateGain = document.getElementById('result-loan-rate-gain');

  // Visual Breakdown Bar
  const pctPrincipal = document.getElementById('pct-principal');
  const pctInterest = document.getElementById('pct-interest');
  const barPrincipal = document.getElementById('bar-principal');
  const barInterest = document.getElementById('bar-interest');

  // Amortization Schedule Elements
  const amortTbody = document.getElementById('loan-amort-tbody');
  const btnToggleAmort = document.getElementById('btn-toggle-amort');

  // State
  let isTenureYears = true;
  let currentFreq = 'monthly';
  let isAmortExpanded = false;

  const FREQ_TITLES = {
    'monthly': 'Monthly Payment',
    'quarterly': 'Quarterly Payment',
    'half_yearly': 'Half-Yearly Payment',
    'yearly': 'Yearly Payment'
  };

  const FREQ_PILLS = {
    'monthly': 'Monthly (12x/yr)',
    'quarterly': 'Quarterly (4x/yr)',
    'half_yearly': 'Half-Yearly (2x/yr)',
    'yearly': 'Yearly (1x/yr)'
  };

  /**
   * Helper to format numbers cleanly with commas for pill indicators
   */
  function formatPillNumber(num) {
    if (isNaN(num) || num === null) return '₹0';
    return '₹' + Math.round(num).toLocaleString('en-IN');
  }

  /**
   * Updates slider background gradient fill for Chrome/Safari/Firefox
   */
  function updateSliderFill(slider) {
    if (!slider) return;
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value) || 0;
    const percent = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
    slider.style.background = `linear-gradient(to right, var(--primary, #2563eb) ${percent}%, #e2e8f0 ${percent}%)`;
  }

  /**
   * Recalculates and updates the entire UI
   */
  function recalculate() {
    const P = parseFloat(inputAmount.value) || 0;
    const R = parseFloat(inputRate.value) || 0;
    const tenureVal = parseFloat(inputTenure.value) || 0;
    const unit = isTenureYears ? 'years' : 'months';
    const freq = currentFreq;

    // Update pill labels
    if (pillAmount) pillAmount.textContent = formatPillNumber(P);
    if (pillRate) pillRate.textContent = `${R}%`;
    if (pillTenure) {
      const unitText = isTenureYears ? (tenureVal === 1 ? 'Yr' : 'Yrs') : (tenureVal === 1 ? 'Mo' : 'Mos');
      pillTenure.textContent = `${tenureVal} ${unitText}`;
    }
    if (pillFreq) pillFreq.textContent = FREQ_PILLS[freq] || 'Monthly';

    // Sync sliders fill
    updateSliderFill(sliderAmount);
    updateSliderFill(sliderRate);
    updateSliderFill(sliderTenure);

    // Run Engine
    const data = engine.calculate(P, R, tenureVal, unit, freq);

    if (!data.isValid) {
      if (resultPayment) resultPayment.textContent = '₹0';
      if (resultPrincipal) resultPrincipal.textContent = '₹0';
      if (resultInterest) resultInterest.textContent = '₹0';
      if (resultTotal) resultTotal.textContent = '₹0';
      if (resultRateGain) resultRateGain.textContent = '0%';
      return;
    }

    // Format primary outputs
    const pmtFormatted = engine.formatINR(data.periodicPayment);
    const pFormatted = engine.formatINR(data.principal);
    const intFormatted = engine.formatINR(data.totalInterest);
    const totFormatted = engine.formatINR(data.totalPayment);
    const gainFormatted = `${data.interestPercentOfPrincipal.toFixed(2)}%`;

    if (resultPayment) resultPayment.textContent = pmtFormatted;
    if (resultPaymentLabel) resultPaymentLabel.textContent = FREQ_TITLES[freq] || 'Periodic Payment';
    if (resultPrincipal) resultPrincipal.textContent = pFormatted;
    if (resultInterest) resultInterest.textContent = intFormatted;
    if (resultTotal) resultTotal.textContent = totFormatted;
    if (resultRateGain) resultRateGain.textContent = `+${gainFormatted}`;

    if (resultPaymentSubtitle) {
      const unitWord = isTenureYears ? (tenureVal === 1 ? 'year' : 'years') : (tenureVal === 1 ? 'month' : 'months');
      resultPaymentSubtitle.textContent = `Payable across ${data.numberOfPeriods} periods over ${tenureVal} ${unitWord} at ${R}%`;
    }

    // Visual breakdown bar
    const pRatio = Math.round(data.principalRatio);
    const intRatio = 100 - pRatio;

    if (pctPrincipal) pctPrincipal.textContent = `${pRatio}%`;
    if (pctInterest) pctInterest.textContent = `${intRatio}%`;

    if (barPrincipal) barPrincipal.style.width = `${pRatio}%`;
    if (barInterest) barInterest.style.width = `${intRatio}%`;

    // Render Amortization Schedule
    renderAmortization(data.amortizationSchedule, freq);
  }

  /**
   * Render amortization schedule rows
   */
  function renderAmortization(schedule, freq) {
    if (!amortTbody) return;
    amortTbody.innerHTML = '';

    if (!schedule || schedule.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="6" style="text-align:center; padding: 1.5rem; color: var(--text-muted);">Enter loan details to view amortization schedule</td>';
      amortTbody.appendChild(emptyRow);
      if (btnToggleAmort) btnToggleAmort.style.display = 'none';
      return;
    }

    const MAX_COLLAPSED_ROWS = 12;
    const shouldCollapse = schedule.length > MAX_COLLAPSED_ROWS && !isAmortExpanded;

    const periodPrefix = freq === 'monthly' ? 'Mo' : (freq === 'quarterly' ? 'Qtr' : (freq === 'half_yearly' ? 'H' : 'Yr'));

    schedule.forEach((row, idx) => {
      const tr = document.createElement('tr');
      if (shouldCollapse && idx >= MAX_COLLAPSED_ROWS) {
        tr.style.display = 'none';
        tr.classList.add('loan-amort-hidden-row');
      }

      tr.innerHTML = `
        <td style="text-align: left; font-weight: 600; color: var(--text-main);">${periodPrefix} ${row.period}</td>
        <td>${engine.formatINR(row.startingBalance)}</td>
        <td style="font-weight: 600; color: var(--text-main);">${engine.formatINR(row.payment)}</td>
        <td style="color: #ef4444; font-weight: 500;">${engine.formatINR(row.interest)}</td>
        <td style="color: #16a34a; font-weight: 500;">${engine.formatINR(row.principal)}</td>
        <td style="font-weight: 700; color: var(--text-main);">${engine.formatINR(row.endingBalance)}</td>
      `;
      amortTbody.appendChild(tr);
    });

    if (btnToggleAmort) {
      if (schedule.length > MAX_COLLAPSED_ROWS) {
        btnToggleAmort.style.display = 'inline-flex';
        btnToggleAmort.textContent = isAmortExpanded ? 'Show Less' : `View Full Schedule (${schedule.length} Periods)`;
      } else {
        btnToggleAmort.style.display = 'none';
      }
    }
  }

  // Toggle Amortization Schedule Expansion
  if (btnToggleAmort) {
    btnToggleAmort.addEventListener('click', () => {
      isAmortExpanded = !isAmortExpanded;
      recalculate();
    });
  }

  // --- Input & Slider Dual-Binding Helpers ---
  function bindInputAndSlider(input, slider, minVal, maxVal) {
    if (!input || !slider) return;

    input.addEventListener('input', () => {
      let val = parseFloat(input.value);
      if (!isNaN(val)) {
        slider.value = Math.min(maxVal, Math.max(minVal, val));
        updateSliderFill(slider);
      }
      recalculate();
    });

    slider.addEventListener('input', () => {
      input.value = slider.value;
      updateSliderFill(slider);
      recalculate();
    });
  }

  bindInputAndSlider(inputAmount, sliderAmount, 10000, 10000000);
  bindInputAndSlider(inputRate, sliderRate, 0, 30);
  bindInputAndSlider(inputTenure, sliderTenure, 1, 30);

  // --- Tenure Unit Toggle (Years vs Months) ---
  function setTenureUnit(isYears) {
    isTenureYears = isYears;
    if (btnTenureYears) {
      btnTenureYears.classList.toggle('is-active', isYears);
      btnTenureYears.setAttribute('aria-pressed', String(isYears));
    }
    if (btnTenureMonths) {
      btnTenureMonths.classList.toggle('is-active', !isYears);
      btnTenureMonths.setAttribute('aria-pressed', String(!isYears));
    }

    if (isYears) {
      if (tenureUnitLabel) tenureUnitLabel.textContent = 'Years';
      sliderTenure.min = '1';
      sliderTenure.max = '30';
      sliderTenure.step = '1';
      let currentYears = Math.max(1, Math.min(30, Math.round(parseFloat(inputTenure.value) / 12) || 5));
      inputTenure.value = currentYears;
      sliderTenure.value = currentYears;
    } else {
      if (tenureUnitLabel) tenureUnitLabel.textContent = 'Months';
      sliderTenure.min = '6';
      sliderTenure.max = '360';
      sliderTenure.step = '6';
      let currentMonths = Math.max(6, Math.min(360, Math.round(parseFloat(inputTenure.value) * 12) || 60));
      inputTenure.value = currentMonths;
      sliderTenure.value = currentMonths;
    }

    updateSliderFill(sliderTenure);
    recalculate();
  }

  if (btnTenureYears) {
    btnTenureYears.addEventListener('click', () => setTenureUnit(true));
  }
  if (btnTenureMonths) {
    btnTenureMonths.addEventListener('click', () => setTenureUnit(false));
  }

  // --- Repayment Frequency Selection ---
  freqButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const freq = btn.dataset.freq;
      if (!freq) return;

      currentFreq = freq;
      freqButtons.forEach(b => {
        const isActive = b === btn;
        b.classList.toggle('is-active', isActive);
        b.setAttribute('aria-checked', String(isActive));
      });

      recalculate();
    });
  });

  // --- Preset Chips ---
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const amount = chip.dataset.amount;
      const tenure = chip.dataset.tenure;
      const unit = chip.dataset.unit;
      const rate = chip.dataset.rate;

      if (amount) {
        const p = parseFloat(amount);
        inputAmount.value = p;
        sliderAmount.value = Math.min(10000000, Math.max(10000, p));
      }

      if (rate) {
        const r = parseFloat(rate);
        inputRate.value = r;
        sliderRate.value = Math.min(30, Math.max(0, r));
      }

      if (tenure) {
        const t = parseFloat(tenure);
        if (unit === 'months' && isTenureYears) {
          setTenureUnit(false);
        } else if (unit === 'years' && !isTenureYears) {
          setTenureUnit(true);
        }
        inputTenure.value = t;
        sliderTenure.value = t;
      }

      presetChips.forEach(c => c.classList.toggle('is-active', c === chip));
      recalculate();
    });
  });

  // --- Reset Functionality ---
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      inputAmount.value = '500000';
      sliderAmount.value = '500000';

      inputRate.value = '10';
      sliderRate.value = '10';

      setTenureUnit(true); // Switch to Years
      inputTenure.value = '5';
      sliderTenure.value = '5';

      currentFreq = 'monthly';
      freqButtons.forEach(b => {
        const isMonthly = b.dataset.freq === 'monthly';
        b.classList.toggle('is-active', isMonthly);
        b.setAttribute('aria-checked', String(isMonthly));
      });

      presetChips.forEach(c => c.classList.remove('is-active'));
      isAmortExpanded = false;

      recalculate();
    });
  }

  // --- Copy Result to Clipboard ---
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const P = parseFloat(inputAmount.value) || 0;
      const R = parseFloat(inputRate.value) || 0;
      const tenureVal = parseFloat(inputTenure.value) || 0;
      const unit = isTenureYears ? 'years' : 'months';
      const freq = currentFreq;

      const data = engine.calculate(P, R, tenureVal, unit, freq);
      if (!data.isValid) return;

      const freqTitle = FREQ_TITLES[freq] || 'Periodic Payment';
      const unitWord = isTenureYears ? (tenureVal === 1 ? 'Year' : 'Years') : (tenureVal === 1 ? 'Month' : 'Months');

      const summaryText = [
        '--- CalculatorHub Loan Calculation Summary ---',
        `Loan Principal: ${engine.formatINR(data.principal)}`,
        `Annual Interest Rate: ${data.annualRate}%`,
        `Loan Tenure: ${data.tenure} ${unitWord} (${data.numberOfPeriods} payments)`,
        `Repayment Frequency: ${FREQ_PILLS[freq]}`,
        '------------------------------------------------',
        `${freqTitle}: ${engine.formatINR(data.periodicPayment)}`,
        `Total Interest Payable: ${engine.formatINR(data.totalInterest)}`,
        `Total Repayment Amount: ${engine.formatINR(data.totalPayment)}`,
        `Interest as % of Principal: +${data.interestPercentOfPrincipal.toFixed(2)}%`,
        '------------------------------------------------',
        'Calculate yours at: https://calcuface.co.in/calculators/loan/'
      ].join('\n');

      navigator.clipboard.writeText(summaryText).then(() => {
        const originalContent = btnCopy.innerHTML;
        btnCopy.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Copied to Clipboard!</span>
        `;
        btnCopy.style.backgroundColor = 'var(--accent-green, #16a34a)';
        btnCopy.style.color = '#ffffff';
        btnCopy.style.borderColor = 'var(--accent-green, #16a34a)';

        setTimeout(() => {
          btnCopy.innerHTML = originalContent;
          btnCopy.style.backgroundColor = '';
          btnCopy.style.color = '';
          btnCopy.style.borderColor = '';
        }, 2200);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    });
  }

  // Initial calculation on page load
  recalculate();
}

/**
 * Mobile Navigation Drawer Toggle
 */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const navDrawer = document.getElementById('mobile-nav-drawer');

  if (!toggleBtn || !navDrawer) return;
  if (toggleBtn.dataset.initialized === 'true') return;
  toggleBtn.dataset.initialized = 'true';

  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    const nextState = !isExpanded;

    toggleBtn.setAttribute('aria-expanded', String(nextState));
    if (nextState) {
      navDrawer.removeAttribute('hidden');
      navDrawer.classList.add('is-open');
    } else {
      navDrawer.setAttribute('hidden', '');
      navDrawer.classList.remove('is-open');
    }
  });

  const links = navDrawer.querySelectorAll('.mobile-nav-link');
  links.forEach(link => {
    link.addEventListener('click', () => {
      toggleBtn.setAttribute('aria-expanded', 'false');
      navDrawer.setAttribute('hidden', '');
      navDrawer.classList.remove('is-open');
    });
  });
}

/**
 * Accessible FAQ Accordion
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-active');

      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('is-active');
          const otherBtn = other.querySelector('.faq-trigger');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('is-active', !isOpen);
      trigger.setAttribute('aria-expanded', String(!isOpen));
    });
  });
}
