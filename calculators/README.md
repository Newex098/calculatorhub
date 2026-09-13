# CalculatorHub — Calculator Extension Architecture

This directory is designed for individual static calculator pages (e.g. `/calculators/emi/`, `/calculators/gst/`, `/calculators/sip/`).

## Architectural Separation of Concerns

Each calculator in CalculatorHub follows a 4-tier modular architecture:

1. **Metadata & Registry (`js/registry.js`)**:
   - Register the calculator's `id`, `name`, `category`, `slug`, `description`, `keywords`, and `url`.
   - Automatically enables homepage search, category pages, and related tools.

2. **Calculation Logic Engine (`js/calculators/<name>-engine.js`)**:
   - Pure mathematical formula decoupled from DOM manipulation (e.g., `StandardCalculatorEngine`, future `EmiCalculatorEngine`).
   - Clean, testable, and reusable across both desktop and mobile views.

3. **Page UI Markup (`calculators/<name>/index.html`)**:
   - Built using `calculators/template.html`.
   - Inherits universal header, footer, and light master design tokens (`css/styles.css` and `css/calculator.css`).
   - Static-site friendly: indexable by search engines (SEO) with clean permalinks.

4. **UI Controller (`js/calculators/<name>.js`)**:
   - Listens to input sliders/number fields, calls the computation engine, and updates the DOM summary.

---

## Example: Adding a New Calculator in 3 Steps

### Step 1: Add to Registry (`js/registry.js`)
```javascript
{
  id: 'fd',
  name: 'FD Calculator',
  slug: 'fd-calculator',
  category: 'finance',
  categoryName: 'Finance',
  description: 'Calculate maturity amount and fixed deposit interest returns.',
  url: 'calculators/fd/index.html',
  keywords: ['fd', 'fixed deposit', 'interest', 'savings']
}
```

### Step 2: Create Pure Logic Engine (`js/calculators/fd-engine.js`)
```javascript
function FdCalculatorEngine() { ... }
FdCalculatorEngine.prototype.calculate = function(principal, rate, years) { ... };
```

### Step 3: Create Page (`calculators/fd/index.html`)
Copy `calculators/template.html` to `calculators/fd/index.html` and wire the input fields to `FdCalculatorEngine`.
