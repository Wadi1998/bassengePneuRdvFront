// services/appointments.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment } from '../models/appointment.model';
import { environment } from '../../environments/environment';

type Bay = 'A'|'B';


@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  // Use environment.apiBase so the backend base URL is configurable per environment
  private readonly base = `${environment.apiBase}/api/appointments`;

  private http = inject(HttpClient);

  listByDate(date: string, bay?: Bay): Observable<Appointment[]> {
    const params = new HttpParams().set('date', date);
    const finalParams = bay ? params.set('bay', bay) : params;
    return this.http.get<Appointment[]>(`${this.base}/by-day`, { params: finalParams });
  }

  create(payload: Appointment): Observable<Appointment> {
    return this.http.post<Appointment>(this.base, payload);
  }

  remove(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
