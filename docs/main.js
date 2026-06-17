/* ============================================================
   SHERSHEN LANDING — main.js
   Form submission → triggers GitHub Actions workflow_dispatch
   which appends the email to waitlist.txt in the repo
   ============================================================ */

// ------- Theme Toggle -------
(function () {
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;

  // Set initial theme based on system preference or stored value
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let currentTheme = systemDark ? 'dark' : 'light';
  root.setAttribute('data-theme', currentTheme);
  updateToggleIcon(toggle, currentTheme);

  if (toggle) {
    toggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', currentTheme);
      updateToggleIcon(toggle, currentTheme);
      toggle.setAttribute('aria-label', `Перемкнути на ${currentTheme === 'dark' ? 'світлу' : 'темну'} тему`);
    });
  }

  function updateToggleIcon(btn, theme) {
    if (!btn) return;
    btn.innerHTML =
      theme === 'dark'
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <circle cx="12" cy="12" r="5"/>
             <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
           </svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
           </svg>`;
  }
})();

// ------- Email Form -------
const form = document.getElementById('signup-form');
const submitBtn = document.getElementById('submit-btn');
const successState = document.getElementById('success-state');
const counterNum = document.getElementById('counter-num');

// Config
// Option A (recommended): set your Cloudflare Worker URL here
// Option B (direct, exposes PAT): leave WORKER_URL empty and fill GITHUB_PAT below
const WORKER_URL = ''; // e.g. 'https://shershen-waitlist.YOUR.workers.dev'

const GITHUB_OWNER = 'daniilsasin963-jpg';
const GITHUB_REPO = 'Shershen';

// Fetch current waitlist count from the file (public repo)
async function fetchWaitlistCount() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/waitlist.txt`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    if (!res.ok) { counterNum.textContent = '0'; return; }
    const data = await res.json();
    const content = atob(data.content.replace(/\n/g, ''));
    const count = content.split('\n').filter(line => line.trim().length > 0).length;
    counterNum.textContent = count;
  } catch {
    counterNum.textContent = '—';
  }
}

fetchWaitlistCount();

// Form submit handler
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email-input').value.trim();
    if (!email) return;

    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = 'Збереження…';

    try {
      // Trigger GitHub Actions workflow_dispatch event
      // The PAT token is stored as a GitHub Actions secret (WAITLIST_TOKEN)
      // This endpoint is called with the email as input
      let res;

      if (WORKER_URL) {
        // Recommended: proxy through Cloudflare Worker (PAT stays secret)
        res = await fetch(WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } else {
        // Direct GitHub API — only for testing, exposes token!
        // See README.md → Step 4 to set up Cloudflare Worker instead
        res = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/dispatches`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/vnd.github.v3+json',
              Authorization: `token REPLACE_WITH_WORKER_INSTEAD`,
            },
            body: JSON.stringify({
              event_type: 'new_waitlist_signup',
              client_payload: { email },
            }),
          }
        );
      }

      if (res.status === 204 || res.ok) {
        showSuccess();
      } else {
        // Fallback: save locally using mailto (last resort)
        fallbackMailto(email);
      }
    } catch {
      fallbackMailto(email);
    }
  });
}

function showSuccess() {
  form.hidden = true;
  successState.hidden = false;
  // Update counter optimistically
  const current = parseInt(counterNum.textContent) || 0;
  counterNum.textContent = current + 1;
}

function fallbackMailto(email) {
  // If GitHub API fails, open mailto as fallback
  window.location.href = `mailto:shershen.app@gmail.com?subject=Waitlist&body=Email: ${encodeURIComponent(email)}`;
  showSuccess();
}
