/**
 * CalculatorHub - SIP Calculator UI Controller
 * Bridges user inputs, sliders, Step-Up toggle, presets, and growth tables
 * with SipCalculatorEngine.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSipCalculatorUI();
  initSipFaqAccordion();
  initSipMobileDrawer();
});

function initSipCalculatorUI() {
  const engine = typeof SipCalculatorEngine !== 'undefined'
    ? new SipCalculatorEngine()
    : createFallbackSipEngine();

  // Inputs & Sliders
  const amountInput = document.getElementById('sip-input-amount');
  const amountSlider = document.getElementById('sip-slider-amount');
  const amountPill = document.getElementById('sip-pill-amount');

  const rateInput = document.getElementById('sip-input-rate');
  const rateSlider = document.getElementById('sip-slider-rate');
  const ratePill = document.getElementById('sip-pill-rate');

  const yearsInput = document.getElementById('sip-input-years');
  const yearsSlider = document.getElementById('sip-slider-years');
  const yearsPill = document.getElementById('sip-pill-years');

  // Step-Up Elements
  const stepUpToggle = document.getElementById('stepup-toggle-btn');
  const stepUpGroup = document.getElementById('stepup-controls-group');
  const stepUpInput = document.getElementById('sip-input-stepup');
  const stepUpSlider = document.getElementById('sip-slider-stepup');
  const stepUpPill = document.getElementById('sip-pill-stepup');
  const stepUpPresets = document.querySelectorAll('.stepup-preset-chip');

  // Action Buttons
  const btnReset = document.getElementById('btn-sip-reset');
  const btnCopy = document.getElementById('btn-sip-copy');

  // Quick Examples
  const exampleChips = document.querySelectorAll('.example-chip');

  // Output Result Elements
  const resultFv = document.getElementById('result-sip-fv');
  const resultFvSubtitle = document.getElementById('result-sip-fv-subtitle');
  const resultInvested = document.getElementById('result-sip-invested');
  const resultReturns = document.getElementById('result-sip-returns');
  const resultDuration = document.getElementById('result-sip-duration');

  // Visual Breakdown Bar
  const barInvested = document.getElementById('bar-invested');
  const barReturns = document.getElementById('bar-returns');
  const pctInvested = document.getElementById('pct-invested');
  const pctReturns = document.getElementById('pct-returns');

  // Step-Up Comparison Box
  const comparisonBox = document.getElementById('stepup-comparison-box');
  const cmpStdInvested = document.getElementById('cmp-std-invested');
  const cmpStdFv = document.getElementById('cmp-std-fv');
  const cmpStdReturns = document.getElementById('cmp-std-returns');
  const cmpStepInvested = document.getElementById('cmp-step-invested');
  const cmpStepFv = document.getElementById('cmp-step-fv');
  const cmpStepReturns = document.getElementById('cmp-step-returns');
  const cmpDiffFv = document.getElementById('cmp-diff-fv');

  // Yearly Growth Table
  const scheduleTbody = document.getElementById('sip-schedule-tbody');
  const btnToggleSchedule = document.getElementById('btn-toggle-schedule');

  // State
  let isStepUpActive = false;
  let isScheduleExpanded = false;

  const DEFAULTS = {
    amount: 5000,
    rate: 12,
    years: 10,
    isStepUp: false,
    stepUpPercent: 10
  };

  /**
   * Synchronize input and slider pairs
   */
  function syncPair(inputEl, sliderEl, pillEl, formatFn) {
    if (!inputEl) return;

    inputEl.addEventListener('input', () => {
      const val = parseFloat(inputEl.value);
      if (!isNaN(val) && sliderEl) {
        sliderEl.value = val;
      }
      if (pillEl && formatFn) {
        pillEl.textContent = formatFn(val);
      }
      recalculate();
    });

    if (sliderEl) {
      sliderEl.addEventListener('input', () => {
        const val = parseFloat(sliderEl.value);
        if (!isNaN(val)) {
          inputEl.value = val;
        }
        if (pillEl && formatFn) {
          pillEl.textContent = formatFn(val);
        }
        recalculate();
      });
    }
  }

  // Bind input/slider syncing
  syncPair(amountInput, amountSlider, amountPill, (v) => engine.formatINR(v));
  syncPair(rateInput, rateSlider, ratePill, (v) => `${v}%`);
  syncPair(yearsInput, yearsSlider, yearsPill, (v) => `${v} Yr${v > 1 ? 's' : ''}`);
  syncPair(stepUpInput, stepUpSlider, stepUpPill, (v) => `${v}%`);

  /**
   * Toggle Step-Up ON/OFF
   */
  function setStepUp(active) {
    isStepUpActive = Boolean(active);

    if (stepUpToggle) {
      stepUpToggle.setAttribute('aria-checked', String(isStepUpActive));
      if (isStepUpActive) {
        stepUpToggle.classList.add('is-active');
      } else {
        stepUpToggle.classList.remove('is-active');
      }
    }

    if (stepUpGroup) {
      stepUpGroup.style.display = isStepUpActive ? 'block' : 'none';
    }

    if (comparisonBox) {
      comparisonBox.style.display = isStepUpActive ? 'block' : 'none';
    }

    recalculate();
  }

  if (stepUpToggle) {
    stepUpToggle.addEventListener('click', (e) => {
      e.preventDefault();
      setStepUp(!isStepUpActive);
    });
  }

  // Step-Up preset buttons (5%, 10%, 15%)
  stepUpPresets.forEach(preset => {
    preset.addEventListener('click', (e) => {
      e.preventDefault();
      const pct = parseFloat(preset.dataset.pct);
      if (!isNaN(pct)) {
        if (stepUpInput) stepUpInput.value = pct;
        if (stepUpSlider) stepUpSlider.value = pct;
        if (stepUpPill) stepUpPill.textContent = `${pct}%`;

        stepUpPresets.forEach(p => p.classList.remove('is-active'));
        preset.classList.add('is-active');

        recalculate();
      }
    });
  });

  // Quick Test Example Chips
  exampleChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const exAmount = parseFloat(chip.dataset.amount);
      const exYears = parseFloat(chip.dataset.years);
      const exRate = parseFloat(chip.dataset.rate);

      if (!isNaN(exAmount) && amountInput) {
        amountInput.value = exAmount;
        if (amountSlider) amountSlider.value = exAmount;
        if (amountPill) amountPill.textContent = engine.formatINR(exAmount);
      }
      if (!isNaN(exYears) && yearsInput) {
        yearsInput.value = exYears;
        if (yearsSlider) yearsSlider.value = exYears;
        if (yearsPill) yearsPill.textContent = `${exYears} Yrs`;
      }
      if (!isNaN(exRate) && rateInput) {
        rateInput.value = exRate;
        if (rateSlider) rateSlider.value = exRate;
        if (ratePill) ratePill.textContent = `${exRate}%`;
      }

      setStepUp(false);

      // Subtle pulse feedback
      chip.style.transform = 'scale(0.96)';
      setTimeout(() => {
        chip.style.transform = '';
      }, 150);

      recalculate();
    });
  });

  /**
   * Recalculate and update the UI
   */
  function recalculate() {
    const rawAmount = engine.parseInput(amountInput ? amountInput.value : DEFAULTS.amount);
    const rawRate = engine.parseInput(rateInput ? rateInput.value : DEFAULTS.rate);
    const rawYears = Math.max(1, Math.min(50, Math.round(engine.parseInput(yearsInput ? yearsInput.value : DEFAULTS.years))));
    const rawStepUp = engine.parseInput(stepUpInput ? stepUpInput.value : DEFAULTS.stepUpPercent);

    // Update pill tags in case they weren't updated
    if (amountPill) amountPill.textContent = engine.formatINR(rawAmount);
    if (ratePill) ratePill.textContent = `${rawRate}%`;
    if (yearsPill) yearsPill.textContent = `${rawYears} Yr${rawYears > 1 ? 's' : ''}`;
    if (stepUpPill) stepUpPill.textContent = `${rawStepUp}%`;

    const data = engine.calculate({
      monthlyInvestment: rawAmount,
      annualRate: rawRate,
      years: rawYears,
      isStepUp: isStepUpActive,
      stepUpPercent: rawStepUp
    });

    // Update Prominent Future Value Display
    if (resultFv) resultFv.textContent = data.formatted.futureValue;
    if (resultFvSubtitle) {
      if (isStepUpActive) {
        resultFvSubtitle.textContent = `Estimated value with ${rawStepUp}% yearly step-up over ${rawYears} years`;
      } else {
        resultFvSubtitle.textContent = `Estimated maturity wealth over ${rawYears} years at ${rawRate}% assumed return`;
      }
    }

    // Update Secondary Results
    if (resultInvested) resultInvested.textContent = data.formatted.totalInvested;
    if (resultReturns) resultReturns.textContent = data.formatted.estimatedReturns;
    if (resultDuration) resultDuration.textContent = data.formatted.durationLabel;

    // Update Visual Ratio Bar
    if (barInvested) barInvested.style.width = `${data.investedPercentage}%`;
    if (barReturns) barReturns.style.width = `${data.returnsPercentage}%`;
    if (pctInvested) pctInvested.textContent = `${data.investedPercentage}%`;
    if (pctReturns) pctReturns.textContent = `${data.returnsPercentage}%`;

    // Update Step-Up Comparison Box (if active)
    if (isStepUpActive && data.comparison) {
      if (cmpStdInvested) cmpStdInvested.textContent = data.comparison.standard.formatted.totalInvested;
      if (cmpStdFv) cmpStdFv.textContent = data.comparison.standard.formatted.futureValue;
      if (cmpStdReturns) cmpStdReturns.textContent = data.comparison.standard.formatted.estimatedReturns;

      if (cmpStepInvested) cmpStepInvested.textContent = data.comparison.stepUp.formatted.totalInvested;
      if (cmpStepFv) cmpStepFv.textContent = data.comparison.stepUp.formatted.futureValue;
      if (cmpStepReturns) cmpStepReturns.textContent = data.comparison.stepUp.formatted.estimatedReturns;

      if (cmpDiffFv) {
        cmpDiffFv.textContent = `+${data.comparison.difference.formatted.futureValue}`;
      }
    }

    // Render Yearly Growth Schedule Table
    renderGrowthTable(data.yearlySchedule);
  }

  /**
   * Render yearly schedule rows
   */
  function renderGrowthTable(schedule) {
    if (!scheduleTbody || !schedule) return;

    scheduleTbody.innerHTML = '';
    const visibleCount = isScheduleExpanded ? schedule.length : Math.min(5, schedule.length);

    schedule.slice(0, visibleCount).forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600;">Year ${row.year}</td>
        <td>${engine.formatINR(row.monthlyInvestment)}</td>
        <td>${engine.formatINR(row.cumulativeInvested)}</td>
        <td class="sip-returns-col">+${engine.formatINR(row.estimatedReturns)}</td>
        <td class="sip-highlight-balance">${engine.formatINR(row.totalValue)}</td>
      `;
      scheduleTbody.appendChild(tr);
    });

    if (btnToggleSchedule) {
      if (schedule.length > 5) {
        btnToggleSchedule.style.display = 'inline-flex';
        btnToggleSchedule.textContent = isScheduleExpanded 
          ? 'Show Less Years' 
          : `View Full ${schedule.length}-Year Schedule (${schedule.length - 5} more)`;
      } else {
        btnToggleSchedule.style.display = 'none';
      }
    }
  }

  // Toggle Table Rows Expansion
  if (btnToggleSchedule) {
    btnToggleSchedule.addEventListener('click', (e) => {
      e.preventDefault();
      isScheduleExpanded = !isScheduleExpanded;
      recalculate();
    });
  }



  // Reset Button
  if (btnReset) {
    btnReset.addEventListener('click', (e) => {
      e.preventDefault();
      if (amountInput) amountInput.value = DEFAULTS.amount;
      if (amountSlider) amountSlider.value = DEFAULTS.amount;

      if (rateInput) rateInput.value = DEFAULTS.rate;
      if (rateSlider) rateSlider.value = DEFAULTS.rate;

      if (yearsInput) yearsInput.value = DEFAULTS.years;
      if (yearsSlider) yearsSlider.value = DEFAULTS.years;

      if (stepUpInput) stepUpInput.value = DEFAULTS.stepUpPercent;
      if (stepUpSlider) stepUpSlider.value = DEFAULTS.stepUpPercent;

      stepUpPresets.forEach(p => {
        if (parseFloat(p.dataset.pct) === 10) p.classList.add('is-active');
        else p.classList.remove('is-active');
      });

      isScheduleExpanded = false;
      setStepUp(false);
    });
  }

  // Copy Calculation Summary
  if (btnCopy) {
    btnCopy.addEventListener('click', (e) => {
      e.preventDefault();
      const rawAmount = engine.parseInput(amountInput ? amountInput.value : DEFAULTS.amount);
      const rawRate = engine.parseInput(rateInput ? rateInput.value : DEFAULTS.rate);
      const rawYears = Math.max(1, Math.min(50, Math.round(engine.parseInput(yearsInput ? yearsInput.value : DEFAULTS.years))));
      const rawStepUp = engine.parseInput(stepUpInput ? stepUpInput.value : DEFAULTS.stepUpPercent);

      const data = engine.calculate({
        monthlyInvestment: rawAmount,
        annualRate: rawRate,
        years: rawYears,
        isStepUp: isStepUpActive,
        stepUpPercent: rawStepUp
      });

      const copyText = [
        `CalculatorHub SIP Calculation Summary:`,
        `• Monthly Investment: ${data.formatted.monthlyInvestment}`,
        `• Assumed Annual Return: ${data.formatted.rateLabel}`,
        `• Investment Duration: ${data.formatted.durationLabel}`,
        isStepUpActive ? `• Annual Step-Up: ${data.formatted.stepUpLabel}` : `• Annual Step-Up: None (Fixed)`,
        `• Total Invested Amount: ${data.formatted.totalInvested}`,
        `• Estimated Returns: ${data.formatted.estimatedReturns}`,
        `• Estimated Future Value: ${data.formatted.futureValue}`,
        `Note: Mutual fund returns are market-linked and not guaranteed.`,
        `Calculated via CalculatorHub (https://calcuface.co.in/calculators/sip/)`
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
          prompt('Copy calculation summary:', copyText);
        });
      } else {
        prompt('Copy calculation summary:', copyText);
      }
    });
  }

  // Initial Calculation Run
  setStepUp(false);
}

/**
 * Fallback engine if external file failed to load
 */
function createFallbackSipEngine() {
  return {
    formatINR: function(val) {
      if (val === null || val === undefined || isNaN(val)) return '₹0';
      const absVal = Math.abs(val);
      return (val < 0 ? '-₹' : '₹') + Math.round(absVal).toLocaleString('en-IN');
    },
    parseInput: function(input) {
      if (typeof input === 'number') return isNaN(input) ? 0 : Math.max(0, input);
      if (!input || typeof input !== 'string') return 0;
      const clean = input.replace(/[^0-9.-]/g, '');
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : Math.max(0, num);
    },
    calculate: function(opts) {
      const P = this.parseInput(opts.monthlyInvestment);
      const R = this.parseInput(opts.annualRate);
      const N = Math.max(1, Math.round(this.parseInput(opts.years)));
      const n = N * 12;
      const r = (R / 100) / 12;
      const tot = P * n;
      const fv = r <= 0 ? tot : P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      return {
        isValid: true,
        futureValue: Math.round(fv),
        totalInvested: Math.round(tot),
        estimatedReturns: Math.round(fv - tot),
        investedPercentage: 50,
        returnsPercentage: 50,
        yearlySchedule: [],
        formatted: {
          monthlyInvestment: this.formatINR(P),
          totalInvested: this.formatINR(tot),
          estimatedReturns: this.formatINR(fv - tot),
          futureValue: this.formatINR(fv),
          durationLabel: `${N} Years`,
          rateLabel: `${R}%`,
          stepUpLabel: '10%'
        }
      };
    }
  };
}

/* ==========================================================================
   2. Expandable FAQ Accordion
   ========================================================================== */
function initSipFaqAccordion() {
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
function initSipMobileDrawer() {
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
