#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 SCRIPT D'INSTALLATION AUTOMATIQUE - FRONTEND BASSENGE PNEU
# ═══════════════════════════════════════════════════════════════════════════════
#
# Ce script installe TOUT automatiquement pour le frontend
#
# UTILISATION:
#   Sur votre VPS, lancez:
#   curl -fsSL https://raw.githubusercontent.com/Wadi1998/bassengePneuRdvFront/main/scripts/setup-frontend.sh | bash
#
#   OU copiez ce fichier sur le serveur et lancez:
#   bash setup-frontend.sh
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Arrêter en cas d'erreur

# ─────────────────────────────────────────────────────────────────────────────
# 🎨 COULEURS
# ─────────────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ─────────────────────────────────────────────────────────────────────────────
# 📝 CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────
DOMAIN="bassenge-pneus.com"
REPO_URL="https://github.com/Wadi1998/bassengePneuRdvFront.git"
APP_DIR="/opt/bassenge-frontend"
DOCKER_NETWORK="garagepneu-network"

# ─────────────────────────────────────────────────────────────────────────────
# 🔧 FONCTIONS UTILES
# ─────────────────────────────────────────────────────────────────────────────
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_section() {
    echo -e "\n${MAGENTA}═══════════════════════════════════════════════════════${NC}"
    echo -e "${MAGENTA}  $1${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════${NC}\n"
}

print_step() {
    echo -e "\n${BLUE}[ÉTAPE $1] $2${NC}\n"
}

# ─────────────────────────────────────────────────────────────────────────────
# 🎬 BANNIÈRE
# ─────────────────────────────────────────────────────────────────────────────
clear
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   🚗  INSTALLATION AUTOMATIQUE - FRONTEND BASSENGE PNEU         ║
║                                                                  ║
║   📦 Angular + Docker + Nginx                                   ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

print_info "Domain: $DOMAIN"
print_info "Repository: $REPO_URL"
print_info "Installation: $APP_DIR"
echo ""

# Demander confirmation
read -p "$(echo -e ${YELLOW}Voulez-vous continuer l'installation ? [Y/n] ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]] && [[ ! -z $REPLY ]]; then
    print_error "Installation annulée."
    exit 1
fi

# ═════════════════════════════════════════════════════════════════════════════
# ÉTAPE 1: VÉRIFICATION DES PRÉREQUIS
# ═════════════════════════════════════════════════════════════════════════════
print_step "1/6" "Vérification des prérequis"

# Vérifier que le script est lancé en root
if [[ $EUID -ne 0 ]]; then
   print_error "Ce script doit être lancé en tant que root"
   print_info "Lancez: sudo bash $(basename $0)"
   exit 1
fi
print_success "Script lancé en root"

# Vérifier la connexion internet
if ping -c 1 google.com &> /dev/null; then
    print_success "Connexion internet OK"
else
    print_error "Pas de connexion internet"
    exit 1
fi

# Vérifier Git
if ! command -v git &> /dev/null; then
    print_info "Installation de Git..."
    apt update -qq
    apt install -y git
fi
print_success "Git installé: $(git --version)"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    print_warning "Docker n'est pas installé"
    print_info "Installation de Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi
print_success "Docker installé: $(docker --version)"

# Vérifier Docker Compose
if ! docker compose version &> /dev/null; then
    print_error "Docker Compose n'est pas disponible"
    exit 1
fi
print_success "Docker Compose installé: $(docker compose version --short)"

# ═════════════════════════════════════════════════════════════════════════════
# ÉTAPE 2: CRÉATION DU RÉSEAU DOCKER
# ═════════════════════════════════════════════════════════════════════════════
print_step "2/6" "Configuration du réseau Docker"

if docker network inspect $DOCKER_NETWORK &> /dev/null; then
    print_success "Réseau Docker '$DOCKER_NETWORK' existe déjà"
else
    print_info "Création du réseau Docker..."
    docker network create $DOCKER_NETWORK
    print_success "Réseau Docker '$DOCKER_NETWORK' créé"
fi

# ═════════════════════════════════════════════════════════════════════════════
# ÉTAPE 3: CONFIGURATION SSH POUR GITHUB ACTIONS
# ═════════════════════════════════════════════════════════════════════════════
print_step "3/6" "Configuration SSH pour GitHub Actions"

SSH_KEY_PATH="$HOME/.ssh/github_deploy_frontend"

if [ -f "$SSH_KEY_PATH" ]; then
    print_success "Clé SSH existe déjà"
else
    print_info "Génération de la clé SSH..."
    ssh-keygen -t ed25519 -C "github-actions-frontend" -f "$SSH_KEY_PATH" -N "" -q
    print_success "Clé SSH générée"
fi

# Ajouter la clé publique aux authorized_keys
if grep -q "$(cat ${SSH_KEY_PATH}.pub)" "$HOME/.ssh/authorized_keys" 2>/dev/null; then
    print_success "Clé publique déjà dans authorized_keys"
else
    print_info "Ajout de la clé publique..."
    cat "${SSH_KEY_PATH}.pub" >> "$HOME/.ssh/authorized_keys"
    chmod 600 "$HOME/.ssh/authorized_keys"
    chmod 700 "$HOME/.ssh"
    print_success "Clé publique ajoutée"
fi

# Tester la clé
if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no root@localhost "exit" 2>/dev/null; then
    print_success "Clé SSH testée et fonctionnelle"
else
    print_warning "Test SSH échoué (peut nécessiter une configuration manuelle)"
fi

# ═════════════════════════════════════════════════════════════════════════════
# ÉTAPE 4: CLONAGE DU REPOSITORY
# ═════════════════════════════════════════════════════════════════════════════
print_step "4/6" "Récupération du code source"

# Créer le répertoire parent si nécessaire
mkdir -p "$(dirname $APP_DIR)"

if [ -d "$APP_DIR/.git" ]; then
    print_info "Repository existe, mise à jour..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/main 2>/dev/null || git reset --hard origin/master
    print_success "Code mis à jour"
else
    print_info "Clonage du repository..."
    if [ -d "$APP_DIR" ]; then
        rm -rf "$APP_DIR"
    fi
    git clone "$REPO_URL" "$APP_DIR"
    print_success "Repository cloné"
fi

cd "$APP_DIR"

# ═════════════════════════════════════════════════════════════════════════════
# ÉTAPE 5: DÉPLOIEMENT DU CONTENEUR
# ═════════════════════════════════════════════════════════════════════════════
print_step "5/6" "Déploiement du conteneur frontend"

# Arrêter l'ancien conteneur si existant
if docker ps -a | grep -q garagepneu-frontend; then
    print_info "Arrêt de l'ancien conteneur..."
    docker compose -f docker-compose.prod.yml down 2>/dev/null || true
fi

# Construire et démarrer
print_info "Construction de l'image Docker (peut prendre 5-10 minutes)..."
docker compose -f docker-compose.prod.yml up -d --build

# Attendre que le conteneur démarre
print_info "Attente du démarrage du conteneur..."
sleep 10

# Vérifier que le conteneur tourne
if docker ps | grep -q garagepneu-frontend; then
    print_success "Conteneur frontend démarré"
else
    print_error "Le conteneur n'a pas démarré correctement"
    print_info "Logs du conteneur:"
    docker logs garagepneu-frontend 2>&1 | tail -20
    exit 1
fi

# Tester que le frontend répond
print_info "Test du frontend..."
sleep 5
if curl -s http://localhost:3000 > /dev/null; then
    print_success "Frontend accessible sur le port 3000"
else
    print_warning "Frontend ne répond pas encore (peut nécessiter plus de temps)"
fi

# ═════════════════════════════════════════════════════════════════════════════
# ÉTAPE 6: CONFIGURATION NGINX
# ═════════════════════════════════════════════════════════════════════════════
print_step "6/6" "Configuration Nginx"

NGINX_CONF="/etc/nginx/sites-available/garagepneu.conf"

# Vérifier si Nginx est installé
if ! command -v nginx &> /dev/null; then
    print_warning "Nginx n'est pas installé"
    print_info "Pour configurer Nginx, suivez le guide DEPLOYMENT.md"
else
    print_success "Nginx est installé"

    # Vérifier si le fichier de config existe
    if [ -f "$NGINX_CONF" ]; then
        print_info "Configuration Nginx existe déjà"
        print_warning "Pour mettre à jour Nginx avec le frontend:"
        echo -e "${YELLOW}  1. Éditez: nano $NGINX_CONF${NC}"
        echo -e "${YELLOW}  2. Ajoutez la section 'location /' pour le frontend${NC}"
        echo -e "${YELLOW}  3. Testez: nginx -t${NC}"
        echo -e "${YELLOW}  4. Rechargez: systemctl reload nginx${NC}"
        echo ""
        echo -e "${CYAN}Voir DEPLOYMENT.md - ÉTAPE 5 pour la configuration complète${NC}"
    else
        print_warning "Configuration Nginx non trouvée"
        print_info "Créez la configuration Nginx selon le guide DEPLOYMENT.md"
    fi
fi

# ═════════════════════════════════════════════════════════════════════════════
# 🎉 RÉSULTAT FINAL
# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ INSTALLATION FRONTEND TERMINÉE ! 🎉${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""

print_section "📊 RÉSUMÉ DE L'INSTALLATION"

echo -e "${CYAN}✓ Docker:${NC}            Installé et fonctionnel"
echo -e "${CYAN}✓ Réseau Docker:${NC}     $DOCKER_NETWORK"
echo -e "${CYAN}✓ Clé SSH:${NC}           $SSH_KEY_PATH"
echo -e "${CYAN}✓ Repository:${NC}        Cloné dans $APP_DIR"
echo -e "${CYAN}✓ Conteneur:${NC}         garagepneu-frontend (port 3000)"

print_section "🔑 CLÉ SSH POUR GITHUB ACTIONS"

echo -e "${YELLOW}COPIEZ CETTE CLÉ COMPLÈTE pour GitHub Secrets:${NC}"
echo ""
echo -e "${MAGENTA}────────────────────────────────────────────────────────────${NC}"
cat "$SSH_KEY_PATH"
echo -e "${MAGENTA}────────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "${CYAN}1. Allez sur: ${NC}https://github.com/Wadi1998/bassengePneuRdvFront/settings/secrets/actions"
echo -e "${CYAN}2. Créez un secret nommé: ${NC}VPS_SSH_KEY"
echo -e "${CYAN}3. Collez la clé ci-dessus (du BEGIN au END)${NC}"
echo ""

print_section "📝 PROCHAINES ÉTAPES"

echo -e "${CYAN}1.${NC} Ajoutez les GitHub Secrets:"
echo -e "   ${YELLOW}VPS_HOST${NC}       = 72.62.182.169"
echo -e "   ${YELLOW}VPS_USER${NC}       = root"
echo -e "   ${YELLOW}VPS_SSH_KEY${NC}    = (la clé ci-dessus)"
echo ""
echo -e "${CYAN}2.${NC} Configurez Nginx pour servir le frontend"
echo -e "   ${YELLOW}Voir:${NC} DEPLOYMENT.md - ÉTAPE 5"
echo ""
echo -e "${CYAN}3.${NC} Poussez votre code sur GitHub:"
echo -e "   ${YELLOW}git push origin main${NC}"
echo ""
echo -e "${CYAN}4.${NC} Le déploiement se fera automatiquement ! 🚀"
echo ""

print_section "🔍 COMMANDES UTILES"

echo -e "${YELLOW}# Voir les logs${NC}"
echo "docker logs -f garagepneu-frontend"
echo ""
echo -e "${YELLOW}# Redémarrer le conteneur${NC}"
echo "cd $APP_DIR && docker compose -f docker-compose.prod.yml restart"
echo ""
echo -e "${YELLOW}# Reconstruire${NC}"
echo "cd $APP_DIR && docker compose -f docker-compose.prod.yml up -d --build"
echo ""
echo -e "${YELLOW}# Voir le statut${NC}"
echo "docker ps | grep garagepneu-frontend"
echo ""

print_success "Installation terminée avec succès !"
echo ""
