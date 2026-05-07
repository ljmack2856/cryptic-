// ══════════════════════════════════════════════════════
//  AUTH-NAVBAR.JS
//  Drop this script into every PUBLIC page (index, plans, etc.)
//  It checks if user is logged in and swaps Login/Register
//  links for a user avatar that links to the dashboard.
//
//  Usage: <script src="auth-navbar.js"><\/script>
//  Place just before </body> on each public page.
// ══════════════════════════════════════════════════════

(async function () {
  // Import Supabase
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')

  const supabase = createClient(
    'https://xbazuosvlggtolahgcjv.supabase.co',
    'sb_publishable_9Wy4npRqw4-b5XbldMQACg_RF2uXc-F'
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return // Not logged in — keep Login/Register links as-is

  const user = session.user
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  // Hide all login and register links/buttons in the navbar
  // Works for both desktop nav-links and mobile-panel links
  document.querySelectorAll(
    'a.nav-register, a.nav-login, a[href="login.html"], a[href="register.html"]'
  ).forEach(el => {
    el.style.display = 'none'
  })

  // Build the avatar element
  const avatarHTML = `
    <a href="dashboard.html" class="nav-user-avatar" title="Go to Dashboard" style="
      display:inline-flex; align-items:center; gap:0.55rem;
      text-decoration:none; margin-left:0.5rem;
    ">
      <span style="
        width:36px; height:36px; border-radius:50%;
        background:linear-gradient(135deg,#f5a623,#d4891a);
        display:inline-flex; align-items:center; justify-content:center;
        font-family:'Syne',sans-serif; font-size:0.85rem; font-weight:800;
        color:#000; flex-shrink:0; letter-spacing:0.02em;
      ">${initials}</span>
      <span style="
        font-size:0.85rem; font-weight:600; color:#fff;
        display:none; /* shown on wider screens via media query below */
      " class="nav-username">${name.split(' ')[0]}</span>
    </a>
  `

  // Inject avatar into desktop nav-links (ul)
  const navLinks = document.querySelector('.nav-links')
  if (navLinks) {
    const li = document.createElement('li')
    li.innerHTML = avatarHTML
    navLinks.appendChild(li)
  }

  // Inject avatar into mobile panel too
  const mobilePanel = document.querySelector('.mobile-panel')
  if (mobilePanel) {
    const a = document.createElement('a')
    a.href = 'dashboard.html'
    a.textContent = `👤 ${name} — Dashboard`
    a.style.cssText = 'color:#f5a623;font-weight:600;'
    mobilePanel.appendChild(a)
  }

  // Show username on larger screens
  const style = document.createElement('style')
  style.textContent = `
    @media(min-width:860px) { .nav-username { display:inline !important; } }
  `
  document.head.appendChild(style)

})()