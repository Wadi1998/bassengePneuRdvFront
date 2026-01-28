/**
 * @file Appointment Model
 * @description Modèles de données pour la gestion des rendez-vous du garage.
 * @module models/appointment
 */

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Identifiants des ponts de travail disponibles.
 * @constant
 */
export const BAY_VALUES = ['A', 'B'] as const;

/**
 * Type représentant un pont de travail.
 */
export type Bay = (typeof BAY_VALUES)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Response DTOs (données reçues de l'API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Représente un rendez-vous tel que retourné par l'API.
 * @interface AppointmentResponse
 */
export interface AppointmentResponse {
  /** Identifiant unique du rendez-vous */
  id?: number;

  /** Date du rendez-vous au format YYYY-MM-DD */
  date: string;

  /** Heure de début au format HH:mm */
  time: string;

  /** Durée en minutes */
  duration?: number;

  /** Pont de travail (A ou B) */
  bay: string;

  /** ID du client */
  clientId?: number;

  /** Nom du client (pour affichage) */
  clientName?: string;

  /** ID du véhicule */
  carId?: number;

  /** Description de la voiture (pour affichage) */
  carDescription?: string;

  /** Type de service (ex: "Changement pneus") */
  serviceType?: string;

  /** Notes additionnelles sur le service */
  serviceNote?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Request DTOs (données envoyées à l'API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Payload pour créer ou mettre à jour un rendez-vous.
 * @interface AppointmentRequest
 */
export interface AppointmentRequest {
  /** Date du rendez-vous au format YYYY-MM-DD (requis) */
  date: string;

  /** Heure de début au format HH:mm (requis) */
  time: string;

  /** Durée en minutes (minimum 15) */
  duration?: number;

  /** Pont de travail A ou B (requis) */
  bay: string;

  /** ID du client (requis) */
  clientId: number;

  /** ID du véhicule (optionnel) */
  carId?: number;

  /** Type de service (optionnel) */
  serviceType?: string;

  /** Notes additionnelles (optionnel) */
  serviceNote?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Type Aliases
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Alias principal pour un rendez-vous.
 */
export type Appointment = AppointmentResponse;
