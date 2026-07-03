const TACTICAL_API = 'https://escdlctsclmpevktgcin.supabase.co/functions/v1/tactical-loadouts';
const alertBox = document.getElementById('srx-alert');
const profilesEl = document.getElementById('profiles');
const proposalForm = document.getElementById('proposal-form');
const proposalStatus = document.getElementById('proposal-status');
const commandPanel = document.getElementById('command-panel');
const queueEl = document.getElementById('command-queue');
const tagCatalogEl = document.getElementById('tag-catalog');
let auth = requireRealmLogin();
let currentAdmin = false;

async function tacticalFetch(action, body = {}) {
  auth = getRealmAuth();
  if (!auth) throw new Error('Identity anchor expired; establish it again');
  const response = await fetch(`${TACTICAL_API}?action=${encodeURIComponent(action)}`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${auth.sessionToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (response.status === 401) localStorage.removeItem(REALM_AUTH_KEY);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `relay error ${response.status}`);
  return data;
}

function esc(value) { const node = document.createElement('span'); node.textContent = String(value ?? ''); return node.innerHTML; }
function status(text, error = false) { alertBox.hidden = false; alertBox.textContent = `SRX TACTICAL // ${text}`; alertBox.className = 'status-box' + (error ? ' error' : ''); }

async function loadStatus() {
  if (!auth) return;
  try {
    const data = await tacticalFetch('status');
    currentAdmin = Boolean(data.admin);
    renderProfiles(data.profiles || [], data.proposals || []);
    commandPanel.hidden = !data.admin;
    if (data.admin) await Promise.all([loadQueue(), loadTagCatalog()]);
  } catch (error) { status(error.message, true); profilesEl.innerHTML = '<p class="muted">Tactical record unavailable.</p>'; }
}

function renderProfiles(profiles, proposals) {
  const profileCards = profiles.map(profile => {
    const card = profile.card;
    if (!card) return `<article class="tactical-card"><span class="badge">${esc(profile.mode)}</span><h3>${esc(profile.character_name)}</h3><p class="muted">Profile exists; Command has not published an active card.</p></article>`;
    const stats = Object.entries(card.stats || {}).map(([key,value]) => `<span class="stat-chip">${esc(key)} ${esc(value)}</span>`).join('');
    const abilities = (card.abilities || []).map(row => `<li>${esc(row.name)} <span class="muted">// ${esc(row.slot)}</span></li>`).join('');
    const optionFor = (slot, selected) => `<option value="">— empty —</option>` + (card.abilities || []).filter(row => row.slot === slot).map(row => `<option value="${esc(row.key)}" ${selected===row.key?'selected':''}>${esc(row.name)}</option>`).join('');
    const current = profile.loadout?.slots || {};
    const slotEditor = profile.loadout?.locked_by_instance ? '<p class="badge">Loadout locked by active instance</p>' : `<form class="loadout-form" data-mode="${esc(profile.mode)}"><label>Passive<select name="passive">${optionFor('passive',current.passive)}</select></label><label>Basic<select name="basic">${optionFor('basic',current.basic)}</select></label>${[1,2,3,4].map(i=>`<label>Active ${i}<select name="active_${i}">${optionFor('active',current[`active_${i}`])}</select></label>`).join('')}<label>Legendary<select name="legendary">${optionFor('legendary',current.legendary)}</select></label><label>Gadget ability<select name="gadget">${optionFor('gadget',current.gadget)}</select></label><fieldset><legend>Approved equipment</legend>${(card.approved_equipment||[]).map(item=>`<label><input type="checkbox" name="equipment" value="${esc(item.key)}"> ${esc(item.name)}</label>`).join('')||'<span class="muted">No equipment approved.</span>'}</fieldset><button class="btn ghost" type="submit">Save loadout version</button></form>`;
    const exportButton = currentAdmin ? `<button class="btn ghost export-card" data-card-id="${esc(card.id)}">Export bot JSON</button>` : '';
    return `<article class="tactical-card"><span class="badge">${esc(profile.mode)}</span><h3>${esc(profile.character_name)} // ${esc(card.class_name)}</h3><div class="stat-line">${stats}</div><ul class="proposal-list">${abilities}</ul><p class="muted">Card v${esc(card.version)} · Arcade XP ${esc(profile.arcade_xp || 0)} · Rank ${esc(profile.arcade_rank || 1)}</p>${slotEditor}${exportButton}</article>`;
  });
  const proposalCards = proposals.filter(row => ['pending','revision'].includes(row.status)).map(row => `<article class="tactical-card"><span class="badge">${esc(row.status)}</span><h3>${esc(row.character_name)}</h3><p class="muted">${esc(row.mode)} proposal submitted ${new Date(row.submitted_at).toLocaleDateString()}.</p>${row.reviewer_notes ? `<p>${esc(row.reviewer_notes)}</p>` : ''}</article>`);
  profilesEl.innerHTML = [...profileCards, ...proposalCards].join('') || '<p class="muted">No tactical card or open proposal is linked to this identity.</p>';
}

profilesEl.addEventListener('submit', async event => {
  const form = event.target.closest('.loadout-form'); if (!form) return;
  event.preventDefault(); const button = form.querySelector('button'); button.disabled = true;
  try {
    const data = new FormData(form), slots = {};
    ['passive','basic','active_1','active_2','active_3','active_4','legendary','gadget'].forEach(key => { const value=data.get(key); if(value) slots[key]=value; });
    const equipment = data.getAll('equipment').map(key => ({key,quantity:1}));
    await tacticalFetch('loadout', {mode:form.dataset.mode,slots,equipment,consumables:[]});
    status('Loadout version saved.'); await loadStatus();
  } catch (error) { status(error.message, true); }
  finally { button.disabled = false; }
});

profilesEl.addEventListener('click', async event => {
  const button = event.target.closest('.export-card'); if (!button) return;
  button.disabled = true;
  try {
    const data = await tacticalFetch('admin-export', {card_id:button.dataset.cardId});
    const blob = new Blob([JSON.stringify(data.payload, null, 2)], {type:'application/json'});
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `${data.payload.card?.card_key || 'tactical-card'}-v${data.payload.card?.version || 1}.json`;
    link.click(); URL.revokeObjectURL(link.href); status('Bot-ready card JSON exported.');
  } catch (error) { status(error.message, true); }
  finally { button.disabled = false; }
});

proposalForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button = proposalForm.querySelector('button[type="submit"]'); button.disabled = true;
  const form = new FormData(proposalForm);
  proposalStatus.textContent = 'SRX COMMAND // Sealing concept package…';
  try {
    await tacticalFetch('proposal', { mode: form.get('mode'), character_name: form.get('character_name'), concept: form.get('concept'), abilities: String(form.get('abilities') || '').split(/\n+/).map(v => v.trim()).filter(Boolean), equipment_notes: form.get('equipment_notes') });
    proposalForm.reset(); proposalStatus.textContent = 'SRX COMMAND // Proposal received and queued for scaling.'; await loadStatus();
  } catch (error) { proposalStatus.textContent = `SRX COMMAND // ${error.message}`; }
  finally { button.disabled = false; }
});

async function loadQueue() {
  try { const data = await tacticalFetch('admin-queue'); renderQueue(data.proposals || []); }
  catch (error) { queueEl.innerHTML = `<p class="muted">${esc(error.message)}</p>`; }
}

async function loadTagCatalog() {
  try {
    const data = await tacticalFetch('tag-catalog');
    tagCatalogEl.innerHTML = (data.tags || []).map(tag => `<details><summary><strong>${esc(tag.label)}</strong><span>${esc(tag.category)} // ${esc(tag.tag_key)} v${esc(tag.version)}</span></summary><p>${esc(tag.description)}</p><pre>${esc(JSON.stringify(tag.property_schema || {}, null, 2))}</pre></details>`).join('') || '<p class="muted">No mechanic tags published.</p>';
  } catch (error) { tagCatalogEl.innerHTML = `<p class="muted">${esc(error.message)}</p>`; }
}

function starterAbility(proposal) {
  const lines = proposal.abilities || [];
  const slotFor = index => index === 0 ? 'passive' : index === 1 ? 'basic' : index === lines.length - 1 ? 'legendary' : 'active';
  return lines.slice(0,7).map((text,index) => ({ key:`ability_${index+1}`, name:String(text).split(/[-—:]/)[0].trim().slice(0,80) || `Ability ${index+1}`, description:String(text).slice(0,2000), slot:slotFor(index), action_kind:index===0?'passive':'attack', attack_stat:'precision', range:index===0?0:6, accuracy:0, cooldown_turns:index===0?0:index===1?1:index===lines.length-1?0:3, limited_use:index===lines.length-1, cost:{}, tags:index===0?[]:[{key:'projectile',properties:{speed:5}},{key:'single_target',properties:{}},{key:'damage',properties:{die:index===lines.length-1?12:6}},...(index===lines.length-1?[{key:'limited_use',properties:{uses:1}}]:[{key:'cooldown',properties:{turns:index===1?1:3}}])], effects:index===0?[]:[{kind:'damage',die:index===lines.length-1?12:6,damage_type:'energy'}] }));
}

function renderQueue(proposals) {
  queueEl.innerHTML = proposals.map(proposal => {
    const stats = ['power','mobility','precision','endurance','insight','resolve','presence'].map(key => `<label>${key}<input type="number" min="0" max="4" name="${key}" value="2"></label>`).join('');
    const abilities = JSON.stringify(starterAbility(proposal), null, 2);
    return `<article class="proposal-card" data-id="${esc(proposal.id)}" data-mode="${esc(proposal.mode)}" data-character="${esc(proposal.character_name)}"><span class="badge">${esc(proposal.mode)}</span><h3>${esc(proposal.character_name)}</h3><p>${esc(proposal.concept)}</p><ul class="proposal-list">${(proposal.abilities||[]).map(row=>`<li>${esc(row)}</li>`).join('')}</ul><p class="muted">Equipment concepts: ${esc(proposal.equipment_notes || 'none')}</p><label>Published class name<input name="class_name" value="${esc(proposal.character_name)} Tactical"></label><div class="review-grid">${stats}</div><label>Validated ability definitions<textarea class="json-editor" name="abilities_json">${esc(abilities)}</textarea></label><label>Approved equipment JSON<textarea class="json-editor" name="equipment_json">[]</textarea></label><label>Command notes<textarea name="notes"></textarea></label><div class="review-actions"><button class="btn ghost save-draft">Save normalized draft</button><button class="btn approve">Publish card</button><button class="btn ghost revision">Request revision</button><button class="btn ghost reject">Reject</button></div></article>`;
  }).join('') || '<p class="muted">No open tactical proposals.</p>';
}

queueEl.addEventListener('click', async event => {
  const button = event.target.closest('button'); if (!button) return;
  const card = button.closest('[data-id]'), proposalId = card.dataset.id, notes = card.querySelector('[name="notes"]').value;
  button.disabled = true;
  try {
    if (button.classList.contains('approve') || button.classList.contains('save-draft')) {
      const stats = {}; ['power','mobility','precision','endurance','insight','resolve','presence'].forEach(key => stats[key] = Number(card.querySelector(`[name="${key}"]`).value));
      const definition = { mode:card.dataset.mode, character_name:card.dataset.character, class_name:card.querySelector('[name="class_name"]').value, stats, abilities:JSON.parse(card.querySelector('[name="abilities_json"]').value), equipment:JSON.parse(card.querySelector('[name="equipment_json"]').value), notes };
      if (button.classList.contains('save-draft')) {
        await tacticalFetch('admin-save-draft', {proposal_id:proposalId,source:'manual',definition});
        status('Normalized review draft saved.');
      } else {
        await tacticalFetch('admin-approve', { proposal_id:proposalId, class_name:definition.class_name, stats, abilities:definition.abilities, approved_equipment:definition.equipment, reviewer_notes:notes });
        status('Tactical card version published.');
      }
    } else {
      await tacticalFetch('admin-review', { proposal_id:proposalId, decision:button.classList.contains('reject')?'rejected':'revision', reviewer_notes:notes });
      status('Proposal review recorded.');
    }
    await loadStatus();
  } catch (error) { status(error.message, true); }
  finally { button.disabled = false; }
});

document.getElementById('refresh').addEventListener('click', loadStatus);
document.getElementById('load-queue').addEventListener('click', loadQueue);
loadStatus();
