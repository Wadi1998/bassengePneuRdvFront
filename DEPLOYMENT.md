# 🚀 Guide de Déploiement - Bassenge Pneu RDV

## 📋 Table des matières
- [Environnements](#environnements)
- [Scripts disponibles](#scripts-disponibles)
- [Déploiement sur Hostinger](#déploiement-sur-hostinger)
- [Configuration DNS](#configuration-dns)
- [SSL/HTTPS](#sslhttps)
- [Checklist avant déploiement](#checklist-avant-déploiement)

---

## 🌍 Environnements

| Environnement | Fichier de config | URL Frontend | URL API | URL Keycloak |
|--------------|-------------------|--------------|---------|--------------|
| **Development** | `environment.ts` | http://localhost:4200 | http://localhost:8080 | http://localhost:8180 |
| **Staging** | `environment.staging.ts` | https://staging.garagepneu.be | https://staging-api.garagepneu.be | https://staging-auth.garagepneu.be |
| **Production** | `environment.prod.ts` | https://garagepneu.be | https://api.garagepneu.be | https://auth.garagepneu.be |

---

## 📜 Scripts disponibles

```bash
# Développement local
npm start                 # Démarrer en mode développement (localhost:4200)
npm run start:staging     # Démarrer avec config staging
npm run start:prod        # Démarrer avec config production

# Build
npm run build:dev         # Build de développement
npm run build:staging     # Build de staging (pré-production)
npm run build:prod        # Build de production optimisé

# Tests et qualité
npm run test              # Tests unitaires
npm run test:ci           # Tests CI avec coverage
npm run lint              # Vérifier le code
npm run lint:fix          # Corriger automatiquement le code

# Déploiement
npm run deploy:prod       # Build production + instructions
npm run deploy:staging    # Build staging

# Utilitaires
npm run clean             # Nettoyer les builds
npm run build:analyze     # Analyser la taille du bundle
```

---

## 🌐 Déploiement sur Hostinger

### Étape 1: Build de production

```bash
# Depuis la racine du projet
npm run build:prod
```

Le build sera généré dans: `dist/garage-pneu/browser/`

### Étape 2: Upload sur Hostinger

1. **Connectez-vous** à votre compte Hostinger
2. **Accédez** au File Manager de votre hébergement
3. **Naviguez** vers le dossier `public_html` (ou le dossier racine de votre domaine)
4. **Supprimez** tout le contenu existant (sauf les fichiers système comme `.htaccess` si présents)
5. **Uploadez** tout le contenu du dossier `dist/garage-pneu/browser/`:
   - `index.html`
   - `.htaccess` (IMPORTANT pour le routage Angular!)
   - Dossier `assets/`
   - Fichiers JavaScript (`*.js`)
   - Fichiers CSS

### Étape 3: Vérification

1. Accédez à votre site via `https://garagepneu.be`
2. Vérifiez que le routage fonctionne (naviguez vers `/login`, `/dashboard`, etc.)
3. Vérifiez les erreurs dans la console du navigateur (F12)

---

## 🔧 Configuration DNS (Hostinger)

### Sous-domaines recommandés

| Sous-domaine | Type | Destination | Usage |
|--------------|------|-------------|-------|
| `garagepneu.be` | A | IP Hostinger | Frontend Angular |
| `api.garagepneu.be` | A/CNAME | Serveur API | Backend Spring Boot |
| `auth.garagepneu.be` | A/CNAME | Serveur Keycloak | Authentification |

### Configuration dans Hostinger DNS Zone

1. Allez dans **Domaines** → **garagepneu.be** → **DNS / Nameservers**
2. Ajoutez les enregistrements A ou CNAME selon votre configuration serveur

---

## 🔒 SSL/HTTPS

### Option 1: SSL Gratuit Hostinger (Let's Encrypt)

1. Dans le **hPanel Hostinger**, allez dans **SSL**
2. Activez le **SSL gratuit** pour votre domaine
3. Attendez quelques minutes pour la propagation
4. **Décommentez** la section HTTPS dans le fichier `.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

### Option 2: Forcer HTTPS via Hostinger

1. Dans le hPanel, activez **Force HTTPS** dans les paramètres SSL

---

## ✅ Checklist avant déploiement

### Vérifications techniques

- [ ] `npm run lint` passe sans erreurs
- [ ] `npm run test` passe sans erreurs
- [ ] `npm run build:prod` se termine sans erreurs
- [ ] Tester le build localement: `npx serve dist/garage-pneu/browser`

### Configuration production

- [ ] Vérifier `environment.prod.ts`:
  - [ ] `apiBase` pointe vers l'URL de production correcte
  - [ ] `keycloak.url` pointe vers Keycloak de production
  - [ ] `production: true`
  - [ ] `logging.enableConsole: false`

### Après déploiement

- [ ] Le site se charge correctement sur `https://garagepneu.be`
- [ ] Le routage Angular fonctionne (navigation entre pages)
- [ ] La connexion Keycloak fonctionne
- [ ] Les appels API fonctionnent
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] HTTPS fonctionne et redirige HTTP → HTTPS

---

## 🐛 Dépannage

### Erreur 404 sur les routes Angular

**Problème**: Les routes comme `/dashboard` retournent une erreur 404.

**Solution**: Vérifiez que le fichier `.htaccess` est bien présent à la racine du site.

### Erreurs CORS

**Problème**: `Access-Control-Allow-Origin` errors dans la console.

**Solution**: Configurez CORS sur votre backend Spring Boot pour autoriser `https://garagepneu.be`.

### Keycloak ne redirige pas correctement

**Problème**: Après connexion, l'utilisateur n'est pas redirigé.

**Solution**: 
1. Vérifiez les **Web Origins** dans la configuration client Keycloak
2. Ajoutez `https://garagepneu.be` aux URLs autorisées

### Le build est trop gros

**Solution**: Analysez le bundle avec:
```bash
npm run build:analyze
```

---

## 📞 Support

Pour toute question concernant le déploiement:
- Documentation Angular: https://angular.io/guide/deployment
- Support Hostinger: https://www.hostinger.com/support

---

*Dernière mise à jour: Janvier 2026*
