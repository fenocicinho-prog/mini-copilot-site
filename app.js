const params = new URLSearchParams(location.search);
const config = {
  agent: params.get('agent') || '',
  token: params.get('token') || '',
  githubRepo: 'fenocicinho-prog/mini-copilot',
};
const form = document.querySelector('#demo-form');
const input = document.querySelector('#demo-input');
const log = document.querySelector('#demo-log');
let thinking = null;

function addMessage(text, role) {
  const message = document.createElement('div');
  message.className = `demo-msg ${role}`;
  message.textContent = text;
  message.setAttribute('role', role === 'ai' ? 'status' : 'article');
  log.appendChild(message);
  message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  return message;
}

function setDemoState(ready, detail = '') {
  const badge = document.querySelector('#demo-state');
  if (badge) { badge.textContent = ready ? '● DÉMO PRÊTE' : '○ DÉMO INDISPONIBLE'; badge.classList.toggle('connected', ready); }
  const hint = document.querySelector('#demo-hint');
  if (hint) hint.textContent = detail || (ready ? 'Démo prête — aucune installation ni clé API requise.' : 'Réessayez dans quelques instants.');
  if (input) input.disabled = !ready;
  const button = form?.querySelector('button'); if (button) button.disabled = !ready;
}

function demoReply(text) {
  const message = text.toLowerCase();
  if (message.includes('bonjour') || message.includes('salut') || message.includes('hello')) return 'Bonjour. Je peux vous aider à imaginer, structurer ou améliorer un projet logiciel.';
  if (message.includes('site') || message.includes('web')) return 'Pour un site moderne, commencez par définir l’objectif, les utilisateurs et une première interface simple. Mini Copilot peut ensuite vous aider à construire chaque étape.';
  if (message.includes('android') || message.includes('windows') || message.includes('application')) return 'Mini Copilot est disponible sur le Web, Android et Windows. Utilisez la page Télécharger pour récupérer la version adaptée à votre appareil.';
  if (message.includes('code') || message.includes('projet') || message.includes('bug')) return 'Je commencerais par inspecter la structure du projet, les dépendances et le message d’erreur, puis je proposerais une correction vérifiable étape par étape.';
  return 'Bonne idée. Je peux vous aider à la transformer en étapes concrètes : objectif, interface, données, logique, puis vérification.';
}

form?.addEventListener('submit', async event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, 'user'); input.value = ''; input.focus();
  thinking = addMessage('Je prépare une réponse…', 'ai loading');
  await new Promise(resolve => setTimeout(resolve, 450));
  if (thinking) thinking.remove();
  thinking = null;
  addMessage(demoReply(text), 'ai');
});

async function hydrateReleaseLinks() {
  try {
    const response = await fetch(`https://api.github.com/repos/${config.githubRepo}/releases?per_page=30`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) return;
    const releases = await response.json();
    const assets = releases.flatMap(release => (release.assets || []).map(asset => ({ ...asset, release })));
    const exe = assets.find(asset => /\.exe$/i.test(asset.name) && /setup|installer|mini.?copilot/i.test(asset.name));
    const apk = assets.find(asset => /\.apk$/i.test(asset.name));
    const windows = document.querySelector('#windows-download'); const android = document.querySelector('#android-download');
    if (windows) windows.href = exe?.browser_download_url || 'https://github.com/fenocicinho-prog/mini-copilot/releases';
    if (android) android.href = apk?.browser_download_url || 'https://github.com/fenocicinho-prog/mini-copilot/releases';
  } catch (_) { /* liens de secours conservés */ }
}

setDemoState(true);
hydrateReleaseLinks();
