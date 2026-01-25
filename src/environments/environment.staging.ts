/**
 * Configuration de l'environnement de STAGING / VPS HOSTINGER
 * Ce fichier remplace environment.ts lors de `ng build --configuration=staging`
 *
 * Déploiement sur VPS Hostinger - IP: 72.62.182.169
 */

export const environment = {
  // Mode de l'application
  production: true,
  envName: 'staging',

  // Configuration de l'API Backend (sur le même serveur VPS)
  apiBase: 'http://72.62.182.169:8080',
  apiTimeout: 30000, // 30 secondes

  // Configuration Keycloak (Authentification)
  keycloak: {
    url: 'http://72.62.182.169:8180',
    realm: 'garage-realm',
    clientId: 'garagepneu-front',
    // Options SSO
    silentCheckSsoRedirectUri: '/assets/silent-check-sso.html',
    checkLoginIframe: false,
    enableLogging: true // Activé pour le staging pour le debug
  },

  // Configuration de l'application
  app: {
    name: 'Bassenge Pneu - RDV (Staging)',
    version: '1.0.0',
    defaultLanguage: 'fr',
    supportedLanguages: ['fr', 'nl', 'en']
  },

  // Configuration des logs
  logging: {
    level: 'debug', // Debug en staging pour diagnostiquer les problèmes
    enableConsole: true
  },

  // Configuration des fonctionnalités (Feature Flags)
  features: {
    enableAnalytics: false, // Désactivé en staging
    enableNotifications: true,
    enableMaintenanceMode: false
  }
};
