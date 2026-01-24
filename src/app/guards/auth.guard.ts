/**
 * @file Auth Guards
 * @description Guards d'authentification basés sur Keycloak.
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { KeycloakService } from '../services/keycloak.service';

/**
 * Guard qui vérifie si l'utilisateur est authentifié.
 * Redirige vers Keycloak login si non connecté.
 */
export const authGuard: CanActivateFn = async () => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);

  // Attend que Keycloak soit initialisé
  if (!keycloakService.isInitialized()) {
    return false;
  }

  if (keycloakService.isAuthenticated()) {
    return true;
  }

  // Redirige vers Keycloak pour la connexion
  await keycloakService.login();
  return false;
};

/**
 * Guard qui vérifie si l'utilisateur a le rôle ADMIN.
 */
export const adminGuard: CanActivateFn = async () => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);

  if (!keycloakService.isAuthenticated()) {
    await keycloakService.login();
    return false;
  }

  if (keycloakService.isAdmin()) {
    return true;
  }

  // Redirige vers dashboard si pas admin
  return router.parseUrl('/dashboard');
};

/**
 * Guard pour la page de login - redirige vers dashboard si déjà connecté.
 */
export const loginPageGuard: CanActivateFn = () => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);

  if (keycloakService.isAuthenticated()) {
    return router.parseUrl('/dashboard');
  }

  return true;
};

/**
 * Guard pour la redirection racine.
 */
export const rootRedirectGuard: CanActivateFn = () => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);

  if (keycloakService.isAuthenticated()) {
    return router.parseUrl('/dashboard');
  }

  return router.parseUrl('/login');
};
