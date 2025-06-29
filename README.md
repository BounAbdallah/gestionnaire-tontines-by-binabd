# ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white) ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

# Gestionnaire de Tontines

## Description du projet

Le **Gestionnaire de Tontines** est une application web conçue pour faciliter la gestion des tontines. Elle permet aux utilisateurs de s'inscrire, de suivre leurs contributions, de visualiser des rapports et de gérer les participants. L'application est construite avec des technologies modernes, offrant une interface utilisateur réactive et intuitive.

### Fonctionnalités clés

- Inscription et gestion des utilisateurs
- Suivi des contributions et des activités des tontines
- Visualisation des rapports et statistiques
- Interface utilisateur conviviale et réactive

## Stack Technologique

| Technologie | Description |
|-------------|-------------|
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white) | Environnement d'exécution JavaScript côté serveur |
| ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black) | Bibliothèque JavaScript pour construire des interfaces utilisateur |
| ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white) | Superset de JavaScript qui ajoute des types statiques |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) | Outil de construction pour des applications modernes |

## Instructions d'installation

### Prérequis

- Node.js (version 14 ou supérieure)
- npm (ou yarn)

### Étapes d'installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/BounAbdallah/gestionnaire-tontines-by-binabd.git
   cd gestionnaire-tontines-by-binabd
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Configurez la base de données :
   - Exécutez le script SQL d'initialisation pour créer la base de données :
     ```bash
     mysql -u <username> -p < init-database.sql
     ```
   - Ajoutez des données de test :
     ```bash
     mysql -u <username> -p < seed-data.sql
     ```

4. Démarrez l'application :
   ```bash
   npm run dev
   ```

## Utilisation

Accédez à l'application via votre navigateur à l'adresse `http://localhost:3000`. Vous pouvez vous inscrire, vous connecter et commencer à gérer vos tontines.

### Exemples d'utilisation

- **Inscription d'un nouvel utilisateur** : Remplissez le formulaire d'inscription sur l'écran d'accueil.
- **Visualisation des rapports** : Accédez à l'onglet des rapports pour consulter les statistiques des tontines.

## Structure du projet

Voici un aperçu de la structure du projet :

```
gestionnaire-tontines-by-binabd/
├── lib/                      # Contient les fichiers de gestion de la base de données
│   └── database.ts           # Configuration de la connexion à la base de données
├── public/                   # Contient les fichiers statiques
│   └── vite.svg              # Logo de Vite
├── scripts/                  # Scripts SQL pour la gestion de la base de données
│   ├── init-database.sql     # Script pour initialiser la base de données
│   └── seed-data.sql         # Script pour ajouter des données de test
├── src/                      # Contient le code source de l'application
│   ├── assets/               # Ressources graphiques
│   ├── components/           # Composants React de l'application
│   ├── types/                # Types TypeScript
│   ├── utils/                # Utilitaires divers
│   ├── App.css               # Styles globaux de l'application
│   ├── App.tsx               # Composant principal de l'application
│   ├── main.tsx              # Point d'entrée de l'application
│   └── vite-env.d.ts         # Types pour Vite
├── .gitignore                # Fichiers à ignorer par Git
├── eslint.config.js          # Configuration d'ESLint
├── index.html                # Fichier HTML principal
├── package.json              # Dépendances et scripts du projet
└── vite.config.ts            # Configuration de Vite
```

## Contribuer

Les contributions sont les bienvenues ! Pour contribuer, veuillez suivre ces étapes :

1. Forkez le projet.
2. Créez votre branche (`git checkout -b feature/nouvelle-fonctionnalité`).
3. Commitez vos modifications (`git commit -m 'Ajout d\'une nouvelle fonctionnalité'`).
4. Poussez vers la branche (`git push origin feature/nouvelle-fonctionnalité`).
5. Ouvrez une Pull Request.

Nous apprécions vos contributions et vos retours !
