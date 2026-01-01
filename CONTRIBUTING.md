# Contribuer au Système de Livraison de Repas Multi-Vendeurs Enatega

Tout d'abord, merci d'envisager de contribuer à notre projet ! Votre aide est grandement appréciée.

## Comment puis-je contribuer ?

### Signaler des Bugs

Si vous trouvez un bug dans le projet, veuillez soumettre un ticket (issue). Lors du signalement d'un bug, merci d'inclure :

-   Un titre clair et descriptif.
-   Une description détaillée du problème, incluant les étapes pour le reproduire.
-   Tout log, capture d'écran ou autre information pertinente pouvant aider à diagnostiquer le problème.

### Suggérer des Améliorations

Nous accueillons favorablement les suggestions d'améliorations et de nouvelles fonctionnalités. Lors d'une suggestion, merci d'inclure :

-   Un titre clair et descriptif.
-   Une description détaillée du changement proposé.
-   Tout contexte pertinent ou raisonnement pour l'amélioration.

### Pull Requests

Si vous souhaitez contribuer au code, suivez ces étapes :

1. **Forker le dépôt** : Créez un fork du dépôt sur GitHub.
2. **Cloner votre fork** : Clonez votre fork sur votre machine locale.
    ```bash
    git clone https://github.com/<votre-nom-utilisateur>/food-delivery-multivendor.git
    cd food-delivery-multivendor
    ```
3. **Créer une nouvelle branche** : Créez une nouvelle branche pour votre fonctionnalité ou correctif.
    ```bash
    git checkout -b description-fonctionnalite-ou-correctif
    ```
4. **Faire vos changements** : Apportez vos modifications au code.
5. **Tester vos changements** : Assurez-vous que vos changements fonctionnent comme prévu et n'introduisent pas de problèmes.
6. **Commiter vos changements** : Commitez vos changements avec un message de commit descriptif.
    ```bash
    git add .
    git commit -m "Description de la fonctionnalité ou du correctif"
    ```
7. **Pusher vos changements** : Poussez vos changements vers votre fork.
    ```bash
    git push origin description-fonctionnalite-ou-correctif
    ```
8. **Soumettre une pull request** : Créez une pull request depuis votre fork vers le dépôt principal. Incluez une description détaillée de vos changements.

### Guides de Codage

Pour assurer la cohérence dans la base de code, veuillez suivre ces directives :

-   **Style de Code** : Suivez le style de code existant dans le projet.
-   **Commentaires** : Écrivez des commentaires clairs et concis pour les sections de code complexes.
-   **Tests** : Écrivez des tests pour les nouvelles fonctionnalités et les correctifs de bugs.

### Code de Conduite

En participant à ce projet, vous acceptez de respecter notre [Code de Conduite](CODE_OF_CONDUCT.md).

## Pour Commencer

### Prérequis

Assurez-vous d'avoir installé ce qui suit :

-   Node.js (version 14.0 à 16.0)
-   npm ou yarn

### Installation

1. **Cloner le dépôt** :

    ```bash
    git clone https://github.com/enatega/food-delivery-multivendor.git
    cd food-delivery-multivendor
    ```

2. **Installer les dépendances** :

    ```bash
    npm install
    # ou
    yarn install
    ```

3. **Lancer le serveur de développement** :
    ```bash
    npm start
    # ou
    yarn start
    ```
