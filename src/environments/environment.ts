/**
 * Configuration de l'environnement de DÉVELOPPEMENT LOCAL
 * Ce fichier est utilisé par défaut lors de `ng serve` et `ng build`
 */

export const environment = {
  // Mode de l'application
  production: false,
  envName: 'development',

  // Configuration de l'API Backend
  apiBase: 'http://localhost:8080',
  apiTimeout: 30000, // 30 secondes

  // Configuration Keycloak (Authentification)
  keycloak: {
    url: 'http://localhost:8180',
    realm: 'garage-realm',
    clientId: 'garagepneu-front',
    // Options SSO
    silentCheckSsoRedirectUri: '/assets/silent-check-sso.html',
    checkLoginIframe: false,
    enableLogging: true
  },

  // Configuration de l'application
  app: {
    name: 'Bassenge Pneu - RDV',
    version: '1.1.0',
    defaultLanguage: 'fr',
    supportedLanguages: ['fr', 'nl', 'en']
  },

  // Configuration des logs
  logging: {
    level: 'debug', // 'debug' | 'info' | 'warn' | 'error'
    enableConsole: true
  },

  // Configuration des fonctionnalités (Feature Flags)
  features: {
    enableAnalytics: false,
    enableNotifications: true,
    enableMaintenanceMode: false
  }
};
