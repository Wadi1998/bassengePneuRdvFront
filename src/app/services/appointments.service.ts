// services/appointments.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment } from '../models/appointment.model';

type Bay = 'A'|'B';


@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private readonly base = 'http://localhost:8080/api/appointments';

  constructor(private http: HttpClient) {}

  listByDate(date: string, bay?: Bay): Observable<Appointment[]> {
    const url = bay ? `${this.base}/by-day?date=${date}&bay=${bay}`
      : `${this.base}/by-day?date=${date}`;
    return this.http.get<Appointment[]>(url);
  }

  create(payload: Appointment): Observable<Appointment> {
    return this.http.post<Appointment>(this.base, payload);
  }

  remove(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  delete(id: number) {
    return undefined;
  }
}
