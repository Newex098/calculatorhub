/**
 * CalculatorHub - Calculator Registry & Metadata Catalog
 * Centralized registry defining calculator tools, categories, keywords, and routing.
 * Designed for client-side search, category filtering, and modular expansion.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CalculatorRegistry = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  // Centralized Site & Production Domain Configuration
  const SITE_CONFIG = {
    brandName: 'CalculatorHub',
    tagline: 'Simple Calculators for Everyday Life',
    productionDomain: 'https://calculatorhub.com',
    canonicalBase: 'https://calculatorhub.com'
  };

  // Category Definitions with Descriptions and Icon metadata
  const CATEGORIES = {
    'finance': {
      id: 'finance',
      name: 'Finance',
      description: 'Loans, mortgages, interest rates, GST, compound interest, fixed deposits, and investment returns.',
      count: 14,
      icon: 'dollar-sign'
    },
    'work': {
      id: 'work',
      name: 'Work & Freelance',
      description: 'Hourly rates, freelance quotes, CTC to in-hand pay, overtime pay, and project profit margins.',
      count: 8,
      icon: 'briefcase'
    },
    'health': {
      id: 'health',
      name: 'Health',
      description: 'Body Mass Index (BMI), daily calorie expenditure, ideal weight range, and target hydration trackers.',
      count: 6,
      icon: 'heart'
    },
    'time': {
      id: 'time',
      name: 'Time & Date',
      description: 'Exact age calculations, date differences, working business days count, countdowns, and time zones.',
      count: 7,
      icon: 'clock'
    },
    'math': {
      id: 'math',
      name: 'Math',
      description: 'Percentage changes, fractions, ratios, statistical averages, probabilities, and scientific notation.',
      count: 12,
      icon: 'percent'
    },
    'utilities': {
      id: 'utilities',
      name: 'Utilities',
      description: 'Unit converters (length, weight, temperature, storage), discount comparisons, and everyday helpers.',
      count: 9,
      icon: 'tool'
    }
  };

  // Calculator Catalog
  const CALCULATORS = [
    {
      id: 'standard',
      name: 'Standard Calculator',
      slug: 'standard-calculator',
      category: 'math',
      categoryName: 'Math',
      description: 'Everyday standard arithmetic calculator with live calculation history, percentage calculation, and sign toggle.',
      url: 'calculator.html',
      isPopular: false,
      isFeatured: false,
      badge: 'Core Tool',
      keywords: ['standard', 'basic', 'math', 'calculator', 'arithmetic', 'addition', 'multiplication', 'division', 'history']
    },
    {
      id: 'emi',
      name: 'EMI Calculator',
      slug: 'emi-calculator',
      category: 'finance',
      categoryName: 'Finance',
      description: 'Calculate equated monthly installments, total interest, and complete repayment schedules for home, car, or personal loans.',
      url: 'calculators/emi/index.html',
      fallbackUrl: 'calculator.html#featured',
      isPopular: true,
      isFeatured: true,
      badge: 'Finance',
      keywords: ['emi', 'loan', 'interest', 'mortgage', 'home loan', 'car loan', 'personal loan', 'bank', 'repayment']
    },
    {
      id: 'gst',
      name: 'GST Calculator',
      slug: 'gst-calculator',
      category: 'finance',
      categoryName: 'Finance',
      description: 'Quickly calculate GST inclusive and exclusive pricing with standard 5%, 12%, 18%, and 28% tax rate slabs.',
      url: 'calculators/gst/index.html',
      fallbackUrl: 'calculator.html',
      isPopular: true,
      isFeatured: false,
      badge: 'Finance',
      keywords: ['gst', 'tax', 'vat', 'invoice', 'sales tax', 'business', 'finance', 'inclusive', 'exclusive']
    },
    {
      id: 'sip',
      name: 'SIP Calculator',
      slug: 'sip-calculator',
      category: 'finance',
      categoryName: 'Finance',
      description: 'Estimate SIP future value, total investment, and estimated returns.',
      url: 'calculators/sip/index.html',
      fallbackUrl: 'calculator.html',
      isPopular: true,
      isFeatured: false,
      badge: 'Finance',
      keywords: ['SIP', 'SIP calculator', 'mutual fund SIP', 'monthly investment calculator', 'SIP returns', 'SIP maturity', 'step up SIP', 'step-up SIP calculator', 'investment calculator']
    },
    {
      id: 'salary',
      name: 'Salary Calculator',
      slug: 'salary-calculator',
      category: 'work',
      categoryName: 'Work & Freelance',
      description: 'Break down annual CTC into monthly in-hand take-home salary, standard deductions, PF contributions, and taxes.',
      url: 'calculators/salary/index.html',
      fallbackUrl: 'calculator.html',
      isPopular: true,
      isFeatured: false,
      badge: 'Work & Freelance',
      keywords: ['salary', 'ctc', 'take home', 'in-hand', 'pay', 'tax', 'deductions', 'income', 'pf', 'work', 'job']
    },
    {
      id: 'percentage',
      name: 'Percentage Calculator',
      slug: 'percentage-calculator',
      category: 'math',
      categoryName: 'Math',
      description: 'Calculate percentages, percentage changes, discounts, markups, and percentage differences.',
      url: 'calculators/percentage/index.html',
      fallbackUrl: 'calculator.html',
      isPopular: true,
      isFeatured: false,
      badge: 'Math',
      keywords: ['percentage', 'percentage calculator', 'percent calculator', 'percentage increase', 'percentage decrease', 'percentage difference', 'discount calculator', 'markup calculator', 'reverse percentage', 'percentage of number']
    },
    {
      id: 'age',
      name: 'Age Calculator',
      slug: 'age-calculator',
      category: 'math',
      categoryName: 'Math',
      description: 'Calculate exact age in years, months, and days and find the next birthday.',
      url: 'calculators/age/index.html',
      fallbackUrl: 'calculator.html',
      isPopular: true,
      isFeatured: false,
      badge: 'Math',
      keywords: ['age calculator', 'age in years months days', 'calculate age', 'birthday calculator', 'exact age calculator', 'date of birth calculator', 'age on date']
    }
  ];

  // Public API methods
  return {
    /**
     * Get all registered calculators
     * @returns {Array} List of all calculators
     */
    getAll: function() {
      return CALCULATORS.slice();
    },

    /**
     * Find a calculator by its unique ID
     * @param {string} id - Calculator ID (e.g. 'emi')
     * @returns {Object|null}
     */
    getById: function(id) {
      if (!id) return null;
      const cleanId = id.trim().toLowerCase();
      return CALCULATORS.find(c => c.id === cleanId) || null;
    },

    /**
     * Find a calculator by its URL slug
     * @param {string} slug - Calculator slug (e.g. 'emi-calculator')
     * @returns {Object|null}
     */
    getBySlug: function(slug) {
      if (!slug) return null;
      const cleanSlug = slug.trim().toLowerCase();
      return CALCULATORS.find(c => c.slug === cleanSlug) || null;
    },

    /**
     * Get popular calculators (for homepage grid)
     * @returns {Array}
     */
    getPopular: function() {
      return CALCULATORS.filter(c => c.isPopular);
    },

    /**
     * Get featured calculators
     * @returns {Array}
     */
    getFeatured: function() {
      return CALCULATORS.filter(c => c.isFeatured);
    },

    /**
     * Get calculators by category ID
     * @param {string} categoryId - e.g. 'finance', 'math'
     * @returns {Array}
     */
    getByCategory: function(categoryId) {
      if (!categoryId) return [];
      const clean = categoryId.trim().toLowerCase();
      return CALCULATORS.filter(c => c.category === clean);
    },

    /**
     * Get all category metadata
     * @returns {Object}
     */
    getCategories: function() {
      return Object.assign({}, CATEGORIES);
    },

    /**
     * Client-side search across name, description, category, and keywords
     * @param {string} query - search query
     * @returns {Array} Matching calculators
     */
    search: function(query) {
      if (!query || typeof query !== 'string') {
        return this.getAll();
      }
      const q = query.trim().toLowerCase();
      if (!q) return this.getAll();

      return CALCULATORS.filter(c => {
        if (c.name.toLowerCase().includes(q)) return true;
        if (c.categoryName.toLowerCase().includes(q)) return true;
        if (c.description.toLowerCase().includes(q)) return true;
        if (c.keywords.some(k => k.toLowerCase().includes(q))) return true;
        return false;
      });
    },

    /**
     * Register a new calculator dynamically (for future extensions)
     * @param {Object} calc - Calculator configuration
     */
    register: function(calc) {
      if (!calc || !calc.id || !calc.name) {
        throw new Error('CalculatorRegistry.register: id and name are required');
      }
      const existingIdx = CALCULATORS.findIndex(c => c.id === calc.id);
      if (existingIdx >= 0) {
        CALCULATORS[existingIdx] = Object.assign({}, CALCULATORS[existingIdx], calc);
      } else {
        CALCULATORS.push(calc);
      }
    },

    /**
     * Get centralized site configuration and production domain metadata
     * @returns {Object} Site configuration
     */
    getConfig: function() {
      return Object.assign({}, SITE_CONFIG);
    },

    /**
     * Get the production canonical base URL
     * @returns {string} Base URL (e.g. 'https://calculatorhub.com')
     */
    getBaseUrl: function() {
      return SITE_CONFIG.productionDomain;
    }
  };
});
