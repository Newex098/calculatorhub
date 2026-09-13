/**
 * CalculatorHub - GST Calculation Engine (India)
 * Pure computation engine for Goods and Services Tax (GST) calculations.
 * Supports GST Exclusive (Add GST) and GST Inclusive (Remove GST) modes,
 * plus Intra-State (CGST + SGST) and Inter-State (IGST) tax breakdowns.
 * Independent of DOM and UI rendering.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GstCalculatorEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  function GstCalculatorEngine() {}

  /**
   * Format numbers into Indian Currency system (e.g. ₹10,000 or ₹1,00,000.50)
   * @param {number} val - Number to format
   * @param {boolean} [forceDecimals=false] - Force showing 2 decimal places
   * @returns {string} Formatted Indian Rupee string
   */
  GstCalculatorEngine.prototype.formatINR = function(val, forceDecimals) {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
      return '₹0';
    }

    const isNegative = val < 0;
    const absVal = Math.abs(val);

    // If forceDecimals is true or value has fractional cents/paise
    const hasFractions = (Math.abs(absVal - Math.round(absVal)) > 0.0001);
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
   * Parse numeric value safely from string or number, removing currency signs & commas
   * @param {string|number} input
   * @returns {number} Clean positive float number
   */
  GstCalculatorEngine.prototype.parseInput = function(input) {
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
   * Round to two decimal places for currency accuracy
   * @param {number} val
   * @returns {number}
   */
  GstCalculatorEngine.prototype.round2 = function(val) {
    if (isNaN(val) || !isFinite(val)) return 0;
    return Math.round((val + Number.EPSILON) * 100) / 100;
  };

  /**
   * Calculate Add GST (Exclusive to Inclusive)
   * GST Amount = (Base Amount * Rate) / 100
   * Final Amount = Base Amount + GST Amount
   * 
   * @param {number|string} baseAmount
   * @param {number|string} rate
   * @returns {Object}
   */
  GstCalculatorEngine.prototype.addGST = function(baseAmount, rate) {
    const base = this.parseInput(baseAmount);
    const r = this.parseInput(rate);

    const gstAmount = (base * r) / 100;
    const finalAmount = base + gstAmount;

    return {
      baseAmount: this.round2(base),
      rate: this.round2(r),
      gstAmount: this.round2(gstAmount),
      finalAmount: this.round2(finalAmount)
    };
  };

  /**
   * Calculate Remove GST (Inclusive to Exclusive)
   * Base Amount = Inclusive Amount / (1 + Rate / 100)
   * GST Amount = Inclusive Amount - Base Amount
   * 
   * @param {number|string} inclusiveAmount
   * @param {number|string} rate
   * @returns {Object}
   */
  GstCalculatorEngine.prototype.removeGST = function(inclusiveAmount, rate) {
    const inclusive = this.parseInput(inclusiveAmount);
    const r = this.parseInput(rate);

    if (r <= 0) {
      return {
        inclusiveAmount: this.round2(inclusive),
        rate: 0,
        baseAmount: this.round2(inclusive),
        gstAmount: 0
      };
    }

    const baseAmount = inclusive / (1 + (r / 100));
    const gstAmount = inclusive - baseAmount;

    return {
      inclusiveAmount: this.round2(inclusive),
      rate: this.round2(r),
      baseAmount: this.round2(baseAmount),
      gstAmount: this.round2(gstAmount)
    };
  };

  /**
   * Complete calculation covering both modes and Intra/Inter state breakdown
   * 
   * @param {number|string} amount - Base amount (for add) or Inclusive amount (for remove)
   * @param {number|string} rate - GST Rate in percentage (e.g. 18)
   * @param {string} [mode='add'] - 'add' (exclusive) or 'remove' (inclusive)
   * @param {boolean} [isIntraState=true] - If true, split GST into CGST (50%) + SGST (50%)
   * @returns {Object} Full calculation results with formatted strings
   */
  GstCalculatorEngine.prototype.calculate = function(amount, rate, mode, isIntraState) {
    const rawAmount = this.parseInput(amount);
    const rawRate = this.parseInput(rate);
    const calcMode = (mode === 'remove') ? 'remove' : 'add';
    const splitTax = (isIntraState !== false);

    let baseAmount = 0;
    let gstAmount = 0;
    let finalAmount = 0;

    if (calcMode === 'add') {
      const res = this.addGST(rawAmount, rawRate);
      baseAmount = res.baseAmount;
      gstAmount = res.gstAmount;
      finalAmount = res.finalAmount;
    } else {
      const res = this.removeGST(rawAmount, rawRate);
      baseAmount = res.baseAmount;
      gstAmount = res.gstAmount;
      finalAmount = res.inclusiveAmount;
    }

    // Intra-State vs Inter-State breakdown
    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (splitTax) {
      cgstRate = this.round2(rawRate / 2);
      sgstRate = this.round2(rawRate / 2);
      cgstAmount = this.round2(gstAmount / 2);
      sgstAmount = this.round2(gstAmount / 2);
    } else {
      igstRate = this.round2(rawRate);
      igstAmount = this.round2(gstAmount);
    }

    // Effective tax percentage of total gross
    const effectiveTaxPct = finalAmount > 0 
      ? this.round2((gstAmount / finalAmount) * 100) 
      : 0;

    return {
      isValid: true,
      mode: calcMode,
      inputAmount: this.round2(rawAmount),
      gstRate: this.round2(rawRate),
      baseAmount: this.round2(baseAmount),
      gstAmount: this.round2(gstAmount),
      finalAmount: this.round2(finalAmount),
      isIntraState: splitTax,
      cgstRate: cgstRate,
      cgstAmount: cgstAmount,
      sgstRate: sgstRate,
      sgstAmount: sgstAmount,
      igstRate: igstRate,
      igstAmount: igstAmount,
      effectiveTaxPct: effectiveTaxPct,
      formatted: {
        inputAmount: this.formatINR(rawAmount),
        baseAmount: this.formatINR(baseAmount),
        gstAmount: this.formatINR(gstAmount),
        finalAmount: this.formatINR(finalAmount),
        cgstAmount: this.formatINR(cgstAmount),
        sgstAmount: this.formatINR(sgstAmount),
        igstAmount: this.formatINR(igstAmount),
        rateLabel: `${this.round2(rawRate)}%`,
        cgstRateLabel: `${cgstRate}%`,
        sgstRateLabel: `${sgstRate}%`,
        igstRateLabel: `${igstRate}%`
      }
    };
  };

  return GstCalculatorEngine;
});
