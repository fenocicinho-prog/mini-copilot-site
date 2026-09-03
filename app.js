const form = document.querySelector('#demo-form');
const input = document.querySelector('#demo-input');
const log = document.querySelector('#demo-log');

const replies = [
  'J’ai reçu votre demande. Pour commencer proprement, je vais examiner la structure du projet, repérer les dépendances importantes et vérifier les points d’entrée de l’application.',
  'Voici une première réponse utile : je peux expliquer le code, rechercher la cause d’un bug, proposer une correction et détailler les étapes avant toute modification.',
  'Les opérations techniques restent séparées de la conversation. La réponse visible ici contient le résultat et le contexte, tandis que les commandes et journaux peuvent être présentés dans un panneau dédié.'
];

let replyIndex = 0;

function scrollToLatest(element, behavior = 'smooth') {
  element.scrollIntoView({ behavior, block: 'nearest' });
}

function addMessage(text, role) {
  const message = document.createElement('div');
  message.className = `demo-msg ${role}`;
  message.textContent = text;
  message.setAttribute('role', role === 'ai' ? 'status' : 'article');
  log.appendChild(message);
  scrollToLatest(message);
  return message;
}

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  input.value = '';
  input.focus();

  const loading = addMessage('Je prépare une réponse détaillée…', 'ai loading');
  window.setTimeout(() => {
    loading.className = 'demo-msg ai';
    loading.textContent = replies[replyIndex++ % replies.length];
    scrollToLatest(loading);
  }, 420);
});
