document.addEventListener('DOMContentLoaded', () => {

  // ── Hamburger / mobile panel toggle
  const hamburger   = document.getElementById('hamburger');
  const mobilePanel = document.getElementById('mobilePanel');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobilePanel.classList.toggle('open');
  });

  // Close panel when any mobile link is clicked
  mobilePanel.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobilePanel.classList.remove('open');
    });
  });

  // ── Active nav link on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-links a[href^="#"]');

  const activateLink = (id) => {
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
    });
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) activateLink(e.target.id); });
  }, { threshold: 0.35 });

  sections.forEach(s => sectionObserver.observe(s));

  // ── Scroll reveal
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // ── Navbar background on scroll
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.style.background = window.scrollY > 40
      ? 'rgba(8,8,8,0.97)'
      : 'rgba(8,8,8,0.8)';
  }, { passive: true });

});