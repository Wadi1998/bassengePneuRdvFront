# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 Dockerfile - Bassenge Pneu Frontend
# ═══════════════════════════════════════════════════════════════════════════════
# Multi-stage build pour optimiser la taille de l'image finale
# Stage 1: Build Angular
# Stage 2: Serve avec Nginx
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 1: Build de l'application Angular
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --legacy-peer-deps

# Copier le code source
COPY . .

# Argument pour choisir l'environnement de build
ARG BUILD_CONFIGURATION=staging

# Build de l'application Angular
RUN npm run build:${BUILD_CONFIGURATION}

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 2: Servir avec Nginx
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:alpine AS production

# Supprimer la configuration par défaut de nginx
RUN rm -rf /usr/share/nginx/html/*
RUN rm /etc/nginx/conf.d/default.conf

# Copier la configuration nginx personnalisée
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le stage précédent
COPY --from=builder /app/dist/garage-pneu/browser /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]
