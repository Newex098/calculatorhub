/**
 * CalculatorHub - General-Purpose Loan Calculation Engine
 * Pure mathematical engine for reducing-balance loan calculations,
 * multi-frequency repayment options, and amortization schedules.
 * 
 * Formula:
 *   Payment = P * r * (1 + r)^n / ((1 + r)^n - 1)
 * Where:
 *   P = Loan Principal Amount
 *   r = Periodic Interest Rate (annualRate / periodsPerYear / 100)
 *   n = Total Number of Repayment Periods (totalYears * periodsPerYear)
 * 
 * Frequencies Supported:
 *   - Monthly: 12 periods/year
 *   - Quarterly: 4 periods/year
 *   - Half-Yearly: 2 periods/year
 *   - Yearly: 1 period/year
 * 
 * Zero external dependencies, pure JavaScript, safe against NaN/Infinity.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LoanCalculatorEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  function LoanCalculatorEngine() {}

  LoanCalculatorEngine.FREQUENCY_PERIODS = {
    'monthly': 12,
    'quarterly': 4,
    'half_yearly': 2,
    'yearly': 1
  };

  /**
   * Format numbers into the Indian numbering system (e.g. ₹5,00,000, ₹10,624, ₹6,37,411)
   * @param {number} val - Amount to format
   * @param {boolean} [forceDecimals=false] - Whether to enforce 2 decimal places
   * @returns {string} Formatted Indian Rupee string
   */
  LoanCalculatorEngine.prototype.formatINR = function(val, forceDecimals) {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
      return '₹0';
    }

    const isNegative = val < 0;
    const absVal = Math.abs(val);

    const hasFractions = (Math.abs(absVal - Math.round(absVal)) > 0.005);
    let formatted = '';

    if (forceDecimals || (hasFractions && absVal < 100000)) {
      const parts = absVal.toFixed(2).split('.');
      formatted = Number(parts[0]).toLocaleString('en-IN') + '.' + parts[1];
    } else {
      formatted = Math.round(absVal).toLocaleString('en-IN');
    }

    return (isNegative ? '-₹' : '₹') + formatted;
  };

  /**
   * Format percentage string
   * @param {number} val - Percentage value
   * @param {number} [decimals=2] - Decimal places
   * @returns {string} Formatted percentage string
   */
  LoanCalculatorEngine.prototype.formatPercent = function(val, decimals) {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
      return '0%';
    }
    const dec = typeof decimals === 'number' ? decimals : 2;
    const str = val.toFixed(dec);
    return (val % 1 === 0 ? val.toFixed(0) : parseFloat(str).toString()) + '%';
  };

  /**
   * Safely sanitize and parse user input into float
   * @param {string|number} input
   * @returns {number} Sanitized float number
   */
  LoanCalculatorEngine.prototype.parseInput = function(input) {
    if (typeof input === 'number') {
      return isNaN(input) || !isFinite(input) ? 0 : input;
    }
    if (!input || typeof input !== 'string') {
      return 0;
    }
    const clean = input.replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) || !isFinite(num) ? 0 : num;
  };

  /**
   * Validate loan input parameters
   * @param {number} principal
   * @param {number} rate
   * @param {number} tenure
   * @returns {Object} Validation result { isValid: boolean, error: string|null }
   */
  LoanCalculatorEngine.prototype.validate = function(principal, rate, tenure) {
    if (principal < 0) {
      return { isValid: false, error: 'Loan principal cannot be negative.' };
    }
    if (rate < 0) {
      return { isValid: false, error: 'Interest rate cannot be negative.' };
    }
    if (tenure <= 0) {
      return { isValid: false, error: 'Loan tenure must be greater than zero.' };
    }
    return { isValid: true, error: null };
  };

  /**
   * Compute loan repayment figures and complete amortization schedule
   * 
   * @param {number|string} principal - Loan amount (P)
   * @param {number|string} annualRate - Annual interest rate in percent (e.g. 10 for 10%)
   * @param {number|string} tenure - Tenure numeric value
   * @param {string} [tenureUnit='years'] - 'years' or 'months'
   * @param {string} [frequency='monthly'] - 'monthly', 'quarterly', 'half_yearly', 'yearly'
   * @returns {Object} Comprehensive calculation result object
   */
  LoanCalculatorEngine.prototype.calculate = function(principal, annualRate, tenure, tenureUnit, frequency) {
    const rawP = this.parseInput(principal);
    const rawR = this.parseInput(annualRate);
    const rawT = this.parseInput(tenure);
    const unit = (tenureUnit || 'years').toLowerCase();
    const freqKey = (frequency || 'monthly').toLowerCase();

    const validation = this.validate(rawP, rawR, rawT);
    if (!validation.isValid) {
      return {
        isValid: false,
        errorMessage: validation.error,
        principal: 0,
        annualRate: 0,
        tenure: 0,
        tenureUnit: unit,
        frequency: freqKey,
        periodsPerYear: 12,
        numberOfPeriods: 0,
        periodicPayment: 0,
        totalPayment: 0,
        totalInterest: 0,
        interestPercentOfPrincipal: 0,
        principalRatio: 100,
        interestRatio: 0,
        amortizationSchedule: []
      };
    }

    const P = rawP;
    const R = rawR;
    const periodsPerYear = LoanCalculatorEngine.FREQUENCY_PERIODS[freqKey] || 12;

    // Convert tenure to total years
    const totalYears = unit === 'months' ? (rawT / 12) : rawT;

    // Total number of payment periods (rounded to nearest positive integer, minimum 1)
    const n = Math.max(1, Math.round(totalYears * periodsPerYear));

    // Zero loan amount edge case
    if (P === 0) {
      return {
        isValid: true,
        errorMessage: null,
        principal: 0,
        annualRate: R,
        tenure: rawT,
        tenureUnit: unit,
        frequency: freqKey,
        periodsPerYear: periodsPerYear,
        numberOfPeriods: n,
        periodicPayment: 0,
        totalPayment: 0,
        totalInterest: 0,
        interestPercentOfPrincipal: 0,
        principalRatio: 100,
        interestRatio: 0,
        amortizationSchedule: []
      };
    }

    let periodicPayment = 0;
    let totalPayment = 0;
    let totalInterest = 0;

    // Periodic interest rate
    const r = (R / 100) / periodsPerYear;

    // 0% Interest Rate Special Handling
    if (R === 0 || r === 0) {
      periodicPayment = P / n;
      totalPayment = P;
      totalInterest = 0;
    } else {
      // Standard Reducing Balance Formula: Payment = P * r * (1+r)^n / ((1+r)^n - 1)
      const factor = Math.pow(1 + r, n);
      if (!isFinite(factor) || factor <= 1) {
        // Fallback for extreme values
        periodicPayment = (P / n) + (P * r);
      } else {
        periodicPayment = P * r * factor / (factor - 1);
      }
      totalPayment = periodicPayment * n;
      totalInterest = Math.max(0, totalPayment - P);
    }

    // Safety guards against NaN or Infinity
    if (isNaN(periodicPayment) || !isFinite(periodicPayment)) {
      periodicPayment = P / n;
    }
    if (isNaN(totalPayment) || !isFinite(totalPayment)) {
      totalPayment = P;
    }
    if (isNaN(totalInterest) || !isFinite(totalInterest)) {
      totalInterest = 0;
    }

    const interestPercentOfPrincipal = P > 0 ? (totalInterest / P) * 100 : 0;

    // Ratios for visual breakdown bar
    let principalRatio = 100;
    let interestRatio = 0;
    if (totalPayment > 0) {
      principalRatio = Math.max(0, Math.min(100, (P / totalPayment) * 100));
      interestRatio = Math.max(0, Math.min(100, 100 - principalRatio));
    }

    // Generate Amortization Schedule
    const schedule = [];
    let runningBalance = P;

    for (let i = 1; i <= n; i++) {
      const startBalance = runningBalance;
      const interestForPeriod = R === 0 ? 0 : startBalance * r;
      let principalForPeriod = 0;
      let paymentForPeriod = periodicPayment;
      let endBalance = 0;

      if (i === n) {
        // Last period adjustment: clear exact remaining principal to eliminate floating-point error
        principalForPeriod = startBalance;
        paymentForPeriod = principalForPeriod + interestForPeriod;
        endBalance = 0;
      } else {
        principalForPeriod = Math.max(0, periodicPayment - interestForPeriod);
        endBalance = Math.max(0, startBalance - principalForPeriod);
      }

      schedule.push({
        period: i,
        startingBalance: startBalance,
        payment: paymentForPeriod,
        interest: interestForPeriod,
        principal: principalForPeriod,
        endingBalance: endBalance
      });

      runningBalance = endBalance;
    }

    return {
      isValid: true,
      errorMessage: null,
      principal: P,
      annualRate: R,
      tenure: rawT,
      tenureUnit: unit,
      frequency: freqKey,
      periodsPerYear: periodsPerYear,
      numberOfPeriods: n,
      periodicPayment: periodicPayment,
      totalPayment: totalPayment,
      totalInterest: totalInterest,
      interestPercentOfPrincipal: interestPercentOfPrincipal,
      principalRatio: principalRatio,
      interestRatio: interestRatio,
      amortizationSchedule: schedule
    };
  };

  return LoanCalculatorEngine;
});
