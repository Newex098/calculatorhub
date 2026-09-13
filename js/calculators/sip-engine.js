/**
 * CalculatorHub - SIP Calculation Engine (India)
 * Pure computation engine for Systematic Investment Plan (SIP) and Step-Up SIP.
 * Compounding: Monthly compounding with beginning-of-month annuity due convention.
 * Zero DOM dependencies, independently testable, safe against NaN/Infinity.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SipCalculatorEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  function SipCalculatorEngine() {}

  /**
   * Format numbers into Indian Currency system (e.g. ₹5,000, ₹10,00,000, ₹1,00,00,000)
   * @param {number} val - Number to format
   * @param {boolean} [forceDecimals=false] - Whether to force 2 decimal places
   * @returns {string} Formatted Indian Rupee string
   */
  SipCalculatorEngine.prototype.formatINR = function(val, forceDecimals) {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
      return '₹0';
    }

    const isNegative = val < 0;
    const absVal = Math.abs(val);

    // If forceDecimals is true or value has fractional paise
    const hasFractions = (Math.abs(absVal - Math.round(absVal)) > 0.0001);
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
   * Parse numeric value safely from string or number, removing currency signs & commas
   * @param {string|number} input
   * @returns {number} Clean non-negative float number
   */
  SipCalculatorEngine.prototype.parseInput = function(input) {
    if (typeof input === 'number') {
      return isNaN(input) || !isFinite(input) ? 0 : Math.max(0, input);
    }
    if (!input || typeof input !== 'string') {
      return 0;
    }
    const clean = input.replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) || !isFinite(num) ? 0 : Math.max(0, num);
  };

  /**
   * Calculate Standard Monthly SIP (Fixed Contribution)
   * Formula: FV = P × [((1+r)^n - 1) / r] × (1+r)
   * Where:
   *   P = Monthly investment
   *   r = Expected annual return / 12 / 100
   *   n = Duration in months (years × 12)
   * 
   * @param {number|string} monthlyInvestment
   * @param {number|string} annualRate
   * @param {number|string} years
   * @returns {Object}
   */
  SipCalculatorEngine.prototype.calculateStandardSIP = function(monthlyInvestment, annualRate, years) {
    const P = this.parseInput(monthlyInvestment);
    const R = this.parseInput(annualRate);
    const N = Math.max(1, Math.min(50, Math.round(this.parseInput(years))));
    const n = N * 12;

    if (P <= 0 || n <= 0) {
      return {
        futureValue: 0,
        totalInvested: 0,
        estimatedReturns: 0,
        yearlySchedule: []
      };
    }

    const r = (R / 100) / 12;
    let futureValue = 0;
    const totalInvested = P * n;

    if (r <= 0) {
      futureValue = totalInvested;
    } else {
      futureValue = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    }

    const estimatedReturns = Math.max(0, futureValue - totalInvested);

    // Build yearly schedule
    const yearlySchedule = [];
    for (let y = 1; y <= N; y++) {
      const monthsElapsed = y * 12;
      const cumInvested = P * monthsElapsed;
      let yearFV = 0;

      if (r <= 0) {
        yearFV = cumInvested;
      } else {
        yearFV = P * ((Math.pow(1 + r, monthsElapsed) - 1) / r) * (1 + r);
      }

      const yearReturns = Math.max(0, yearFV - cumInvested);

      yearlySchedule.push({
        year: y,
        monthlyInvestment: Math.round(P),
        yearInvested: Math.round(P * 12),
        cumulativeInvested: Math.round(cumInvested),
        totalValue: Math.round(yearFV),
        estimatedReturns: Math.round(yearReturns)
      });
    }

    return {
      futureValue: futureValue,
      totalInvested: totalInvested,
      estimatedReturns: estimatedReturns,
      yearlySchedule: yearlySchedule
    };
  };

  /**
   * Calculate Step-Up Monthly SIP (Annual Increase)
   * Each year's contribution increases by stepUpPercent.
   * Compounded month-by-month to the end of tenure.
   * 
   * @param {number|string} initialMonthly
   * @param {number|string} annualRate
   * @param {number|string} years
   * @param {number|string} stepUpPercent
   * @returns {Object}
   */
  SipCalculatorEngine.prototype.calculateStepUpSIP = function(initialMonthly, annualRate, years, stepUpPercent) {
    const P = this.parseInput(initialMonthly);
    const R = this.parseInput(annualRate);
    const N = Math.max(1, Math.min(50, Math.round(this.parseInput(years))));
    const S = this.parseInput(stepUpPercent);

    if (P <= 0 || N <= 0) {
      return {
        futureValue: 0,
        totalInvested: 0,
        estimatedReturns: 0,
        yearlySchedule: []
      };
    }

    const r = (R / 100) / 12;
    const s = S / 100;

    let cumulativeInvested = 0;
    let portfolioValue = 0;
    const yearlySchedule = [];

    for (let y = 1; y <= N; y++) {
      // Monthly contribution for year y
      const monthlyForYear = P * Math.pow(1 + s, y - 1);
      const yearInvested = monthlyForYear * 12;
      cumulativeInvested += yearInvested;

      // Month-by-month compounding for 12 months in this year
      for (let m = 0; m < 12; m++) {
        if (r <= 0) {
          portfolioValue += monthlyForYear;
        } else {
          portfolioValue = (portfolioValue + monthlyForYear) * (1 + r);
        }
      }

      const yearReturns = Math.max(0, portfolioValue - cumulativeInvested);

      yearlySchedule.push({
        year: y,
        monthlyInvestment: Math.round(monthlyForYear),
        yearInvested: Math.round(yearInvested),
        cumulativeInvested: Math.round(cumulativeInvested),
        totalValue: Math.round(portfolioValue),
        estimatedReturns: Math.round(yearReturns)
      });
    }

    const estimatedReturns = Math.max(0, portfolioValue - cumulativeInvested);

    return {
      futureValue: portfolioValue,
      totalInvested: cumulativeInvested,
      estimatedReturns: estimatedReturns,
      yearlySchedule: yearlySchedule
    };
  };

  /**
   * Main calculation entrypoint
   * 
   * @param {Object} options
   * @param {number|string} options.monthlyInvestment - Monthly deposit in ₹
   * @param {number|string} options.annualRate - Assumed annual return in % (e.g. 12)
   * @param {number|string} options.years - Investment horizon in years (e.g. 10)
   * @param {boolean} [options.isStepUp=false] - Whether Step-Up SIP is enabled
   * @param {number|string} [options.stepUpPercent=10] - Annual step-up percentage (e.g. 10)
   * @returns {Object} Complete calculation results with formatted values
   */
  SipCalculatorEngine.prototype.calculate = function(options) {
    const opts = options || {};
    const P = this.parseInput(opts.monthlyInvestment);
    const R = this.parseInput(opts.annualRate);
    const N = Math.max(1, Math.min(50, Math.round(this.parseInput(opts.years))));
    const isStepUp = Boolean(opts.isStepUp);
    const S = this.parseInput(opts.stepUpPercent);

    if (P <= 0 || N <= 0) {
      return {
        isValid: false,
        isStepUp: isStepUp,
        monthlyInvestment: 0,
        annualRate: R,
        years: N,
        stepUpPercent: S,
        totalInvested: 0,
        estimatedReturns: 0,
        futureValue: 0,
        investedPercentage: 100,
        returnsPercentage: 0,
        yearlySchedule: [],
        comparison: null,
        formatted: {
          monthlyInvestment: '₹0',
          totalInvested: '₹0',
          estimatedReturns: '₹0',
          futureValue: '₹0',
          durationLabel: `${N} Years`,
          rateLabel: `${R}%`,
          stepUpLabel: `${S}%`
        }
      };
    }

    let resultData;
    let comparisonData = null;

    if (isStepUp && S > 0) {
      resultData = this.calculateStepUpSIP(P, R, N, S);

      // Also compute standard for comparison
      const standardData = this.calculateStandardSIP(P, R, N);
      const diffInvested = resultData.totalInvested - standardData.totalInvested;
      const diffFutureValue = resultData.futureValue - standardData.futureValue;
      const diffReturns = resultData.estimatedReturns - standardData.estimatedReturns;

      comparisonData = {
        standard: {
          totalInvested: Math.round(standardData.totalInvested),
          futureValue: Math.round(standardData.futureValue),
          estimatedReturns: Math.round(standardData.estimatedReturns),
          formatted: {
            totalInvested: this.formatINR(standardData.totalInvested),
            futureValue: this.formatINR(standardData.futureValue),
            estimatedReturns: this.formatINR(standardData.estimatedReturns)
          }
        },
        stepUp: {
          totalInvested: Math.round(resultData.totalInvested),
          futureValue: Math.round(resultData.futureValue),
          estimatedReturns: Math.round(resultData.estimatedReturns),
          formatted: {
            totalInvested: this.formatINR(resultData.totalInvested),
            futureValue: this.formatINR(resultData.futureValue),
            estimatedReturns: this.formatINR(resultData.estimatedReturns)
          }
        },
        difference: {
          invested: Math.round(diffInvested),
          futureValue: Math.round(diffFutureValue),
          returns: Math.round(diffReturns),
          formatted: {
            invested: this.formatINR(diffInvested),
            futureValue: this.formatINR(diffFutureValue),
            returns: this.formatINR(diffReturns)
          }
        }
      };
    } else {
      resultData = this.calculateStandardSIP(P, R, N);
    }

    const totalInvested = Math.round(resultData.totalInvested);
    const futureValue = Math.round(resultData.futureValue);
    const estimatedReturns = Math.round(resultData.estimatedReturns);

    let investedPct = 100;
    let returnsPct = 0;
    if (futureValue > 0) {
      investedPct = Math.max(0, Math.min(100, Math.round((totalInvested / futureValue) * 100)));
      returnsPct = Math.max(0, 100 - investedPct);
    }

    return {
      isValid: true,
      isStepUp: isStepUp,
      monthlyInvestment: P,
      annualRate: R,
      years: N,
      stepUpPercent: S,
      totalInvested: totalInvested,
      estimatedReturns: estimatedReturns,
      futureValue: futureValue,
      investedPercentage: investedPct,
      returnsPercentage: returnsPct,
      yearlySchedule: resultData.yearlySchedule,
      comparison: comparisonData,
      formatted: {
        monthlyInvestment: this.formatINR(P),
        totalInvested: this.formatINR(totalInvested),
        estimatedReturns: this.formatINR(estimatedReturns),
        futureValue: this.formatINR(futureValue),
        durationLabel: `${N} Year${N > 1 ? 's' : ''}`,
        rateLabel: `${R}%`,
        stepUpLabel: `${S}%`
      }
    };
  };

  return SipCalculatorEngine;
});
