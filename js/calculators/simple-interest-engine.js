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

  // Maximum supported duration limits (equivalent to 50 years)
  SimpleInterestEngine.MAX_YEARS = 50;
  SimpleInterestEngine.MAX_MONTHS = 600;
  SimpleInterestEngine.MAX_DAYS = 18250;
  SimpleInterestEngine.DAYS_PER_YEAR = 365;

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

    if (forceDecimals || hasFractions) {
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
   * Safely sanitize and parse user input into numeric float
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
   * Convert duration in years, months, or days into decimal years
   * Day-based calculations use a 365-day year convention.
   *
   * @param {number} duration - Input duration number
   * @param {string} [unit='years'] - 'years', 'months', or 'days'
   * @returns {number} Time expressed in years (T)
   */
  SimpleInterestEngine.prototype.convertDurationToYears = function(duration, unit) {
    const u = (typeof unit === 'string' ? unit.toLowerCase() : 'years').trim();
    if (u === 'months') {
      return duration / 12;
    }
    if (u === 'days') {
      return duration / SimpleInterestEngine.DAYS_PER_YEAR; // 365
    }
    return duration; // 'years'
  };

  /**
   * Validate calculation input parameters
   * @param {number} principal
   * @param {number} rate
   * @param {number} duration
   * @param {string} [unit='years']
   * @returns {Object} Validation result { isValid: boolean, error: string|null }
   */
  SimpleInterestEngine.prototype.validate = function(principal, rate, duration, unit) {
    const u = (typeof unit === 'string' ? unit.toLowerCase() : 'years').trim();

    if (typeof principal !== 'number' || isNaN(principal) || !isFinite(principal)) {
      return { isValid: false, error: 'Please enter a valid numeric principal amount.' };
    }
    if (principal < 0) {
      return { isValid: false, error: 'Principal amount cannot be negative.' };
    }
    if (principal === 0) {
      return { isValid: false, error: 'Principal amount must be greater than zero.' };
    }

    if (typeof rate !== 'number' || isNaN(rate) || !isFinite(rate)) {
      return { isValid: false, error: 'Please enter a valid numeric interest rate.' };
    }
    if (rate < 0) {
      return { isValid: false, error: 'Interest rate cannot be negative.' };
    }
    if (rate > 100) {
      return { isValid: false, error: 'Interest rate cannot exceed 100%.' };
    }

    if (typeof duration !== 'number' || isNaN(duration) || !isFinite(duration)) {
      return { isValid: false, error: 'Please enter a valid numeric time period.' };
    }
    if (duration < 0) {
      return { isValid: false, error: 'Time period cannot be negative.' };
    }
    if (duration === 0) {
      return { isValid: false, error: 'Time period must be greater than zero.' };
    }

    // Equivalent 50-year limit validation
    if (u === 'days') {
      if (duration > SimpleInterestEngine.MAX_DAYS) {
        return { isValid: false, error: `Time period cannot exceed ${SimpleInterestEngine.MAX_DAYS.toLocaleString('en-IN')} days (50 years).` };
      }
    } else if (u === 'months') {
      if (duration > SimpleInterestEngine.MAX_MONTHS) {
        return { isValid: false, error: `Time period cannot exceed ${SimpleInterestEngine.MAX_MONTHS} months (50 years).` };
      }
    } else {
      if (duration > SimpleInterestEngine.MAX_YEARS) {
        return { isValid: false, error: `Time period cannot exceed ${SimpleInterestEngine.MAX_YEARS} years.` };
      }
    }

    return { isValid: true, error: null };
  };

  /**
   * Compute simple interest, total amount, and annual progression schedule
   * Supports duration in years, months, or days.
   * 
   * @param {number|string} principal - Principal investment amount (P)
   * @param {number|string} annualRate - Annual interest rate in percent (R)
   * @param {number|string} duration - Time period in selected unit (T)
   * @param {string} [unit='years'] - Duration unit ('years', 'months', or 'days')
   * @returns {Object} Full calculation result object
   */
  SimpleInterestEngine.prototype.calculate = function(principal, annualRate, duration, unit) {
    const cleanUnit = (typeof unit === 'string' ? unit.toLowerCase() : 'years').trim();
    const rawP = this.parseInput(principal);
    const rawR = this.parseInput(annualRate);
    const rawDuration = this.parseInput(duration);

    const validation = this.validate(rawP, rawR, rawDuration, cleanUnit);
    if (!validation.isValid) {
      return {
        isValid: false,
        errorMessage: validation.error,
        principal: 0,
        annualRate: 0,
        duration: 0,
        unit: cleanUnit,
        years: 0,
        equivalentYears: 0,
        formattedEquivalentYears: '0 Years',
        durationLabel: '0 Years',
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
    const T = this.convertDurationToYears(rawDuration, cleanUnit);

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

    // Format duration and equivalent time
    let formattedEquivalentYears = '';
    let durationLabel = '';

    if (cleanUnit === 'days') {
      const displayYears = parseFloat(T.toFixed(4)).toString();
      formattedEquivalentYears = `${displayYears} ${T === 1 ? 'Year' : 'Years'}`;
      durationLabel = `${rawDuration} ${rawDuration === 1 ? 'Day' : 'Days'}`;
    } else if (cleanUnit === 'months') {
      const displayYears = (T % 1 === 0) ? T.toFixed(0) : parseFloat(T.toFixed(4)).toString();
      formattedEquivalentYears = `${displayYears} ${T === 1 ? 'Year' : 'Years'}`;
      durationLabel = `${rawDuration} ${rawDuration === 1 ? 'Month' : 'Months'}`;
    } else {
      const displayYears = (T % 1 === 0) ? T.toFixed(0) : parseFloat(T.toFixed(4)).toString();
      formattedEquivalentYears = `${displayYears} ${T === 1 ? 'Year' : 'Years'}`;
      durationLabel = `${rawDuration} ${rawDuration === 1 ? 'Year' : 'Years'}`;
    }

    // Build yearly interest progression schedule
    const yearlySchedule = [];
    const fullYears = Math.min(SimpleInterestEngine.MAX_YEARS, Math.floor(T));
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

    // If fractional period remains (e.g. T = 0.5 or T = 3.5 years)
    if (T > fullYears) {
      const remainingFraction = T - fullYears;
      const yearStart = P + cumulativeInterest;
      // Exact fractional simple interest ensuring cumulative interest perfectly equals total simple interest
      const partialInterest = safeSI - cumulativeInterest;
      cumulativeInterest += partialInterest;
      const yearEnd = safeTotal;

      let fracLabel = '';
      if (fullYears === 0) {
        if (cleanUnit === 'days') {
          fracLabel = `${rawDuration} Days (${parseFloat(T.toFixed(4))} Yr)`;
        } else if (cleanUnit === 'months') {
          fracLabel = `${rawDuration} Months (${parseFloat(T.toFixed(2))} Yr)`;
        } else {
          fracLabel = `${T} Year${T === 1 ? '' : 's'}`;
        }
      } else {
        if (cleanUnit === 'days') {
          const remDays = Math.round(remainingFraction * SimpleInterestEngine.DAYS_PER_YEAR);
          fracLabel = `Year ${fullYears + 1} (+${remDays} Days)`;
        } else if (cleanUnit === 'months') {
          const remMos = Math.round(remainingFraction * 12);
          fracLabel = `Year ${fullYears + 1} (+${remMos} Mos)`;
        } else if (remainingFraction === 0.5) {
          fracLabel = `Year ${fullYears + 0.5} (+6 Mos)`;
        } else {
          fracLabel = `Year ${parseFloat(T.toFixed(2))} (Final Period)`;
        }
      }

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
      duration: rawDuration,
      unit: cleanUnit,
      years: T,
      equivalentYears: T,
      formattedEquivalentYears: formattedEquivalentYears,
      durationLabel: durationLabel,
      totalAmount: safeTotal,
      simpleInterest: safeSI,
      interestPercentOfPrincipal: interestPercentOfPrincipal,
      principalRatio: principalRatio,
      interestRatio: interestRatio,
      yearlySchedule: yearlySchedule
    };
  };

  /**
   * Alias method consistent with clean engine API
   */
  SimpleInterestEngine.prototype.calculateSimpleInterest = function(principal, rate, duration, unit) {
    return this.calculate(principal, rate, duration, unit);
  };

  return SimpleInterestEngine;
});
