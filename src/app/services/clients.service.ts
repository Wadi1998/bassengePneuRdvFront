import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client } from '../models/client.model';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private base = `${environment.apiBase}/api/clients`;

  constructor(private http: HttpClient) {}

  list(): Observable<Client[]> {
    return this.http.get<Client[]>(this.base);
  }

  create(dto: Omit<Client, 'id'>): Observable<Client> {
    return this.http.post<Client>(this.base, dto);
  }

  update(id: Client['id'], dto: Partial<Client>): Observable<Client> {
    return this.http.patch<Client>(`${this.base}/${id}`, dto);
  }

  remove(id: Client['id']): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /**
   * Récupère les clients paginés
   * @param page Numéro de la page (commence à 1)
   * @param pageSize Nombre d'éléments par page
   */
  listPaged(page: number, pageSize: number): Observable<{ items: Client[]; total: number }> {
    const params = { page: page.toString(), pageSize: pageSize.toString() };
    return this.http.get<{ items: Client[]; total: number }>(this.base, { params });
  }

  /**
   * Récupère les clients filtrés et paginés
   * @param query Termes de recherche pour filtrer les clients
   * @param page Numéro de la page (commence à 1)
   * @param pageSize Nombre d'éléments par page
   */
  listFiltered(query: string, page: number, pageSize: number): Observable<{ items: Client[]; total: number }> {
    const params = { query, page: page.toString(), pageSize: pageSize.toString() };
    return this.http.get<{ items: Client[]; total: number }>(`${this.base}/search`, { params });
  }
}
