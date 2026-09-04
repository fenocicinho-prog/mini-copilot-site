const params = new URLSearchParams(location.search);
const config = {
  agent: params.get('agent') || localStorage.getItem('mini-copilot-agent') || 'http://127.0.0.1:8765',
  token: params.get('token') || localStorage.getItem('mini-copilot-agent-token') || '',
  githubRepo: 'fenocicinho-prog/mini-copilot',
};
const form = document.querySelector('#demo-form');
const input = document.querySelector('#demo-input');
const log = document.querySelector('#demo-log');
let eventSource = null;
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
function setDemoState(connected, detail = '') {
  const badge = document.querySelector('#demo-state');
  if (badge) { badge.textContent = connected ? '● IA CONNECTÉE' : '○ CONFIGURATION REQUISE'; badge.classList.toggle('connected', connected); }
  const hint = document.querySelector('#demo-hint');
  if (hint) hint.textContent = detail || (connected ? 'Plan gratuit — chat uniquement.' : 'Lancez web_server.py puis ouvrez le site avec ?agent=...&token=...');
  if (input) input.disabled = !connected;
  const button = form?.querySelector('button'); if (button) button.disabled = !connected;
}
function connectAgent() {
  if (!config.agent || !config.token) { setDemoState(false); return; }
  localStorage.setItem('mini-copilot-agent', config.agent); localStorage.setItem('mini-copilot-agent-token', config.token);
  eventSource = new EventSource(`${config.agent.replace(/\/$/, '')}/events?token=${encodeURIComponent(config.token)}`);
  eventSource.onopen = () => setDemoState(true);
  eventSource.onerror = () => { setDemoState(false, 'Serveur agent déconnecté. Relancez web_server.py.'); eventSource.close(); };
  eventSource.onmessage = event => {
    try {
      const frame = JSON.parse(event.data);
      if (thinking && ['assistant', 'error', 'confirm'].includes(frame.kind)) { thinking.remove(); thinking = null; }
      if (frame.kind === 'assistant' && frame.text) addMessage(frame.text, 'ai');
      else if (frame.kind === 'error') addMessage(`Erreur : ${frame.text}`, 'ai');
      else if (frame.kind === 'confirm') addMessage('Cette action avancée est réservée aux plans autorisés dans l’application complète.', 'ai');
    } catch (_) { /* frame invalide ignorée */ }
  };
}
async function sendToAgent(text) {
  const response = await fetch(`${config.agent.replace(/\/$/, '')}/message`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-MiniCopilot-Token': config.token }, body: JSON.stringify({ text }) });
  if (!response.ok) throw new Error(`Agent indisponible (${response.status})`);
}
form?.addEventListener('submit', async event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || !config.agent || !config.token) return;
  addMessage(text, 'user'); input.value = ''; input.focus();
  thinking = addMessage('Je prépare une réponse…', 'ai loading');
  try { await sendToAgent(text); } catch (error) { if (thinking) thinking.remove(); thinking = null; addMessage(error.message, 'ai'); }
});

async function hydrateReleaseLinks() {
  try {
    const response = await fetch(`https://api.github.com/repos/${config.githubRepo}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) return;
    const release = await response.json();
    const exe = release.assets?.find(asset => /setup|windows.*\.exe$/i.test(asset.name));
    const apk = release.assets?.find(asset => /\.apk$/i.test(asset.name));
    const windows = document.querySelector('#windows-download'); const android = document.querySelector('#android-download');
    if (windows) windows.href = exe?.browser_download_url || release.html_url;
    if (android) android.href = apk?.browser_download_url || release.html_url;
    const version = document.querySelector('#release-version'); if (version) version.textContent = release.tag_name || 'dernière version';
  } catch (_) { /* liens de secours conservés */ }
}
const webLaunch = document.querySelector('#web-launch');
if (webLaunch && config.agent) { webLaunch.href = `${config.agent.replace(/\/$/, '')}/launch`; webLaunch.target = '_blank'; webLaunch.rel = 'noopener'; }
setDemoState(false);
connectAgent();
hydrateReleaseLinks();
