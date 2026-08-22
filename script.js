/* Reveal on scroll, nav hairline, year, and the pixel orb.

   The orb is drawn on a small canvas (80x80 logical pixels) and scaled up with
   image-rendering: pixelated — the same technique as the pixel scene in Meet, so
   the two sites share a visual language rather than just a palette. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav hairline ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- contact email copy & feedback ---------- */
  var emailBtn = document.getElementById('email-btn');
  if (emailBtn) {
    var emailAddress = 'tarangpatel1703@gmail.com';
    var resetTimer = null;
    var originalHTML = emailBtn.innerHTML;

    function fallbackCopy(text) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        ta.style.left = '-9999px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (err) {
        // silent fallback
      }
    }

    emailBtn.addEventListener('click', function () {
      // 1. Copy email address to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(emailAddress).catch(function () {
          fallbackCopy(emailAddress);
        });
      } else {
        fallbackCopy(emailAddress);
      }

      // 2. Inline visual confirmation
      emailBtn.classList.add('copied');
      emailBtn.innerHTML = 'Copied \u2014 ' + emailAddress;

      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(function () {
        emailBtn.classList.remove('copied');
        emailBtn.innerHTML = originalHTML;
      }, 3000);
    });
  }

  /* ---------- reveal ---------- */
  var items = document.querySelectorAll('.reveal');
  if (items.length) {
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('visible'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry, i) {
          if (!entry.isIntersecting) return;
          setTimeout(function () { entry.target.classList.add('visible'); }, i * 70);
          io.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      items.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- fireflies in the dark sections ----------
     Drifting warm pixels, straight out of Meet's living room. Drawn on a low-res
     canvas and scaled up so they stay chunky rather than smooth blurs. */
  document.querySelectorAll('canvas.flies').forEach(function (cv) {
    var host = cv.parentElement;
    var n = parseInt(cv.getAttribute('data-flies'), 10) || 12;
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, SCALE = 5;          // 1 logical px = 5 css px

    var flies = [];
    for (var i = 0; i < n; i++) {
      flies.push({
        x: Math.random(), y: 0.12 + Math.random() * 0.82,
        ph: Math.random() * 6.28,
        spd: 0.25 + Math.random() * 0.6,
        amp: 0.012 + Math.random() * 0.03,
        drift: (Math.random() - 0.5) * 0.00004
      });
    }

    function size() {
      var r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width / SCALE));
      H = Math.max(1, Math.round(r.height / SCALE));
      cv.width = W; cv.height = H;
      ctx.imageSmoothingEnabled = false;
    }
    size();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(size).observe(host);

    var t0 = performance.now();
    function paint(now) {
      var t = now - t0;
      ctx.clearRect(0, 0, W, H);
      flies.forEach(function (f, i) {
        if (!reduce) f.x = (f.x + f.drift * 16 + 1) % 1;
        var ph = reduce ? f.ph : f.ph + t * 0.0007 * f.spd;
        var x = Math.round((f.x + Math.cos(ph) * f.amp) * W);
        var y = Math.round((f.y + Math.sin(ph * 1.3) * f.amp * 1.6) * H);
        var glow = reduce ? 0.6 : 0.30 + 0.70 * Math.abs(Math.sin(ph * 1.9 + i));
        if (glow > 0.86) {                       // halo at peak brightness
          ctx.fillStyle = 'rgba(255,207,135,0.14)';
          ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3);
        }
        ctx.fillStyle = 'rgba(255,230,160,' + (glow * 0.9).toFixed(2) + ')';
        ctx.fillRect(x, y, 1, 1);
      });
      requestAnimationFrame(paint);
    }
    requestAnimationFrame(paint);
  });

  /* ---------- live state panel ----------
     A reduced version of the real engine: per-rasa decay rates taken from the
     reference table, a few of the 18 couplings, and occasional events. The bars
     are what the transition function is actually producing, not a canned loop. */
  var host = document.getElementById('state');
  if (!host) return;

  //            name         decay    tone
  var RASA = [
    ['shanta',    0.0030, 'cool'],
    ['shringara', 0.0100, 'cool'],
    ['karuna',    0.0100, 'cool'],
    ['adbhuta',   0.0180, 'cool'],
    ['hasya',     0.0200, 'cool'],
    ['bhayanaka', 0.0250, 'warm'],
    ['krodha',    0.0180, 'warm'],
    ['shoka',     0.0050, 'warm'],
    ['dvesha',    0.0040, 'warm']
  ];
  var IX = {}; RASA.forEach(function (r, i) { IX[r[0]] = i; });

  // a handful of the real couplings: source, target, rate
  var COUPLE = [
    ['krodha', 'shanta', -0.012], ['shanta', 'bhayanaka', -0.010],
    ['karuna', 'krodha', -0.007], ['shringara', 'hasya', 0.004],
    ['dvesha', 'krodha', 0.005], ['hasya', 'bhayanaka', -0.006]
  ];

  // events push a set of rasas in a direction; magnitude scales with current value
  var WARM_EV = [
    { n: 'attacked',  d: { bhayanaka: 1, krodha: 1, shringara: -1 } },
    { n: 'betrayed',  d: { dvesha: 1, krodha: 1, shringara: -1 } },
    { n: 'loss',      d: { shoka: 1, karuna: 1, hasya: -1 } },
    { n: 'saw threat',d: { bhayanaka: 1, hasya: -1 } }
  ];
  var COOL_EV = [
    { n: 'helped',    d: { shringara: 1, karuna: 1, adbhuta: 1, bhayanaka: -1 } },
    { n: 'reunion',   d: { shringara: 1, hasya: 1, shoka: -1, bhayanaka: -1 } },
    { n: 'discovery', d: { adbhuta: 1, hasya: 1 } },
    { n: 'gift',      d: { shringara: 1, hasya: 1, dvesha: -1 } }
  ];
  var warmTurn = false;

  var SEED = { shanta: 0.58, shringara: 0.34, karuna: 0.29, adbhuta: 0.22,
               hasya: 0.18, bhayanaka: 0.12, krodha: 0.08, shoka: 0.15, dvesha: 0.09 };
  var v = RASA.map(function (r) { return SEED[r[0]] + Math.random() * 0.06; });

  var SEG = 14;
  var rows = RASA.map(function (r) {
    var row = document.createElement('div');
    row.className = 'srow ' + r[2];
    var name = document.createElement('span'); name.className = 'sname'; name.textContent = r[0];
    var bar = document.createElement('span'); bar.className = 'sbar';
    var segs = [];
    for (var i = 0; i < SEG; i++) { var b = document.createElement('i'); bar.appendChild(b); segs.push(b); }
    var val = document.createElement('span'); val.className = 'sval';
    row.appendChild(name); row.appendChild(bar); row.appendChild(val);
    host.appendChild(row);
    return { segs: segs, val: val };
  });

  var evLabel = document.createElement('div');
  evLabel.className = 'sevent';
  evLabel.textContent = ' ';
  host.appendChild(evLabel);

  function step() {
    // 1. decay
    for (var i = 0; i < v.length; i++) {
      if (RASA[i][0] !== 'shanta') v[i] = Math.max(0, v[i] - RASA[i][1] * 0.22);
    }
    // 2. shanta refills toward equilibrium
    var tot = 0;
    for (i = 1; i < v.length; i++) tot += v[i];
    v[0] = Math.min(0.74, Math.max(0.16, 0.82 - tot * 0.15));
    // 3. coupling
    var delta = v.map(function () { return 0; });
    COUPLE.forEach(function (c) { delta[IX[c[1]]] += v[IX[c[0]]] * c[2] * 0.35; });
    for (i = 0; i < v.length; i++) v[i] = Math.min(1, Math.max(0, v[i] + delta[i]));
  }

  function fire() {
    // alternate so neither half of the panel sits dark for long
    var pool = warmTurn ? WARM_EV : COOL_EV;
    warmTurn = !warmTurn;
    var e = pool[(Math.random() * pool.length) | 0];
    var amount = 0.34 + Math.random() * 0.22;
    for (var k in e.d) {
      if (!(k in IX)) continue;
      var i = IX[k];
      // magnitude derived from the state receiving it — the engine's core move
      var delta = e.d[k] * amount * (v[i] + 0.34);
      v[i] = Math.min(1, Math.max(0, v[i] + delta));
    }
    evLabel.textContent = '→ ' + e.n;
    evLabel.classList.add('lit');
    setTimeout(function () { evLabel.classList.remove('lit'); }, 1400);
  }

  function paint() {
    rows.forEach(function (row, i) {
      var filled = Math.round(v[i] * SEG);
      for (var j = 0; j < SEG; j++) row.segs[j].classList.toggle('on', j < filled);
      row.val.textContent = v[i].toFixed(2);
    });
  }

  paint();
  if (reduce) { fire(); paint(); return; }

  setInterval(function () { step(); paint(); }, 170);
  setTimeout(function tick() {
    fire(); paint();
    setTimeout(tick, 1500 + Math.random() * 1300);
  }, 900);
})();
