/**
 * Interface TypeScript pour typer la configuration d'environnement
 * Assure la cohérence entre tous les fichiers environment.*.ts
 */

export interface EnvironmentConfig {
  // Mode de l'application
  production: boolean;
  envName: 'development' | 'staging' | 'production';

  // Configuration de l'API Backend
  apiBase: string;
  apiTimeout: number;

  // Configuration Keycloak
  keycloak: KeycloakConfig;

  // Configuration de l'application
  app: AppConfig;

  // Configuration des logs
  logging: LoggingConfig;

  // Configuration des fonctionnalités
  features: FeaturesConfig;
}

export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
  silentCheckSsoRedirectUri: string;
  checkLoginIframe: boolean;
  enableLogging: boolean;
}

export interface AppConfig {
  name: string;
  version: string;
  defaultLanguage: string;
  supportedLanguages: string[];
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
}

export interface FeaturesConfig {
  enableAnalytics: boolean;
  enableNotifications: boolean;
  enableMaintenanceMode: boolean;
}
