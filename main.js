/* LakshEStar — интерактивность: меню, шапка, табы, FAQ, reveal-анимации */
(function () {
  'use strict';

  var body = document.body;
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobile-menu');
  var iconMenu = document.getElementById('icon-menu');
  var iconClose = document.getElementById('icon-close');

  /* Мобильное меню */
  function toggleMenu(force) {
    var open = typeof force === 'boolean' ? force : menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !open);
    iconMenu.classList.toggle('hidden', open);
    iconClose.classList.toggle('hidden', !open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    body.classList.toggle('no-scroll', open);
  }

  burger.addEventListener('click', function () { toggleMenu(); });

  document.querySelectorAll('.mobile-link').forEach(function (link) {
    link.addEventListener('click', function () { toggleMenu(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.classList.contains('hidden')) toggleMenu(false);
  });

  /* Тень шапки при скролле */
  var header = document.getElementById('header');
  window.addEventListener('scroll', function () {
    header.classList.toggle('header-scrolled', window.scrollY > 8);
  }, { passive: true });

  /* Табы «Наши кошки» */
  var tabs = document.querySelectorAll('.tab-btn');
  var panels = {
    'tab-males': document.getElementById('panel-males'),
    'tab-females': document.getElementById('panel-females'),
    'tab-neuters': document.getElementById('panel-neuters')
  };

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.setAttribute('aria-selected', String(active));
        t.classList.toggle('bg-forest', active);
        t.classList.toggle('text-white', active);
        t.classList.toggle('shadow-sm', active);
        t.classList.toggle('border', !active);
        t.classList.toggle('border-ink/15', !active);
        t.classList.toggle('bg-white', !active);
        t.classList.toggle('text-ink', !active);
      });
      Object.keys(panels).forEach(function (key) {
        var on = key === tab.id;
        panels[key].classList.toggle('hidden', !on);
      });
    });
  });

  /* FAQ-аккордеон (одиночный режим) */
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    item.querySelector('.faq-trigger').addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      faqItems.forEach(function (other) {
        other.classList.remove('open');
        other.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        item.querySelector('.faq-trigger').setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* Появление секций при скролле */
  var revealItems = document.querySelectorAll('.reveal');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach(function (el) { observer.observe(el); });
  }

  /* Карусель отзывов: бесконечная авто-лента с ручной прокруткой и эффектом краёв */
  var reviewsViewport = document.getElementById('reviews-viewport');
  var reviewsTrack = document.getElementById('reviews-track');
  var reviewsPrev = document.getElementById('reviews-prev');
  var reviewsNext = document.getElementById('reviews-next');

  if (reviewsViewport && reviewsTrack) {
    var GAP = 16;          /* зазор между карточками (gap-4) */
    var FADE = 170;        /* ширина зоны затухания у краёв, px */
    var SPEED = 42;        /* скорость автопрокрутки, px/сек */

    var rx = 0, rNudge = 0, rSetWidth = 0;
    var rDragging = false, rSuppressClick = false;
    var rHoverPaused = false, rIdlePaused = false, rIdleTimer = null;

    /* Дублируем набор карточек для бесшовной ленты */
    var rOriginals = Array.prototype.slice.call(reviewsTrack.children);
    rOriginals.forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a').forEach(function (a) { a.setAttribute('tabindex', '-1'); });
      reviewsTrack.appendChild(clone);
    });

    var rCardWidth = function () {
      var first = reviewsTrack.children[0];
      return first ? first.offsetWidth + GAP : 300;
    };
    var rMeasure = function () { rSetWidth = rOriginals.length * (rCardWidth()); };
    var rWrap = function (v) {
      if (!rSetWidth) return v;
      v = v % rSetWidth;
      if (v > 0) v -= rSetWidth;
      return v;
    };

    /* Пауза автопрокрутки после взаимодействия пользователя */
    var rWake = function () {
      rIdlePaused = true;
      clearTimeout(rIdleTimer);
      rIdleTimer = setTimeout(function () { rIdlePaused = false; }, 2600);
    };

    /* Затухание и уменьшение карточек у краёв контейнера */
    var rUpdateEdges = function () {
      var w = reviewsViewport.clientWidth;
      for (var i = 0; i < reviewsTrack.children.length; i++) {
        var card = reviewsTrack.children[i];
        var center = card.offsetLeft + card.offsetWidth / 2 + rx;
        var dist = Math.min(center, w - center);
        var t = Math.max(0, Math.min(1, dist / FADE));
        t = t * t * (3 - 2 * t);
        card.style.opacity = t.toFixed(3);
        card.style.transform = 'scale(' + (0.82 + 0.18 * t).toFixed(3) + ')';
        card.style.pointerEvents = t < 0.2 ? 'none' : '';
      }
    };

    /* Упрощённый нативный режим при prefers-reduced-motion */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reviewsViewport.classList.add('reviews-native');
      if (reviewsPrev) reviewsPrev.addEventListener('click', function () {
        reviewsViewport.scrollBy({ left: -rCardWidth(), behavior: 'smooth' });
      });
      if (reviewsNext) reviewsNext.addEventListener('click', function () {
        reviewsViewport.scrollBy({ left: rCardWidth(), behavior: 'smooth' });
      });
    } else {
      rMeasure();

      /* Блокируем переход по ссылке сразу после перетаскивания */
      reviewsTrack.addEventListener('click', function (e) {
        if (rSuppressClick) { e.preventDefault(); rSuppressClick = false; }
      }, true);

      /* Перетаскивание мышью и свайп пальцем */
      reviewsTrack.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        rDragging = true;
        rSuppressClick = false;
        reviewsTrack.classList.add('dragging');
        reviewsTrack.setPointerCapture(e.pointerId);
        reviewsTrack.dataset.startX = String(e.clientX);
        reviewsTrack.dataset.startOffset = String(rx);
        rWake();
      });
      reviewsTrack.addEventListener('pointermove', function (e) {
        if (!rDragging) return;
        var dx = e.clientX - parseFloat(reviewsTrack.dataset.startX);
        if (Math.abs(dx) > 8) rSuppressClick = true;
        rx = parseFloat(reviewsTrack.dataset.startOffset) + dx;
        rWake();
      });
      var rEndDrag = function (e) {
        if (!rDragging) return;
        rDragging = false;
        reviewsTrack.classList.remove('dragging');
        if (reviewsTrack.hasPointerCapture(e.pointerId)) reviewsTrack.releasePointerCapture(e.pointerId);
        rWake();
      };
      reviewsTrack.addEventListener('pointerup', rEndDrag);
      reviewsTrack.addEventListener('pointercancel', rEndDrag);

      /* Пауза при наведении мыши */
      reviewsViewport.addEventListener('mouseenter', function () { rHoverPaused = true; });
      reviewsViewport.addEventListener('mouseleave', function () { rHoverPaused = false; });

      /* Горизонтальный тачпад/shift+колесо */
      reviewsViewport.addEventListener('wheel', function (e) {
        var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
        if (!d) return;
        e.preventDefault();
        rx -= d;
        rWake();
      }, { passive: false });

      /* Кнопки: плавный сдвиг на одну карточку */
      if (reviewsPrev) reviewsPrev.addEventListener('click', function () { rNudge += rCardWidth(); rWake(); });
      if (reviewsNext) reviewsNext.addEventListener('click', function () { rNudge -= rCardWidth(); rWake(); });

      window.addEventListener('resize', function () {
        rMeasure();
        rx = rWrap(rx);
      });

      var rLast = performance.now();
      var rFrame = function (now) {
        var dt = Math.min((now - rLast) / 1000, 0.05);
        rLast = now;
        if (!rDragging) {
          if (!rHoverPaused && !rIdlePaused && !document.hidden) rx -= SPEED * dt;
          if (rNudge) {
            var delta = rNudge * Math.min(1, dt * 7);
            rx += delta;
            rNudge -= delta;
            if (Math.abs(rNudge) < 0.4) { rx += rNudge; rNudge = 0; }
          }
        }
        rx = rWrap(rx);
        reviewsTrack.style.transform = 'translate3d(' + rx.toFixed(2) + 'px,0,0)';
        rUpdateEdges();
        requestAnimationFrame(rFrame);
      };
      requestAnimationFrame(rFrame);
    }
  }
})();
