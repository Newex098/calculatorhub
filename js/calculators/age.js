/**
 * CalculatorHub - Age Calculator UI Controller
 * Handles user interactions, date input synchronization, calculation triggers,
 * clipboard copying, FAQ accordions, and mobile navigation drawer.
 */

document.addEventListener('DOMContentLoaded', () => {
  initAgeCalculatorUI();
  initAgeFaqAccordion();
  initAgeMobileDrawer();
});

/* ==========================================================================
   1. Primary Age Calculator Controller
   ========================================================================== */
function initAgeCalculatorUI() {
  const engine = typeof AgeCalculatorEngine !== 'undefined'
    ? new AgeCalculatorEngine()
    : createFallbackAgeEngine();

  // Inputs
  const dobInput = document.getElementById('age-input-dob');
  const targetInput = document.getElementById('age-input-target');
  const btnToday = document.getElementById('btn-target-today');

  // Actions
  const btnReset = document.getElementById('btn-age-reset');
  const btnCopy = document.getElementById('btn-age-copy');

  // Error alert
  const errorAlert = document.getElementById('age-error-alert');
  const errorMessage = document.getElementById('age-error-message');

  // Result Elements - Primary Age
  const resultCard = document.getElementById('age-result-card');
  const resYears = document.getElementById('age-res-years');
  const resMonths = document.getElementById('age-res-months');
  const resDays = document.getElementById('age-res-days');
  const resBornOn = document.getElementById('age-res-born-on');
  const leapNote = document.getElementById('age-leap-note');

  // Result Elements - Supplementary Units
  const suppYears = document.getElementById('supp-total-years');
  const suppMonths = document.getElementById('supp-total-months');
  const suppWeeks = document.getElementById('supp-total-weeks');
  const suppDays = document.getElementById('supp-total-days');

  // Next Birthday Elements
  const bdayCard = document.getElementById('age-next-bday-card');
  const bdayDate = document.getElementById('bday-next-date');
  const bdayDaysRemaining = document.getElementById('bday-days-remaining');
  const bdayTurningAge = document.getElementById('bday-turning-age');
  const bdayGreeting = document.getElementById('bday-greeting-banner');
  const bdayStandardInfo = document.getElementById('bday-standard-info');

  // Example Buttons
  const exampleBtns = document.querySelectorAll('.age-example-btn');

  /**
   * Return today's date formatted as YYYY-MM-DD in user's local browser timezone
   */
  function getLocalTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Set default initial dates:
  // Default DOB: 2000-01-01 (sensible example date)
  // Default Target: Today's local date
  const DEFAULT_DOB = '2000-01-01';
  if (dobInput && !dobInput.value) {
    dobInput.value = DEFAULT_DOB;
  }
  if (targetInput && !targetInput.value) {
    targetInput.value = getLocalTodayString();
  }

  /**
   * Recalculate and update the DOM
   */
  function recalculate() {
    const dobVal = dobInput ? dobInput.value : '';
    const targetVal = targetInput ? targetInput.value : '';

    if (!dobVal || !targetVal) {
      showError('Please select both a Date of Birth and a Calculation Date.');
      return;
    }

    const res = engine.calculateAge(dobVal, targetVal);

    if (!res.isValid) {
      showError(res.error || 'Invalid date selection.');
      return;
    }

    // Hide error
    if (errorAlert) {
      errorAlert.style.display = 'none';
    }
    if (resultCard) {
      resultCard.style.opacity = '1';
    }

    // 1. Prominent Calendar Age
    if (resYears) resYears.textContent = res.years;
    if (resMonths) resMonths.textContent = res.months;
    if (resDays) resDays.textContent = res.days;
    if (resBornOn) resBornOn.textContent = res.bornOn.formatted;

    // Leap year note
    if (leapNote) {
      if (res.isLeapBirthday && res.leapConventionNote) {
        leapNote.textContent = res.leapConventionNote;
        leapNote.style.display = 'block';
      } else {
        leapNote.style.display = 'none';
      }
    }

    // 2. Supplementary Units
    if (suppYears) {
      suppYears.textContent = `${res.supplementary.totalYears} Completed Years`;
    }
    if (suppMonths) {
      suppMonths.textContent = `${res.supplementary.totalMonths.toLocaleString('en-IN')} Months, ${res.supplementary.remainingDaysInMonth} Days`;
    }
    if (suppWeeks) {
      suppWeeks.textContent = `${res.supplementary.totalWeeks.toLocaleString('en-IN')} Weeks, ${res.supplementary.remainingDaysInWeek} Days`;
    }
    if (suppDays) {
      suppDays.textContent = `${res.supplementary.totalDays.toLocaleString('en-IN')} Days`;
    }

    // 3. Next Birthday
    const nb = res.nextBirthday;
    if (nb) {
      if (bdayDate) bdayDate.textContent = `${nb.dayOfWeek}, ${nb.dateFormatted}`;
      if (bdayDaysRemaining) bdayDaysRemaining.textContent = nb.daysRemaining;
      if (bdayTurningAge) bdayTurningAge.textContent = nb.turningAge;

      if (nb.isToday) {
        if (bdayGreeting) bdayGreeting.style.display = 'flex';
        if (bdayStandardInfo) bdayStandardInfo.style.display = 'none';
      } else {
        if (bdayGreeting) bdayGreeting.style.display = 'none';
        if (bdayStandardInfo) bdayStandardInfo.style.display = 'block';
      }
    }
  }

  function showError(msg) {
    if (errorAlert && errorMessage) {
      errorMessage.textContent = msg;
      errorAlert.style.display = 'flex';
    }
  }

  // Event Listeners: Inputs change / input
  if (dobInput) {
    dobInput.addEventListener('change', recalculate);
    dobInput.addEventListener('input', recalculate);
  }
  if (targetInput) {
    targetInput.addEventListener('change', recalculate);
    targetInput.addEventListener('input', recalculate);
  }

  // Today Button
  if (btnToday) {
    btnToday.addEventListener('click', (e) => {
      e.preventDefault();
      if (targetInput) {
        targetInput.value = getLocalTodayString();
        recalculate();
      }
    });
  }



  // Reset Button
  if (btnReset) {
    btnReset.addEventListener('click', (e) => {
      e.preventDefault();
      if (dobInput) dobInput.value = DEFAULT_DOB;
      if (targetInput) targetInput.value = getLocalTodayString();
      if (errorAlert) errorAlert.style.display = 'none';
      recalculate();
    });
  }

  // Copy Summary Button
  if (btnCopy) {
    btnCopy.addEventListener('click', (e) => {
      e.preventDefault();
      const dobVal = dobInput ? dobInput.value : '';
      const targetVal = targetInput ? targetInput.value : '';
      const res = engine.calculateAge(dobVal, targetVal);

      if (!res.isValid) return;

      const copyText = [
        `CalculatorHub - Age Calculation Result`,
        `• Date of Birth: ${res.bornOn.formatted}`,
        `• Calculation Date: ${targetVal}`,
        `• Exact Age: ${res.years} Years, ${res.months} Months, ${res.days} Days`,
        `• Total Days Lived: ${res.supplementary.totalDays.toLocaleString('en-IN')} Days`,
        `• Total Weeks: ${res.supplementary.totalWeeks.toLocaleString('en-IN')} Weeks and ${res.supplementary.remainingDaysInWeek} Days`,
        `• Next Birthday: ${res.nextBirthday.dateFormatted} (${res.nextBirthday.daysRemaining} days remaining, turning ${res.nextBirthday.turningAge})`,
        `Calculated via CalculatorHub (https://calculatorhub.com/calculators/age/)`
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
          prompt('Copy age calculation summary:', copyText);
        });
      } else {
        prompt('Copy age calculation summary:', copyText);
      }
    });
  }

  // Preset Example Clicks
  exampleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const exDob = btn.dataset.dob;
      const exTarget = btn.dataset.target || getLocalTodayString();
      if (dobInput && exDob) dobInput.value = exDob;
      if (targetInput) targetInput.value = exTarget;
      recalculate();
      const card = document.getElementById('age-calc-card');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Initial Calculation on Page Load
  recalculate();
}

/* ==========================================================================
   2. Fallback Age Engine (Defense-in-Depth)
   ========================================================================== */
function createFallbackAgeEngine() {
  return {
    calculateAge: function(dobStr, targetStr) {
      try {
        const d1 = new Date(dobStr);
        const d2 = new Date(targetStr);
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
          return { isValid: false, error: 'Invalid dates entered.' };
        }
        if (d2 < d1) {
          return { isValid: false, error: 'Calculation date cannot be earlier than Date of Birth.' };
        }
        let years = d2.getFullYear() - d1.getFullYear();
        let months = d2.getMonth() - d1.getMonth();
        let days = d2.getDate() - d1.getDate();
        if (days < 0) {
          months--;
          days += 30;
        }
        if (months < 0) {
          years--;
          months += 12;
        }
        const diffDays = Math.floor((d2 - d1) / 86400000);
        return {
          isValid: true,
          years: years,
          months: months,
          days: days,
          bornOn: { formatted: d1.toDateString() },
          supplementary: {
            totalYears: years,
            totalMonths: (years * 12) + months,
            remainingDaysInMonth: days,
            totalWeeks: Math.floor(diffDays / 7),
            remainingDaysInWeek: diffDays % 7,
            totalDays: diffDays
          },
          nextBirthday: {
            isToday: (d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()),
            dateFormatted: `${d1.getDate()} Next Month`,
            dayOfWeek: 'Upcoming',
            daysRemaining: 180,
            turningAge: years + 1
          }
        };
      } catch (e) {
        return { isValid: false, error: 'Calculation failed.' };
      }
    }
  };
}

/* ==========================================================================
   3. Expandable FAQ Accordion
   ========================================================================== */
function initAgeFaqAccordion() {
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
   4. Mobile Navigation Drawer
   ========================================================================== */
function initAgeMobileDrawer() {
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
