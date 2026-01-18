import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client, ClientRequest, ClientResponse } from '../models/client.model';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

// Interface pour la réponse paginée
interface PageResponseClientResponse {
  items: ClientResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private base = `${environment.apiBase}/api/clients`;
  private http = inject(HttpClient);

  list(): Observable<ClientResponse[]> {
    return this.http.get<ClientResponse[]>(this.base);
  }

  getById(id: number): Observable<ClientResponse> {
    return this.http.get<ClientResponse>(`${this.base}/${id}`);
  }

  create(dto: ClientRequest): Observable<ClientResponse> {
    return this.http.post<ClientResponse>(this.base, dto);
  }

  update(id: number, dto: ClientRequest): Observable<ClientResponse> {
    return this.http.put<ClientResponse>(`${this.base}/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /**
   * Récupère les clients paginés
   * @param page Numéro de la page (commence à 1)
   * @param pageSize Nombre d'éléments par page
   */
  listPaged(page: number, pageSize: number): Observable<PageResponseClientResponse> {
    const params = { page: page.toString(), pageSize: pageSize.toString() };
    return this.http.get<PageResponseClientResponse>(this.base, { params });
  }

  /**
   * Recherche des clients par nom ou téléphone
   * @param query Termes de recherche pour filtrer les clients
   * @param page Numéro de la page (commence à 1)
   * @param pageSize Nombre d'éléments par page
   */
  listFiltered(query: string, page: number, pageSize: number): Observable<PageResponseClientResponse> {
    const params = { query, page: page.toString(), pageSize: pageSize.toString() };
    return this.http.get<PageResponseClientResponse>(`${this.base}/search`, { params });
  }
}
