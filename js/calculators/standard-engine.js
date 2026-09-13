/**
 * CalculatorHub - Standard Calculator Engine
 * Pure computation engine for standard arithmetic calculations.
 * Completely decoupled from DOM and UI rendering.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StandardCalculatorEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  function StandardCalculatorEngine() {
    this.currentInput = '0';
    this.previousInput = '';
    this.operation = null;
    this.shouldResetScreen = false;
  }

  StandardCalculatorEngine.prototype.getOperatorSymbol = function(op) {
    switch (op) {
      case '*': return '×';
      case '/': return '÷';
      case '-': return '−';
      case '+': return '+';
      default: return op || '';
    }
  };

  StandardCalculatorEngine.prototype.formatNumber = function(val) {
    if (!val || val === 'Error') return val;
    if (val.includes('e')) return val; // keep scientific notation
    
    const isNegative = val.startsWith('-');
    const cleanVal = isNegative ? val.slice(1) : val;

    const parts = cleanVal.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    const parsedInt = parseFloat(integerPart);
    if (!isNaN(parsedInt) && integerPart.length <= 15) {
      try {
        const formatted = Number(integerPart).toLocaleString('en-US');
        return (isNegative ? '-' : '') + formatted + decimalPart;
      } catch (e) {
        return val;
      }
    }
    return val;
  };

  StandardCalculatorEngine.prototype.inputDigit = function(digit) {
    if (this.currentInput === '0' || this.shouldResetScreen) {
      this.currentInput = digit === '00' ? '0' : String(digit);
      this.shouldResetScreen = false;
    } else {
      if (this.currentInput.replace(/[^0-9]/g, '').length < 14) {
        this.currentInput += String(digit);
      }
    }
    return this.getState();
  };

  StandardCalculatorEngine.prototype.inputDecimal = function() {
    if (this.shouldResetScreen) {
      this.currentInput = '0.';
      this.shouldResetScreen = false;
      return this.getState();
    }
    if (!this.currentInput.includes('.')) {
      this.currentInput += '.';
    }
    return this.getState();
  };

  StandardCalculatorEngine.prototype.setOperation = function(op) {
    if (this.currentInput === 'Error') {
      return this.getState();
    }
    if (this.operation !== null && !this.shouldResetScreen) {
      this.compute();
    }
    this.previousInput = this.currentInput;
    this.operation = op;
    this.shouldResetScreen = true;
    return this.getState();
  };

  StandardCalculatorEngine.prototype.compute = function() {
    if (this.operation === null || this.shouldResetScreen) {
      return null;
    }

    const prev = parseFloat(this.previousInput);
    const current = parseFloat(this.currentInput);

    if (isNaN(prev) || isNaN(current)) {
      return null;
    }

    let result;
    switch (this.operation) {
      case '+':
        result = prev + current;
        break;
      case '-':
        result = prev - current;
        break;
      case '*':
        result = prev * current;
        break;
      case '/':
        result = current === 0 ? 'Error' : prev / current;
        break;
      default:
        return null;
    }

    const opSymbol = this.getOperatorSymbol(this.operation);
    const formulaText = `${this.formatNumber(this.previousInput)} ${opSymbol} ${this.formatNumber(this.currentInput)}`;

    let record = null;
    if (result !== 'Error') {
      // Fix binary floating point precision artifacts while preserving exact large integers
      if (!Number.isInteger(result)) {
        result = parseFloat(result.toPrecision(12));
      }
      this.currentInput = String(result);
      record = {
        success: true,
        equation: formulaText,
        result: this.formatNumber(this.currentInput),
        value: result
      };
    } else {
      this.currentInput = 'Error';
      record = {
        success: false,
        equation: formulaText,
        result: 'Error',
        error: 'Division by zero'
      };
    }

    this.operation = null;
    this.shouldResetScreen = true;
    return record;
  };

  StandardCalculatorEngine.prototype.backspace = function() {
    if (this.currentInput === 'Error' || this.shouldResetScreen) {
      this.currentInput = '0';
      this.shouldResetScreen = false;
      return this.getState();
    }
    if (this.currentInput.length > 1) {
      this.currentInput = this.currentInput.slice(0, -1);
      if (this.currentInput === '-' || this.currentInput === '-0') {
        this.currentInput = '0';
      }
    } else {
      this.currentInput = '0';
    }
    return this.getState();
  };

  StandardCalculatorEngine.prototype.toggleSign = function() {
    if (this.currentInput === '0' || this.currentInput === 'Error') {
      return this.getState();
    }
    if (this.currentInput.startsWith('-')) {
      this.currentInput = this.currentInput.substring(1);
    } else {
      this.currentInput = '-' + this.currentInput;
    }
    return this.getState();
  };

  StandardCalculatorEngine.prototype.computePercent = function() {
    const val = parseFloat(this.currentInput);
    if (!isNaN(val)) {
      this.currentInput = String(val / 100);
    }
    return this.getState();
  };

  StandardCalculatorEngine.prototype.clear = function() {
    this.currentInput = '0';
    this.previousInput = '';
    this.operation = null;
    this.shouldResetScreen = false;
    return this.getState();
  };

  StandardCalculatorEngine.prototype.getState = function() {
    let expression = '';
    if (this.operation !== null) {
      const opSymbol = this.getOperatorSymbol(this.operation);
      expression = `${this.formatNumber(this.previousInput)} ${opSymbol}`;
    }

    return {
      currentInput: this.currentInput,
      previousInput: this.previousInput,
      operation: this.operation,
      displayValue: this.formatNumber(this.currentInput),
      expressionValue: expression
    };
  };

  return StandardCalculatorEngine;
});
