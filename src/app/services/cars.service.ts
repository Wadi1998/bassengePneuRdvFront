/**
 * @file Cars Service
 * @description Service pour la gestion des véhicules via l'API REST.
 * @module services/cars
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Car, CarRequest, CarResponse } from '../models';

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Service de gestion des véhicules.
 * Fournit les opérations CRUD pour les voitures des clients.
 *
 * @example
 * const cars$ = carsService.getByClientId(123);
 * const car$ = carsService.create({ clientId: 1, brand: 'Peugeot', model: '208' });
 */
@Injectable({ providedIn: 'root' })
export class CarsService {
  // ═══════════════════════════════════════════════════════════════════════════
  // Configuration
  // ═══════════════════════════════════════════════════════════════════════════
  private readonly baseUrl = `${environment.apiBase}/api/cars`;
  private readonly http = inject(HttpClient);

  // ═══════════════════════════════════════════════════════════════════════════
  // Lecture
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Récupère toutes les voitures.
   * @returns Observable de la liste complète des voitures
   */
  list(): Observable<CarResponse[]> {
    return this.http.get<CarResponse[]>(this.baseUrl);
  }

  /**
   * Récupère une voiture par son ID.
   * @param id Identifiant de la voiture
   * @returns Observable de la voiture
   */
  getById(id: number): Observable<CarResponse> {
    return this.http.get<CarResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Récupère les voitures d'un client.
   * @param clientId Identifiant du client propriétaire
   * @returns Observable de la liste des voitures du client
   */
  getByClientId(clientId: number): Observable<CarResponse[]> {
    return this.http.get<CarResponse[]>(`${this.baseUrl}/client/${clientId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Écriture
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Crée une nouvelle voiture.
   * @param dto Données de la voiture à créer
   * @returns Observable de la voiture créée
   */
  create(dto: CarRequest): Observable<Car> {
    return this.http.post<Car>(this.baseUrl, dto);
  }

  /**
   * Met à jour une voiture existante.
   * @param id Identifiant de la voiture
   * @param dto Données mises à jour
   * @returns Observable de la voiture modifiée
   */
  update(id: number, dto: CarRequest): Observable<Car> {
    return this.http.put<Car>(`${this.baseUrl}/${id}`, dto);
  }

  /**
   * Supprime une voiture.
   * @param id Identifiant de la voiture à supprimer
   * @returns Observable vide
   */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
