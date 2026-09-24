/**
 * CalculatorHub - Simple Interest Calculator UI Controller
 * Binds DOM inputs, sliders, and presets to the SimpleInterestEngine.
 * Handles live automatic calculation, formatted clipboard export, and schedule expansion.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSimpleInterestCalculator();
  initFaqAccordion();
  initMobileNav();
});

function initSimpleInterestCalculator() {
  const engine = new SimpleInterestEngine();

  // Inputs & Sliders
  const inputPrincipal = document.getElementById('si-input-principal');
  const sliderPrincipal = document.getElementById('si-slider-principal');
  const pillPrincipal = document.getElementById('si-pill-principal');

  const inputRate = document.getElementById('si-input-rate');
  const sliderRate = document.getElementById('si-slider-rate');
  const pillRate = document.getElementById('si-pill-rate');

  const inputYears = document.getElementById('si-input-years');
  const sliderYears = document.getElementById('si-slider-years');
  const pillYears = document.getElementById('si-pill-years');

  // Presets & Quick Examples
  const presetChips = document.querySelectorAll('.si-preset-chip');

  // Action Buttons
  const btnReset = document.getElementById('btn-si-reset');
  const btnCopy = document.getElementById('btn-si-copy');

  // Outputs (Results Card)
  const resultTotal = document.getElementById('result-si-total');
  const resultTotalSubtitle = document.getElementById('result-si-total-subtitle');
  const resultPrincipal = document.getElementById('result-si-principal');
  const resultInterest = document.getElementById('result-si-interest');
  const resultRateGain = document.getElementById('result-si-rate-gain');

  // Visual Breakdown Bar
  const pctPrincipal = document.getElementById('pct-principal');
  const pctInterest = document.getElementById('pct-interest');
  const barPrincipal = document.getElementById('bar-principal');
  const barInterest = document.getElementById('bar-interest');

  // Schedule Table Elements
  const scheduleTbody = document.getElementById('si-schedule-tbody');
  const btnToggleSchedule = document.getElementById('btn-toggle-schedule');

  // State
  let isScheduleExpanded = false;

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
    const P = parseFloat(inputPrincipal.value) || 0;
    const R = parseFloat(inputRate.value) || 0;
    const T = parseFloat(inputYears.value) || 0;

    // Update pill labels
    if (pillPrincipal) pillPrincipal.textContent = formatPillNumber(P);
    if (pillRate) pillRate.textContent = `${R}%`;
    if (pillYears) pillYears.textContent = `${T} ${T === 1 ? 'Yr' : 'Yrs'}`;

    // Sync sliders fill
    updateSliderFill(sliderPrincipal);
    updateSliderFill(sliderRate);
    updateSliderFill(sliderYears);

    // Run Engine
    const data = engine.calculate(P, R, T);

    if (!data.isValid) {
      if (resultTotal) resultTotal.textContent = '₹0';
      if (resultPrincipal) resultPrincipal.textContent = '₹0';
      if (resultInterest) resultInterest.textContent = '₹0';
      if (resultRateGain) resultRateGain.textContent = '0%';
      return;
    }

    // Format results
    const totalFormatted = engine.formatINR(data.totalAmount);
    const pFormatted = engine.formatINR(data.principal);
    const intFormatted = engine.formatINR(data.simpleInterest);
    const gainFormatted = `${data.interestPercentOfPrincipal.toFixed(2)}%`;

    if (resultTotal) resultTotal.textContent = totalFormatted;
    if (resultPrincipal) resultPrincipal.textContent = pFormatted;
    if (resultInterest) resultInterest.textContent = intFormatted;
    if (resultRateGain) resultRateGain.textContent = `+${gainFormatted}`;

    if (resultTotalSubtitle) {
      resultTotalSubtitle.textContent = `Total amount receivable over ${T} ${T === 1 ? 'year' : 'years'} at ${R}% simple interest`;
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
      emptyRow.innerHTML = '<td colspan="4" style="text-align:center; padding: 1.5rem; color: var(--text-muted);">Enter principal and time period to view interest progression</td>';
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
        tr.classList.add('si-schedule-hidden-row');
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
  bindInputAndSlider(inputRate, sliderRate, 0, 25);
  bindInputAndSlider(inputYears, sliderYears, 1, 30);

  // --- Quick Test Preset Chips ---
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const p = parseFloat(chip.dataset.principal);
      const r = parseFloat(chip.dataset.rate);
      const t = parseFloat(chip.dataset.years);

      if (!isNaN(p)) {
        inputPrincipal.value = p;
        sliderPrincipal.value = Math.min(1000000, Math.max(1000, p));
      }
      if (!isNaN(r)) {
        inputRate.value = r;
        sliderRate.value = Math.min(25, Math.max(0, r));
      }
      if (!isNaN(t)) {
        inputYears.value = t;
        sliderYears.value = Math.min(30, Math.max(1, t));
      }

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
      const T = parseFloat(inputYears.value) || 0;

      const data = engine.calculate(P, R, T);
      if (!data.isValid) return;

      const summaryText = [
        '--- CalculatorHub Simple Interest Calculation ---',
        `Principal Amount: ${engine.formatINR(data.principal)}`,
        `Annual Interest Rate: ${data.annualRate}%`,
        `Time Horizon: ${data.years} ${data.years === 1 ? 'Year' : 'Years'}`,
        '------------------------------------------------',
        `Total Maturity Amount: ${engine.formatINR(data.totalAmount)}`,
        `Simple Interest Earned: ${engine.formatINR(data.simpleInterest)}`,
        `Interest Gain on Principal: +${data.interestPercentOfPrincipal.toFixed(2)}%`,
        '------------------------------------------------',
        'Calculate yours at: https://calculatorhub.com/calculators/simple-interest/'
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
