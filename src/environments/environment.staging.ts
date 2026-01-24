/**
 * Configuration de l'environnement de STAGING (Pré-production)
 * Ce fichier remplace environment.ts lors de `ng build --configuration=staging`
 *
 * Utilisé pour les tests avant la mise en production
 */

export const environment = {
  // Mode de l'application
  production: true, // Comportement production mais avec logs
  envName: 'staging',

  // Configuration de l'API Backend (Staging)
  apiBase: 'https://staging-api.garagepneu.be',
  apiTimeout: 30000, // 30 secondes

  // Configuration Keycloak (Authentification Staging)
  keycloak: {
    url: 'https://staging-auth.garagepneu.be',
    realm: 'garage-realm',
    clientId: 'garagepneu-front',
    // Options SSO
    silentCheckSsoRedirectUri: '/assets/silent-check-sso.html',
    checkLoginIframe: false,
    enableLogging: true // Activé pour le debugging en staging
  },

  // Configuration de l'application
  app: {
    name: 'Bassenge Pneu - RDV [STAGING]',
    version: '1.0.0-staging',
    defaultLanguage: 'fr',
    supportedLanguages: ['fr', 'nl', 'en']
  },

  // Configuration des logs
  logging: {
    level: 'info', // Plus de logs qu'en production
    enableConsole: true // Activé pour le debugging
  },

  // Configuration des fonctionnalités (Feature Flags)
  features: {
    enableAnalytics: false, // Désactivé en staging pour ne pas polluer les données
    enableNotifications: true,
    enableMaintenanceMode: false
  }
};
