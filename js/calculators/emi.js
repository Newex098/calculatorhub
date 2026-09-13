/**
 * CalculatorHub - EMI Calculator UI Controller
 * Bridges user inputs, sliders, and amortization table with EmiCalculatorEngine.
 */

document.addEventListener('DOMContentLoaded', () => {
  initEmiCalculatorUI();
  initEmiFaqAccordion();
  initEmiMobileDrawer();
});

function initEmiCalculatorUI() {
  const engine = typeof EmiCalculatorEngine !== 'undefined'
    ? new EmiCalculatorEngine()
    : createFallbackEmiEngine();

  // Inputs & Sliders
  const amountInput = document.getElementById('emi-input-amount');
  const amountSlider = document.getElementById('emi-slider-amount');
  const amountPill = document.getElementById('emi-pill-amount');

  const rateInput = document.getElementById('emi-input-rate');
  const rateSlider = document.getElementById('emi-slider-rate');
  const ratePill = document.getElementById('emi-pill-rate');

  const tenureInput = document.getElementById('emi-input-tenure');
  const tenureSlider = document.getElementById('emi-slider-tenure');
  const tenurePill = document.getElementById('emi-pill-tenure');
  const tenureUnitLabel = document.getElementById('emi-tenure-unit-label');
  const tenureYearsBtn = document.getElementById('tenure-btn-years');
  const tenureMonthsBtn = document.getElementById('tenure-btn-months');

  // Action Buttons
  const btnReset = document.getElementById('btn-emi-reset');

  // Outputs
  const resultEmi = document.getElementById('result-emi-monthly');
  const resultPrincipal = document.getElementById('result-emi-principal');
  const resultInterest = document.getElementById('result-emi-interest');
  const resultTotal = document.getElementById('result-emi-total');
  const resultPeriod = document.getElementById('result-emi-period');

  // Visual Breakdown Bar
  const barPrincipal = document.getElementById('bar-principal');
  const barInterest = document.getElementById('bar-interest');
  const pctPrincipal = document.getElementById('pct-principal');
  const pctInterest = document.getElementById('pct-interest');

  // Amortization
  const amortTbody = document.getElementById('amortization-tbody');
  const btnToggleAmort = document.getElementById('btn-toggle-amortization');

  // State
  let isTenureYears = true;
  let isAmortExpanded = false;

  // Defaults
  const DEFAULTS = {
    amount: 1000000,
    rate: 8.5,
    tenureYears: 20,
    tenureMonths: 240
  };

  function getTenureInMonths() {
    const val = parseFloat(tenureInput?.value || '20');
    if (isNaN(val) || val <= 0) return 240;
    return isTenureYears ? Math.round(val * 12) : Math.round(val);
  }

  function recalculate() {
    const p = engine.parseInput(amountInput ? amountInput.value : DEFAULTS.amount);
    const r = engine.parseInput(rateInput ? rateInput.value : DEFAULTS.rate);
    const n = getTenureInMonths();

    const data = engine.calculate(p, r, n);

    // Update Result Summary
    if (resultEmi) resultEmi.textContent = data.formatted.monthlyEmi;
    if (resultPrincipal) resultPrincipal.textContent = data.formatted.principalAmount;
    if (resultInterest) resultInterest.textContent = data.formatted.totalInterest;
    if (resultTotal) resultTotal.textContent = data.formatted.totalPayment;
    if (resultPeriod) {
      resultPeriod.textContent = `per month for ${n} months (${(n / 12).toFixed(1).replace('.0', '')} yrs)`;
    }

    // Update Ratio Progress Bar
    if (barPrincipal) barPrincipal.style.width = `${data.principalPercentage}%`;
    if (barInterest) barInterest.style.width = `${data.interestPercentage}%`;
    if (pctPrincipal) pctPrincipal.textContent = `${data.principalPercentage}%`;
    if (pctInterest) pctInterest.textContent = `${data.interestPercentage}%`;

    // Render Amortization Table
    renderAmortizationTable(data.yearlyAmortization);
  }

  function renderAmortizationTable(schedule) {
    if (!amortTbody || !schedule) return;

    amortTbody.innerHTML = '';
    const visibleCount = isAmortExpanded ? schedule.length : Math.min(5, schedule.length);

    schedule.slice(0, visibleCount).forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600;">Year ${row.year}</td>
        <td>${engine.formatINR(row.openingBalance)}</td>
        <td class="principal-col">${engine.formatINR(row.principalPaid)}</td>
        <td>${engine.formatINR(row.interestPaid)}</td>
        <td style="font-weight: 600;">${engine.formatINR(row.totalPayment)}</td>
        <td class="highlight-balance">${engine.formatINR(row.closingBalance)}</td>
      `;
      amortTbody.appendChild(tr);
    });

    if (btnToggleAmort) {
      if (schedule.length > 5) {
        btnToggleAmort.style.display = 'inline-flex';
        btnToggleAmort.textContent = isAmortExpanded 
          ? 'Show Less Years' 
          : `View Full Schedule (${schedule.length} Years) ↓`;
      } else {
        btnToggleAmort.style.display = 'none';
      }
    }
  }

  // Synchronize Amount
  if (amountSlider && amountInput) {
    amountSlider.addEventListener('input', () => {
      const val = parseInt(amountSlider.value, 10);
      amountInput.value = val.toLocaleString('en-IN');
      if (amountPill) amountPill.textContent = '₹' + val.toLocaleString('en-IN');
      recalculate();
    });

    amountInput.addEventListener('input', () => {
      const clean = engine.parseInput(amountInput.value);
      amountSlider.value = Math.min(amountSlider.max, Math.max(amountSlider.min, clean));
      if (amountPill) amountPill.textContent = '₹' + clean.toLocaleString('en-IN');
      recalculate();
    });
  }

  // Synchronize Interest Rate
  if (rateSlider && rateInput) {
    rateSlider.addEventListener('input', () => {
      rateInput.value = rateSlider.value;
      if (ratePill) ratePill.textContent = rateSlider.value + '%';
      recalculate();
    });

    rateInput.addEventListener('input', () => {
      const clean = parseFloat(rateInput.value);
      if (!isNaN(clean)) {
        rateSlider.value = Math.min(rateSlider.max, Math.max(rateSlider.min, clean));
        if (ratePill) ratePill.textContent = clean + '%';
        recalculate();
      }
    });
  }

  // Synchronize Tenure
  if (tenureSlider && tenureInput) {
    tenureSlider.addEventListener('input', () => {
      tenureInput.value = tenureSlider.value;
      if (tenurePill) {
        tenurePill.textContent = tenureSlider.value + (isTenureYears ? ' Yrs' : ' Mos');
      }
      recalculate();
    });

    tenureInput.addEventListener('input', () => {
      const clean = parseFloat(tenureInput.value);
      if (!isNaN(clean)) {
        tenureSlider.value = Math.min(tenureSlider.max, Math.max(tenureSlider.min, clean));
        if (tenurePill) {
          tenurePill.textContent = clean + (isTenureYears ? ' Yrs' : ' Mos');
        }
        recalculate();
      }
    });
  }

  // Tenure Toggle (Years vs Months)
  if (tenureYearsBtn && tenureMonthsBtn) {
    tenureYearsBtn.addEventListener('click', () => {
      if (isTenureYears) return;
      isTenureYears = true;
      tenureYearsBtn.classList.add('is-active');
      tenureMonthsBtn.classList.remove('is-active');
      if (tenureUnitLabel) tenureUnitLabel.textContent = 'Years';

      // Convert current months to years
      const currentMonths = parseFloat(tenureInput.value) || 240;
      const years = Math.max(1, Math.min(30, Math.round(currentMonths / 12)));
      tenureSlider.min = '1';
      tenureSlider.max = '30';
      tenureSlider.step = '1';
      tenureSlider.value = String(years);
      tenureInput.value = String(years);
      if (tenurePill) tenurePill.textContent = years + ' Yrs';
      recalculate();
    });

    tenureMonthsBtn.addEventListener('click', () => {
      if (!isTenureYears) return;
      isTenureYears = false;
      tenureMonthsBtn.classList.add('is-active');
      tenureYearsBtn.classList.remove('is-active');
      if (tenureUnitLabel) tenureUnitLabel.textContent = 'Months';

      // Convert current years to months
      const currentYears = parseFloat(tenureInput.value) || 20;
      const months = Math.max(12, Math.min(360, Math.round(currentYears * 12)));
      tenureSlider.min = '12';
      tenureSlider.max = '360';
      tenureSlider.step = '6';
      tenureSlider.value = String(months);
      tenureInput.value = String(months);
      if (tenurePill) tenurePill.textContent = months + ' Mos';
      recalculate();
    });
  }

  // Quick Chips (Amounts)
  document.querySelectorAll('.amount-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = parseInt(chip.dataset.val, 10);
      if (!isNaN(val)) {
        amountInput.value = val.toLocaleString('en-IN');
        amountSlider.value = val;
        if (amountPill) amountPill.textContent = '₹' + val.toLocaleString('en-IN');
        recalculate();
      }
    });
  });

  // Quick Chips (Rates)
  document.querySelectorAll('.rate-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = parseFloat(chip.dataset.val);
      if (!isNaN(val)) {
        rateInput.value = String(val);
        rateSlider.value = val;
        if (ratePill) ratePill.textContent = val + '%';
        recalculate();
      }
    });
  });



  // Reset Button
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      isTenureYears = true;
      if (tenureYearsBtn) tenureYearsBtn.classList.add('is-active');
      if (tenureMonthsBtn) tenureMonthsBtn.classList.remove('is-active');
      if (tenureUnitLabel) tenureUnitLabel.textContent = 'Years';

      if (amountInput) amountInput.value = DEFAULTS.amount.toLocaleString('en-IN');
      if (amountSlider) amountSlider.value = DEFAULTS.amount;
      if (amountPill) amountPill.textContent = '₹' + DEFAULTS.amount.toLocaleString('en-IN');

      if (rateInput) rateInput.value = String(DEFAULTS.rate);
      if (rateSlider) rateSlider.value = DEFAULTS.rate;
      if (ratePill) ratePill.textContent = DEFAULTS.rate + '%';

      if (tenureSlider) {
        tenureSlider.min = '1';
        tenureSlider.max = '30';
        tenureSlider.step = '1';
        tenureSlider.value = String(DEFAULTS.tenureYears);
      }
      if (tenureInput) tenureInput.value = String(DEFAULTS.tenureYears);
      if (tenurePill) tenurePill.textContent = DEFAULTS.tenureYears + ' Yrs';

      recalculate();
    });
  }

  // Toggle Amortization Schedule
  if (btnToggleAmort) {
    btnToggleAmort.addEventListener('click', () => {
      isAmortExpanded = !isAmortExpanded;
      recalculate();
    });
  }

  // Initial calculation on page load
  recalculate();
}

/**
 * Fallback computation engine if EmiCalculatorEngine is not yet loaded
 */
function createFallbackEmiEngine() {
  return {
    parseInput: (val) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      const clean = String(val || '').replace(/[^0-9.-]/g, '');
      return parseFloat(clean) || 0;
    },
    formatINR: (num) => '₹' + Math.round(num || 0).toLocaleString('en-IN'),
    calculate: function(p, r, n) {
      if (p <= 0 || n <= 0) return { monthlyEmi: 0, formatted: { monthlyEmi: '₹0' } };
      const rate = r / 1200;
      const factor = Math.pow(1 + rate, n);
      const emi = !isFinite(factor) ? (p * rate) : ((p * rate * factor) / (factor - 1));
      const total = emi * n;
      const interest = Math.max(0, total - p);
      return {
        monthlyEmi: Math.round(emi),
        principalAmount: p,
        totalInterest: Math.round(interest),
        totalPayment: Math.round(total),
        principalPercentage: Math.round((p / total) * 100),
        interestPercentage: 100 - Math.round((p / total) * 100),
        yearlyAmortization: [],
        formatted: {
          monthlyEmi: '₹' + Math.round(emi).toLocaleString('en-IN'),
          principalAmount: '₹' + Math.round(p).toLocaleString('en-IN'),
          totalInterest: '₹' + Math.round(interest).toLocaleString('en-IN'),
          totalPayment: '₹' + Math.round(total).toLocaleString('en-IN')
        }
      };
    }
  };
}

/* ==========================================================================
   2. Expandable FAQ Accordion
   ========================================================================== */
function initEmiFaqAccordion() {
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
function initEmiMobileDrawer() {
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
