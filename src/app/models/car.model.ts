/**
 * @file Car Model
 * @description Modèles de données pour la gestion des véhicules.
 * @module models/car
 */

// ─────────────────────────────────────────────────────────────────────────────
// Response DTOs (données reçues de l'API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Représente un véhicule tel que retourné par l'API.
 * @interface CarResponse
 */
export interface CarResponse {
  /** Identifiant unique du véhicule */
  id?: number;

  /** Marque du véhicule (ex: Peugeot, Renault) */
  brand: string;

  /** Modèle du véhicule (ex: 208, Clio) */
  model: string;

  /** Année de fabrication (optionnel) */
  year?: number;

  /** Plaque d'immatriculation (optionnel) */
  licensePlate?: string;

  /** ID du client propriétaire */
  clientId?: number;

  /** Nom complet du client (pour affichage) */
  clientFullName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Request DTOs (données envoyées à l'API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Payload pour créer un véhicule.
 * @interface CarRequest
 */
export interface CarRequest {
  /** ID du client propriétaire (requis) */
  clientId: number;

  /** Marque du véhicule (requis) */
  brand: string;

  /** Modèle du véhicule (requis) */
  model: string;

  /** Année de fabrication (optionnel) */
  year?: number;

  /** Plaque d'immatriculation (optionnel) */
  licensePlate?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Type Aliases
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Alias principal pour un véhicule.
 */
export type Car = CarResponse;

/**
 * Alias pour la création de véhicule.
 * @deprecated Utiliser CarRequest à la place
 */
export type CarCreateRequest = CarRequest;

/**
 * Payload pour mettre à jour un véhicule (tous les champs optionnels sauf clientId).
 */
export type CarUpdateRequest = Partial<Omit<CarRequest, 'clientId'>> & {
  clientId?: number;
};
