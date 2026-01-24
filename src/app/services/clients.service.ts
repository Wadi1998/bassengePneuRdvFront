/**
 * @file Clients Service
 * @description Service pour la gestion des clients via l'API REST.
 * @module services/clients
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Client, ClientRequest, ClientResponse, PageResponse } from '../models';

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Service de gestion des clients.
 * Fournit les opérations CRUD et la recherche paginée.
 *
 * @example
 * const clients$ = clientsService.listPaged(1, 20);
 * const client$ = clientsService.getById(123);
 */
@Injectable({ providedIn: 'root' })
export class ClientsService {
  // ═══════════════════════════════════════════════════════════════════════════
  // Configuration
  // ═══════════════════════════════════════════════════════════════════════════
  private readonly baseUrl = `${environment.apiBase}/api/clients`;
  private readonly http = inject(HttpClient);

  // ═══════════════════════════════════════════════════════════════════════════
  // Lecture
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Récupère tous les clients (sans pagination).
   * @returns Observable de la liste complète des clients
   */
  list(): Observable<ClientResponse[]> {
    return this.http.get<ClientResponse[]>(this.baseUrl);
  }

  /**
   * Récupère les clients avec pagination.
   * @param page Numéro de la page (commence à 1)
   * @param pageSize Nombre d'éléments par page
   * @returns Observable de la réponse paginée
   */
  listPaged(page: number, pageSize: number): Observable<PageResponse<ClientResponse>> {
    const params = { page: page.toString(), pageSize: pageSize.toString() };
    return this.http.get<PageResponse<ClientResponse>>(this.baseUrl, { params });
  }

  /**
   * Recherche des clients par nom ou téléphone avec pagination.
   * @param query Terme de recherche
   * @param page Numéro de la page
   * @param pageSize Nombre d'éléments par page
   * @returns Observable de la réponse paginée filtrée
   */
  listFiltered(query: string, page: number, pageSize: number): Observable<PageResponse<ClientResponse>> {
    const params = { query, page: page.toString(), pageSize: pageSize.toString() };
    return this.http.get<PageResponse<ClientResponse>>(`${this.baseUrl}/search`, { params });
  }

  /**
   * Récupère un client par son ID.
   * @param id Identifiant du client
   * @returns Observable du client
   */
  getById(id: number): Observable<ClientResponse> {
    return this.http.get<ClientResponse>(`${this.baseUrl}/${id}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Écriture
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Crée un nouveau client.
   * @param dto Données du client à créer
   * @returns Observable du client créé
   */
  create(dto: ClientRequest): Observable<Client> {
    return this.http.post<Client>(this.baseUrl, dto);
  }

  /**
   * Met à jour un client existant.
   * @param id Identifiant du client
   * @param dto Données mises à jour
   * @returns Observable du client modifié
   */
  update(id: number, dto: ClientRequest): Observable<Client> {
    return this.http.put<Client>(`${this.baseUrl}/${id}`, dto);
  }

  /**
   * Supprime un client.
   * @param id Identifiant du client à supprimer
   * @returns Observable vide
   */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
