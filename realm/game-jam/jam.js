'use strict';
const API = 'https://comments.srxnexus.org';
const form = document.querySelector('#signup-form');
const status = document.querySelector('#signup-status');
const button = form.querySelector('button');
let widget, token = '';
const show = (message, kind = '') => { status.textContent = message; status.className = kind; };
async function jsonRequest(path, options = {}) {
  const response = await fetch(API + path, { ...options, signal: AbortSignal.timeout(15000) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'The notification list is temporarily unavailable. Please try again shortly.');
  return body;
}
window.jamTurnstileReady = () => {
  widget = window.turnstile.render('#spam-check', {
    sitekey: form.dataset.sitekey, action: 'game_jam_signup', theme: 'dark', size: 'flexible',
    callback: (value) => { token = value; button.disabled = false; show(''); },
    'expired-callback': () => { token = ''; button.disabled = true; show('Please complete the anti-spam check again.'); },
    'error-callback': () => { token = ''; button.disabled = true; show('The anti-spam check could not load. Refresh to try again.', 'error'); }
  });
};
(async () => {
  try {
    const config = await jsonRequest('/game-jam/config');
    if (!config.ready || !config.siteKey) throw new Error('The notification list is temporarily unavailable. Please try again shortly.');
    form.dataset.sitekey = config.siteKey;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=jamTurnstileReady&render=explicit';
    script.onerror = () => show('The anti-spam check could not load. Refresh to try again.', 'error');
    document.head.append(script);
    show('Complete the anti-spam check to join.');
  } catch { show('The notification list is temporarily unavailable. Please try again shortly.', 'error'); }
})();
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity() || !token || button.disabled) return;
  button.disabled = true; button.textContent = 'JOINING…'; show('Saving your signup…');
  try {
    const result = await jsonRequest('/game-jam/signups', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({email:form.email.value, handle:form.handle.value, interest:form.interest.value, website:form.website.value, turnstileToken:token})
    });
    if (result.subscribed !== true) throw new Error('Your signup was not confirmed. Please try again.');
    form.hidden = true;
    show('You’re on the notification list. We’ll email you when applications and team formation open.', 'success');
  } catch (error) {
    show(error.message || 'Your signup could not be saved. Please try again.', 'error');
    token = ''; window.turnstile.reset(widget);
  } finally { button.textContent = 'JOIN THE EXPERIMENT'; }
});
