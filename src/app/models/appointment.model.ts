export interface Appointment {
  id?: number;

  // Jour du rendez-vous (YYYY-MM-DD)
  date: string;

  // Heure de début du rendez-vous (HH:mm)
  time: string;

  // Durée en minutes (ex. 15/30/45/60)
  duration: number;

  // Pont
  bay: 'A' | 'B';

  // Lié au client
  clientId?: number;
  clientName?: string;

  // Info service (affichage)
  serviceType?: string;
}
