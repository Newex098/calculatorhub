/**
 * CalculatorHub - Age Calculation Engine
 * Pure computation engine for chronological age, calendar differences,
 * next birthday countdowns, and multi-unit conversions.
 * Zero DOM dependencies, no external libraries, safe against invalid dates.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AgeCalculatorEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  function AgeCalculatorEngine() {}

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const DAY_NAMES = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  /**
   * Check whether a given year is a leap year (Gregorian calendar)
   * @param {number} year
   * @returns {boolean}
   */
  AgeCalculatorEngine.prototype.isLeapYear = function(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };

  /**
   * Return the exact number of days in a given month of a given year
   * @param {number} year - Full year (e.g. 2024)
   * @param {number} month - Month (1-12)
   * @returns {number} Days (28, 29, 30, or 31)
   */
  AgeCalculatorEngine.prototype.getDaysInMonth = function(year, month) {
    if (month === 2) {
      return this.isLeapYear(year) ? 29 : 28;
    }
    if (month === 4 || month === 6 || month === 9 || month === 11) {
      return 30;
    }
    return 31;
  };

  /**
   * Parse and validate a date string in YYYY-MM-DD format
   * Uses UTC components to prevent browser timezone shifts.
   * @param {string} dateStr
   * @returns {Object|null} { year, month, day } or null if invalid
   */
  AgeCalculatorEngine.prototype.parseDateParts = function(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.trim().split('-');
    if (parts.length !== 3) return null;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    if (year < 100 || year > 9999) return null;
    if (month < 1 || month > 12) return null;

    const maxDays = this.getDaysInMonth(year, month);
    if (day < 1 || day > maxDays) return null;

    return { year, month, day };
  };

  /**
   * Format a date into a clean human-readable string (e.g. "15 March 2026")
   * @param {number} year
   * @param {number} month - (1-12)
   * @param {number} day
   * @returns {string}
   */
  AgeCalculatorEngine.prototype.formatDate = function(year, month, day) {
    return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
  };

  /**
   * Return day of week name for a valid year, month (1-12), day
   * @param {number} year
   * @param {number} month
   * @param {number} day
   * @returns {string} e.g. "Monday"
   */
  AgeCalculatorEngine.prototype.getDayOfWeek = function(year, month, day) {
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    return DAY_NAMES[utcDate.getUTCDay()];
  };

  /**
   * Calculate exact chronological calendar age in years, months, and days.
   * Also computes supplementary units (total months, weeks, days, hours)
   * and next birthday countdown.
   * 
   * @param {string} dobString - Date of Birth in YYYY-MM-DD
   * @param {string} targetString - Target calculation date in YYYY-MM-DD
   * @returns {Object} Complete structured age analysis
   */
  AgeCalculatorEngine.prototype.calculateAge = function(dobString, targetString) {
    const dob = this.parseDateParts(dobString);
    if (!dob) {
      return {
        isValid: false,
        error: 'Please enter a valid Date of Birth.'
      };
    }

    const target = this.parseDateParts(targetString);
    if (!target) {
      return {
        isValid: false,
        error: 'Please enter a valid calculation date.'
      };
    }

    // Comparison using numeric tuple
    const isTargetBeforeDob = (target.year < dob.year) ||
      (target.year === dob.year && target.month < dob.month) ||
      (target.year === dob.year && target.month === dob.month && target.day < dob.day);

    if (isTargetBeforeDob) {
      return {
        isValid: false,
        error: 'Calculation date cannot be earlier than Date of Birth.'
      };
    }

    // 1. Calculate Exact Calendar Years, Months, and Days
    let years = target.year - dob.year;
    let months = target.month - dob.month;
    let days = target.day - dob.day;

    // Documented leap-year birthday convention:
    // If born on Feb 29 and target is Feb 28 in a non-leap year,
    // the person is considered to have completed a full year.
    const isLeapDob = (dob.month === 2 && dob.day === 29);
    if (isLeapDob && !this.isLeapYear(target.year) && target.month === 2 && target.day === 28) {
      years = target.year - dob.year;
      months = 0;
      days = 0;
    } else {
      if (days < 0) {
        months--;
        // Number of days in the month immediately preceding the target month
        const prevMonth = target.month === 1 ? 12 : target.month - 1;
        const prevYear = target.month === 1 ? target.year - 1 : target.year;
        days += this.getDaysInMonth(prevYear, prevMonth);
      }

      if (months < 0) {
        years--;
        months += 12;
      }
    }

    // 2. Exact Calendar Difference in Days (UTC based)
    const utcDob = Date.UTC(dob.year, dob.month - 1, dob.day);
    const utcTarget = Date.UTC(target.year, target.month - 1, target.day);
    const totalDays = Math.floor((utcTarget - utcDob) / 86400000);

    // 3. Supplementary Units
    const totalWeeks = Math.floor(totalDays / 7);
    const remainingDaysInWeek = totalDays % 7;
    const totalCompletedMonths = (years * 12) + months;
    const totalHours = totalDays * 24;

    // Day of the week born
    const dayBorn = this.getDayOfWeek(dob.year, dob.month, dob.day);
    const bornOnFormatted = `${dayBorn}, ${this.formatDate(dob.year, dob.month, dob.day)}`;

    // 4. Next Birthday Analysis
    const nextBirthday = this.calculateNextBirthday(dob, target);

    return {
      isValid: true,
      dob: dob,
      target: target,
      years: years,
      months: months,
      days: days,
      formattedAge: `${years} Year${years === 1 ? '' : 's'}, ${months} Month${months === 1 ? '' : 's'}, ${days} Day${days === 1 ? '' : 's'}`,
      bornOn: {
        dayOfWeek: dayBorn,
        formatted: bornOnFormatted
      },
      supplementary: {
        totalYears: years,
        totalMonths: totalCompletedMonths,
        remainingDaysInMonth: days,
        totalWeeks: totalWeeks,
        remainingDaysInWeek: remainingDaysInWeek,
        totalDays: totalDays,
        totalHours: totalHours
      },
      nextBirthday: nextBirthday,
      isLeapBirthday: isLeapDob,
      leapConventionNote: isLeapDob
        ? 'For February 29 leap-day birthdays, February 28 is observed as the birthday in non-leap years.'
        : null
    };
  };

  /**
   * Calculate next upcoming birthday relative to the target calculation date
   * @param {Object} dob - { year, month, day }
   * @param {Object} target - { year, month, day }
   * @returns {Object}
   */
  AgeCalculatorEngine.prototype.calculateNextBirthday = function(dob, target) {
    const self = this;

    function getBirthdayInYear(year) {
      if (dob.month === 2 && dob.day === 29) {
        // Leap year birthday: Feb 29 if leap year, else Feb 28
        const day = self.isLeapYear(year) ? 29 : 28;
        return { year: year, month: 2, day: day };
      }
      return { year: year, month: dob.month, day: dob.day };
    }

    const bdayThisYear = getBirthdayInYear(target.year);
    const utcTarget = Date.UTC(target.year, target.month - 1, target.day);
    const utcBdayThisYear = Date.UTC(bdayThisYear.year, bdayThisYear.month - 1, bdayThisYear.day);

    let nextBday;
    let isToday = false;
    let turningAge = target.year - dob.year;

    if (utcTarget === utcBdayThisYear) {
      isToday = true;
      nextBday = bdayThisYear;
      turningAge = target.year - dob.year;
    } else if (utcTarget < utcBdayThisYear) {
      isToday = false;
      nextBday = bdayThisYear;
      turningAge = target.year - dob.year;
    } else {
      isToday = false;
      nextBday = getBirthdayInYear(target.year + 1);
      turningAge = (target.year + 1) - dob.year;
    }

    const utcNextBday = Date.UTC(nextBday.year, nextBday.month - 1, nextBday.day);
    const daysRemaining = Math.max(0, Math.floor((utcNextBday - utcTarget) / 86400000));
    const dayOfWeek = this.getDayOfWeek(nextBday.year, nextBday.month, nextBday.day);
    const dateFormatted = `${this.formatDate(nextBday.year, nextBday.month, nextBday.day)}`;

    return {
      isToday: isToday,
      date: nextBday,
      dateFormatted: dateFormatted,
      dayOfWeek: dayOfWeek,
      daysRemaining: daysRemaining,
      turningAge: turningAge,
      summaryText: isToday
        ? 'Happy Birthday! 🎉'
        : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining until turning ${turningAge}`
    };
  };

  return AgeCalculatorEngine;
});
