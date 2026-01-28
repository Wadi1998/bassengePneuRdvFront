# 🚀 GUIDE DE DÉPLOIEMENT COMPLET - FRONTEND BASSENGE PNEU

> **Guide ultra-complet pour déployer votre frontend Angular de A à Z**
>
> 📍 **VPS** : 72.62.182.169 (Hostinger)  
> 🌐 **Domaine** : bassenge-pneus.com  
> 🔒 **Sécurité** : SSL/TLS automatique, HTTPS  
> ⚡ **Déploiement** : Automatique via GitHub Actions

**✅ Frontend Angular + Nginx en conteneur Docker**

---

## 📚 TABLE DES MATIÈRES

1. [Prérequis](#-prérequis)
2. [Vue d'ensemble](#-vue-densemble)
3. [ÉTAPE 1 : Préparation du serveur](#-étape-1--préparation-du-serveur-5-min)
4. [ÉTAPE 2 : Configuration DNS](#-étape-2--configuration-dns-5-min)
5. [ÉTAPE 3 : GitHub Secrets](#-étape-3--configuration-github-secrets-5-min)
6. [ÉTAPE 4 : Premier déploiement](#-étape-4--premier-déploiement-10-min)
7. [ÉTAPE 5 : Configuration Nginx](#-étape-5--configuration-nginx-10-min)
8. [ÉTAPE 6 : Vérification](#-étape-6--vérification-5-min)
9. [Maintenance](#-maintenance)
10. [Dépannage](#-dépannage)

**⏱️ Durée totale : 40 minutes**

---

## 🎯 PRÉREQUIS

Avant de commencer :

- ✅ Un VPS Debian/Ubuntu avec accès root
- ✅ Le domaine bassenge-pneus.com
- ✅ Backend déjà déployé (API + Keycloak)
- ✅ Accès à GitHub (https://github.com/Wadi1998/bassengePneuRdvFront)
- ✅ Terminal (PowerShell sur Windows, Terminal sur Mac/Linux)

---

## 🏗️ VUE D'ENSEMBLE

### Architecture Finale

```
Internet
    │
    ↓
[DNS : bassenge-pneus.com → 72.62.182.169]
    │
    ↓
[Pare-feu UFW : 22, 80, 443]
    │
    ↓
[Nginx Principal (80, 443)]
    ├─→ /api/*     → [Backend Spring Boot:8080]
    ├─→ /auth/*    → [Keycloak:8180]
    └─→ /*         → [Frontend Angular:3000]
                         ↓
                    [Container Docker Nginx]
```

### Composants Frontend

| Composant | Description | Port |
|-----------|-------------|------|
| **Frontend Angular** | Application SPA | 3000 (interne) |
| **Nginx (conteneur)** | Serveur web frontend | 3000 (interne) |
| **Nginx (système)** | Reverse proxy principal | 80, 443 (public) |

---

## 🔧 ÉTAPE 1 : PRÉPARATION DU SERVEUR (5 min)

### 1.1 Connexion au serveur

```bash
ssh root@72.62.182.169
```

Entrez votre mot de passe quand demandé.

---

### 1.2 Vérifier que Docker est installé

```bash
docker --version
docker compose version
```

**✅ Si installé** : Passez à l'étape 1.3  
**❌ Si pas installé** : Installez Docker

```bash
curl -fsSL https://get.docker.com | sh
```

---

### 1.3 Créer le réseau Docker

Le frontend doit être sur le même réseau que le backend :

```bash
# Créer le réseau (si pas déjà fait par le backend)
docker network create garagepneu-network 2>/dev/null || echo "✅ Réseau déjà existant"
```

---

### 1.4 Générer la clé SSH pour GitHub Actions

```bash
# Générer la clé SSH (si pas déjà fait)
ssh-keygen -t ed25519 -C 'github-actions-frontend' -f ~/.ssh/github_deploy_frontend -N ''

# Ajouter la clé publique aux clés autorisées
cat ~/.ssh/github_deploy_frontend.pub >> ~/.ssh/authorized_keys

# Définir les bonnes permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Afficher la clé PRIVÉE
echo "=========================================="
echo "COPIEZ CETTE CLÉ COMPLÈTE (du BEGIN au END) :"
echo "=========================================="
cat ~/.ssh/github_deploy_frontend
echo "=========================================="
```

#### 📋 IMPORTANT : Copier la clé privée

**✅ COPIEZ TOUT** (du `-----BEGIN OPENSSH PRIVATE KEY-----` jusqu'au `-----END OPENSSH PRIVATE KEY-----` inclus).

**📝 Collez-la dans un fichier temporaire** (Notepad) - vous en aurez besoin pour GitHub Secrets.

---

### 1.5 Tester la clé SSH

```bash
ssh -i ~/.ssh/github_deploy_frontend root@localhost "echo '✅ SSH Frontend OK'"
```

**✅ Si ça affiche "✅ SSH Frontend OK"** → Parfait !

---

### 1.6 Créer les répertoires

```bash
# Créer les répertoires nécessaires
mkdir -p /opt/bassenge-frontend
mkdir -p /var/log/nginx

# Donner les bonnes permissions
chmod 755 /opt/bassenge-frontend
```

---

### 1.7 Se déconnecter

```bash
exit
```

---

## 🌐 ÉTAPE 2 : CONFIGURATION DNS (5 min)

### 2.1 Vérifier que le DNS pointe vers votre VPS

**NORMALEMENT**, si le backend est déjà déployé, le DNS est déjà configuré.

**Vérifier sur votre PC** :

```powershell
# Windows PowerShell
nslookup bassenge-pneus.com 8.8.8.8
nslookup www.bassenge-pneus.com 8.8.8.8
```

```bash
# Mac/Linux
dig @8.8.8.8 bassenge-pneus.com +short
dig @8.8.8.8 www.bassenge-pneus.com +short
```

**✅ Résultat attendu** : `72.62.182.169`

---

### 2.2 Si le DNS n'est pas configuré

Chez votre fournisseur de domaine, ajoutez :

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| **A** | `@` | `72.62.182.169` | 3600 |
| **A** | `www` | `72.62.182.169` | 3600 |

**⏳ Attendez 5-30 minutes** pour la propagation DNS.

---

## 🔐 ÉTAPE 3 : CONFIGURATION GITHUB SECRETS (5 min)

### 3.1 Aller sur GitHub Secrets

```
https://github.com/Wadi1998/bassengePneuRdvFront/settings/secrets/actions
```

---

### 3.2 Ajouter les secrets

Cliquez sur **"New repository secret"** et ajoutez UN PAR UN :

| Nom du Secret | Valeur | Description |
|---------------|--------|-------------|
| `VPS_HOST` | `72.62.182.169` | IP du serveur VPS |
| `VPS_USER` | `root` | Utilisateur SSH |
| `VPS_SSH_KEY` | *votre clé privée complète* | Clé SSH générée à l'étape 1.4 |

**⚠️ POUR `VPS_SSH_KEY`** : Copiez-collez la clé COMPLÈTE (BEGIN à END).

---

### 3.3 Vérifier les secrets

Vous devriez voir **3 secrets** dans la liste :
- ✅ VPS_HOST
- ✅ VPS_USER  
- ✅ VPS_SSH_KEY

---

## 🚀 ÉTAPE 4 : PREMIER DÉPLOIEMENT (10 min)

### 4.1 Vérifier votre fichier deploy.yml

Assurez-vous d'avoir un fichier `.github/workflows/deploy.yml` dans votre projet.

**Si vous n'en avez pas**, créez-le :

```yaml
name: 🚀 Deploy Frontend to VPS

on:
  push:
    branches: [main, master]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: 🚀 Deploy Frontend

    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 🚀 Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/bassenge-frontend
            
            # Cloner ou mettre à jour le repository
            if [ ! -d .git ]; then
              git clone https://github.com/Wadi1998/bassengePneuRdvFront.git .
            else
              git fetch origin
              git reset --hard origin/main
            fi
            
            # Arrêter l'ancien conteneur
            docker compose -f docker-compose.prod.yml down || true
            
            # Construire et démarrer
            docker compose -f docker-compose.prod.yml up -d --build
            
            # Attendre le démarrage
            sleep 10
            
            # Vérifier le statut
            docker ps | grep garagepneu-frontend
            
            echo "✅ Déploiement frontend terminé !"
```

---

### 4.2 Déclencher le déploiement

**Sur votre PC**, dans le dossier du projet :

```bash
# Ajouter tous les fichiers
git add .

# Créer un commit
git commit -m "🚀 Déploiement initial frontend"

# Pousser sur GitHub
git push origin main
```

---

### 4.3 Suivre le déploiement

1. **Allez sur GitHub** :
   ```
   https://github.com/Wadi1998/bassengePneuRdvFront/actions
   ```

2. **Cliquez sur le workflow en cours**

3. **Regardez les étapes s'exécuter** (~5-10 minutes)

---

### 4.4 Ce qui se passe pendant le déploiement

```
GitHub Actions exécute :
├─ 1. Clone/Update du repository
├─ 2. Connexion SSH au VPS
├─ 3. Construction de l'image Docker :
│   ├─ npm install (dépendances)
│   ├─ npm run build:staging (compilation Angular)
│   └─ Copy vers Nginx
├─ 4. Démarrage du conteneur
└─ 5. Vérification
```

**⏱️ Durée** : 7-10 minutes (première fois)

---

### 4.5 Vérifier que le déploiement a réussi

✅ **Le workflow doit être VERT**

---

## 🔧 ÉTAPE 5 : CONFIGURATION NGINX (10 min)

Maintenant que le conteneur frontend tourne sur le port 3000, on doit configurer Nginx pour qu'il serve le frontend.

### 5.1 Connexion au serveur

```bash
ssh root@72.62.182.169
```

---

### 5.2 Modifier la configuration Nginx

```bash
nano /etc/nginx/sites-available/garagepneu.conf
```

**Remplacez TOUT le contenu par ceci** :

```nginx
# ═══════════════════════════════════════════════════════════════════
# CONFIGURATION NGINX - BASSENGE PNEU (FRONTEND + BACKEND)
# ═══════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────
# Redirection HTTP → HTTPS
# ─────────────────────────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name bassenge-pneus.com www.bassenge-pneus.com;

    # Certbot challenge (pour renouvellement SSL)
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Tout le reste → HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# ─────────────────────────────────────────────────────────────────
# SERVEUR HTTPS PRINCIPAL
# ─────────────────────────────────────────────────────────────────
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bassenge-pneus.com www.bassenge-pneus.com;

    # ═════════════════════════════════════════════════════════════
    # SSL/TLS Configuration
    # ═════════════════════════════════════════════════════════════
    ssl_certificate /etc/letsencrypt/live/bassenge-pneus.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bassenge-pneus.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ═════════════════════════════════════════════════════════════
    # Headers de sécurité
    # ═════════════════════════════════════════════════════════════
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # ═════════════════════════════════════════════════════════════
    # Logs
    # ═════════════════════════════════════════════════════════════
    access_log /var/log/nginx/garagepneu.access.log;
    error_log  /var/log/nginx/garagepneu.error.log;

    # ═════════════════════════════════════════════════════════════
    # BACKEND API
    # ═════════════════════════════════════════════════════════════
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_read_timeout 90s;
        proxy_send_timeout 90s;
    }

    # ═════════════════════════════════════════════════════════════
    # KEYCLOAK
    # ═════════════════════════════════════════════════════════════
    location /auth/ {
        proxy_pass http://127.0.0.1:8180/auth/;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port 443;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        
        # Buffers
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # ═════════════════════════════════════════════════════════════
    # FRONTEND ANGULAR (DÉFAUT)
    # ═════════════════════════════════════════════════════════════
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (si nécessaire)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

**Sauvegarder** : `Ctrl+X`, puis `Y`, puis `Entrée`

---

### 5.3 Activer la configuration

```bash
# Lien symbolique (si pas déjà fait)
ln -sf /etc/nginx/sites-available/garagepneu.conf /etc/nginx/sites-enabled/

# Supprimer l'ancienne config temporaire (si elle existe)
rm -f /etc/nginx/sites-enabled/garagepneu-temp.conf
rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
nginx -t
```

**✅ Résultat attendu** :
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

---

### 5.4 Recharger Nginx

```bash
systemctl reload nginx
```

---

### 5.5 Se déconnecter

```bash
exit
```

---

## ✅ ÉTAPE 6 : VÉRIFICATION (5 min)

### 6.1 Tester le frontend

Ouvrez votre navigateur et allez sur :
```
https://bassenge-pneus.com
```

**✅ Vous devriez voir** : Votre application Angular ! 🎉

---

### 6.2 Tester la page de login

```
https://bassenge-pneus.com/login
```

**✅ Vous devriez voir** : La page de connexion

---

### 6.3 Vérifier le SSL

1. **Cliquez sur le cadenas** 🔒 dans la barre d'adresse
2. **Vérifiez** : "Connexion sécurisée"

---

### 6.4 Tester que le backend fonctionne toujours

```bash
curl https://bassenge-pneus.com/api/actuator/health
```

**✅ Résultat attendu** :
```json
{"status":"UP"}
```

---

### 6.5 Ouvrir la console développeur

1. **Appuyez sur F12** (Chrome/Edge) ou **Cmd+Option+I** (Mac)
2. **Vérifiez l'onglet "Console"**
3. **✅ Pas d'erreurs rouges** = Tout est bon !

---

## 🛠️ MAINTENANCE

### Commandes utiles

#### Se connecter au serveur
```bash
ssh root@72.62.182.169
```

#### Voir le conteneur frontend
```bash
docker ps | grep garagepneu-frontend
```

#### Logs du conteneur frontend
```bash
docker logs -f garagepneu-frontend
```

#### Redémarrer le frontend
```bash
cd /opt/bassenge-frontend
docker compose -f docker-compose.prod.yml restart
```

#### Reconstruire le frontend
```bash
cd /opt/bassenge-frontend
docker compose -f docker-compose.prod.yml up -d --build
```

#### Voir les logs Nginx (système)
```bash
tail -f /var/log/nginx/garagepneu.access.log
tail -f /var/log/nginx/garagepneu.error.log
```

#### Voir le statut Nginx
```bash
systemctl status nginx
```

---

### Déploiements futurs

Pour déployer une nouvelle version du frontend :

```bash
git add .
git commit -m "Nouvelle fonctionnalité frontend"
git push origin main
```

**Le déploiement se fait automatiquement** via GitHub Actions ! 🎉

---

## 🐛 DÉPANNAGE

### Problème : Page blanche

**Causes possibles** :
- Le conteneur n'est pas démarré
- Erreur de build Angular
- Port 3000 non accessible

**Solution** :

```bash
ssh root@72.62.182.169

# Voir les logs
docker logs garagepneu-frontend --tail 100

# Vérifier que le conteneur tourne
docker ps | grep garagepneu-frontend

# Tester localement
curl http://localhost:3000

# Si erreur, reconstruire
cd /opt/bassenge-frontend
docker compose -f docker-compose.prod.yml up -d --build --force-recreate
```

---

### Problème : Erreur 502 Bad Gateway

**Causes** :
- Le conteneur frontend n'est pas démarré
- Port 3000 non accessible
- Nginx mal configuré

**Solution** :

```bash
# Tester le conteneur
docker ps | grep garagepneu-frontend

# Si absent, redémarrer
cd /opt/bassenge-frontend
docker compose -f docker-compose.prod.yml up -d

# Tester localement
curl http://localhost:3000

# Vérifier la config Nginx
nginx -t

# Recharger Nginx
systemctl reload nginx
```

---

### Problème : Erreur CORS

**Symptôme** : Dans la console (F12), vous voyez :
```
Access to XMLHttpRequest at 'https://bassenge-pneus.com/api/...' 
has been blocked by CORS policy
```

**Solution** : Vérifier le backend

Le backend doit avoir dans `CORS_ALLOWED_ORIGINS` :
```
https://bassenge-pneus.com,https://www.bassenge-pneus.com
```

Vérifiez les secrets GitHub du **backend** et redéployez le backend si nécessaire.

---

### Problème : Keycloak ne se connecte pas

**Symptôme** : Erreur de redirection ou "Invalid issuer"

**Solution** : Vérifier les environnements Angular

Dans `src/environments/environment.prod.ts` :

```typescript
keycloak: {
  issuer: 'https://bassenge-pneus.com/auth/realms/garage-realm',
  clientId: 'garagepneu-frontend',
  redirectUri: 'https://bassenge-pneus.com'
}
```

**⚠️ Important** : Pas de slash `/` à la fin de `redirectUri`.

---

### Problème : Le conteneur redémarre en boucle

**Solution** :

```bash
# Voir pourquoi il crash
docker logs garagepneu-frontend --tail 100

# Vérifier les erreurs de build
docker compose -f docker-compose.prod.yml up --build

# Si erreur de mémoire, vérifier la RAM
free -h
```

---

### Problème : Certificat SSL expiré

**Solution** :

```bash
# Renouveler (automatique via cron)
certbot renew

# Forcer le renouvellement
certbot renew --force-renewal

# Recharger Nginx
systemctl reload nginx
```

---

## 🎉 CONCLUSION

**Félicitations !** Votre frontend Angular est déployé !

### 📍 Récapitulatif des URLs

| Service | URL | Accès |
|---------|-----|-------|
| **Frontend** | https://bassenge-pneus.com | Public |
| **Login** | https://bassenge-pneus.com/login | Public |
| **API** | https://bassenge-pneus.com/api | Public |
| **Keycloak** | https://bassenge-pneus.com/auth | Public |

### 🔄 Workflow de développement

1. **Développer localement** : `npm start`
2. **Commiter** : `git add . && git commit -m "..."`
3. **Pousser** : `git push origin main`
4. **Déploiement automatique** ! ✅

---

### 🎨 Prochaines étapes

- ✅ Tester toutes les fonctionnalités
- ✅ Configurer Google Analytics (si besoin)
- ✅ Ajouter un monitoring (Uptime Robot)
- ✅ Tester les performances (Lighthouse)

---

**Guide créé le 28 janvier 2026**  
**Version** : 1.0.0  
**Projet** : Bassenge Pneu - Frontend Angular  
**Auteur** : DevOps Team

---

**🚗 Bon déploiement ! 🚀**
