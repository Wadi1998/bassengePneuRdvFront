import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CarResponse, CarRequest } from '../models/car.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CarsService {
  private readonly base = `${environment.apiBase}/api/cars`;
  private http = inject(HttpClient);

  /**
   * Liste toutes les voitures
   */
  list(): Observable<CarResponse[]> {
    return this.http.get<CarResponse[]>(this.base);
  }

  /**
   * Récupère une voiture par son ID
   */
  getById(id: number): Observable<CarResponse> {
    return this.http.get<CarResponse>(`${this.base}/${id}`);
  }

  /**
   * Liste les voitures d'un client
   */
  getByClientId(clientId: number): Observable<CarResponse[]> {
    return this.http.get<CarResponse[]>(`${this.base}/client/${clientId}`);
  }

  /**
   * Ajoute une nouvelle voiture à un client
   */
  create(dto: CarRequest): Observable<CarResponse> {
    return this.http.post<CarResponse>(this.base, dto);
  }

  /**
   * Modifie une voiture existante
   */
  update(id: number, dto: CarRequest): Observable<CarResponse> {
    return this.http.put<CarResponse>(`${this.base}/${id}`, dto);
  }

  /**
   * Supprime une voiture
   */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

