import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppointmentResponse, AppointmentRequest } from '../models/appointment.model';
import { environment } from '../../environments/environment';

type Bay = 'A' | 'B';

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly base = `${environment.apiBase}/api/appointments`;
  private http = inject(HttpClient);

  /**
   * Liste tous les rendez-vous
   */
  list(): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(this.base);
  }

  /**
   * Récupère un rendez-vous par son ID
   */
  getById(id: number): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${this.base}/${id}`);
  }

  /**
   * Liste les rendez-vous d'un jour donné
   */
  listByDate(date: string, bay?: Bay): Observable<AppointmentResponse[]> {
    const params = new HttpParams().set('date', date);
    const finalParams = bay ? params.set('bay', bay) : params;
    return this.http.get<AppointmentResponse[]>(`${this.base}/by-day`, { params: finalParams });
  }

  /**
   * Liste les rendez-vous d'un client
   */
  getByClientId(clientId: number): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${this.base}/client/${clientId}`);
  }

  /**
   * Crée un nouveau rendez-vous
   */
  create(payload: AppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(this.base, payload);
  }

  /**
   * Modifie un rendez-vous existant
   */
  update(id: number, payload: AppointmentRequest): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.base}/${id}`, payload);
  }

  /**
   * Supprime un rendez-vous
   */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
