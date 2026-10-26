/* Member app interactions: target modal and activity heatmap. */
(function () {
  'use strict';

  var modal = document.querySelector('[data-target-modal]');
  if (modal) {
    var openers = document.querySelectorAll('[data-target-open]');
    var closeButtons = modal.querySelectorAll('[data-modal-close]');
    var lastFocused = null;
    var previousOverflow = '';

    function focusableElements() {
      return Array.prototype.slice
        .call(
          modal.querySelectorAll(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        )
        .filter(function (element) {
          return element.offsetParent !== null;
        });
    }

    function openModal() {
      lastFocused = document.activeElement;
      previousOverflow = document.body.style.overflow;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      var first =
        modal.querySelector('input:not([type="hidden"]), select, textarea') ||
        modal.querySelector('button');
      if (first) first.focus();
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = previousOverflow;
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    Array.prototype.forEach.call(openers, function (button) {
      button.addEventListener('click', openModal);
    });
    Array.prototype.forEach.call(closeButtons, function (button) {
      button.addEventListener('click', closeModal);
    });
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (event) {
      if (!modal.classList.contains('is-open')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key !== 'Tab') return;
      var focusable = focusableElements();
      if (focusable.length === 0) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    if (modal.dataset.autoOpen === 'true') {
      window.requestAnimationFrame(openModal);
    }

    var juzSuffix = modal.dataset.juzSuffix || 'juz/day';
    var pagesSuffix = modal.dataset.pagesSuffix || 'pages/day';
    Array.prototype.forEach.call(modal.querySelectorAll('[data-target-field]'), function (button) {
      button.addEventListener('click', function () {
        var field = button.getAttribute('data-target-field');
        var unit = button.getAttribute('data-target-unit');
        var hidden = document.getElementById('target-' + field + '-unit');
        var input = document.getElementById('target-' + field + '-input');
        var suffix = document.getElementById('target-' + field + '-suffix');
        if (!field || !unit || !hidden || !input || !suffix) return;

        var oldUnit = hidden.value;
        if (oldUnit !== unit) {
          var value = Number(input.value) || 0;
          input.value = unit === 'pages'
            ? String(Math.max(0.01, Number((value * (604 / 30)).toFixed(2))))
            : String(Math.max(0.01, Number((value / (604 / 30)).toFixed(2))));
        }
        hidden.value = unit;
        input.max = unit === 'pages' ? '604' : '30';
        input.min = '0.01';
        input.step = '0.01';
        suffix.textContent = unit === 'pages' ? pagesSuffix : juzSuffix;
        Array.prototype.forEach.call(
          modal.querySelectorAll('[data-target-field="' + field + '"]'),
          function (item) {
            item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
          }
        );
      });
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-heatmap]'), function (grid) {
    var cells = Array.prototype.slice.call(grid.querySelectorAll('[data-heat-date]'));
    if (cells.length === 0) return;
    var detail = document.getElementById(grid.getAttribute('data-detail') || '');
    var current = cells.findIndex(function (cell) {
      return cell.tabIndex === 0;
    });
    if (current < 0) current = 0;

    function show(cell) {
      if (detail) detail.textContent = cell.getAttribute('aria-label') || '';
    }

    function focusCell(index) {
      var next = ((index % cells.length) + cells.length) % cells.length;
      Array.prototype.forEach.call(cells, function (cell) {
        cell.tabIndex = -1;
      });
      cells[next].tabIndex = 0;
      cells[next].focus();
      current = next;
      show(cells[next]);
    }

    var steps = {
      ArrowRight: 7,
      ArrowLeft: -7,
      ArrowDown: 1,
      ArrowUp: -1,
    };
    grid.addEventListener('keydown', function (event) {
      if (event.key === 'Home') {
        event.preventDefault();
        focusCell(0);
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        focusCell(cells.length - 1);
        return;
      }
      var step = steps[event.key];
      if (!step) return;
      event.preventDefault();
      focusCell(current + step);
    });
    cells.forEach(function (cell, index) {
      cell.addEventListener('focus', function () {
        current = index;
        show(cell);
      });
      cell.addEventListener('click', function () {
        current = index;
        show(cell);
      });
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-log-form]'), function (form) {
    var mode = form.querySelector('[data-log-mode]');
    var unitButtons = form.querySelectorAll('[data-log-unit]');
    var juzFields = form.querySelector('[data-log-juz]');
    var pagesFields = form.querySelector('[data-log-pages]');
    var amount = form.querySelector('[data-log-amount]');
    var pagesWhole = form.querySelector('[data-log-pages-whole]');
    var pagesHalf = form.querySelector('[data-log-pages-half]');
    var summaryAmount = form.querySelector('[data-log-summary-amount]');
    var summaryEquivalent = form.querySelector('[data-log-summary-equivalent]');
    var presets = form.querySelectorAll('[data-log-preset]');
    var unitJuz = form.getAttribute('data-unit-juz') || 'juz';
    var unitPages = form.getAttribute('data-unit-pages') || 'pages';
    var hint = form.querySelector('[data-log-hint]');
    var defaultHint = hint ? hint.textContent : '';
    if (!mode || !amount || !pagesWhole || !summaryAmount || !summaryEquivalent) return;

    function formatAmount(value) {
      if (value % 1 === 0.5) return String(Math.floor(value)) + '½';
      return new Intl.NumberFormat(document.documentElement.lang || 'id', { maximumFractionDigits: 2 }).format(value);
    }

    function currentValue() {
      if (mode.value === 'pages') {
        var whole = Number(pagesWhole.value) || 0;
        return whole + (pagesHalf && pagesHalf.checked ? 0.5 : 0);
      }
      return Number(amount.value) || 0;
    }

    function updateSummary() {
      var value = currentValue();
      var isPages = mode.value === 'pages';
      summaryAmount.textContent = isPages
        ? formatAmount(value) + ' ' + unitPages
        : formatAmount(value) + ' ' + unitJuz;
      summaryEquivalent.textContent = isPages
        ? (value / (604 / 30)).toFixed(2) + ' ' + unitJuz
        : formatAmount(value * (604 / 30)) + ' ' + unitPages;
    }

    function setMode(next, convert) {
      if (next !== 'pages' && next !== 'juz') return;
      if (hint) hint.textContent = defaultHint;
      if (convert && next !== mode.value) {
        if (hint) hint.textContent += ' ' + (form.getAttribute(next === 'pages' ? 'data-unit-conversion-note' : 'data-juz-unit-note') || '');
        if (next === 'pages') {
          var converted = Math.round((Number(amount.value) || 0) * (604 / 30) * 2) / 2;
          pagesWhole.value = String(Math.floor(converted));
          if (pagesHalf) pagesHalf.checked = converted % 1 >= 0.5;
        } else {
          var pages = (Number(pagesWhole.value) || 0) + (pagesHalf && pagesHalf.checked ? 0.5 : 0);
          amount.value = pages > 0 ? String(Number((pages / (604 / 30)).toFixed(6))) : '';
        }
      }
      mode.value = next;
      juzFields.hidden = next !== 'juz';
      pagesFields.hidden = next !== 'pages';
      var amountLabel = form.querySelector('label[for="' + amount.id + '"], label[for="' + pagesWhole.id + '"]');
      if (amountLabel) amountLabel.htmlFor = next === 'pages' ? pagesWhole.id : amount.id;
      Array.prototype.forEach.call(unitButtons, function (button) {
        button.setAttribute('aria-pressed', button.getAttribute('data-log-unit') === next ? 'true' : 'false');
      });
      updateSummary();
    }

    Array.prototype.forEach.call(unitButtons, function (button) {
      button.addEventListener('click', function () {
        setMode(button.getAttribute('data-log-unit'), true);
        Array.prototype.forEach.call(presets, function (preset) {
          preset.setAttribute('aria-pressed', 'false');
        });
      });
    });

    Array.prototype.forEach.call(presets, function (preset) {
      preset.addEventListener('click', function () {
        var unit = preset.getAttribute('data-unit');
        var value = preset.getAttribute('data-amount') || '1';
        setMode(unit, false);
        if (unit === 'pages') {
          pagesWhole.value = value;
          if (pagesHalf) pagesHalf.checked = false;
        } else {
          amount.value = value;
        }
        Array.prototype.forEach.call(presets, function (item) {
          item.setAttribute('aria-pressed', item === preset ? 'true' : 'false');
        });
        updateSummary();
      });
    });

    [amount, pagesWhole, pagesHalf].forEach(function (input) {
      if (!input) return;
      function changed() {
        Array.prototype.forEach.call(presets, function (preset) {
          preset.setAttribute('aria-pressed', 'false');
        });
        updateSummary();
      }
      input.addEventListener('input', changed);
      input.addEventListener('change', changed);
    });

    setMode(mode.value === 'pages' ? 'pages' : 'juz', false);
    updateSummary();
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-coverage]'), function (group) {
    var tabs = group.querySelectorAll('[data-coverage-tab]');
    var panels = group.querySelectorAll('[data-coverage-panel]');
    function show(name) {
      Array.prototype.forEach.call(tabs, function (tab) {
        tab.setAttribute('aria-pressed', tab.getAttribute('data-coverage-tab') === name ? 'true' : 'false');
      });
      Array.prototype.forEach.call(panels, function (panel) {
        panel.hidden = panel.getAttribute('data-coverage-panel') !== name;
      });
    }
    Array.prototype.forEach.call(tabs, function (tab) {
      tab.addEventListener('click', function () {
        show(tab.getAttribute('data-coverage-tab'));
      });
    });
    show('month');
  });
})();

/* Existing server routes remain authoritative for dates, positions and ownership. */
(function () {
  'use strict';
  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (form instanceof HTMLFormElement && form.hasAttribute('data-confirm') && !window.confirm(form.getAttribute('data-confirm'))) event.preventDefault();
  });
  document.querySelectorAll('[data-log-form]').forEach(function (form) {
    function ayahLimit(prefix) {
      var select = form.querySelector('[name="' + prefix + '_surah"]');
      var input = form.querySelector('[name="' + prefix + '_ayah"]');
      if (!select || !input) return;
      var option = select.options[select.selectedIndex];
      var limit = option && option.getAttribute('data-total-ayahs');
      if (limit) input.max = limit; else input.removeAttribute('max');
    }
    ['start','end'].forEach(function (prefix) {
      var select = form.querySelector('[name="' + prefix + '_surah"]');
      if (select) select.addEventListener('change', function () { ayahLimit(prefix); });
      ayahLimit(prefix);
    });
    var next = form.querySelector('[data-continue-surah]');
    if (!next) return;
    next.addEventListener('click', function () {
      var select = form.querySelector('[name="start_surah"]');
      var ayah = form.querySelector('[name="start_ayah"]');
      if (!select || !ayah) return;
      var surah = Number(next.getAttribute('data-continue-surah'));
      var verse = Number(next.getAttribute('data-continue-ayah'));
      var option = Array.from(select.options).find(function (item) { return Number(item.value) === surah; });
      if (!option) return;
      if (verse < Number(option.getAttribute('data-total-ayahs'))) verse += 1;
      else { if (surah >= 114) return; surah += 1; verse = 1; }
      select.value = String(surah); ayah.value = String(verse); ayahLimit('start');
      var ending = form.querySelector('[name="end_surah"]');
      if (ending) ending.focus();
    });
  });
})();
