/**
 * CalculatorHub - Main JavaScript
 * Handles navigation, interactive search filtering, accordion FAQs, and UI preview interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNavigation();
  initFaqAccordion();
  initCalculatorSearch();
  initEmiPreview();
});

/* ==========================================================================
   1. Mobile Navigation Toggle
   ========================================================================== */
function initMobileNavigation() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const navDrawer = document.getElementById('mobile-nav-drawer');

  if (!toggleBtn || !navDrawer) return;
  if (toggleBtn.dataset.menuInitialized === 'true') return;
  toggleBtn.dataset.menuInitialized = 'true';

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

  // Close mobile drawer when clicking any link inside it
  const mobileLinks = navDrawer.querySelectorAll('.mobile-nav-link');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggleBtn.setAttribute('aria-expanded', 'false');
      navDrawer.setAttribute('hidden', '');
      navDrawer.classList.remove('is-open');
    });
  });
}

/* ==========================================================================
   2. Expandable FAQ Accordion
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isCurrentlyExpanded = item.classList.contains('is-expanded');

      // Optional: Close other FAQs for clean single-accordion experience
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('is-expanded')) {
          otherItem.classList.remove('is-expanded');
          const otherTrigger = otherItem.querySelector('.faq-trigger');
          if (otherTrigger) {
            otherTrigger.setAttribute('aria-expanded', 'false');
          }
        }
      });

      // Toggle clicked item
      if (isCurrentlyExpanded) {
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
   3. Search and Filter Functionality
   ========================================================================== */
function initCalculatorSearch() {
  const searchInput = document.getElementById('calculator-search-input');
  const clearBtn = document.getElementById('search-clear-btn');
  const searchFeedback = document.getElementById('search-feedback');
  const suggestionChips = document.querySelectorAll('.suggestion-chip');
  const calcCards = document.querySelectorAll('#popular-calculators-grid .calc-card');

  if (!searchInput || !calcCards.length) return;

  function performFilter(term) {
    const query = term.trim().toLowerCase();

    // Toggle clear button
    if (query.length > 0) {
      clearBtn?.classList.add('is-active');
    } else {
      clearBtn?.classList.remove('is-active');
    }

    let matchCount = 0;
    const registryResults = (typeof CalculatorRegistry !== 'undefined')
      ? CalculatorRegistry.search(query).map(c => c.name.toLowerCase())
      : [];

    calcCards.forEach(card => {
      const name = (card.getAttribute('data-calc-name') || '').toLowerCase();
      const keywords = (card.getAttribute('data-keywords') || '').toLowerCase();
      const text = card.textContent?.toLowerCase() || '';

      const isMatch = !query 
        || registryResults.includes(name) 
        || name.includes(query) 
        || keywords.includes(query) 
        || text.includes(query);

      if (isMatch) {
        card.style.display = 'flex';
        matchCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Feedback message
    if (query.length > 0) {
      if (searchFeedback) {
        searchFeedback.classList.add('is-visible');
        if (matchCount > 0) {
          searchFeedback.innerHTML = `Found <strong>${matchCount}</strong> calculator${matchCount > 1 ? 's' : ''} matching "<strong>${escapeHtml(query)}</strong>"`;
        } else {
          searchFeedback.innerHTML = `No calculators found matching "<strong>${escapeHtml(query)}</strong>". Showing all popular tools.`;
          // Reset cards display so user is not left with blank space
          calcCards.forEach(card => card.style.display = 'flex');
        }
      }
    } else {
      if (searchFeedback) {
        searchFeedback.classList.remove('is-visible');
        searchFeedback.innerHTML = '';
      }
    }
  }

  // Input event
  searchInput.addEventListener('input', (e) => {
    performFilter(e.target.value);
  });

  // Clear button click
  clearBtn?.addEventListener('click', () => {
    searchInput.value = '';
    performFilter('');
    searchInput.focus();
  });

  // Suggestion chip clicks
  suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-search') || chip.textContent?.trim() || '';
      searchInput.value = query;
      performFilter(query);

      // Scroll smoothly to popular section
      const popularSection = document.getElementById('popular');
      if (popularSection) {
        popularSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

/* ==========================================================================
   4. Featured EMI Calculator Interactive UI Preview
   ========================================================================== */
function initEmiPreview() {
  const amountInput = document.getElementById('emi-loan-amount');
  const amountRange = document.getElementById('emi-range-amount');
  const amountBadge = document.getElementById('preview-amount-val');

  const rateInput = document.getElementById('emi-interest-rate');
  const rateRange = document.getElementById('emi-range-rate');
  const rateBadge = document.getElementById('preview-rate-val');

  const tenureInput = document.getElementById('emi-loan-tenure');
  const tenureRange = document.getElementById('emi-range-tenure');
  const tenureBadge = document.getElementById('preview-tenure-val');

  const btnCalculate = document.getElementById('btn-demo-calculate');

  const emiDisplay = document.getElementById('result-emi-amount');
  const principalDisplay = document.getElementById('result-principal');
  const interestDisplay = document.getElementById('result-interest');
  const totalDisplay = document.getElementById('result-total');

  const barPrincipal = document.getElementById('bar-principal');
  const barInterest = document.getElementById('bar-interest');
  const pctPrincipal = document.getElementById('pct-principal');
  const pctInterest = document.getElementById('pct-interest');

  // Format number into Indian currency style (e.g. 10,00,000)
  function formatINR(val) {
    const num = Math.round(val);
    return '₹' + num.toLocaleString('en-IN');
  }

  // Standard EMI Formula: E = P * r * (1+r)^n / ((1+r)^n - 1)
  function updateCalculations() {
    let p = parseFloat((amountRange ? amountRange.value : amountInput?.value) || '1000000');
    let annualRate = parseFloat((rateRange ? rateRange.value : rateInput?.value) || '8.5');
    let years = parseFloat((tenureRange ? tenureRange.value : tenureInput?.value) || '20');

    if (isNaN(p) || p <= 0) p = 1000000;
    if (isNaN(annualRate) || annualRate <= 0) annualRate = 8.5;
    if (isNaN(years) || years <= 0) years = 20;

    const r = annualRate / (12 * 100); // monthly interest rate
    const n = years * 12;             // total number of months

    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - p;

    const pPct = Math.round((p / totalPayment) * 100);
    const iPct = 100 - pPct;

    if (emiDisplay) emiDisplay.textContent = formatINR(emi);
    if (principalDisplay) principalDisplay.textContent = formatINR(p);
    if (interestDisplay) interestDisplay.textContent = formatINR(totalInterest);
    if (totalDisplay) totalDisplay.textContent = formatINR(totalPayment);

    if (barPrincipal) barPrincipal.style.width = `${pPct}%`;
    if (barInterest) barInterest.style.width = `${iPct}%`;
    if (pctPrincipal) pctPrincipal.textContent = `${pPct}%`;
    if (pctInterest) pctInterest.textContent = `${iPct}%`;
  }

  // Slider & input sync for Amount
  if (amountRange && amountInput) {
    amountRange.addEventListener('input', () => {
      const formatted = Number(amountRange.value).toLocaleString('en-IN');
      amountInput.value = formatted;
      if (amountBadge) amountBadge.textContent = '₹' + formatted;
      updateCalculations();
    });

    amountInput.addEventListener('input', () => {
      const clean = amountInput.value.replace(/[^0-9]/g, '');
      const val = parseInt(clean, 10);
      if (!isNaN(val)) {
        amountRange.value = val;
        if (amountBadge) amountBadge.textContent = '₹' + val.toLocaleString('en-IN');
        updateCalculations();
      }
    });
  }

  // Slider & input sync for Rate
  if (rateRange && rateInput) {
    rateRange.addEventListener('input', () => {
      rateInput.value = rateRange.value;
      if (rateBadge) rateBadge.textContent = rateRange.value + '%';
      updateCalculations();
    });

    rateInput.addEventListener('input', () => {
      const val = parseFloat(rateInput.value);
      if (!isNaN(val)) {
        rateRange.value = val;
        if (rateBadge) rateBadge.textContent = val + '%';
        updateCalculations();
      }
    });
  }

  // Slider & input sync for Tenure
  if (tenureRange && tenureInput) {
    tenureRange.addEventListener('input', () => {
      tenureInput.value = tenureRange.value;
      if (tenureBadge) tenureBadge.textContent = tenureRange.value + ' Years';
      updateCalculations();
    });

    tenureInput.addEventListener('input', () => {
      const val = parseInt(tenureInput.value, 10);
      if (!isNaN(val)) {
        tenureRange.value = val;
        if (tenureBadge) tenureBadge.textContent = val + ' Years';
        updateCalculations();
      }
    });
  }

  // Prominent Calculate Button Click (visual feedback)
  if (btnCalculate) {
    btnCalculate.addEventListener('click', () => {
      updateCalculations();
      
      // Button click animation
      const originalHtml = btnCalculate.innerHTML;
      btnCalculate.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>Calculated!</span>
      `;
      btnCalculate.style.backgroundColor = 'var(--accent-green)';

      setTimeout(() => {
        btnCalculate.innerHTML = originalHtml;
        btnCalculate.style.backgroundColor = '';
      }, 1200);
    });
  }

  // Initial calculation on load
  updateCalculations();
}
