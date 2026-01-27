docker logs -f garagepneu-frontend
docker ps
docker restart garagepneu-frontend
docker stop garagepneu-frontend
docker stop garagepneu-frontend
docker rm garagepneu-frontend
docker rmi garagepneu-frontend:latest
docker build -t garagepneu-frontend:latest --build-arg BUILD_CONFIGURATION=staging .
docker run -d --name garagepneu-frontend --network garagepneu-network -p 3000:80 --restart unless-stopped garagepneu-frontend:latest
docker logs garagepneu-frontend --tail 50
docker exec -it garagepneu-frontend cat /etc/nginx/conf.d/default.conf
# 🚀 Déploiement Frontend (Angular) sur VPS Hostinger Debian + Nginx (prod)

> **Serveur VPS** : `72.62.182.169`  
> **Exposition publique** : via Nginx reverse proxy (`80/443`)  
> **Conteneur frontend** : écoute en loopback `127.0.0.1:3000` (non exposé sur Internet)  
> **CI/CD** : GitHub Actions (push sur `main` ou `staging`)

---

## 📌 Ce qu'on va faire

1) Vérifier/installer la stack (Docker, Nginx, UFW, Fail2Ban, Certbot)  
2) Poser la conf Nginx reverse proxy pour le frontend  
3) Mettre/valider les secrets GitHub Actions  
4) Lancer le premier déploiement auto  
5) Vérifier, activer HTTPS quand tu auras un domaine  
6) Configurer Keycloak côté front

---

## 🌍 Schéma rapide

```
Internet ──▶ Nginx (ports 80/443) ──▶ 127.0.0.1:3000 (container Angular)
                                 └─▶ 127.0.0.1:8080 (backend via autre host conf)
```

Le conteneur frontend n'est accessible que depuis l'hôte (loopback). Seul Nginx publie le service.

---

## 🛠️ Étape 0 — Pré-requis

- Accès root SSH : `ssh root@72.62.182.169`
- Docker déjà installé ? (sinon voir script backend).  
- Si le backend a déjà posé Docker/Nginx/UFW/Fail2Ban/Certbot, on réutilise. On ajoute juste le vhost front.

Commandes de contrôle (sur le VPS) :

```bash
docker --version
nginx -t
ufw status
systemctl status fail2ban --no-pager
```

Si Nginx n'est pas présent (cas rare si backend pas fait) :

```bash
apt update && apt install -y nginx certbot python3-certbot-nginx
systemctl enable nginx --now
```

---

## 🧱 Étape 1 — Conf Nginx reverse proxy (prod)

Objectif : publier `http://72.62.182.169/` (et plus tard `https://ton-domaine`) vers le conteneur front sur `127.0.0.1:3000`.

1) Créer le vhost (domaine `bassenge-pneus.com`) :

```bash
cat >/etc/nginx/sites-available/garagepneu-frontend <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name bassenge-pneus.com www.bassenge-pneus.com;

    # Sécurité de base
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy vers le conteneur front (loopback seulement)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Healthcheck simple
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }

    # Cache statique (optionnel côté reverse proxy)
    location ~* \.(js|css|ico|gif|jpe?g|png|svg|webp|woff2?|ttf|eot|otf)$ {
        expires 7d;
        add_header Cache-Control "public";
        proxy_pass http://127.0.0.1:3000;
    }
}
EOF

ln -sf /etc/nginx/sites-available/garagepneu-frontend /etc/nginx/sites-enabled/garagepneu-frontend
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

2) DNS : crée un enregistrement **A** pour `bassenge-pneus.com` (et `www`) pointant vers `72.62.182.169`.

3) UFW (si pas déjà fait) :

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw reload
```

4) HTTPS (avec le domaine qui pointe déjà sur le VPS) :

```bash
certbot --nginx -d bassenge-pneus.com -d www.bassenge-pneus.com
```

---

## 🔐 Étape 2 — Secrets GitHub Actions (repo front)

Dans GitHub → Settings → Secrets and variables → Actions, ajoute :

| Nom | Valeur |
| --- | --- |
| `VPS_HOST` | `72.62.182.169` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | Clé privée SSH (celle déjà générée pour le backend) |

> Ne commit jamais la clé. Elle vit uniquement dans les secrets.

---

## 🚀 Étape 3 — Déploiement automatique

1) Sur ta machine locale :

```bash
git add .
git commit -m "feat: premier déploiement front"
git push origin main   # ou staging
```

2) Sur GitHub → onglet **Actions**, lance/observe le workflow `🚀 CI/CD Deploy Frontend to VPS`.

Ce que fait le workflow :
- Build Angular (staging config) → image Docker.  
- Push des sources par rsync sur le VPS.  
- Build image Docker sur le VPS et run sur `127.0.0.1:3000`.  
- Le conteneur est sur le réseau Docker `garagepneu-network` et redémarre automatiquement.

---

## ✅ Étape 4 — Vérifications rapides

- Front via Nginx : http://72.62.182.169/ (ou ton domaine)  
- Health front : http://72.62.182.169/health  
- Logs front : `docker logs -f garagepneu-frontend`  
- Statut conteneur : `docker ps | grep garagepneu-frontend`

Si tu as un domaine et du HTTPS, teste aussi `https://ton-domaine/`.

---

## 🔑 Étape 5 — Keycloak (client front)

Dans Keycloak (realm `garage-realm`) :

1. **Clients** → **Create client**  
   - Client ID : `garagepneu-front`  
   - Public client (Client authentication = OFF)  
2. Onglet **Access settings** :
   - Root URL : `http://72.62.182.169` (ou `https://ton-domaine`)  
   - Home URL : idem  
   - Valid redirect URIs : `http://72.62.182.169/*` (ajoute la version https si domaine)  
   - Web origins : `*` ou mieux l'URL exacte (`http://72.62.182.169` + ton domaine en https)  
3. Sauvegarde.

Backend (déjà côté repo back) : assure `CORS_ALLOWED_ORIGINS` inclut l'URL front (`http://72.62.182.169` et ton domaine https).

---

## 🔒 Sécurité / Hardening rapide

- Conteneur front seulement en loopback (`127.0.0.1:3000`) → déjà géré dans le workflow.  
- Nginx publie en 80/443, protège via UFW.  
- Fail2Ban actif sur SSH (voir backend script).  
- Quand domaine dispo : active HTTPS via Certbot.  
- Logs : `/var/log/nginx/` et `docker logs -f garagepneu-frontend`. Purge régulière (logrotate fait le job pour Nginx, `docker image prune -f` tourne en fin de workflow).

---

## 🛠️ Commandes utiles (VPS)

```bash
# Connexion SSH
ssh root@72.62.182.169

# Nginx
nginx -t && systemctl reload nginx

6) (Option pro) Bloquer l’accès direct HTTP/HTTPS par IP (autoriser seulement le domaine) — à activer si tu veux forcer le host :

```bash
cat >/etc/nginx/snippets/deny-by-host.conf <<'EOF'
if ($host !~* ^(bassenge-pneus\.com|www\.bassenge-pneus\.com)$) {
    return 444;
}
EOF

# Puis inclure ce snippet dans les deux blocs server (80 et 443) juste après server_name :
#   include /etc/nginx/snippets/deny-by-host.conf;

nginx -t && systemctl reload nginx
```

# Conteneur front
docker logs -f garagepneu-frontend
docker restart garagepneu-frontend
docker ps

# Reconstruire manuellement (optionnel)
cd ~/garagepneu-frontend
docker build -t garagepneu-frontend:latest --build-arg BUILD_CONFIGURATION=staging .
docker stop garagepneu-frontend && docker rm garagepneu-frontend || true
docker run -d --name garagepneu-frontend --network garagepneu-network -p 127.0.0.1:3000:80 --restart unless-stopped garagepneu-frontend:latest
```

---

## 🔄 Dév local rapide

```bash
npm run start:staging   # front local sur 4200, API sur le VPS
```

---

## 📞 Support

1) GitHub Actions → logs du workflow  
2) `docker logs -f garagepneu-frontend`  
3) `nginx -t` puis `systemctl reload nginx` si tu modifies la conf  
4) Pour HTTPS : `certbot --nginx -d ton-domaine`

---

*Guide mis à jour le 27 janvier 2026*
