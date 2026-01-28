/**
 * @file Auth Service
 * @description Service d'authentification - wrapper autour de KeycloakService.
 * @deprecated Utiliser directement KeycloakService pour les nouvelles fonctionnalités.
 */

import { Injectable, inject } from '@angular/core';
import { KeycloakService } from './keycloak.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly keycloakService = inject(KeycloakService);

  /**
   * Vérifie si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    return this.keycloakService.isAuthenticated();
  }

  /**
   * Déconnecte l'utilisateur
   */
  async logout(): Promise<void> {
    await this.keycloakService.logout();
  }

  /**
   * Connecte l'utilisateur via Keycloak
   */
  async login(): Promise<void> {
    await this.keycloakService.login();
  }

  /**
   * Récupère le token d'accès
   */
  async getToken(): Promise<string | undefined> {
    return this.keycloakService.getToken();
  }

  /**
   * Vérifie si l'utilisateur est admin
   */
  isAdmin(): boolean {
    return this.keycloakService.isAdmin();
  }

  /**
   * Récupère le profil utilisateur
   */
  getUserProfile() {
    return this.keycloakService.userProfile();
  }
}
