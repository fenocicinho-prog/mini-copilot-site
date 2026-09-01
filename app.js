const form = document.querySelector('#demo-form');
const input = document.querySelector('#demo-input');
const log = document.querySelector('#demo-log');
const replies = [
  'Démo reçue. Dans la version complète, RT analyserait votre demande et proposerait des étapes concrètes.',
  'Je peux expliquer le code, repérer un problème ou préparer une amélioration de votre projet.',
  'Les actions techniques apparaîtront dans le panneau Terminal séparé, jamais au milieu de la conversation.'
];
let replyIndex = 0;
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const user = document.createElement('div');
  user.className = 'demo-msg user';
  user.textContent = text;
  log.appendChild(user);
  input.value = '';
  const ai = document.createElement('div');
  ai.className = 'demo-msg ai';
  ai.textContent = replies[replyIndex++ % replies.length];
  log.appendChild(ai);
  log.scrollTop = log.scrollHeight;
});
