/**
 * Configuration de l'environnement de PRODUCTION
 * Ce fichier remplace environment.ts lors de `ng build --configuration=production`
 *
 * Déploiement sur Hostinger - Domaine: garagepneu.be
 */

export const environment = {
  // Mode de l'application
  production: true,
  envName: 'production',

  // Configuration de l'API Backend
  apiBase: 'https://api.garagepneu.be',
  apiTimeout: 30000, // 30 secondes

  // Configuration Keycloak (Authentification)
  keycloak: {
    url: 'https://auth.garagepneu.be',
    realm: 'garage-realm',
    clientId: 'garagepneu-front',
    // Options SSO
    silentCheckSsoRedirectUri: '/assets/silent-check-sso.html',
    checkLoginIframe: false,
    enableLogging: false // Désactivé en production
  },

  // Configuration de l'application
  app: {
    name: 'Bassenge Pneu - RDV',
    version: '1.0.0',
    defaultLanguage: 'fr',
    supportedLanguages: ['fr', 'nl', 'en']
  },

  // Configuration des logs
  logging: {
    level: 'error', // Seulement les erreurs en production
    enableConsole: false // Désactivé en production pour la performance
  },

  // Configuration des fonctionnalités (Feature Flags)
  features: {
    enableAnalytics: true, // Activé en production
    enableNotifications: true,
    enableMaintenanceMode: false
  }
};
