#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# 🔧 Script d'installation du serveur - Bassenge Pneu Frontend
# ═══════════════════════════════════════════════════════════════════════════════
#
# Ce script configure un serveur VPS pour héberger le frontend Angular
# Il installe Docker et prépare l'environnement
#
# Usage: curl -fsSL https://raw.githubusercontent.com/Wadi1998/bassengePneuRdvFront/main/scripts/setup-server.sh | bash
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions de log
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "🚀 Installation du serveur - Bassenge Pneu Frontend"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Vérification des prérequis
# ─────────────────────────────────────────────────────────────────────────────
log_info "Vérification des prérequis..."

if [ "$EUID" -ne 0 ]; then
    log_error "Ce script doit être exécuté en tant que root"
    echo "Utilisez: sudo bash setup-server.sh"
    exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# Mise à jour du système
# ─────────────────────────────────────────────────────────────────────────────
log_info "Mise à jour du système..."
apt-get update -y
apt-get upgrade -y
log_success "Système mis à jour"

# ─────────────────────────────────────────────────────────────────────────────
# Installation des outils de base
# ─────────────────────────────────────────────────────────────────────────────
log_info "Installation des outils de base..."
apt-get install -y \
    curl \
    wget \
    git \
    htop \
    vim \
    unzip \
    rsync \
    ca-certificates \
    gnupg \
    lsb-release
log_success "Outils de base installés"

# ─────────────────────────────────────────────────────────────────────────────
# Installation de Docker
# ─────────────────────────────────────────────────────────────────────────────
if command -v docker &> /dev/null; then
    log_warning "Docker est déjà installé"
    docker --version
else
    log_info "Installation de Docker..."

    # Ajouter la clé GPG officielle de Docker
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Ajouter le repository Docker
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
        tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Installer Docker
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Démarrer Docker
    systemctl start docker
    systemctl enable docker

    log_success "Docker installé et démarré"
    docker --version
fi

# ─────────────────────────────────────────────────────────────────────────────
# Configuration du pare-feu (UFW)
# ─────────────────────────────────────────────────────────────────────────────
log_info "Configuration du pare-feu..."

if command -v ufw &> /dev/null; then
    # Autoriser SSH
    ufw allow 22/tcp

    # Autoriser le frontend sur le port 3000
    ufw allow 3000/tcp

    # Autoriser HTTP et HTTPS (pour le futur avec nom de domaine)
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Activer le pare-feu
    echo "y" | ufw enable

    log_success "Pare-feu configuré (ports 22, 80, 443, 3000 ouverts)"
else
    log_warning "UFW n'est pas installé, configuration du pare-feu ignorée"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Création des répertoires
# ─────────────────────────────────────────────────────────────────────────────
log_info "Création des répertoires..."
mkdir -p ~/garagepneu-frontend
mkdir -p ~/.ssh
chmod 700 ~/.ssh
log_success "Répertoires créés"

# ─────────────────────────────────────────────────────────────────────────────
# Création du réseau Docker
# ─────────────────────────────────────────────────────────────────────────────
log_info "Création du réseau Docker..."
docker network create garagepneu-network 2>/dev/null || log_warning "Le réseau garagepneu-network existe déjà"
log_success "Réseau Docker configuré"

# ─────────────────────────────────────────────────────────────────────────────
# Configuration SSH sécurisée
# ─────────────────────────────────────────────────────────────────────────────
log_info "Configuration SSH..."

# Désactiver l'authentification par mot de passe (optionnel, à décommenter si souhaité)
# sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
# systemctl restart sshd

log_success "SSH configuré"

# ─────────────────────────────────────────────────────────────────────────────
# Résumé
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "✅ Installation terminée avec succès!"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Générer une clé SSH pour GitHub Actions:"
echo "   ssh-keygen -t ed25519 -C 'github-actions' -f ~/.ssh/github_deploy -N ''"
echo "   cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys"
echo "   cat ~/.ssh/github_deploy"
echo ""
echo "2. Copier la clé privée affichée et l'ajouter dans GitHub Secrets:"
echo "   - VPS_HOST: $(hostname -I | awk '{print $1}')"
echo "   - VPS_USER: root"
echo "   - VPS_SSH_KEY: (la clé privée)"
echo ""
echo "3. Pousser votre code sur GitHub pour déclencher le déploiement"
echo ""
echo "📌 URLs après déploiement:"
echo "   - Frontend: http://$(hostname -I | awk '{print $1}'):3000"
echo "   - Health:   http://$(hostname -I | awk '{print $1}'):3000/health"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
