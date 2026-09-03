# Mini Copilot — site public

Ce dépôt contient la page publique de présentation et une démo de chat sans moteur IA réel. Le code de l’application Windows/Android est conservé dans un dépôt privé séparé.

## Corrections livrées dans cette version

La démo publique corrige le formulaire qui ne pouvait pas soumettre correctement les messages, affiche désormais une réponse textuelle complète au lieu d’un simple statut d’action, présente un état de chargement, puis fait défiler automatiquement la conversation jusqu’à la dernière réponse. La taille de texte du champ de saisie et des messages a également été renforcée pour éviter l’affichage miniature, et les logos/icônes sont rendus circulaires.

## Limites du dépôt public

L’inscription avec nom, prénom, e-mail et mot de passe, la connexion Google, la synchronisation ou l’effacement du cache de l’application installée, le véritable moteur IA et l’intégration Flutterwave ou Paystack ne peuvent pas être implémentés de manière sécurisée dans ce dépôt statique. Ils nécessitent le code de l’application et un serveur ou service d’authentification capable de conserver les comptes, gérer les sessions et vérifier les paiements côté serveur.

Pour terminer ces fonctionnalités, il faut fournir le dépôt privé de l’application, préciser si la cible est Windows, Android ou les deux, puis configurer les identifiants OAuth Google et les clés serveur de la passerelle choisie. Les clés secrètes ne doivent jamais être placées dans le JavaScript public de l’application.

## Vérification locale

```bash
node --check app.js
git diff --check
```
