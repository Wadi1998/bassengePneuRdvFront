# 🚀 GUIDE ULTRA-SIMPLE - DÉPLOYER LE FRONTEND (Sans nano !)

> **Guide pas-à-pas ultra-détaillé pour déployer votre frontend Angular**  
> ⏱️ **Durée totale : 30 minutes**  
> 📍 **Backend déjà déployé** : ✅  
> 🎯 **Objectif** : Avoir votre site sur https://bassenge-pneus.com

---

## 📋 CE QU'ON VA FAIRE (Vue d'ensemble)

```
1️⃣ Vérifier/Configurer GitHub Secrets (5 min)
2️⃣ Préparer le serveur VPS (10 min)
3️⃣ Déployer via GitHub Actions (5 min)
4️⃣ Configurer Nginx (10 min)
5️⃣ Tester le site (5 min)
```

> ⚠️ **IMPORTANT - CORRECTION KEYCLOAK EFFECTUÉE** :  
> L'URL Keycloak a été corrigée de `https://auth.bassenge-pneus.com` vers `https://bassenge-pneus.com/auth` pour correspondre à votre configuration Nginx backend qui utilise un PATH et non un sous-domaine. ✅

---

## 🎯 PARTIE 1 : VÉRIFIER GITHUB SECRETS (5 min)

### Étape 1.1 : Aller sur GitHub Secrets

1. **Ouvrez votre navigateur**
2. **Allez sur** : https://github.com/Wadi1998/bassengePneuRdvFront/settings/secrets/actions

### Étape 1.2 : Vérifier les secrets existants

**Vous DEVEZ avoir ces 3 secrets** :

| Nom | Valeur attendue |
|-----|----------------|
| `VPS_HOST` | `72.62.182.169` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | *Une clé SSH complète* |

### Étape 1.3 : Si les secrets EXISTENT déjà

✅ **Parfait !** Passez directement à la [PARTIE 2](#-partie-2--préparer-le-serveur-vps-10-min)

### Étape 1.4 : Si les secrets N'EXISTENT PAS

On va les créer ! **Suivez la PARTIE 1-B ci-dessous** ⬇️

---

## 🔐 PARTIE 1-B : CRÉER LES SECRETS GITHUB (seulement si nécessaire)

### Étape 1B.1 : Se connecter au serveur

**Sur votre ordinateur**, ouvrez un terminal :

**Sur Mac/Linux** :
```bash
ssh root@72.62.182.169
```

**Sur Windows (PowerShell)** :
```powershell
ssh root@72.62.182.169
```

📝 **Entrez le mot de passe** quand demandé

### Étape 1B.2 : Créer la clé SSH

**Copiez-collez cette commande** (tout d'un coup) :

```bash
ssh-keygen -t ed25519 -C 'github-frontend' -f ~/.ssh/github_deploy_frontend -N ''
```

**Résultat attendu** :
```
Generating public/private ed25519 key pair.
Your identification has been saved in ~/.ssh/github_deploy_frontend
Your public key has been saved in ~/.ssh/github_deploy_frontend.pub
```

✅ **Parfait !**

### Étape 1B.3 : Autoriser la clé

```bash
cat ~/.ssh/github_deploy_frontend.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Étape 1B.4 : Afficher la clé privée

```bash
cat ~/.ssh/github_deploy_frontend
```

**Résultat** : Vous verrez quelque chose comme ça :
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...plusieurs lignes...
-----END OPENSSH PRIVATE KEY-----
```

### Étape 1B.5 : COPIER LA CLÉ 📋

**TRÈS IMPORTANT** :

1. **Sélectionnez TOUT le texte** (du `-----BEGIN` jusqu'au `-----END` **inclus**)
2. **Copiez** (Ctrl+C ou Cmd+C)
3. **Collez dans un fichier Notepad temporaire** (vous en aurez besoin dans 2 minutes)

### Étape 1B.6 : Se déconnecter du serveur

```bash
exit
```

### Étape 1B.7 : Créer les secrets sur GitHub

**Retournez sur** : https://github.com/Wadi1998/bassengePneuRdvFront/settings/secrets/actions

**Cliquez sur** : `New repository secret`

**Créez ces 3 secrets UN PAR UN** :

#### Secret 1 : VPS_HOST
- **Name** : `VPS_HOST`
- **Value** : `72.62.182.169`
- **Cliquez** : `Add secret`

#### Secret 2 : VPS_USER
- **Name** : `VPS_USER`
- **Value** : `root`
- **Cliquez** : `Add secret`

#### Secret 3 : VPS_SSH_KEY
- **Name** : `VPS_SSH_KEY`
- **Value** : *Collez la clé privée complète que vous avez copiée*
- **Cliquez** : `Add secret`

✅ **Vous devriez maintenant voir 3 secrets dans la liste !**

---

## 🖥️ PARTIE 2 : PRÉPARER LE SERVEUR VPS (10 min)

### Étape 2.1 : Se connecter au serveur

```bash
ssh root@72.62.182.169
```

### Étape 2.2 : Vérifier que Docker est installé

```bash
docker --version
```

**✅ Si vous voyez** : `Docker version 20.x.x` → **Parfait !**

**❌ Si erreur** "command not found" :

```bash
curl -fsSL https://get.docker.com | sh
```

⏳ **Attendez 2-3 minutes** pour l'installation

### Étape 2.3 : Créer le réseau Docker

```bash
docker network create garagepneu-network 2>/dev/null || echo "✅ Réseau déjà existant"
```

**Résultat** : Soit un hash bizarre, soit "Réseau déjà existant" → **C'est bon !**

### Étape 2.4 : Créer le dossier frontend

```bash
mkdir -p ~/garagepneu-frontend
```

### Étape 2.5 : Vérifier que le backend fonctionne

```bash
docker ps | grep backend
```

**✅ Vous devriez voir une ligne** avec "backend" ou "garagepneu" → **Le backend tourne !**

### Étape 2.6 : Rester connecté

**NE VOUS DÉCONNECTEZ PAS** - On va avoir besoin du terminal dans quelques minutes !

---

## 🚀 PARTIE 3 : DÉPLOYER VIA GITHUB ACTIONS (5 min)

### Étape 3.1 : Ouvrir un NOUVEAU terminal

**Sur votre PC** (pas sur le serveur), ouvrez un **nouveau terminal/PowerShell**

### Étape 3.2 : Aller dans le dossier du projet

```bash
cd /Users/Wadie/IdeaProjects/bassengePneuRdvFront
```

### Étape 3.3 : Vérifier que vous êtes au bon endroit

```bash
ls -la
```

**✅ Vous devriez voir** : `package.json`, `Dockerfile`, `DEPLOYMENT.md`, etc.

### Étape 3.4 : Faire un commit

```bash
git add .
git commit -m "🚀 Déploiement frontend" -a
git push origin main
```

**📝 Note** : Si vous avez des erreurs "nothing to commit", c'est OK ! Faites juste :
```bash
git commit --allow-empty -m "🚀 Déploiement frontend"
git push origin main
```

### Étape 3.5 : Suivre le déploiement sur GitHub

1. **Ouvrez votre navigateur**
2. **Allez sur** : https://github.com/Wadi1998/bassengePneuRdvFront/actions
3. **Cliquez sur le workflow en cours** (le premier dans la liste)
4. **Regardez les étapes s'exécuter** ⏳

### Étape 3.6 : Attendre la fin

**⏱️ Durée** : 5-8 minutes

**✅ C'est terminé quand** : Toutes les étapes sont VERTES avec ✅

**❌ Si une étape est ROUGE avec ❌** : Notez l'erreur et regardez la [section Dépannage](#-dépannage) à la fin

---

## 🌐 PARTIE 4 : CONFIGURER NGINX (10 min)

**Retournez au terminal connecté au serveur** (celui de la Partie 2)

### Étape 4.1 : Vérifier que le conteneur frontend tourne

```bash
docker ps | grep frontend
```

**✅ Vous devriez voir** :
```
garagepneu-frontend   ...   Up X minutes   127.0.0.1:3000->80/tcp
```

### Étape 4.2 : Tester le frontend en local

```bash
curl http://localhost:3000
```

**✅ Vous devriez voir** : Du code HTML (plein de `<div>`, `<html>`, etc.)

**❌ Si erreur** "Connection refused" : Le conteneur n'est pas démarré → Voir [Dépannage](#-dépannage)

### Étape 4.3 : Créer le fichier de configuration Nginx

**AU LIEU d'utiliser nano**, on va créer le fichier directement avec une commande :

```bash
cat > /etc/nginx/sites-available/garagepneu.conf << 'ENDOFFILE'
# Configuration Nginx - Bassenge Pneu

# Redirection HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name bassenge-pneus.com www.bassenge-pneus.com;

    # Certbot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirection HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# Serveur HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bassenge-pneus.com www.bassenge-pneus.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/bassenge-pneus.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bassenge-pneus.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/garagepneu.access.log;
    error_log  /var/log/nginx/garagepneu.error.log;

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 90s;
        proxy_send_timeout 90s;
    }

    # Keycloak
    location /auth/ {
        proxy_pass http://127.0.0.1:8180/auth/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # Frontend Angular
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
ENDOFFILE
```

**⚡ Appuyez sur ENTRÉE** après avoir collé la commande

**✅ Résultat** : Rien ne s'affiche, c'est normal ! Le fichier a été créé.

### Étape 4.4 : Vérifier que le fichier a été créé

```bash
ls -lh /etc/nginx/sites-available/garagepneu.conf
```

**✅ Vous devriez voir** : Une ligne avec la taille du fichier (~2K)

### Étape 4.5 : Activer la configuration

```bash
ln -sf /etc/nginx/sites-available/garagepneu.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
```

### Étape 4.6 : Tester la configuration Nginx

```bash
nginx -t
```

**✅ Résultat attendu** :
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**❌ Si erreur** : Notez l'erreur exacte et consultez le [Dépannage](#-dépannage)

### Étape 4.7 : Recharger Nginx

```bash
systemctl reload nginx
```

**✅ Aucun message = Succès !**

### Étape 4.8 : Vérifier le statut Nginx

```bash
systemctl status nginx
```

**✅ Vous devriez voir** : `Active: active (running)` en vert

**Appuyez sur `q`** pour quitter

### Étape 4.9 : Se déconnecter du serveur

```bash
exit
```

---

## ✅ PARTIE 5 : TESTER LE SITE (5 min)

### Étape 5.1 : Ouvrir le site dans le navigateur

**Ouvrez votre navigateur** et allez sur :

```
https://bassenge-pneus.com
```

**✅ Vous devriez voir** : Votre application Angular ! 🎉

### Étape 5.2 : Vérifier le SSL

1. **Cliquez sur le cadenas** 🔒 dans la barre d'adresse
2. **Vérifiez** : "Connexion sécurisée"

✅ **Parfait !**

### Étape 5.3 : Tester la page de connexion

```
https://bassenge-pneus.com/login
```

**✅ Vous devriez voir** : La page de login

### Étape 5.4 : Vérifier la console (erreurs JavaScript)

1. **Appuyez sur F12** (ou Cmd+Option+I sur Mac)
2. **Cliquez sur l'onglet "Console"**
3. **Vérifiez** : Pas d'erreurs rouges importantes

### Étape 5.5 : Tester l'API

**Dans un nouveau terminal** sur votre PC :

```bash
curl https://bassenge-pneus.com/api/actuator/health
```

**✅ Résultat attendu** :
```json
{"status":"UP"}
```

---

## 🎉 FÉLICITATIONS !

**Votre frontend est déployé !** 🚀

### 📍 Récapitulatif

| Service | URL | Statut |
|---------|-----|--------|
| **Frontend** | https://bassenge-pneus.com | ✅ Déployé |
| **API** | https://bassenge-pneus.com/api | ✅ Opérationnel |
| **Keycloak** | https://bassenge-pneus.com/auth | ✅ Opérationnel |

### 🔄 Pour les prochains déploiements

**C'est ultra-simple !** Sur votre PC :

```bash
cd /Users/Wadie/IdeaProjects/bassengePneuRdvFront
git add .
git commit -m "Nouvelle fonctionnalité"
git push origin main
```

**Et c'est tout !** GitHub Actions déploie automatiquement ! ⚡

---

## 🐛 DÉPANNAGE

### Problème : "Le workflow GitHub est rouge ❌"

**Solution** :

1. **Cliquez sur l'étape rouge** sur GitHub Actions
2. **Lisez l'erreur**
3. **Cas communs** :

#### Erreur : "Permission denied (publickey)"
→ Les secrets GitHub sont mal configurés
→ Refaites la [PARTIE 1-B](#-partie-1-b--créer-les-secrets-github-seulement-si-nécessaire)

#### Erreur : "docker: command not found"
→ Docker n'est pas installé sur le serveur
→ Installez Docker (voir Étape 2.2)

---

### Problème : "Page blanche sur le site"

**Solution** :

```bash
# Se connecter au serveur
ssh root@72.62.182.169

# Voir les logs du conteneur
docker logs garagepneu-frontend --tail 50

# Si le conteneur n'est pas démarré
cd ~/garagepneu-frontend
docker ps -a | grep frontend

# Redémarrer le conteneur
docker start garagepneu-frontend

# Si ça ne fonctionne toujours pas, reconstruire
docker stop garagepneu-frontend
docker rm garagepneu-frontend
docker build -t garagepneu-frontend:latest --build-arg BUILD_CONFIGURATION=prod .
docker run -d --name garagepneu-frontend --network garagepneu-network -p 127.0.0.1:3000:80 --restart unless-stopped garagepneu-frontend:latest
```

---

### Problème : "Erreur 502 Bad Gateway"

**Solution** :

```bash
# Se connecter
ssh root@72.62.182.169

# Vérifier que le conteneur tourne
docker ps | grep frontend

# Tester localement
curl http://localhost:3000

# Si erreur, vérifier les logs
docker logs garagepneu-frontend

# Vérifier Nginx
nginx -t
systemctl status nginx

# Recharger Nginx
systemctl reload nginx
```

---

### Problème : "nginx -t" affiche une erreur

**Erreurs courantes** :

#### Erreur : "unknown directive" ou "unexpected end"
→ La configuration n'a pas été bien copiée
→ **Solution** : Supprimez et recréez le fichier

```bash
rm /etc/nginx/sites-available/garagepneu.conf
```

Puis **refaites l'Étape 4.3** en copiant-collant **tout le bloc** de commande

#### Erreur : "certificate file not found"
→ Le certificat SSL n'existe pas encore
→ **Solution** : Créez le certificat Let's Encrypt

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d bassenge-pneus.com -d www.bassenge-pneus.com
```

Suivez les instructions (entrez votre email, acceptez les termes)

---

### Problème : "Erreur CORS dans la console F12"

**Symptôme** :
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution** : Le backend doit autoriser le domaine

1. **Allez sur les secrets GitHub du BACKEND**
2. **Vérifiez** que `CORS_ALLOWED_ORIGINS` contient :
   ```
   https://bassenge-pneus.com,https://www.bassenge-pneus.com
   ```
3. **Redéployez le backend** si nécessaire

---

### Problème : "La connexion Keycloak ne fonctionne pas"

**Solution** : Vérifiez l'URL Keycloak dans l'environnement

**Dans votre projet**, le fichier `src/environments/environment.prod.ts` doit contenir :

```typescript
keycloak: {
  url: 'https://bassenge-pneus.com/auth',  // ⚠️ SANS slash à la fin
  realm: 'garage-realm',
  clientId: 'garagepneu-front'
}
```

**Si ce n'est pas le cas** :
1. Modifiez le fichier
2. `git add .`
3. `git commit -m "Fix Keycloak URL"`
4. `git push origin main`

---

## 📞 BESOIN D'AIDE ?

Si vous êtes bloqué :

1. **Notez l'erreur exacte** que vous voyez
2. **Notez l'étape** où vous êtes bloqué
3. **Prenez une capture d'écran** si possible
4. **Demandez de l'aide** avec ces informations

---

## 🎓 COMMANDES UTILES À CONNAÎTRE

### Sur le serveur VPS

```bash
# Se connecter
ssh root@72.62.182.169

# Voir les conteneurs actifs
docker ps

# Voir les logs du frontend
docker logs -f garagepneu-frontend

# Redémarrer le frontend
docker restart garagepneu-frontend

# Voir les logs Nginx
tail -f /var/log/nginx/garagepneu.error.log

# Tester la config Nginx
nginx -t

# Recharger Nginx
systemctl reload nginx

# Voir le statut Nginx
systemctl status nginx
```

### Sur votre PC

```bash
# Aller dans le projet
cd /Users/Wadie/IdeaProjects/bassengePneuRdvFront

# Voir le statut Git
git status

# Déployer
git add .
git commit -m "Mon changement"
git push origin main

# Tester l'API
curl https://bassenge-pneus.com/api/actuator/health
```

---

**🚗 Bon déploiement ! 🚀**

**Guide créé le 28 janvier 2026**  
**Version simplifiée - Sans nano**
