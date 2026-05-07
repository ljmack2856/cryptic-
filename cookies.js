// ══════════════════════════════════════════════════════
//  COOKIES.JS — Session & Consent Cookie Management
//  Include this in every page: <script src="cookies.js"></script>
//  Place BEFORE your supabase module script
// ══════════════════════════════════════════════════════

// ── Cookie helpers ──────────────────────────────────
const Cookies = {
  set(name, value, days = 7, sameSite = 'Strict') {
    const expires = new Date(Date.now() + days * 864e5).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=${sameSite};Secure`
  },

  get(name) {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith(name + '='))
      ?.split('=')[1]
      ? decodeURIComponent(document.cookie
          .split('; ')
          .find(row => row.startsWith(name + '='))
          .split('=')[1])
      : null
  },

  delete(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure`
  },

  exists(name) {
    return !!this.get(name)
  }
}

// ── Session cookie sync with Supabase ───────────────
// Call this after supabase.auth.signIn or signUp succeeds
function setSessionCookie(session, days = 7) {
  if (!session) return
  Cookies.set('cfxm_uid',   session.user.id,      days)
  Cookies.set('cfxm_email', session.user.email,   days)
  Cookies.set('cfxm_token', session.access_token, days)
  Cookies.set('cfxm_auth',  'true',               days)
}

// Call this on logout
function clearSessionCookies() {
  Cookies.delete('cfxm_uid')
  Cookies.delete('cfxm_email')
  Cookies.delete('cfxm_token')
  Cookies.delete('cfxm_auth')
}

// Quick check — is user marked as logged in via cookie?
function isLoggedInCookie() {
  return Cookies.get('cfxm_auth') === 'true'
}

// ── Cookie Consent Banner ───────────────────────────
function initCookieConsent() {
  // Don't show if already accepted or declined
  if (Cookies.exists('cfxm_consent')) return

  const banner = document.createElement('div')
  banner.id = 'cookieBanner'
  banner.innerHTML = `
    <div style="
      position:fixed; bottom:0; left:0; right:0; z-index:99999;
      background:#111; border-top:1px solid rgba(255,255,255,0.08);
      padding:1.1rem 6%; display:flex; align-items:center;
      justify-content:space-between; flex-wrap:wrap; gap:1rem;
      font-family:'DM Sans',sans-serif; font-size:0.875rem; color:#aaa;
      box-shadow:0 -4px 24px rgba(0,0,0,0.4);
    ">
      <span style="flex:1; min-width:220px; line-height:1.6;">
        🍪 We use cookies to keep you signed in and improve your experience.
        <a href="#" style="color:#f5a623; text-decoration:none; margin-left:4px;">Learn more</a>
      </span>
      <div style="display:flex; gap:0.75rem; flex-shrink:0;">
        <button id="cookieDecline" style="
          background:transparent; border:1px solid rgba(255,255,255,0.15);
          color:#888; padding:0.5rem 1.1rem; border-radius:6px;
          cursor:pointer; font-family:'DM Sans',sans-serif; font-size:0.85rem;
          transition:border-color 0.2s;
        ">Decline</button>
        <button id="cookieAccept" style="
          background:#f5a623; border:none; color:#000; font-weight:700;
          padding:0.5rem 1.25rem; border-radius:6px; cursor:pointer;
          font-family:'DM Sans',sans-serif; font-size:0.85rem;
          transition:background 0.2s;
        ">Accept</button>
      </div>
    </div>
  `
  document.body.appendChild(banner)

  document.getElementById('cookieAccept').addEventListener('click', () => {
    Cookies.set('cfxm_consent', 'accepted', 365)
    banner.remove()
  })

  document.getElementById('cookieDecline').addEventListener('click', () => {
    Cookies.set('cfxm_consent', 'declined', 30)
    banner.remove()
  })
}

// Auto-init consent banner on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCookieConsent)
} else {
  initCookieConsent()
}