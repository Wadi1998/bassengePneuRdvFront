/**
 * @file Client Model
 * @description Modèles de données pour la gestion des clients du garage.
 * @module models/client
 */

import { Car } from './car.model';

// ─────────────────────────────────────────────────────────────────────────────
// Response DTOs (données reçues de l'API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Représente un client tel que retourné par l'API.
 * @interface ClientResponse
 */
export interface ClientResponse {
  /** Identifiant unique du client */
  id: number;

  /** Prénom du client */
  firstName: string;

  /** Nom de famille du client */
  name: string;

  /** Numéro de téléphone au format E.164 (ex: +32470123456) */
  phone: string;

  /** Liste des voitures associées au client (optionnel) */
  cars?: Car[];

  /** Nom complet du client (calculé par le backend) */
  fullName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Request DTOs (données envoyées à l'API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Payload pour créer ou mettre à jour un client.
 * @interface ClientRequest
 */
export interface ClientRequest {
  /** Prénom du client (requis, 2-100 caractères) */
  firstName: string;

  /** Nom de famille du client (requis, 2-100 caractères) */
  name: string;

  /** Numéro de téléphone (requis, max 20 caractères) */
  phone: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Type Aliases
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Alias principal pour un client.
 * Utilisé dans toute l'application pour une meilleure lisibilité.
 */
export type Client = ClientResponse;
