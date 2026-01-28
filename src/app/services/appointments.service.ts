/**
 * @file Appointments Service
 * @description Service pour la gestion des rendez-vous via l'API REST.
 * @module services/appointments
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Appointment, AppointmentRequest, AppointmentResponse, Bay } from '../models';

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Service de gestion des rendez-vous.
 * Fournit les opérations CRUD et la recherche par date/pont.
 *
 * @example
 * const appointments$ = appointmentsService.listByDate('2025-01-24', 'A');
 * const appointment$ = appointmentsService.create({ date: '2025-01-24', time: '09:00', bay: 'A', clientId: 1 });
 */
@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  // ═══════════════════════════════════════════════════════════════════════════
  // Configuration
  // ═══════════════════════════════════════════════════════════════════════════
  private readonly baseUrl = `${environment.apiBase}/api/appointments`;
  private readonly http = inject(HttpClient);

  // ═══════════════════════════════════════════════════════════════════════════
  // Lecture
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Récupère tous les rendez-vous.
   * @returns Observable de la liste complète des rendez-vous
   */
  list(): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(this.baseUrl);
  }

  /**
   * Récupère un rendez-vous par son ID.
   * @param id Identifiant du rendez-vous
   * @returns Observable du rendez-vous
   */
  getById(id: number): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Récupère les rendez-vous d'une date donnée.
   * @param date Date au format YYYY-MM-DD
   * @param bay Pont de travail (optionnel, filtre sur A ou B)
   * @returns Observable de la liste des rendez-vous du jour
   */
  listByDate(date: string, bay?: Bay): Observable<AppointmentResponse[]> {
    let params = new HttpParams().set('date', date);
    if (bay) {
      params = params.set('bay', bay);
    }
    return this.http.get<AppointmentResponse[]>(`${this.baseUrl}/by-day`, { params });
  }

  /**
   * Récupère les rendez-vous d'un client.
   * @param clientId Identifiant du client
   * @returns Observable de la liste des rendez-vous du client
   */
  getByClientId(clientId: number): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${this.baseUrl}/client/${clientId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Écriture
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Crée un nouveau rendez-vous.
   * @param dto Données du rendez-vous à créer
   * @returns Observable du rendez-vous créé
   */
  create(dto: AppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.baseUrl, dto);
  }

  /**
   * Met à jour un rendez-vous existant.
   * @param id Identifiant du rendez-vous
   * @param dto Données mises à jour
   * @returns Observable du rendez-vous modifié
   */
  update(id: number, dto: AppointmentRequest): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.baseUrl}/${id}`, dto);
  }

  /**
   * Supprime un rendez-vous.
   * @param id Identifiant du rendez-vous à supprimer
   * @returns Observable vide
   */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
