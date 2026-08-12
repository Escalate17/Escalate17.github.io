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

  /* ---------- pixel orb ---------- */
  var host = document.getElementById('orb');
  if (!host) return;

  var S = 80;                 // logical grid: 80x80 chunky pixels
  var CX = 40, CY = 39;       // orb centre
  var R = 21;                 // orb radius

  // Light from the upper left, slightly toward the viewer. The z term is what makes
  // this read as a sphere — without it the dot product is a linear ramp across the
  // disc and you get flat diagonal stripes.
  var LX = -0.40, LY = -0.46, LZ = 0.79;

  // Quantised shading bands — the banding IS the look; no smooth gradient.
  var BANDS = [
    [0.93, '#f2fcd8'],
    [0.80, '#e3f5b0'],
    [0.63, '#c7f074'],
    [0.44, '#a8db63'],
    [0.26, '#84b855'],
    [0.10, '#639247'],
    [-2.00, '#4a6f3d']
  ];

  var canvas = document.createElement('canvas');
  canvas.width = S; canvas.height = S;
  canvas.style.cssText = 'display:block;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges;';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function shadeFor(nx, ny, nz) {
    // full surface normal dotted with the light direction
    var lit = nx * LX + ny * LY + nz * LZ;
    for (var i = 0; i < BANDS.length; i++) {
      if (lit >= BANDS[i][0]) return BANDS[i][1];
    }
    return BANDS[BANDS.length - 1][1];
  }

  // The sphere never changes, so rasterise it once.
  var sphere = document.createElement('canvas');
  sphere.width = S; sphere.height = S;
  (function rasterise() {
    var s = sphere.getContext('2d');
    for (var y = 0; y < S; y++) {
      for (var x = 0; x < S; x++) {
        var dx = (x + 0.5 - CX) / R, dy = (y + 0.5 - CY) / R;
        var d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        var dz = Math.sqrt(1 - d2);
        s.fillStyle = shadeFor(dx, dy, dz);
        s.fillRect(x, y, 1, 1);
        if (dz < 0.22) {                       // soften the silhouette edge
          s.fillStyle = 'rgba(43,51,39,0.13)';
          s.fillRect(x, y, 1, 1);
        }
      }
    }
  })();

  var RINGS = [
    { r: 28, speed: 0.0055, dots: 1 },
    { r: 34, speed: -0.0034, dots: 1 },
    { r: 39, speed: 0.0021, dots: 2 }
  ];

  function ringPixels(radius) {
    // Midpoint-ish circle, deduped to whole pixels — chunky on purpose.
    var pts = [], seen = {};
    for (var a = 0; a < 360; a += 1.2) {
      var t = a * Math.PI / 180;
      var x = Math.round(CX + Math.cos(t) * radius);
      var y = Math.round(CY + Math.sin(t) * radius);
      var k = x + ',' + y;
      if (!seen[k]) { seen[k] = 1; pts.push([x, y]); }
    }
    return pts;
  }
  RINGS.forEach(function (ring) { ring.pts = ringPixels(ring.r); });

  var t0 = performance.now();

  function draw(now) {
    var t = (now - t0);
    ctx.clearRect(0, 0, S, S);

    // faint dotted orbit rings
    ctx.fillStyle = 'rgba(92,129,73,0.28)';
    RINGS.forEach(function (ring) {
      for (var i = 0; i < ring.pts.length; i += 4) {
        ctx.fillRect(ring.pts[i][0], ring.pts[i][1], 1, 1);
      }
    });

    // the sphere, breathing by one pixel
    var puff = reduce ? 0 : (Math.sin(t * 0.0009) > 0.55 ? 1 : 0);
    if (puff) {
      ctx.drawImage(sphere, CX, CY, S - CX, S - CY, CX - 1, CY - 1, S - CX + 2, S - CY + 2);
      ctx.drawImage(sphere, 0, 0, S, S, -0.5, -0.5, S + 1, S + 1);
    } else {
      ctx.drawImage(sphere, 0, 0);
    }

    // orbiting pixels
    RINGS.forEach(function (ring, ri) {
      for (var d = 0; d < ring.dots; d++) {
        var ang = (reduce ? 0.8 : t * ring.speed) + (d * Math.PI * 2 / ring.dots) + ri * 1.7;
        var x = Math.round(CX + Math.cos(ang) * ring.r);
        var y = Math.round(CY + Math.sin(ang) * ring.r);
        ctx.fillStyle = '#5c8149';
        ctx.fillRect(x - 1, y - 1, 2, 2);
        ctx.fillStyle = 'rgba(199,240,116,0.85)';
        ctx.fillRect(x - 1, y - 1, 1, 1);
      }
    });

    raf = requestAnimationFrame(draw);
  }

  var raf = requestAnimationFrame(draw);
})();
