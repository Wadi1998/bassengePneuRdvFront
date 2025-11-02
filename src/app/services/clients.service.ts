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

  remove(id: Client['id']): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
