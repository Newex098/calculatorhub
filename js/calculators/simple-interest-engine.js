/**
 * CalculatorHub - Simple Interest Calculation Engine
 * Pure mathematical engine for calculating simple interest, total maturity amount,
 * and annual progression schedules.
 * 
 * Formulas:
 *   SI = (P * R * T) / 100
 *   A = P + SI
 * Where:
 *   SI = Simple Interest
 *   A = Total Amount (Maturity Value)
 *   P = Principal Amount
 *   R = Annual Interest Rate (percentage)
 *   T = Time in years (supports decimal/fractional values)
 * 
 * Features:
 * - Pure JavaScript with zero external dependencies.
 * - UMD wrapper compatible with browser globals and Node.js testing environments.
 * - Robust input validation and defense against negative, NaN, or infinite numbers.
 * - Indian Rupee (INR ₹ Lakh/Crore) currency formatting.
 * - Accurate yearly interest progression schedule breakdown.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SimpleInterestEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  function SimpleInterestEngine() {}

  /**
   * Format numbers into the Indian numbering system (e.g. ₹10,000, ₹1,00,000, ₹14,000)
   * @param {number} val - Amount to format
   * @param {boolean} [forceDecimals=false] - Whether to enforce two decimal places
   * @returns {string} Formatted Indian Rupee string
   */
  SimpleInterestEngine.prototype.formatINR = function(val, forceDecimals) {
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
   * @returns {string} Formatted percentage
   */
  SimpleInterestEngine.prototype.formatPercent = function(val, decimals) {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
      return '0%';
    }
    const dec = typeof decimals === 'number' ? decimals : 2;
    const str = val.toFixed(dec);
    return (val % 1 === 0 ? val.toFixed(0) : parseFloat(str).toString()) + '%';
  };

  /**
   * Safely sanitize and parse user input into non-negative float
   * @param {string|number} input
   * @returns {number} Clean numeric float
   */
  SimpleInterestEngine.prototype.parseInput = function(input) {
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
   * @returns {Object} Validation result { isValid: boolean, error: string|null }
   */
  SimpleInterestEngine.prototype.validate = function(principal, rate, years) {
    if (principal < 0) {
      return { isValid: false, error: 'Principal amount cannot be negative.' };
    }
    if (rate < 0) {
      return { isValid: false, error: 'Interest rate cannot be negative.' };
    }
    if (years < 0) {
      return { isValid: false, error: 'Time period cannot be negative.' };
    }
    return { isValid: true, error: null };
  };

  /**
   * Compute simple interest, total amount, and annual progression schedule
   * 
   * @param {number|string} principal - Principal investment amount (P)
   * @param {number|string} annualRate - Annual interest rate in percent (R)
   * @param {number|string} years - Time period in years (T)
   * @returns {Object} Full calculation result object
   */
  SimpleInterestEngine.prototype.calculate = function(principal, annualRate, years) {
    const rawP = this.parseInput(principal);
    const rawR = this.parseInput(annualRate);
    const rawT = this.parseInput(years);

    const validation = this.validate(rawP, rawR, rawT);
    if (!validation.isValid) {
      return {
        isValid: false,
        errorMessage: validation.error,
        principal: 0,
        annualRate: 0,
        years: 0,
        totalAmount: 0,
        simpleInterest: 0,
        interestPercentOfPrincipal: 0,
        principalRatio: 100,
        interestRatio: 0,
        yearlySchedule: []
      };
    }

    const P = rawP;
    const R = rawR;
    const T = rawT;

    // Edge case: zero principal or zero time
    if (P === 0 || T === 0) {
      return {
        isValid: true,
        errorMessage: null,
        principal: P,
        annualRate: R,
        years: T,
        totalAmount: P,
        simpleInterest: 0,
        interestPercentOfPrincipal: 0,
        principalRatio: 100,
        interestRatio: 0,
        yearlySchedule: []
      };
    }

    // SI = (P * R * T) / 100
    const simpleInterest = (P * R * T) / 100;
    const totalAmount = P + simpleInterest;

    // Safety guard against NaN or Infinity
    const safeSI = (isNaN(simpleInterest) || !isFinite(simpleInterest)) ? 0 : Math.max(0, simpleInterest);
    const safeTotal = (isNaN(totalAmount) || !isFinite(totalAmount)) ? P : Math.max(0, totalAmount);

    const interestPercentOfPrincipal = P > 0 ? (safeSI / P) * 100 : 0;

    // Ratios for visual breakdown bar
    let principalRatio = 100;
    let interestRatio = 0;
    if (safeTotal > 0) {
      principalRatio = Math.max(0, Math.min(100, (P / safeTotal) * 100));
      interestRatio = Math.max(0, Math.min(100, 100 - principalRatio));
    }

    // Build yearly interest progression schedule
    const yearlySchedule = [];
    const fullYears = Math.floor(T);
    const annualInterestRateAmount = (P * R) / 100; // Constant interest accrued per full year

    let cumulativeInterest = 0;

    for (let y = 1; y <= fullYears; y++) {
      const yearStart = P + cumulativeInterest;
      const yearInterest = annualInterestRateAmount;
      cumulativeInterest += yearInterest;
      const yearEnd = P + cumulativeInterest;

      yearlySchedule.push({
        yearLabel: `Year ${y}`,
        yearNum: y,
        startingBalance: yearStart,
        interestEarned: yearInterest,
        endingBalance: yearEnd
      });
    }

    // If fractional year remains (e.g. T = 3.5 years, remaining = 0.5 years)
    if (T > fullYears) {
      const remainingFraction = T - fullYears;
      const yearStart = P + cumulativeInterest;
      const partialInterest = (P * R * remainingFraction) / 100;
      cumulativeInterest += partialInterest;
      const yearEnd = safeTotal;

      const fracLabel = remainingFraction === 0.5
        ? `Year ${fullYears + 0.5} (+6 Mos)`
        : `Year ${T.toFixed(1)} (Final Period)`;

      yearlySchedule.push({
        yearLabel: fracLabel,
        yearNum: T,
        startingBalance: yearStart,
        interestEarned: partialInterest,
        endingBalance: yearEnd,
        isFractional: true
      });
    }

    return {
      isValid: true,
      errorMessage: null,
      principal: P,
      annualRate: R,
      years: T,
      totalAmount: safeTotal,
      simpleInterest: safeSI,
      interestPercentOfPrincipal: interestPercentOfPrincipal,
      principalRatio: principalRatio,
      interestRatio: interestRatio,
      yearlySchedule: yearlySchedule
    };
  };

  return SimpleInterestEngine;
});
