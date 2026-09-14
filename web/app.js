// Mini Copilot — client web, aligné visuellement et fonctionnellement sur desktop_gui.py
// (même palette moderne, mêmes trois panneaux sans bordures épaisses, même indicateur
// "réfléchit…", bulles sans avatar comme dans les interfaces d'agents actuelles).
//
// Sert à deux endroits :
//   1) servi en local par web_server.py et relié au vrai agent.py ;
//   2) ouvert publiquement depuis le site et relié à l’API Vercel pour le chat Web.
const SHARE_ORIGIN = ""; // ex: "https://mon-compte.github.io/mini-copilot" — laisser vide pour désactiver

const params = new URLSearchParams(location.search);
const token = params.get("token");
const remotePort = params.get("port");
const apiBase = remotePort ? `http://127.0.0.1:${remotePort}` : location.origin;
const isLocalServer = !remotePort;
const centralApi = params.get("api") || localStorage.getItem("mini-copilot-central-api") || "https://mini-copilot-api.vercel.app";
const remoteMode = !token && !remotePort && Boolean(centralApi);
let centralSession = JSON.parse(localStorage.getItem("mini-copilot-session") || "null");
let entitlement = null;

const logEl = document.getElementById("log");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const projectPathEl = document.getElementById("projectPath");
const bannerEl = document.getElementById("banner");
const confirmEl = document.getElementById("confirm");
const confirmDetail = document.getElementById("confirmDetail");
const composer = document.getElementById("composer");
const input = document.getElementById("input");
const submitBtn = composer.querySelector("button");
const actionsEl = document.getElementById("actions");
const clearBtn = document.getElementById("clearBtn");
const terminalEl = document.getElementById("terminal");
// Un serveur local génère un nouveau token à chaque lancement : une nouvelle
// installation/session ne récupère donc pas silencieusement l’ancien cache navigateur.
function getHistoryKey() {
  const identity = remoteMode ? centralSession?.user?.openId || "guest" : token || "local";
  return `mini-copilot-history-v3:${location.origin}:${identity}`;
}
let restoring = true;

function saveHistory() {
  const messages = [...logEl.querySelectorAll(".row")].filter(row => !row.querySelector(".bubble.thinking"))
    .map(row => ({ role: row.classList.contains("user") ? "user" : row.classList.contains("system") ? "system" : "ai",
      text: row.querySelector(".bubble")?.innerText || "" })).slice(-300);
  const actions = [...actionsEl.querySelectorAll("li")].map(li => ({
    label: li.querySelector(".label")?.textContent || "Action", status: li.dataset.status || "ok",
    time: li.querySelector(".time")?.textContent || "" })).slice(-300);
  localStorage.setItem(getHistoryKey(), JSON.stringify({ messages, actions, terminal: terminalEl.textContent }));
}

function loadHistory() {
  try {
    const data = JSON.parse(localStorage.getItem(getHistoryKey()) || "{}");
    (data.messages || []).forEach(item => addRow(item.role, item.text, false));
    (data.actions || []).reverse().forEach(item => addAction(item.label, item.status, false, item.time));
    terminalEl.textContent = data.terminal || "";
  } catch { /* historique local invalide : on démarre proprement */ }
  restoring = false;
}

// ---------------------------------------------------------------- messages

const CODE_FENCE_RE = /```(\w+)?\n?([\s\S]*?)```/g;

function renderBubbleContent(bubble, text) {
  let lastIndex = 0;
  let match;
  CODE_FENCE_RE.lastIndex = 0;
  let hasCode = false;
  while ((match = CODE_FENCE_RE.exec(text)) !== null) {
    hasCode = true;
    if (match.index > lastIndex) {
      bubble.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }
    const pre = document.createElement("pre");
    pre.textContent = match[2].trim();
    bubble.appendChild(pre);
    lastIndex = CODE_FENCE_RE.lastIndex;
  }
  if (!hasCode) {
    bubble.textContent = text;
    return;
  }
  if (lastIndex < text.length) {
    bubble.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
}

function addRow(role, text, persist = true) {
  const row = document.createElement("div");
  row.className = `row ${role}`;

  if (role === "ai" || role === "user") {
    const sender = document.createElement("div");
    sender.className = "sender";
    sender.textContent = role === "ai" ? "RT" : "Vous";
    row.appendChild(sender);
  }

  const bubble = document.createElement("div");
  bubble.className = `bubble ${role}`;
  renderBubbleContent(bubble, text);
  row.appendChild(bubble);

  logEl.appendChild(row);
  logEl.scrollTop = logEl.scrollHeight;
  if (persist && !restoring) saveHistory();
  return row;
}

function addError(text) {
  const row = document.createElement("div");
  row.className = "row ai";
  const sender = document.createElement("div");
  sender.className = "sender";
  sender.textContent = "RT";
  row.appendChild(sender);
  const bubble = document.createElement("div");
  bubble.className = "bubble error";
  bubble.textContent = `⚠️ ${text}`;
  row.appendChild(bubble);
  logEl.appendChild(row);
  logEl.scrollTop = logEl.scrollHeight;
}

// -------------------------------------------------------- indicateur "réfléchit"
// Même comportement que show_thinking()/hide_thinking() de desktop_gui.py : une bulle
// avec trois points qui pulsent, affichée dès l'envoi d'un message, masquée dès la
// première frame de réponse (assistant, confirm ou error).

let thinkingRow = null;

function showThinking() {
  if (thinkingRow) return;
  thinkingRow = addRow("ai", "");
  const bubble = thinkingRow.querySelector(".bubble");
  bubble.classList.add("thinking");
  bubble.innerHTML = '<span class="thinking-dots"><span></span><span></span><span></span></span>';
}

function hideThinking() {
  if (!thinkingRow) return;
  thinkingRow.remove();
  thinkingRow = null;
}

// -------------------------------------------------------------- historique d'actions

function addAction(label, status, persist = true, timeOverride = "") {
  const li = document.createElement("li");
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dot = document.createElement("span");
  dot.className = `status-dot ${status === "ok" ? "ok" : status === "à confirmer" ? "attente" : status === "échec" ? "echec" : "neutre"}`;
  const labelSpan = document.createElement("span");
  labelSpan.className = "label";
  labelSpan.textContent = label;
  const timeSpan = document.createElement("span");
  timeSpan.className = "time";
  timeSpan.textContent = timeOverride || time;
  li.dataset.status = status;
  li.append(dot, labelSpan, timeSpan);
  actionsEl.prepend(li);
  terminalEl.textContent += `[${timeSpan.textContent}] ${status.toUpperCase()}  ${label}\n`;
  terminalEl.scrollTop = terminalEl.scrollHeight;
  if (persist && !restoring) saveHistory();
}

function cleanAssistantText(text) {
  const actions = [];
  const cleaned = String(text || "").replace(/^\s*[☑☐✓✔]\s+(.+?)\s*$/gm, (_, label) => {
    actions.push({ label: label.trim(), status: "ok" }); return "";
  }).trim();
  actions.forEach(action => addAction(action.label, action.status));
  return cleaned;
}

// ------------------------------------------------------------------- connexion

function setConnected(ok, isError) {
  statusDot.classList.toggle("on", ok && !isError);
  statusDot.classList.toggle("err", !!isError);
  statusText.textContent = ok ? "Session active" : (isError ? "Erreur de connexion" : "Déconnecté");
  input.disabled = !ok;
  submitBtn.disabled = !ok;
}

function clearConversationView() {
  logEl.innerHTML = "";
  actionsEl.innerHTML = "";
  terminalEl.textContent = "";
  confirmEl.style.display = "none";
}

function openAuth() {
  document.getElementById("auth").style.display = "grid";
  document.getElementById("email").focus();
}

async function activateRemoteSession(session) {
  centralSession = session;
  localStorage.setItem("mini-copilot-session", JSON.stringify(centralSession));
  clearConversationView();
  restoring = true;
  loadHistory();
  setConnected(true);
  statusText.textContent = `Session active — ${centralSession.user?.email || "compte connecté"}`;
}

async function post(path, body) {
  const res = await fetch(apiBase + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-MiniCopilot-Token": token, ...(centralSession?.token ? { "X-MiniCopilot-Session": centralSession.token } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} a échoué (${res.status})`);
}

const WORKSPACE_RE = /workspace\s*:\s*([^|]+)/i;

function handleFrame(frame) {
  switch (frame.kind) {
    case "assistant":
      hideThinking();
      { const text = cleanAssistantText(frame.text); if (text) addRow("ai", text); }
      addAction("Réponse", "ok");
      break;
    case "status": {
      addRow("system", frame.text);
      const m = WORKSPACE_RE.exec(frame.text || "");
      if (m) projectPathEl.textContent = m[1].trim();
      break;
    }
    case "error":
      hideThinking();
      addAction("Erreur", "échec");
      addError(frame.text);
      break;
    case "confirm":
      hideThinking();
      confirmDetail.textContent = JSON.stringify(frame.action, null, 2);
      confirmEl.style.display = "block";
      input.disabled = true;
      submitBtn.disabled = true;
      break;
    case "session_end":
      setConnected(false);
      addRow("system", "Session terminée.");
      addAction("Session", "terminée");
      break;
    case "terminal":
      terminalEl.textContent += frame.text || "";
      terminalEl.scrollTop = terminalEl.scrollHeight;
      if (!restoring) saveHistory();
      break;
    default:
      break;
  }
}

function setupAccountUI() {
  const auth = document.getElementById("auth"), plans = document.getElementById("plans"); let register = false;
  document.getElementById("authBtn").onclick = openAuth;
  document.getElementById("plansBtn").onclick = () => { document.getElementById("planGrid").innerHTML = '<article class="plan-card"><h3>Accès gratuit</h3><p>Toutes les fonctionnalités sont disponibles sans abonnement ni carte bancaire.</p></article>'; plans.style.display="block"; };
  document.getElementById("authClose").onclick=()=>auth.style.display="none"; document.getElementById("plansClose").onclick=()=>plans.style.display="none";
  document.getElementById("authMode").onclick=()=>{register=!register; document.getElementById("authTitle").textContent=register?"Créer un compte":"Se connecter"; document.getElementById("authSubmit").textContent=register?"S’inscrire":"Se connecter"; document.getElementById("firstName").style.display=register?"block":"none"; document.getElementById("lastName").style.display=register?"block":"none";};
  document.getElementById("googleBtn").onclick=()=>{const url=params.get("oauth"); if(url) location.href=url; else document.getElementById("authError").textContent="Ajoutez ?oauth=URL_OAUTH_PUBLIQUE";};
  document.getElementById("authSubmit").onclick=async()=>{try{const body={email:email.value,password:password.value};if(register)Object.assign(body,{firstName:firstName.value,lastName:lastName.value});const r=await fetch(centralApi+`/api/auth/${register?"register":"login"}`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.error);if(!d.sessionToken)throw Error("Le serveur n’a pas fourni de session.");await activateRemoteSession({user:d.user,token:d.sessionToken});auth.style.display="none";}catch(e){document.getElementById("authError").textContent=e.message;}};
}

async function remoteChat(message) {
  if (!centralSession?.token) throw new Error("Connectez-vous pour utiliser le chat.");
  const response = await fetch(`${centralApi.replace(/\/$/, "")}/api/trpc/chat.complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${centralSession.token}` },
    body: JSON.stringify({ json: { message } }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) throw new Error(payload.error?.json?.message || "Le service Web est momentanément indisponible.");
  return payload.result?.data?.json?.answer || "Le moteur IA n’a pas renvoyé de réponse.";
}

function connect() {
  if (remoteMode) {
    projectPathEl.textContent = "Espace Web Mini Copilot";
    if (!centralSession?.token) {
      setConnected(false);
      statusText.textContent = "Connexion requise";
      openAuth();
      return;
    }
    fetch(`${centralApi.replace(/\/$/, "")}/api/auth/entitlements`, { headers: { Authorization: `Bearer ${centralSession.token}` } })
      .then(response => {
        if (!response.ok) throw new Error("Session expirée");
        setConnected(true);
        statusText.textContent = `Session active — ${centralSession.user?.email || "compte connecté"}`;
      })
      .catch(() => {
        centralSession = null;
        localStorage.removeItem("mini-copilot-session");
        setConnected(false, true);
        statusText.textContent = "Session expirée";
        openAuth();
      });
    return;
  }
  if (!token) {
    statusText.textContent = "Pas de jeton — ouvre cette page depuis Mini Copilot";
    return;
  }
  const es = new EventSource(`${apiBase}/events?token=${encodeURIComponent(token)}${centralSession?.token ? `&session=${encodeURIComponent(centralSession.token)}` : ""}`);
  es.onopen = () => setConnected(true);
  es.onerror = () => {
    setConnected(false, true);
    es.close();
  };
  es.onmessage = (ev) => {
    try {
      handleFrame(JSON.parse(ev.data));
    } catch {
      /* frame non-JSON ignorée */
    }
  };
}

// ------------------------------------------------------------------- interactions

composer.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  try {
    if (remoteMode) {
      addRow("user", text);
      input.value = "";
      showThinking();
      const answer = await remoteChat(text);
      hideThinking();
      addRow("ai", answer);
      addAction("Réponse Vercel", "ok");
      return;
    }
    if (!centralApi) { addError("API centrale non configurée"); return; }
    if (!centralSession?.token) { openAuth(); return; }
    const response = await fetch(centralApi.replace(/\/$/, "") + "/api/auth/entitlements", { credentials: "include", headers: centralSession.token ? { Authorization: `Bearer ${centralSession.token}` } : {} });
    const access = await response.json();
    if (!response.ok) throw new Error(access.error || "Session invalide");
    const used = Number(access.usage?.used || 0), limit = Number(access.usage?.limit || access.plan?.quota || 0);
    if (used >= limit) { document.getElementById("plans").style.display = "block"; return; }
  } catch (error) { hideThinking(); addError(error.message); return; }
  addRow("user", text);
  input.value = "";
  showThinking();
  try {
    await post("/message", { text });
  } catch (err) {
    hideThinking();
    addError(String(err));
  }
});

document.getElementById("confirmAllow").addEventListener("click", () => respondConfirm(true));
document.getElementById("confirmDeny").addEventListener("click", () => respondConfirm(false));

async function respondConfirm(accepted) {
  confirmEl.style.display = "none";
  input.disabled = false;
  submitBtn.disabled = false;
  showThinking();
  try {
    await post("/confirm", { accepted });
  } catch (err) {
    hideThinking();
    addError(String(err));
  }
}

clearBtn.addEventListener("click", () => {
  clearConversationView();
  saveHistory();
});

// Bandeau "ouvrir en version partageable" — uniquement en local, sur Chromium, si
// SHARE_ORIGIN est configuré.
if (isLocalServer && SHARE_ORIGIN && navigator.userAgentData?.brands?.some(
  (b) => /chromium|chrome|edge/i.test(b.brand)
)) {
  bannerEl.style.display = "block";
  bannerEl.innerHTML =
    `Ton navigateur supporte la version partageable — ` +
    `<a href="${SHARE_ORIGIN}?port=${location.port}&token=${encodeURIComponent(token)}">l'ouvrir</a>.`;
}

loadHistory();
setupAccountUI();
connect();
