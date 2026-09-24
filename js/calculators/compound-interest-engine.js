/**
 * CalculatorHub - Compound Interest Calculation Engine
 * Pure mathematical engine for calculating compound interest, future value,
 * and yearly compounding growth schedules.
 * 
 * Formula:
 *   A = P * (1 + r/n)^(n*t)
 *   CI = A - P
 * Where:
 *   A = Final Amount (Future Value)
 *   P = Principal
 *   r = Annual interest rate as decimal (Rate / 100)
 *   n = Compounding periods per year (1=Annual, 2=Half-Yearly, 4=Quarterly, 12=Monthly, 365=Daily)
 *   t = Time in years (supports decimal/fractional values)
 * 
 * Features:
 * - Zero external dependencies, pure JavaScript.
 * - UMD wrapper for Node.js test runners and browser global scope.
 * - Safe numeric handling: NaN/Infinity guards, division-by-zero protection.
 * - Indian currency formatting (INR ₹ Lakh/Crore system).
 * - Step-by-step yearly growth schedule breakdown.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CompoundInterestEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  function CompoundInterestEngine() {}

  /**
   * Compounding frequency mapping
   */
  CompoundInterestEngine.FREQUENCIES = {
    ANNUALLY: 1,
    HALF_YEARLY: 2,
    QUARTERLY: 4,
    MONTHLY: 12,
    DAILY: 365
  };

  /**
   * Format numbers into the Indian numbering system (e.g. ₹10,000, ₹1,00,000, ₹1,46,933)
   * @param {number} val - Amount to format
   * @param {boolean} [forceDecimals=false] - Whether to enforce two decimal places
   * @returns {string} Formatted Indian Rupee string
   */
  CompoundInterestEngine.prototype.formatINR = function(val, forceDecimals) {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
      return '₹0';
    }

    const isNegative = val < 0;
    const absVal = Math.abs(val);

    // Check if value has fractional parts and is under 1,00,000 or forced
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
   * @returns {string} Formatted percentage
   */
  CompoundInterestEngine.prototype.formatPercent = function(val, decimals) {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
      return '0%';
    }
    const dec = typeof decimals === 'number' ? decimals : 2;
    // Strip trailing zeros if it's an integer
    const str = val.toFixed(dec);
    return (val % 1 === 0 ? val.toFixed(0) : parseFloat(str).toString()) + '%';
  };

  /**
   * Safely sanitize and parse user input into non-negative float
   * @param {string|number} input
   * @returns {number} Clean numeric float
   */
  CompoundInterestEngine.prototype.parseInput = function(input) {
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
   * Validate calculation input parameters
   * @param {number} principal
   * @param {number} rate
   * @param {number} years
   * @param {number} frequency
   * @returns {Object} Validation result { isValid: boolean, error: string|null }
   */
  CompoundInterestEngine.prototype.validate = function(principal, rate, years, frequency) {
    if (principal < 0) {
      return { isValid: false, error: 'Principal amount cannot be negative.' };
    }
    if (rate < 0) {
      return { isValid: false, error: 'Interest rate cannot be negative.' };
    }
    if (years < 0) {
      return { isValid: false, error: 'Time period cannot be negative.' };
    }
    if (frequency <= 0 || !isFinite(frequency)) {
      return { isValid: false, error: 'Compounding frequency must be a positive number.' };
    }
    return { isValid: true, error: null };
  };

  /**
   * Compute compound interest and full growth breakdown
   * 
   * @param {number|string} principal - Initial investment (P)
   * @param {number|string} annualRate - Annual interest rate in percent (e.g. 8 for 8%)
   * @param {number|string} years - Time period in years (supports decimals e.g. 2.5)
   * @param {number|string} [frequency=1] - Compounding periods per year (1, 2, 4, 12, 365)
   * @returns {Object} Full calculation result object
   */
  CompoundInterestEngine.prototype.calculate = function(principal, annualRate, years, frequency) {
    const rawP = this.parseInput(principal);
    const rawR = this.parseInput(annualRate);
    const rawT = this.parseInput(years);
    const rawN = this.parseInput(frequency) || 1;

    const validation = this.validate(rawP, rawR, rawT, rawN);
    if (!validation.isValid) {
      return {
        isValid: false,
        errorMessage: validation.error,
        principal: 0,
        annualRate: 0,
        years: 0,
        frequency: rawN,
        futureValue: 0,
        totalInterest: 0,
        interestPercentOfPrincipal: 0,
        principalRatio: 100,
        interestRatio: 0,
        yearlySchedule: []
      };
    }

    const P = rawP;
    const R = rawR;
    const t = rawT;
    const n = Math.max(1, Math.min(365, Math.round(rawN)));

    // Edge case: zero principal or zero time
    if (P === 0 || t === 0) {
      return {
        isValid: true,
        errorMessage: null,
        principal: P,
        annualRate: R,
        years: t,
        frequency: n,
        futureValue: P,
        totalInterest: 0,
        interestPercentOfPrincipal: 0,
        principalRatio: 100,
        interestRatio: 0,
        yearlySchedule: []
      };
    }

    // Rate as decimal
    const r = R / 100;
    let futureValue = 0;

    // Edge case: 0% interest rate
    if (r === 0) {
      futureValue = P;
    } else {
      // Standard compound interest formula: A = P * (1 + r/n)^(n*t)
      // Guard against exponent overflow
      const exponent = n * t;
      if (exponent > 5000) {
        return {
          isValid: false,
          errorMessage: 'Calculation exceeds maximum supported duration or frequency bounds.',
          principal: P,
          annualRate: R,
          years: t,
          frequency: n,
          futureValue: 0,
          totalInterest: 0,
          interestPercentOfPrincipal: 0,
          principalRatio: 100,
          interestRatio: 0,
          yearlySchedule: []
        };
      }
      futureValue = P * Math.pow(1 + (r / n), exponent);
    }

    // Safety guard against NaN or Infinity
    if (isNaN(futureValue) || !isFinite(futureValue)) {
      futureValue = P;
    }

    const totalInterest = Math.max(0, futureValue - P);
    const interestPercentOfPrincipal = P > 0 ? (totalInterest / P) * 100 : 0;

    // Ratios for visual breakdown bar
    let principalRatio = 100;
    let interestRatio = 0;
    if (futureValue > 0) {
      principalRatio = Math.max(0, Math.min(100, (P / futureValue) * 100));
      interestRatio = Math.max(0, Math.min(100, 100 - principalRatio));
    }

    // Build yearly growth schedule
    const yearlySchedule = [];
    const fullYears = Math.floor(t);
    let runningBalance = P;

    for (let y = 1; y <= fullYears; y++) {
      const yearStart = runningBalance;
      let yearEnd = 0;
      if (r === 0) {
        yearEnd = P;
      } else {
        yearEnd = P * Math.pow(1 + (r / n), n * y);
      }
      const yearInterest = Math.max(0, yearEnd - yearStart);
      yearlySchedule.push({
        yearLabel: `Year ${y}`,
        yearNum: y,
        startingBalance: yearStart,
        interestEarned: yearInterest,
        endingBalance: yearEnd
      });
      runningBalance = yearEnd;
    }

    // If fractional year remains (e.g. t = 2.5 years, remaining = 0.5 years)
    if (t > fullYears) {
      const remainingFraction = t - fullYears;
      const yearStart = runningBalance;
      const yearEnd = futureValue;
      const yearInterest = Math.max(0, yearEnd - yearStart);
      const fracLabel = remainingFraction === 0.5
        ? `Year ${fullYears + 0.5} (+6 Mos)`
        : `Year ${t.toFixed(1)} (Final Period)`;

      yearlySchedule.push({
        yearLabel: fracLabel,
        yearNum: t,
        startingBalance: yearStart,
        interestEarned: yearInterest,
        endingBalance: yearEnd,
        isFractional: true
      });
    }

    return {
      isValid: true,
      errorMessage: null,
      principal: P,
      annualRate: R,
      years: t,
      frequency: n,
      futureValue: futureValue,
      totalInterest: totalInterest,
      interestPercentOfPrincipal: interestPercentOfPrincipal,
      principalRatio: principalRatio,
      interestRatio: interestRatio,
      yearlySchedule: yearlySchedule
    };
  };

  return CompoundInterestEngine;
});
