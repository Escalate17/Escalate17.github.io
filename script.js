/* ============================================================
   Script — Tarang Patel Portfolio
   Scroll animations, nav behavior, orb parallax, interactivity
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Navigation Scroll Effect ---------- */
  const navHeader = document.getElementById('nav-header');
  let lastScroll = 0;

  function handleNavScroll() {
    const currentScroll = window.scrollY;

    if (currentScroll > 80) {
      navHeader.classList.add('scrolled');
    } else {
      navHeader.classList.remove('scrolled');
    }

    // Show nav after initial hero area
    if (currentScroll > 50) {
      navHeader.style.opacity = '1';
    }

    lastScroll = currentScroll;
  }

  // Start nav hidden, then show on scroll
  navHeader.style.opacity = '0';
  navHeader.style.transition = 'opacity 0.5s ease, background 0.5s ease, border-color 0.5s ease';

  // Show nav immediately if page is already scrolled (e.g., refresh mid-page)
  if (window.scrollY > 50) {
    navHeader.style.opacity = '1';
    navHeader.classList.add('scrolled');
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });

  /* ---------- Mobile Nav Toggle ---------- */
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  let menuOpen = false;

  navToggle.addEventListener('click', () => {
    menuOpen = !menuOpen;
    navLinks.classList.toggle('open', menuOpen);
    navToggle.setAttribute('aria-expanded', menuOpen);

    // Animate hamburger to X
    const spans = navToggle.querySelectorAll('span');
    if (menuOpen) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (menuOpen) {
        menuOpen = false;
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        const spans = navToggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
  });

  /* ---------- Scroll Reveal (Intersection Observer) ---------- */
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px',
    }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  /* ---------- Smooth Scroll for Anchor Links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80; // nav height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---------- Active Nav Link Tracking ---------- */
  const sections = document.querySelectorAll('section[id]');
  const navLinkElements = document.querySelectorAll('.nav-links a');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinkElements.forEach((link) => {
            if (link.getAttribute('href') === `#${id}`) {
              link.style.color = 'rgba(255,255,255,0.95)';
            } else {
              link.style.color = '';
            }
          });
        }
      });
    },
    {
      threshold: 0.3,
      rootMargin: '-80px 0px -40% 0px',
    }
  );

  sections.forEach((section) => sectionObserver.observe(section));

  /* ---------- Orb Parallax on Scroll ---------- */
  const orbs = document.querySelectorAll('.orb');

  function parallaxOrbs() {
    const scrollY = window.scrollY;
    orbs.forEach((orb, i) => {
      const speed = 0.02 + (i % 3) * 0.015;
      const direction = i % 2 === 0 ? 1 : -1;
      orb.style.transform = `translateY(${scrollY * speed * direction}px)`;
    });
  }

  window.addEventListener('scroll', parallaxOrbs, { passive: true });

  /* ---------- Cursor Glow Effect (Desktop Only) ---------- */
  if (window.matchMedia('(pointer: fine)').matches) {
    const glow = document.createElement('div');
    glow.style.cssText = `
      position: fixed;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
      transform: translate(-50%, -50%);
      transition: opacity 0.3s;
      opacity: 0;
    `;
    document.body.appendChild(glow);

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      glow.style.opacity = '1';
    });

    document.addEventListener('mouseleave', () => {
      glow.style.opacity = '0';
    });

    function animateGlow() {
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      glow.style.left = glowX + 'px';
      glow.style.top = glowY + 'px';
      requestAnimationFrame(animateGlow);
    }

    animateGlow();
  }

  /* ---------- Glass Card Tilt Effect (Desktop Only) ---------- */
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.project-card:not(.project-card-more)').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / centerY * -3;
        const rotateY = (x - centerX) / centerX * 3;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---------- Typed Effect for Hero Subtitle (Optional Enhancement) ---------- */
  // The hero words animate via CSS. This section is reserved for future enhancements.

  /* ---------- Copyright Year ---------- */
  const yearEl = document.querySelector('.footer-text');
  if (yearEl) {
    yearEl.innerHTML = yearEl.innerHTML.replace('© 2025', `© ${new Date().getFullYear()}`);
  }

  /* ---------- Three.js 3D Background Structure ---------- */
  if (typeof THREE !== 'undefined') {
    const container = document.getElementById('three-container');
    if (container) {
      // Scene, Camera, Renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // Add floating wireframe shapes at different heights
      const shapes = [];
      const geometries = [
        new THREE.TorusGeometry(3, 1, 12, 48),
        new THREE.IcosahedronGeometry(2.5, 1),
        new THREE.OctahedronGeometry(2, 1),
        new THREE.TorusKnotGeometry(2.5, 0.6, 64, 8),
        new THREE.BoxGeometry(3, 3, 3, 2, 2, 2)
      ];

      // Distribute shapes along the scroll axis (Y axis in 3D space)
      const colorCyan = new THREE.Color('#06b6d4');
      const colorBlue = new THREE.Color('#3b82f6');
      const colorTeal = new THREE.Color('#14b8a6');
      const colors = [colorCyan, colorBlue, colorTeal, colorCyan, colorBlue];
      
      const count = 6;
      for (let i = 0; i < count; i++) {
        const geom = geometries[i % geometries.length];
        const material = new THREE.MeshBasicMaterial({
          color: colors[i % colors.length],
          wireframe: true,
          transparent: true,
          opacity: 0.12 + (i % 2) * 0.05
        });
        
        const mesh = new THREE.Mesh(geom, material);
        
        // Randomize positions, but distribute them vertically
        mesh.position.x = (Math.random() - 0.5) * 16;
        // Distribute from Y = 10 down to Y = -60
        mesh.position.y = 8 - i * 14 + (Math.random() - 0.5) * 4;
        mesh.position.z = -5 - Math.random() * 5;
        
        mesh.rotationSpeedX = (Math.random() - 0.5) * 0.01;
        mesh.rotationSpeedY = (Math.random() - 0.5) * 0.01;
        
        scene.add(mesh);
        shapes.push(mesh);
      }

      // Initial Camera Position
      camera.position.z = 10;
      let targetCameraY = 0;

      // Handle Scroll — map scroll position to camera Y
      function updateCameraScroll() {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = window.scrollY / (maxScroll || 1);
        // Map 0 -> 100% scroll to 3D Y coordinate shift
        targetCameraY = -scrollPercent * 65;
      }

      window.addEventListener('scroll', updateCameraScroll, { passive: true });
      updateCameraScroll(); // Call once to set initial

      // Window Resize
      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      });

      // Animation Loop
      function animate() {
        requestAnimationFrame(animate);

        // Smooth camera transition on scroll
        camera.position.y += (targetCameraY - camera.position.y) * 0.05;

        // Rotate individual shapes
        shapes.forEach((shape) => {
          shape.rotation.x += shape.rotationSpeedX;
          shape.rotation.y += shape.rotationSpeedY;
        });

        renderer.render(scene, camera);
      }

      animate();
    }
  }

})();
