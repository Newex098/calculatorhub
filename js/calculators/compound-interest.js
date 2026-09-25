/**
 * CalculatorHub - Compound Interest Calculator UI Controller
 * Binds DOM inputs, sliders, presets, and frequency selectors to the CompoundInterestEngine.
 * Handles live calculation, input validation, formatted clipboard export, and schedule expansion.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCompoundInterestCalculator();
  initFaqAccordion();
  initMobileNav();
});

function initCompoundInterestCalculator() {
  const engine = new CompoundInterestEngine();

  // Inputs & Sliders
  const inputPrincipal = document.getElementById('ci-input-principal');
  const sliderPrincipal = document.getElementById('ci-slider-principal');
  const pillPrincipal = document.getElementById('ci-pill-principal');

  const inputRate = document.getElementById('ci-input-rate');
  const sliderRate = document.getElementById('ci-slider-rate');
  const pillRate = document.getElementById('ci-pill-rate');

  const inputYears = document.getElementById('ci-input-years');
  const sliderYears = document.getElementById('ci-slider-years');
  const pillYears = document.getElementById('ci-pill-years');

  // Compounding Frequency Controls
  const freqButtons = document.querySelectorAll('.ci-freq-btn');
  const pillFreq = document.getElementById('ci-pill-freq');

  // Presets & Quick Examples
  const presetChips = document.querySelectorAll('.ci-preset-chip');

  // Action Buttons
  const btnReset = document.getElementById('btn-ci-reset');
  const btnCopy = document.getElementById('btn-ci-copy');

  // Outputs (Results Card)
  const resultTotal = document.getElementById('result-ci-total');
  const resultTotalSubtitle = document.getElementById('result-ci-total-subtitle');
  const resultPrincipal = document.getElementById('result-ci-principal');
  const resultInterest = document.getElementById('result-ci-interest');
  const resultRateGain = document.getElementById('result-ci-rate-gain');

  // Visual Breakdown Bar
  const pctPrincipal = document.getElementById('pct-principal');
  const pctInterest = document.getElementById('pct-interest');
  const barPrincipal = document.getElementById('bar-principal');
  const barInterest = document.getElementById('bar-interest');

  // Schedule Table Elements
  const scheduleTbody = document.getElementById('ci-schedule-tbody');
  const btnToggleSchedule = document.getElementById('btn-toggle-schedule');

  // State
  let currentFreq = 1; // Default: Annually
  let isScheduleExpanded = false;

  const FREQ_LABELS = {
    1: 'Annually (1x/yr)',
    2: 'Half-Yearly (2x/yr)',
    4: 'Quarterly (4x/yr)',
    12: 'Monthly (12x/yr)',
    365: 'Daily (365x/yr)'
  };

  /**
   * Helper to format numbers cleanly with commas for display
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
    const P = parseFloat(inputPrincipal.value) || 0;
    const R = parseFloat(inputRate.value) || 0;
    const t = parseFloat(inputYears.value) || 0;
    const n = currentFreq;

    // Update pill labels
    if (pillPrincipal) pillPrincipal.textContent = formatPillNumber(P);
    if (pillRate) pillRate.textContent = `${R}%`;
    if (pillYears) pillYears.textContent = `${t} ${t === 1 ? 'Yr' : 'Yrs'}`;
    if (pillFreq) pillFreq.textContent = FREQ_LABELS[n] || `${n}x/yr`;

    // Sync sliders fill
    updateSliderFill(sliderPrincipal);
    updateSliderFill(sliderRate);
    updateSliderFill(sliderYears);

    // Run Engine
    const data = engine.calculate(P, R, t, n);

    if (!data.isValid) {
      if (resultTotal) resultTotal.textContent = '₹0';
      if (resultPrincipal) resultPrincipal.textContent = '₹0';
      if (resultInterest) resultInterest.textContent = '₹0';
      if (resultRateGain) resultRateGain.textContent = '0%';
      return;
    }

    // Format results
    const fvFormatted = engine.formatINR(data.futureValue);
    const pFormatted = engine.formatINR(data.principal);
    const intFormatted = engine.formatINR(data.totalInterest);
    const gainFormatted = `${data.interestPercentOfPrincipal.toFixed(2)}%`;

    if (resultTotal) resultTotal.textContent = fvFormatted;
    if (resultPrincipal) resultPrincipal.textContent = pFormatted;
    if (resultInterest) resultInterest.textContent = intFormatted;
    if (resultRateGain) resultRateGain.textContent = `+${gainFormatted}`;

    if (resultTotalSubtitle) {
      const freqWord = n === 1 ? 'annual' : (n === 2 ? 'half-yearly' : (n === 4 ? 'quarterly' : (n === 12 ? 'monthly' : 'daily')));
      resultTotalSubtitle.textContent = `Maturity amount over ${t} ${t === 1 ? 'year' : 'years'} with ${freqWord} compounding at ${R}%`;
    }

    // Visual breakdown bar
    const pRatio = Math.round(data.principalRatio);
    const intRatio = 100 - pRatio;

    if (pctPrincipal) pctPrincipal.textContent = `${pRatio}%`;
    if (pctInterest) pctInterest.textContent = `${intRatio}%`;

    if (barPrincipal) barPrincipal.style.width = `${pRatio}%`;
    if (barInterest) barInterest.style.width = `${intRatio}%`;

    // Render Yearly Growth Schedule
    renderSchedule(data.yearlySchedule);
  }

  /**
   * Render yearly schedule rows in table
   */
  function renderSchedule(schedule) {
    if (!scheduleTbody) return;
    scheduleTbody.innerHTML = '';

    if (!schedule || schedule.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="4" style="text-align:center; padding: 1.5rem; color: var(--text-muted);">Enter principal and tenure to view growth schedule</td>';
      scheduleTbody.appendChild(emptyRow);
      if (btnToggleSchedule) btnToggleSchedule.style.display = 'none';
      return;
    }

    const MAX_COLLAPSED_ROWS = 10;
    const shouldCollapse = schedule.length > MAX_COLLAPSED_ROWS && !isScheduleExpanded;

    schedule.forEach((row, idx) => {
      const tr = document.createElement('tr');
      if (shouldCollapse && idx >= MAX_COLLAPSED_ROWS) {
        tr.style.display = 'none';
        tr.classList.add('ci-schedule-hidden-row');
      }

      tr.innerHTML = `
        <td style="text-align: left; font-weight: 600; color: var(--text-main);">${row.yearLabel}</td>
        <td>${engine.formatINR(row.startingBalance)}</td>
        <td style="color: #16a34a; font-weight: 600;">+${engine.formatINR(row.interestEarned)}</td>
        <td style="font-weight: 700; color: var(--text-main);">${engine.formatINR(row.endingBalance)}</td>
      `;
      scheduleTbody.appendChild(tr);
    });

    if (btnToggleSchedule) {
      if (schedule.length > MAX_COLLAPSED_ROWS) {
        btnToggleSchedule.style.display = 'inline-flex';
        btnToggleSchedule.textContent = isScheduleExpanded ? 'Show Less' : `View Full Schedule (${schedule.length} Years)`;
      } else {
        btnToggleSchedule.style.display = 'none';
      }
    }
  }

  // Toggle Schedule Expansion
  if (btnToggleSchedule) {
    btnToggleSchedule.addEventListener('click', () => {
      isScheduleExpanded = !isScheduleExpanded;
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

  bindInputAndSlider(inputPrincipal, sliderPrincipal, 1000, 1000000);
  bindInputAndSlider(inputRate, sliderRate, 1, 25);
  bindInputAndSlider(inputYears, sliderYears, 1, 30);

  // --- Compounding Frequency Selection ---
  freqButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const freq = parseInt(btn.dataset.freq, 10);
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

  // --- Quick Test Preset Chips ---
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const p = parseFloat(chip.dataset.principal);
      const r = parseFloat(chip.dataset.rate);
      const t = parseFloat(chip.dataset.years);
      const f = parseInt(chip.dataset.freq, 10) || 1;

      if (!isNaN(p)) {
        inputPrincipal.value = p;
        sliderPrincipal.value = Math.min(1000000, Math.max(1000, p));
      }
      if (!isNaN(r)) {
        inputRate.value = r;
        sliderRate.value = Math.min(25, Math.max(1, r));
      }
      if (!isNaN(t)) {
        inputYears.value = t;
        sliderYears.value = Math.min(30, Math.max(1, t));
      }

      currentFreq = f;
      freqButtons.forEach(b => {
        const match = parseInt(b.dataset.freq, 10) === f;
        b.classList.toggle('is-active', match);
        b.setAttribute('aria-checked', String(match));
      });

      presetChips.forEach(c => c.classList.toggle('is-active', c === chip));
      recalculate();
    });
  });

  // --- Reset Functionality ---
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      inputPrincipal.value = '10000';
      sliderPrincipal.value = '10000';

      inputRate.value = '8';
      sliderRate.value = '8';

      inputYears.value = '5';
      sliderYears.value = '5';

      currentFreq = 1; // Annually
      freqButtons.forEach(b => {
        const isAnnual = parseInt(b.dataset.freq, 10) === 1;
        b.classList.toggle('is-active', isAnnual);
        b.setAttribute('aria-checked', String(isAnnual));
      });

      presetChips.forEach(c => c.classList.remove('is-active'));
      isScheduleExpanded = false;

      recalculate();
    });
  }

  // --- Copy Result to Clipboard ---
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const P = parseFloat(inputPrincipal.value) || 0;
      const R = parseFloat(inputRate.value) || 0;
      const t = parseFloat(inputYears.value) || 0;
      const n = currentFreq;
      const freqLabel = FREQ_LABELS[n] || `${n}x/year`;

      const data = engine.calculate(P, R, t, n);
      if (!data.isValid) return;

      const summaryText = [
        '--- CalculatorHub Compound Interest Calculation ---',
        `Principal Amount: ${engine.formatINR(data.principal)}`,
        `Annual Interest Rate: ${data.annualRate}%`,
        `Time Horizon: ${data.years} ${data.years === 1 ? 'Year' : 'Years'}`,
        `Compounding Frequency: ${freqLabel}`,
        '------------------------------------------------',
        `Total Future Value: ${engine.formatINR(data.futureValue)}`,
        `Total Interest Earned: ${engine.formatINR(data.totalInterest)}`,
        `Interest Gain on Principal: +${data.interestPercentOfPrincipal.toFixed(2)}%`,
        '------------------------------------------------',
        'Calculate yours at: https://calcuface.co.in/calculators/compound-interest/'
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
