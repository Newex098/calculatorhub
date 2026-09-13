/**
 * CalculatorHub - EMI Calculation Engine (India)
 * Pure computation engine for reducing-balance loan Equated Monthly Instalments (EMI).
 * Independent of DOM and UI rendering.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.EmiCalculatorEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  function EmiCalculatorEngine() {}

  /**
   * Format numbers into Indian Currency system (e.g. ₹10,00,000)
   * @param {number} val - Number to format
   * @param {boolean} [includeDecimals=false] - Whether to show paise/decimals
   * @returns {string} Formatted Indian Rupee string
   */
  EmiCalculatorEngine.prototype.formatINR = function(val, includeDecimals) {
    if (val === null || val === undefined || isNaN(val)) {
      return '₹0';
    }

    const isNegative = val < 0;
    const absVal = Math.abs(val);

    let formatted = '';
    if (includeDecimals) {
      const parts = absVal.toFixed(2).split('.');
      formatted = Number(parts[0]).toLocaleString('en-IN') + '.' + parts[1];
    } else {
      formatted = Math.round(absVal).toLocaleString('en-IN');
    }

    return (isNegative ? '-₹' : '₹') + formatted;
  };

  /**
   * Parse numeric value from string containing commas or currency symbols
   * @param {string|number} input
   * @returns {number} Clean float number
   */
  EmiCalculatorEngine.prototype.parseInput = function(input) {
    if (typeof input === 'number') {
      return isNaN(input) ? 0 : input;
    }
    if (!input || typeof input !== 'string') {
      return 0;
    }
    const clean = input.replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  /**
   * Calculate Equated Monthly Instalment and full payment breakdown
   * Formula: EMI = [P x r x (1+r)^n] / [(1+r)^n - 1]
   * 
   * @param {number} principal - Principal Loan Amount (P) in ₹
   * @param {number} annualRate - Annual Interest Rate (R) in % (e.g. 8.5)
   * @param {number} tenureMonths - Total Loan Tenure in Months (n)
   * @returns {Object} Full calculation results and amortization schedule
   */
  EmiCalculatorEngine.prototype.calculate = function(principal, annualRate, tenureMonths) {
    const P = this.parseInput(principal);
    const R = this.parseInput(annualRate);
    const n = Math.max(1, Math.round(this.parseInput(tenureMonths)));

    // Handle invalid or zero principal
    if (P <= 0 || n <= 0) {
      return {
        isValid: false,
        monthlyEmi: 0,
        principalAmount: 0,
        totalInterest: 0,
        totalPayment: 0,
        principalPercentage: 0,
        interestPercentage: 0,
        yearlyAmortization: [],
        formatted: {
          monthlyEmi: '₹0',
          principalAmount: '₹0',
          totalInterest: '₹0',
          totalPayment: '₹0'
        }
      };
    }

    let monthlyEmi = 0;
    let totalPayment = 0;
    let totalInterest = 0;

    // Special Case: 0% Interest
    if (R <= 0) {
      monthlyEmi = P / n;
      totalPayment = P;
      totalInterest = 0;
    } else {
      // Standard Reducing-Balance Formula
      const r = R / (12 * 100); // monthly interest rate
      const factor = Math.pow(1 + r, n);
      if (!isFinite(factor)) {
        monthlyEmi = P * r;
      } else {
        monthlyEmi = (P * r * factor) / (factor - 1);
      }
      totalPayment = monthlyEmi * n;
      totalInterest = Math.max(0, totalPayment - P);
    }

    const principalPct = totalPayment > 0 ? Math.round((P / totalPayment) * 100) : 100;
    const interestPct = Math.max(0, 100 - principalPct);

    // Build Amortization Schedule (Yearly Aggregation)
    const yearlyAmortization = [];
    const r = R > 0 ? R / (12 * 100) : 0;
    let remainingBalance = P;
    const totalYears = Math.ceil(n / 12);

    for (let year = 1; year <= totalYears; year++) {
      const yearOpening = remainingBalance;
      let yearPrincipal = 0;
      let yearInterest = 0;

      const monthsInThisYear = Math.min(12, n - (year - 1) * 12);

      for (let m = 0; m < monthsInThisYear; m++) {
        if (remainingBalance <= 0) break;

        const monthInterest = r > 0 ? remainingBalance * r : 0;
        let monthPrincipal = monthlyEmi - monthInterest;

        if (monthPrincipal > remainingBalance) {
          monthPrincipal = remainingBalance;
        }

        yearInterest += monthInterest;
        yearPrincipal += monthPrincipal;
        remainingBalance -= monthPrincipal;
      }

      if (remainingBalance < 0.01) {
        remainingBalance = 0;
      }

      yearlyAmortization.push({
        year: year,
        openingBalance: Math.round(yearOpening),
        principalPaid: Math.round(yearPrincipal),
        interestPaid: Math.round(yearInterest),
        totalPayment: Math.round(yearPrincipal + yearInterest),
        closingBalance: Math.round(remainingBalance)
      });
    }

    return {
      isValid: true,
      monthlyEmi: Math.round(monthlyEmi),
      monthlyEmiExact: monthlyEmi,
      principalAmount: Math.round(P),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
      principalPercentage: principalPct,
      interestPercentage: interestPct,
      yearlyAmortization: yearlyAmortization,
      formatted: {
        monthlyEmi: this.formatINR(monthlyEmi),
        principalAmount: this.formatINR(P),
        totalInterest: this.formatINR(totalInterest),
        totalPayment: this.formatINR(totalPayment)
      }
    };
  };

  return EmiCalculatorEngine;
});
