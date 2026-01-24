/**
 * @file Keycloak Service
 * @description Service d'authentification Keycloak pour Angular.
 */

import { Injectable, signal, computed } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../environments/environment';

export interface UserProfile {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private keycloak!: Keycloak;
  private initPromise: Promise<boolean> | null = null;

  // Signals pour la réactivité
  private readonly _isAuthenticated = signal(false);
  private readonly _userProfile = signal<UserProfile | null>(null);
  private readonly _isInitialized = signal(false);
  private readonly _initError = signal<string | null>(null);

  // Computed accessibles publiquement
  readonly isAuthenticated = computed(() => this._isAuthenticated());
  readonly userProfile = computed(() => this._userProfile());
  readonly isInitialized = computed(() => this._isInitialized());
  readonly initError = computed(() => this._initError());

  constructor() {
    this.createKeycloakInstance();
  }

  /**
   * Crée l'instance Keycloak
   */
  private createKeycloakInstance(): void {
    try {
      this.keycloak = new Keycloak({
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId
      });
      console.log('Keycloak instance créée avec:', {
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId
      });
    } catch (error) {
      console.error('Erreur création instance Keycloak:', error);
      this._initError.set('Erreur création instance Keycloak');
    }
  }

  /**
   * Initialise Keycloak - à appeler au démarrage de l'application
   */
  async init(): Promise<boolean> {
    // Si déjà en cours d'initialisation, retourner la promesse existante
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<boolean> {
    try {
      console.log('Initialisation Keycloak...');

      const authenticated = await this.keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        enableLogging: true
      });

      console.log('Keycloak initialisé, authentifié:', authenticated);

      this._isAuthenticated.set(authenticated);
      this._isInitialized.set(true);

      if (authenticated) {
        await this.loadUserProfile();
      }

      // Auto-refresh du token
      this.setupTokenRefresh();

      return authenticated;
    } catch (error: any) {
      console.error('Erreur initialisation Keycloak:', error);
      this._initError.set(error?.message || 'Erreur de connexion au serveur Keycloak');
      this._isInitialized.set(true); // Marquer comme initialisé même en cas d'erreur
      return false;
    }
  }

  /**
   * Redirige vers la page de connexion Keycloak
   */
  async login(): Promise<void> {
    // Attendre que Keycloak soit initialisé
    if (!this._isInitialized()) {
      console.log('Attente initialisation Keycloak...');
      await this.init();
    }

    // Vérifier si keycloak est prêt
    if (!this.keycloak) {
      console.error('Instance Keycloak non disponible');
      alert('Erreur: Impossible de se connecter au serveur d\'authentification. Vérifiez que Keycloak est démarré sur ' + environment.keycloak.url);
      return;
    }

    try {
      console.log('Redirection vers Keycloak login...');
      await this.keycloak.login({
        redirectUri: window.location.origin + '/dashboard'
      });
    } catch (error) {
      console.error('Erreur lors du login:', error);
      alert('Erreur: Impossible de se connecter. Vérifiez que Keycloak est accessible sur ' + environment.keycloak.url);
    }
  }

  /**
   * Déconnexion et redirection vers la page de login
   */
  async logout(): Promise<void> {
    this._isAuthenticated.set(false);
    this._userProfile.set(null);

    if (this.keycloak) {
      await this.keycloak.logout({
        redirectUri: window.location.origin + '/login'
      });
    }
  }

  /**
   * Récupère le token d'accès (pour les requêtes API)
   */
  async getToken(): Promise<string | undefined> {
    if (!this.keycloak || !this._isAuthenticated()) {
      return undefined;
    }

    try {
      // Rafraîchit le token s'il expire dans moins de 30 secondes
      await this.keycloak.updateToken(30);
      return this.keycloak.token;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      await this.login();
      return undefined;
    }
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(role: string): boolean {
    if (!this.keycloak) return false;
    return this.keycloak.hasRealmRole(role);
  }

  /**
   * Vérifie si l'utilisateur est admin
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Vérifie si l'utilisateur est un utilisateur standard
   */
  isUser(): boolean {
    return this.hasRole('USER');
  }

  /**
   * Charge le profil utilisateur depuis Keycloak
   */
  private async loadUserProfile(): Promise<void> {
    if (!this.keycloak) return;

    try {
      const profile = await this.keycloak.loadUserProfile();
      const roles = this.keycloak.realmAccess?.roles || [];

      this._userProfile.set({
        username: profile.username || '',
        email: profile.email || '',
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        roles: roles.filter(r => r === 'ADMIN' || r === 'USER')
      });
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    }
  }

  /**
   * Configure le rafraîchissement automatique du token
   */
  private setupTokenRefresh(): void {
    if (!this.keycloak) return;

    // Rafraîchit le token toutes les minutes
    setInterval(async () => {
      if (this._isAuthenticated() && this.keycloak) {
        try {
          const refreshed = await this.keycloak.updateToken(60);
          if (refreshed) {
            console.log('Token rafraîchi');
          }
        } catch (error) {
          console.error('Erreur rafraîchissement token:', error);
          this._isAuthenticated.set(false);
        }
      }
    }, 60000);
  }
}
