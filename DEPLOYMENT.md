# 🚀 Guide de Déploiement - Bassenge Pneu RDV Frontend

> **Serveur VPS Hostinger** : `72.62.182.169`  
> **Port Frontend** : `3000`  
> **Mode** : Déploiement automatique via GitHub Actions (CI/CD)

---

## 📋 Résumé

Tu dois faire **2 choses** :
1. **Configurer le serveur UNE SEULE FOIS** (5-10 minutes) - ⚠️ Si déjà fait pour le backend, passer à l'étape 2
2. **Configurer GitHub Secrets** (3 minutes)

Ensuite, chaque `git push` déploie automatiquement ton application ! 🎉

---

## 🌍 Architecture du Déploiement

```
┌─────────────────────────────────────────────────────────────────┐
│                    VPS Hostinger (72.62.182.169)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │   Frontend      │    │    Backend      │    │  Keycloak   │ │
│  │   (Angular)     │    │ (Spring Boot)   │    │   (Auth)    │ │
│  │   Port: 3000    │───▶│   Port: 8080    │◀───│ Port: 8180  │ │
│  │                 │    │                 │    │             │ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│          │                      │                     │        │
│          └──────────────────────┴─────────────────────┘        │
│                    Docker Network: garagepneu-network          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### URLs de l'application :

| Service | URL |
|---------|-----|
| **Frontend** | http://72.62.182.169:3000 |
| **API Backend** | http://72.62.182.169:8080/api |
| **Swagger API** | http://72.62.182.169:8080/api/swagger-ui.html |
| **Keycloak** | http://72.62.182.169:8180 |

---

## 🖥️ ÉTAPE 1 : Configuration du Serveur (UNE SEULE FOIS)

> ⚠️ **Si tu as déjà configuré le serveur pour le backend**, tu peux passer directement à l'**ÉTAPE 2**.

### 1.1 Se connecter au serveur

Ouvre un terminal et connecte-toi :

```bash
ssh root@72.62.182.169
```

### 1.2 Exécuter le script d'installation

Ce script installe Docker et configure l'environnement :

```bash
curl -fsSL https://raw.githubusercontent.com/Wadi1998/bassengePneuRdvFront/main/scripts/setup-server.sh | bash
```

⏳ **Attends environ 3-5 minutes** que le script se termine.

### 1.3 Générer une clé SSH pour GitHub (si pas déjà fait)

> ⚠️ **Si tu as déjà une clé SSH pour le backend**, tu peux réutiliser la même clé !

Toujours sur le serveur, exécute ces commandes :

```bash
# Générer la clé (appuie sur Entrée pour tout accepter)
ssh-keygen -t ed25519 -C 'github-actions' -f ~/.ssh/github_deploy -N ''

# Autoriser cette clé
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Afficher la clé PRIVÉE (tu vas la copier)
cat ~/.ssh/github_deploy
```

📋 **IMPORTANT** : Copie TOUT le contenu affiché (de `-----BEGIN OPENSSH PRIVATE KEY-----` jusqu'à `-----END OPENSSH PRIVATE KEY-----`)

Tu peux maintenant te déconnecter du serveur :
```bash
exit
```

---

## 🔐 ÉTAPE 2 : Configurer GitHub Secrets

### 2.1 Aller dans les paramètres du repo

1. Va sur ton repo GitHub : https://github.com/Wadi1998/bassengePneuRdvFront
2. Clique sur **Settings** (⚙️)
3. Dans le menu gauche, clique sur **Secrets and variables** → **Actions**
4. Clique sur **New repository secret**

### 2.2 Ajouter les secrets

Ajoute chaque secret un par un :

| Nom du Secret | Valeur à mettre |
|---------------|-----------------|
| `VPS_HOST` | `72.62.182.169` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | *(La clé privée SSH - celle du backend si déjà créée)* |

> 💡 **Astuce** : Si tu as déjà configuré les secrets pour le repo backend, tu peux utiliser les mêmes valeurs !

---

## 🚀 ÉTAPE 3 : Déployer

### 3.1 Premier déploiement

Sur ta machine locale, dans le dossier du projet :

```bash
git add .
git commit -m "Premier déploiement frontend"
git push origin main
```

### 3.2 Suivre le déploiement

1. Va sur GitHub → **Actions** (onglet)
2. Tu verras le workflow "🚀 CI/CD Deploy Frontend to VPS" en cours
3. Attends qu'il soit vert ✅ (environ 3-5 minutes)

---

## ✅ ÉTAPE 4 : Vérifier que tout fonctionne

### 4.1 Tester le Frontend

Ouvre dans ton navigateur :
- **Application** : http://72.62.182.169:3000
- **Health Check** : http://72.62.182.169:3000/health

### 4.2 Vérifier la connexion au Backend

1. Ouvre l'application : http://72.62.182.169:3000
2. Essaie de te connecter via Keycloak
3. Vérifie que les données s'affichent correctement

---

## 🔧 ÉTAPE 5 : Configurer Keycloak pour le Frontend

> ⚠️ **Important** : Pour que l'authentification fonctionne, tu dois configurer un client Keycloak pour le frontend.

### 5.1 Accéder à Keycloak

1. Ouvre : http://72.62.182.169:8180
2. Connecte-toi avec le compte admin

### 5.2 Créer le Client Frontend

1. Sélectionne le realm `garage-realm`
2. Menu gauche → **Clients** → **Create client**
3. Configure :
   - **Client ID** : `garagepneu-front`
   - **Client authentication** : **OFF** (application publique)
   - **Authorization** : **OFF**
4. Clique **Next**

### 5.3 Configurer les URLs

Dans l'écran de configuration :

| Champ | Valeur |
|-------|--------|
| Root URL | `http://72.62.182.169:3000` |
| Home URL | `http://72.62.182.169:3000` |
| Valid redirect URIs | `http://72.62.182.169:3000/*` |
| Valid post logout redirect URIs | `http://72.62.182.169:3000/*` |
| Web origins | `http://72.62.182.169:3000` |

5. Clique **Save**

### 5.4 Configurer CORS sur le Backend (si pas déjà fait)

Dans les secrets du backend, assure-toi que `CORS_ALLOWED_ORIGINS` inclut :
```
http://72.62.182.169:3000,http://localhost:4200
```

---

## 🎉 C'est terminé !

Ton application frontend est déployée et fonctionnelle !

### Récapitulatif des URLs :

| Service | URL |
|---------|-----|
| **Frontend** | http://72.62.182.169:3000 |
| **Backend API** | http://72.62.182.169:8080/api |
| **Swagger** | http://72.62.182.169:8080/api/swagger-ui.html |
| **Keycloak** | http://72.62.182.169:8180 |

### Prochains déploiements

Pour chaque modification, il suffit de :

```bash
git add .
git commit -m "ma modification"
git push origin main
```

GitHub Actions s'occupe du reste ! 🚀

---

## 🛠️ Commandes utiles (sur le serveur)

```bash
# Se connecter
ssh root@72.62.182.169

# Voir les logs du frontend
docker logs -f garagepneu-frontend

# Voir l'état des conteneurs
docker ps

# Redémarrer le frontend
docker restart garagepneu-frontend

# Arrêter le frontend
docker stop garagepneu-frontend

# Supprimer et reconstruire le frontend
docker stop garagepneu-frontend
docker rm garagepneu-frontend
docker rmi garagepneu-frontend:latest
cd ~/garagepneu-frontend
docker build -t garagepneu-frontend:latest --build-arg BUILD_CONFIGURATION=staging .
docker run -d --name garagepneu-frontend --network garagepneu-network -p 3000:80 --restart unless-stopped garagepneu-frontend:latest
```

---

## 📜 Scripts NPM disponibles

```bash
# Développement local
npm start                 # Démarrer en mode développement (localhost:4200)
npm run start:staging     # Démarrer avec config staging (pointe vers le VPS)
npm run start:prod        # Démarrer avec config production

# Build
npm run build:dev         # Build de développement
npm run build:staging     # Build de staging (pour le VPS)
npm run build:prod        # Build de production optimisé

# Tests et qualité
npm run test              # Tests unitaires
npm run lint              # Vérifier le code
npm run lint:fix          # Corriger automatiquement le code
```

---

## ❓ FAQ / Problèmes courants

### Le frontend ne charge pas

```bash
ssh root@72.62.182.169
docker logs garagepneu-frontend --tail 50
```

### Erreur 404 sur les routes Angular

Le fichier nginx est configuré pour gérer le routage SPA. Si le problème persiste :
```bash
docker exec -it garagepneu-frontend cat /etc/nginx/conf.d/default.conf
```

### Erreurs CORS

1. Vérifie que Keycloak a la bonne **Web Origins** configurée
2. Vérifie que le backend a `CORS_ALLOWED_ORIGINS` avec l'URL du frontend

### Keycloak ne redirige pas correctement

1. Vérifie les **Valid redirect URIs** dans Keycloak
2. Assure-toi que l'URL correspond exactement : `http://72.62.182.169:3000/*`

### Erreur de connexion SSH dans GitHub Actions

Vérifie que :
1. La clé `VPS_SSH_KEY` est complète (avec les lignes BEGIN et END)
2. Le `VPS_HOST` est correct : `72.62.182.169`
3. Le `VPS_USER` est `root`

### Le build échoue

Vérifie les logs dans GitHub Actions → onglet **Actions** → clique sur le workflow en échec.

---

## 🔄 Développement Local

Pour développer en local tout en utilisant le backend sur le VPS :

```bash
# Démarrer avec la config staging (API sur le VPS)
npm run start:staging
```

Puis ouvre : http://localhost:4200

---

## 📞 Support

En cas de problème :
1. Vérifie les logs Docker sur le serveur
2. Vérifie l'onglet **Actions** sur GitHub pour voir les erreurs de déploiement
3. Consulte la documentation Angular : https://angular.io/guide/deployment

---

*Guide créé le 25 janvier 2026*
