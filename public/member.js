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
            ? String(Math.max(1, Math.round(value * 20)))
            : String(Math.max(1, Math.round(value / 20)));
        }
        hidden.value = unit;
        input.max = unit === 'pages' ? '604' : '30';
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
})();
