/**
 * CalculatorHub - Percentage Calculation Engine
 * Pure computation engine for general percentage calculations, changes,
 * differences, shopping discounts, markups, and reverse discounts.
 * Zero DOM dependencies, independently testable, safe against NaN/Infinity.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PercentageCalculatorEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  function PercentageCalculatorEngine() {}

  /**
   * Safely parse numeric input from string or number
   * @param {string|number} input
   * @param {boolean} [allowNegative=false]
   * @returns {number} Clean float number
   */
  PercentageCalculatorEngine.prototype.parseInput = function(input, allowNegative) {
    if (typeof input === 'number') {
      if (isNaN(input) || !isFinite(input)) return 0;
      return allowNegative ? input : Math.max(0, input);
    }
    if (!input || typeof input !== 'string') {
      return 0;
    }
    const clean = input.replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    if (isNaN(num) || !isFinite(num)) return 0;
    return allowNegative ? num : Math.max(0, num);
  };

  /**
   * Round to up to 2 decimal places cleanly
   * @param {number} val
   * @returns {number}
   */
  PercentageCalculatorEngine.prototype.round2 = function(val) {
    if (isNaN(val) || !isFinite(val)) return 0;
    return Math.round((val + Number.EPSILON) * 100) / 100;
  };

  /**
   * Format standard number without unnecessary trailing zeros
   * @param {number} val
   * @returns {string}
   */
  PercentageCalculatorEngine.prototype.formatNumber = function(val) {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
      return '0';
    }
    const rounded = this.round2(val);
    return rounded.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  /**
   * Format numbers into Indian Rupee currency format (e.g. ₹2,000, ₹1,600)
   * @param {number} val
   * @returns {string} Formatted INR string
   */
  PercentageCalculatorEngine.prototype.formatINR = function(val) {
    if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
      return '₹0';
    }
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const hasFractions = (Math.abs(absVal - Math.round(absVal)) > 0.0001);

    let formatted = '';
    if (hasFractions) {
      const parts = absVal.toFixed(2).split('.');
      formatted = Number(parts[0]).toLocaleString('en-IN') + '.' + parts[1];
    } else {
      formatted = Math.round(absVal).toLocaleString('en-IN');
    }

    return (isNegative ? '-₹' : '₹') + formatted;
  };

  /**
   * MODE 1: What is X% of Y?
   * Formula: (X ÷ 100) × Y
   * @param {number|string} percentage - X
   * @param {number|string} total - Y
   * @returns {Object}
   */
  PercentageCalculatorEngine.prototype.percentageOf = function(percentage, total) {
    const X = this.parseInput(percentage, true);
    const Y = this.parseInput(total, true);

    const result = (X / 100) * Y;
    const rounded = this.round2(result);

    return {
      isValid: true,
      percentage: X,
      total: Y,
      result: rounded,
      formula: `(${X} ÷ 100) × ${Y}`,
      calculation: `${this.formatNumber(X / 100)} × ${this.formatNumber(Y)}`,
      formattedResult: this.formatNumber(rounded)
    };
  };

  /**
   * MODE 2: X is what % of Y?
   * Formula: (X ÷ Y) × 100
   * @param {number|string} part - X
   * @param {number|string} total - Y
   * @returns {Object}
   */
  PercentageCalculatorEngine.prototype.whatPercentageIs = function(part, total) {
    const X = this.parseInput(part, true);
    const Y = this.parseInput(total, true);

    if (Y === 0) {
      return {
        isValid: false,
        error: 'Division by zero is undefined (Total cannot be 0)',
        part: X,
        total: 0,
        result: 0,
        formula: `(${X} ÷ 0) × 100`,
        calculation: 'Cannot divide by zero',
        formattedResult: '0%'
      };
    }

    const result = (X / Y) * 100;
    const rounded = this.round2(result);

    return {
      isValid: true,
      part: X,
      total: Y,
      result: rounded,
      formula: `(${X} ÷ ${Y}) × 100`,
      calculation: `${this.formatNumber(X / Y)} × 100`,
      formattedResult: `${this.formatNumber(rounded)}%`
    };
  };

  /**
   * MODE 3: Percentage Increase
   * Formula: ((New - Original) ÷ Original) × 100
   * @param {number|string} original
   * @param {number|string} newValue
   * @returns {Object}
   */
  PercentageCalculatorEngine.prototype.percentageIncrease = function(original, newValue) {
    const orig = this.parseInput(original, true);
    const updated = this.parseInput(newValue, true);

    if (orig === 0) {
      return {
        isValid: false,
        error: 'Original value cannot be zero for percentage increase',
        original: 0,
        newValue: updated,
        difference: updated,
        result: 0,
        formula: `((${updated} − 0) ÷ 0) × 100`,
        calculation: 'Cannot divide by zero base',
        formattedResult: '0%'
      };
    }

    const diff = updated - orig;
    const result = (diff / orig) * 100;
    const rounded = this.round2(result);

    return {
      isValid: true,
      original: orig,
      newValue: updated,
      difference: this.round2(diff),
      result: rounded,
      formula: `((${updated} − ${orig}) ÷ ${orig}) × 100`,
      calculation: `(${this.formatNumber(diff)} ÷ ${this.formatNumber(orig)}) × 100`,
      formattedResult: `${this.formatNumber(rounded)}%`
    };
  };

  /**
   * MODE 4: Percentage Decrease
   * Formula: ((Original - New) ÷ Original) × 100
   * @param {number|string} original
   * @param {number|string} newValue
   * @returns {Object}
   */
  PercentageCalculatorEngine.prototype.percentageDecrease = function(original, newValue) {
    const orig = this.parseInput(original, true);
    const updated = this.parseInput(newValue, true);

    if (orig === 0) {
      return {
        isValid: false,
        error: 'Original value cannot be zero for percentage decrease',
        original: 0,
        newValue: updated,
        difference: -updated,
        result: 0,
        formula: `((${orig} − ${updated}) ÷ 0) × 100`,
        calculation: 'Cannot divide by zero base',
        formattedResult: '0%'
      };
    }

    const diff = orig - updated;
    const result = (diff / orig) * 100;
    const rounded = this.round2(result);

    return {
      isValid: true,
      original: orig,
      newValue: updated,
      difference: this.round2(diff),
      result: rounded,
      formula: `((${orig} − ${updated}) ÷ ${orig}) × 100`,
      calculation: `(${this.formatNumber(diff)} ÷ ${this.formatNumber(orig)}) × 100`,
      formattedResult: `${this.formatNumber(rounded)}%`
    };
  };

  /**
   * MODE 5: Percentage Difference
   * Formula: (|A - B| ÷ ((A + B) ÷ 2)) × 100
   * @param {number|string} valueA
   * @param {number|string} valueB
   * @returns {Object}
   */
  PercentageCalculatorEngine.prototype.percentageDifference = function(valueA, valueB) {
    const A = this.parseInput(valueA, true);
    const B = this.parseInput(valueB, true);
    const avg = (A + B) / 2;

    if (avg === 0) {
      return {
        isValid: false,
        error: 'Average of both values cannot be zero',
        valueA: A,
        valueB: B,
        average: 0,
        absoluteDiff: Math.abs(A - B),
        result: 0,
        formula: `|${A} − ${B}| ÷ ((${A} + ${B}) ÷ 2) × 100`,
        calculation: 'Average is zero',
        formattedResult: '0%'
      };
    }

    const absDiff = Math.abs(A - B);
    const result = (absDiff / avg) * 100;
    const rounded = this.round2(result);

    return {
      isValid: true,
      valueA: A,
      valueB: B,
      average: this.round2(avg),
      absoluteDiff: this.round2(absDiff),
      result: rounded,
      formula: `|${A} − ${B}| ÷ ((${A} + ${B}) ÷ 2) × 100`,
      calculation: `${this.formatNumber(absDiff)} ÷ ${this.formatNumber(avg)} × 100`,
      formattedResult: `${this.formatNumber(rounded)}%`
    };
  };

  /**
   * Discount Calculator
   * Discount Amount = Original Price × (Discount% ÷ 100)
   * Final Price = Original Price - Discount Amount
   * @param {number|string} originalPrice
   * @param {number|string} discountPercent
   * @returns {Object}
   */
  PercentageCalculatorEngine.prototype.calculateDiscount = function(originalPrice, discountPercent) {
    const price = this.parseInput(originalPrice);
    const discPct = Math.max(0, Math.min(100, this.parseInput(discountPercent)));

    const discountAmount = price * (discPct / 100);
    const finalPrice = Math.max(0, price - discountAmount);

    return {
      isValid: true,
      originalPrice: this.round2(price),
      discountPercent: this.round2(discPct),
      discountAmount: this.round2(discountAmount),
      finalPrice: this.round2(finalPrice),
      formatted: {
        originalPrice: this.formatINR(price),
        discountAmount: this.formatINR(discountAmount),
        finalPrice: this.formatINR(finalPrice),
        discountPercent: `${this.round2(discPct)}%`
      }
    };
  };

  /**
   * Markup Calculator
   * Markup Amount = Cost Price × (Markup% ÷ 100)
   * Selling Price = Cost Price + Markup Amount
   * @param {number|string} costPrice
   * @param {number|string} markupPercent
   * @returns {Object}
   */
  PercentageCalculatorEngine.prototype.calculateMarkup = function(costPrice, markupPercent) {
    const cost = this.parseInput(costPrice);
    const markupPct = this.parseInput(markupPercent);

    const markupAmount = cost * (markupPct / 100);
    const sellingPrice = cost + markupAmount;

    return {
      isValid: true,
      costPrice: this.round2(cost),
      markupPercent: this.round2(markupPct),
      markupAmount: this.round2(markupAmount),
      sellingPrice: this.round2(sellingPrice),
      formatted: {
        costPrice: this.formatINR(cost),
        markupAmount: this.formatINR(markupAmount),
        sellingPrice: this.formatINR(sellingPrice),
        markupPercent: `${this.round2(markupPct)}%`
      }
    };
  };

  /**
   * Reverse Discount Calculator (Original Price After Discount)
   * Original Price = Final Price ÷ (1 - Discount% ÷ 100)
   * @param {number|string} finalPrice
   * @param {number|string} discountPercent
   * @returns {Object}
   */
  PercentageCalculatorEngine.prototype.calculateReverseDiscount = function(finalPrice, discountPercent) {
    const finalP = this.parseInput(finalPrice);
    const discPct = this.parseInput(discountPercent);

    if (discPct >= 100) {
      return {
        isValid: false,
        error: 'Discount percentage cannot be 100% or greater in reverse discount calculation (division by zero).',
        finalPrice: this.round2(finalP),
        discountPercent: this.round2(discPct),
        originalPrice: 0,
        discountSaved: 0,
        formatted: {
          finalPrice: this.formatINR(finalP),
          originalPrice: 'Undefined (100% discount)',
          discountSaved: '₹0',
          discountPercent: `${this.round2(discPct)}%`
        }
      };
    }

    const multiplier = 1 - (discPct / 100);
    const originalPrice = finalP / multiplier;
    const discountSaved = originalPrice - finalP;

    return {
      isValid: true,
      finalPrice: this.round2(finalP),
      discountPercent: this.round2(discPct),
      originalPrice: this.round2(originalPrice),
      discountSaved: this.round2(discountSaved),
      formatted: {
        finalPrice: this.formatINR(finalP),
        originalPrice: this.formatINR(originalPrice),
        discountSaved: this.formatINR(discountSaved),
        discountPercent: `${this.round2(discPct)}%`
      }
    };
  };

  return PercentageCalculatorEngine;
});
