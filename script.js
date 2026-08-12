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

  /* ---------- pixel scene: orb, firelight, fireflies ----------
     Same technique as Meet's ChatScene — a low-res grid rasterised with integer
     fillRect and scaled up. Two lights: a cool key from the upper left and a warm
     ember rim from the lower right, so the sphere isn't uniformly lime. */
  var host = document.getElementById('orb');
  if (!host) return;

  var S = 116;                    // logical grid
  var CX = 58, CY = 54, R = 23;   // orb

  var KEY  = { x: -0.40, y: -0.46, z: 0.79 };   // cool key, upper left
  var WARM = { x:  0.62, y:  0.50, z: 0.36 };   // ember fill, lower right (the fire)

  var COOL_BANDS = [
    [0.93, '#f2fcd8'], [0.80, '#e3f5b0'], [0.63, '#c7f074'],
    [0.44, '#a8db63'], [0.26, '#84b855'], [0.10, '#639247'], [-2, '#4a6f3d']
  ];
  // firelight falling on the shadow side — wood, ember and lamp tones from Meet
  var WARM_BANDS = [
    [0.80, '#e8a061'], [0.62, '#cf7a52'], [0.44, '#a8613f'], [-2, '#7a4a33']
  ];

  var canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  canvas.style.cssText = 'display:block;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges;';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function band(bands, v) {
    for (var i = 0; i < bands.length; i++) if (v >= bands[i][0]) return bands[i][1];
    return bands[bands.length - 1][1];
  }

  // The sphere is static — rasterise once.
  var sphere = document.createElement('canvas');
  sphere.width = S; sphere.height = S;
  (function () {
    var s2 = sphere.getContext('2d');
    for (var y = 0; y < S; y++) {
      for (var x = 0; x < S; x++) {
        var dx = (x + 0.5 - CX) / R, dy = (y + 0.5 - CY) / R;
        var d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        var dz = Math.sqrt(1 - d2);
        var lit  = dx * KEY.x  + dy * KEY.y  + dz * KEY.z;
        var warm = dx * WARM.x + dy * WARM.y + dz * WARM.z;
        // Firelight reads as a rim: only where the key has fallen away AND the
        // surface is turning away from the viewer (low dz = grazing angle).
        // Without the dz term it fills in as a patch rather than an edge.
        var rim = lit < 0.20 && warm > 0.42 && dz < 0.72;
        s2.fillStyle = rim ? band(WARM_BANDS, warm) : band(COOL_BANDS, lit);
        s2.fillRect(x, y, 1, 1);
      }
    }
  })();

  var RINGS = [
    { r: 31, speed: 0.0052, dots: 1 },
    { r: 38, speed: -0.0032, dots: 1 },
    { r: 44, speed: 0.0020, dots: 2 }
  ];
  RINGS.forEach(function (ring) {
    var pts = [], seen = {};
    for (var a = 0; a < 360; a += 1.1) {
      var t = a * Math.PI / 180;
      var x = Math.round(CX + Math.cos(t) * ring.r), y = Math.round(CY + Math.sin(t) * ring.r);
      var k = x + ',' + y;
      if (!seen[k]) { seen[k] = 1; pts.push([x, y]); }
    }
    ring.pts = pts;
  });

  // Fireflies — straight out of Meet's living room.
  var FLY = [];
  for (var i = 0; i < 9; i++) {
    FLY.push({
      x: 8 + Math.random() * (S - 16),
      y: 10 + Math.random() * (S - 20),
      ph: Math.random() * 6.28,
      spd: 0.35 + Math.random() * 0.7,
      amp: 3 + Math.random() * 7
    });
  }

  var t0 = performance.now(), raf = 0;

  function draw(now) {
    var t = now - t0;
    ctx.clearRect(0, 0, S, S);

    ctx.fillStyle = 'rgba(92,129,73,0.26)';
    RINGS.forEach(function (ring) {
      for (var i = 0; i < ring.pts.length; i += 4) ctx.fillRect(ring.pts[i][0], ring.pts[i][1], 1, 1);
    });

    ctx.drawImage(sphere, 0, 0);

    // warm ember pool under the orb, as if lit from a hearth off-frame
    ctx.fillStyle = 'rgba(207,122,82,0.13)';
    ctx.fillRect(CX - 17, CY + R - 1, 34, 2);
    ctx.fillStyle = 'rgba(207,122,82,0.08)';
    ctx.fillRect(CX - 11, CY + R + 1, 22, 2);

    RINGS.forEach(function (ring, ri) {
      for (var d = 0; d < ring.dots; d++) {
        var ang = (reduce ? 0.8 : t * ring.speed) + d * Math.PI * 2 / ring.dots + ri * 1.7;
        var x = Math.round(CX + Math.cos(ang) * ring.r), y = Math.round(CY + Math.sin(ang) * ring.r);
        ctx.fillStyle = '#5c8149'; ctx.fillRect(x - 1, y - 1, 2, 2);
        ctx.fillStyle = 'rgba(199,240,116,0.85)'; ctx.fillRect(x - 1, y - 1, 1, 1);
      }
    });

    FLY.forEach(function (f, i) {
      var ph = reduce ? f.ph : f.ph + t * 0.0006 * f.spd;
      var x = Math.round(f.x + Math.cos(ph) * f.amp);
      var y = Math.round(f.y + Math.sin(ph * 1.4) * f.amp * 0.7);
      var glow = reduce ? 0.7 : 0.45 + 0.55 * Math.abs(Math.sin(ph * 2.1 + i));
      var dx = x - CX, dy = y - CY;
      if (dx * dx + dy * dy < (R + 2) * (R + 2)) return;   // don't sit on the orb
      ctx.fillStyle = 'rgba(255,230,160,' + (glow * 0.85).toFixed(2) + ')';
      ctx.fillRect(x, y, 1, 1);
      if (glow > 0.8) {
        ctx.fillStyle = 'rgba(255,207,135,0.22)';
        ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3);
      }
    });

    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
})();
