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

  const inputTime = document.getElementById('si-input-time') || document.getElementById('si-input-years');
  const sliderTime = document.getElementById('si-slider-time') || document.getElementById('si-slider-years');
  const pillTime = document.getElementById('si-pill-time') || document.getElementById('si-pill-years');
  const selectUnit = document.getElementById('si-select-unit');
  const legendMin = document.getElementById('si-legend-min');
  const legendMid = document.getElementById('si-legend-mid');
  const legendMax = document.getElementById('si-legend-max');

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
  const resultDuration = document.getElementById('result-si-duration');
  const rowEquivalentTime = document.getElementById('row-si-equivalent-time');
  const resultEquivalentTime = document.getElementById('result-si-equivalent-time');
  const dayConventionNote = document.getElementById('si-day-convention-note');

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
  let currentUnit = selectUnit ? selectUnit.value : 'years';

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
   * Update input constraints and slider ranges based on selected unit
   */
  function updateUnitRanges(unit) {
    const u = (unit || 'years').toLowerCase();
    if (u === 'days') {
      if (inputTime) {
        inputTime.min = '0.01';
        inputTime.max = String(SimpleInterestEngine.MAX_DAYS || 18250);
        inputTime.step = 'any';
        inputTime.placeholder = 'e.g. 180';
      }
      if (sliderTime) {
        sliderTime.min = '1';
        sliderTime.max = String(SimpleInterestEngine.MAX_DAYS || 18250);
        sliderTime.step = '1';
      }
      if (legendMin) legendMin.textContent = '1 Day';
      if (legendMid) legendMid.textContent = '9,125 Days';
      if (legendMax) legendMax.textContent = '18,250 Days';
    } else if (u === 'months') {
      if (inputTime) {
        inputTime.min = '0.1';
        inputTime.max = String(SimpleInterestEngine.MAX_MONTHS || 600);
        inputTime.step = 'any';
        inputTime.placeholder = 'e.g. 12';
      }
      if (sliderTime) {
        sliderTime.min = '1';
        sliderTime.max = String(SimpleInterestEngine.MAX_MONTHS || 600);
        sliderTime.step = '1';
      }
      if (legendMin) legendMin.textContent = '1 Mo';
      if (legendMid) legendMid.textContent = '300 Mos';
      if (legendMax) legendMax.textContent = '600 Mos';
    } else {
      // years
      if (inputTime) {
        inputTime.min = '0.01';
        inputTime.max = String(SimpleInterestEngine.MAX_YEARS || 50);
        inputTime.step = 'any';
        inputTime.placeholder = 'e.g. 5';
      }
      if (sliderTime) {
        sliderTime.min = '1';
        sliderTime.max = String(SimpleInterestEngine.MAX_YEARS || 50);
        sliderTime.step = '0.5';
      }
      if (legendMin) legendMin.textContent = '1 Yr';
      if (legendMid) legendMid.textContent = '25 Yrs';
      if (legendMax) legendMax.textContent = '50 Yrs';
    }
  }

  /**
   * Recalculates and updates the entire UI
   */
  function recalculate() {
    const P = engine.parseInput(inputPrincipal ? inputPrincipal.value : 0);
    const R = engine.parseInput(inputRate ? inputRate.value : 0);
    const rawT = engine.parseInput(inputTime ? inputTime.value : 0);
    const unit = selectUnit ? selectUnit.value : 'years';

    // Update pill labels
    if (pillPrincipal) pillPrincipal.textContent = formatPillNumber(P);
    if (pillRate) pillRate.textContent = `${R}%`;
    if (pillTime) {
      if (unit === 'days') {
        pillTime.textContent = `${rawT} ${rawT === 1 ? 'Day' : 'Days'}`;
      } else if (unit === 'months') {
        pillTime.textContent = `${rawT} ${rawT === 1 ? 'Mo' : 'Mos'}`;
      } else {
        pillTime.textContent = `${rawT} ${rawT === 1 ? 'Yr' : 'Yrs'}`;
      }
    }

    // Sync sliders fill
    updateSliderFill(sliderPrincipal);
    updateSliderFill(sliderRate);
    updateSliderFill(sliderTime);

    // Run Engine
    const data = engine.calculate(P, R, rawT, unit);

    if (!data.isValid) {
      if (resultTotal) resultTotal.textContent = '₹0';
      if (resultPrincipal) resultPrincipal.textContent = '₹0';
      if (resultInterest) resultInterest.textContent = '₹0';
      if (resultRateGain) resultRateGain.textContent = '0%';
      if (resultTotalSubtitle) {
        resultTotalSubtitle.textContent = data.errorMessage || 'Invalid calculation inputs';
      }
      if (resultDuration) resultDuration.textContent = '—';
      if (rowEquivalentTime) rowEquivalentTime.style.display = 'none';
      if (dayConventionNote) dayConventionNote.style.display = 'none';
      if (barPrincipal) barPrincipal.style.width = '0%';
      if (barInterest) barInterest.style.width = '0%';
      if (pctPrincipal) pctPrincipal.textContent = '0%';
      if (pctInterest) pctInterest.textContent = '0%';
      renderSchedule([]);
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

    if (resultDuration) {
      resultDuration.textContent = data.durationLabel;
    }

    if (rowEquivalentTime && resultEquivalentTime) {
      if (data.unit === 'years') {
        rowEquivalentTime.style.display = 'none';
      } else {
        rowEquivalentTime.style.display = 'flex';
        resultEquivalentTime.textContent = data.formattedEquivalentYears;
      }
    }

    if (dayConventionNote) {
      dayConventionNote.style.display = data.unit === 'days' ? 'flex' : 'none';
    }

    if (resultTotalSubtitle) {
      if (data.unit === 'days') {
        resultTotalSubtitle.textContent = `Total amount receivable over ${data.duration} days (${data.formattedEquivalentYears} at 365 days/year) at ${R}% simple interest`;
      } else if (data.unit === 'months') {
        resultTotalSubtitle.textContent = `Total amount receivable over ${data.duration} months (${data.formattedEquivalentYears}) at ${R}% simple interest`;
      } else {
        resultTotalSubtitle.textContent = `Total amount receivable over ${data.years} ${data.years === 1 ? 'year' : 'years'} at ${R}% simple interest`;
      }
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
      emptyRow.innerHTML = '<td colspan="4" style="text-align:center; padding: 1.5rem; color: var(--text-muted);">Enter principal and duration to view interest progression</td>';
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
        btnToggleSchedule.textContent = isScheduleExpanded ? 'Show Less' : `View Full Schedule (${schedule.length} Periods)`;
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
        const curMin = parseFloat(slider.min) || minVal;
        const curMax = parseFloat(slider.max) || maxVal;
        slider.value = Math.min(curMax, Math.max(curMin, val));
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
  bindInputAndSlider(inputTime, sliderTime, 1, 50);

  // --- Handle Unit Dropdown Switch ---
  if (selectUnit) {
    selectUnit.addEventListener('change', () => {
      const nextUnit = selectUnit.value;
      const currentVal = parseFloat(inputTime ? inputTime.value : 0);

      if (!isNaN(currentVal) && currentVal > 0) {
        // Preserve underlying duration in decimal years to prevent any precision loss
        const durationInYears = engine.convertDurationToYears(currentVal, currentUnit);

        let rawConverted = durationInYears;
        if (nextUnit === 'months') {
          rawConverted = durationInYears * 12;
        } else if (nextUnit === 'days') {
          rawConverted = durationInYears * SimpleInterestEngine.DAYS_PER_YEAR; // 365
        }

        // Clean floating-point precision up to 6 decimal places, avoiding trailing decimal noise
        const converted = parseFloat(rawConverted.toFixed(6));

        if (inputTime) inputTime.value = converted;
        currentUnit = nextUnit;
        updateUnitRanges(nextUnit);

        if (sliderTime) {
          const sMin = parseFloat(sliderTime.min) || 1;
          const sMax = parseFloat(sliderTime.max) || 50;
          sliderTime.value = Math.min(sMax, Math.max(sMin, converted));
          updateSliderFill(sliderTime);
        }
      } else {
        currentUnit = nextUnit;
        updateUnitRanges(nextUnit);
      }

      recalculate();
    });
  }

  // --- Quick Test Preset Chips ---
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const p = parseFloat(chip.dataset.principal);
      const r = parseFloat(chip.dataset.rate);
      const unit = chip.dataset.unit || 'years';
      const t = parseFloat(chip.dataset.duration || chip.dataset.years);

      if (!isNaN(p) && inputPrincipal) {
        inputPrincipal.value = p;
        if (sliderPrincipal) sliderPrincipal.value = Math.min(1000000, Math.max(1000, p));
      }
      if (!isNaN(r) && inputRate) {
        inputRate.value = r;
        if (sliderRate) sliderRate.value = Math.min(25, Math.max(0, r));
      }

      if (selectUnit) {
        selectUnit.value = unit;
        currentUnit = unit;
        updateUnitRanges(unit);
      }

      if (!isNaN(t) && inputTime) {
        inputTime.value = t;
        if (sliderTime) {
          const maxS = parseFloat(sliderTime.max) || 30;
          const minS = parseFloat(sliderTime.min) || 1;
          sliderTime.value = Math.min(maxS, Math.max(minS, t));
        }
      }

      presetChips.forEach(c => c.classList.toggle('is-active', c === chip));
      recalculate();
    });
  });

  // --- Reset Functionality ---
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (inputPrincipal) inputPrincipal.value = '10000';
      if (sliderPrincipal) sliderPrincipal.value = '10000';

      if (inputRate) inputRate.value = '8';
      if (sliderRate) sliderRate.value = '8';

      if (selectUnit) selectUnit.value = 'years';
      currentUnit = 'years';
      updateUnitRanges('years');

      if (inputTime) inputTime.value = '5';
      if (sliderTime) sliderTime.value = '5';

      presetChips.forEach(c => c.classList.remove('is-active'));
      isScheduleExpanded = false;

      recalculate();
    });
  }

  // --- Copy Result to Clipboard ---
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const P = engine.parseInput(inputPrincipal ? inputPrincipal.value : 0);
      const R = engine.parseInput(inputRate ? inputRate.value : 0);
      const rawT = engine.parseInput(inputTime ? inputTime.value : 0);
      const unit = selectUnit ? selectUnit.value : 'years';

      const data = engine.calculate(P, R, rawT, unit);
      if (!data.isValid) return;

      const summaryText = [
        '--- CalculatorHub Simple Interest Calculation ---',
        `Principal Amount: ${engine.formatINR(data.principal)}`,
        `Annual Interest Rate: ${data.annualRate}%`,
        `Duration: ${data.durationLabel}${data.unit !== 'years' ? ` (Equivalent: ${data.formattedEquivalentYears})` : ''}`,
        data.unit === 'days' ? 'Day Convention: 365 days/year' : '',
        '------------------------------------------------',
        `Total Maturity Amount: ${engine.formatINR(data.totalAmount)}`,
        `Simple Interest Earned: ${engine.formatINR(data.simpleInterest)}`,
        `Interest Gain on Principal: +${data.interestPercentOfPrincipal.toFixed(2)}%`,
        '------------------------------------------------',
        'Calculate yours at: https://calcuface.co.in/calculators/simple-interest/'
      ].filter(Boolean).join('\n');

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

  // Initial setup and calculation on page load
  updateUnitRanges(currentUnit);
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
