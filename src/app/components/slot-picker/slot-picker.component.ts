import { ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Appointment } from '../../models/appointment.model';
import { I18nService } from '../../services/i18n.service';

type SlotState = 'free' | 'busy' | 'past' | 'indispo';

interface SlotVM {
  time: string;              // "HH:mm" (début du slot affiché)
  endTime?: string;          // "HH:mm" (fin du rendez-vous pour affichage groupé)
  state: SlotState;
  clientName?: string;
  serviceType?: string;
  carDescription?: string;   // Description voiture
  note?: string;
  appointmentId?: number;    // ID du rendez-vous pour la suppression
  // Propriétés pour le regroupement visuel
  isFirstOfGroup?: boolean;  // Premier slot d'un rendez-vous multi-slots
  isLastOfGroup?: boolean;   // Dernier slot d'un rendez-vous multi-slots
  isMiddleOfGroup?: boolean; // Slot au milieu d'un rendez-vous multi-slots
  slotCount?: number;        // Nombre total de slots du rendez-vous
  duration?: number;         // Durée totale du rendez-vous en minutes
}

@Component({
  standalone: true,
  selector: 'app-slot-picker',
  templateUrl: './slot-picker.component.html',
  imports: [CommonModule, NgFor, NgIf],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlotPickerComponent implements OnChanges {
  // ---------- Inputs ----------
  @Input() date!: string;
  @Input() duration!: number;                // durée à réserver (30/45/60…), l'affichage reste en pas de 15
  @Input() bay!: 'A' | 'B';
  @Input() items: Appointment[] = [];
  @Input() serviceType!: string;
  @Input() canBook!: boolean;
  @Input() needService!: boolean;
  @Input() needClient!: boolean;
  @Input() isLoading: boolean = false;
  @Input() readOnly: boolean = false;        // Mode lecture seule (dashboard)

  // ---------- Outputs ----------
  @Output() pick = new EventEmitter<string>();                         // émet l'heure "HH:mm"
  @Output() blocked = new EventEmitter<'service' | 'client' | 'both'>();
  @Output() deleteAppointment = new EventEmitter<number>();            // émet l'ID du rdv à supprimer

  // ---------- Etat local ----------
  slots: SlotVM[] = [];

  // Constante: affichage en pas de 15 min
  private readonly DISPLAY_STEP = 15;
  // Plage d'ouverture (garde comme avant)
  private readonly START_HOUR = 8;
  private readonly END_HOUR = 18;

  private cdr = inject(ChangeDetectorRef);
  public i18n = inject(I18nService);

  // --- helpers date locale (évite toISOString/UTC) ---
  private pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`;
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['date'] || ch['duration'] || ch['bay'] || ch['items']) {
      this.buildSlots();
      this.cdr.markForCheck();
    }
  }

  /** Appelable par le parent si besoin (hard refresh) */
  public rebuild(): void {
    this.buildSlots();
    this.cdr.detectChanges();
  }

  // ---------- Calcul des créneaux (toujours en 15 min) ----------
  private buildSlots(): void {
    if (!this.date || !this.duration || !this.bay) return;

    // Utiliser la date locale pour éviter les décalages UTC
    const todayStr = this.formatDate(new Date());
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const out: SlotVM[] = [];

    // Set pour tracker les rendez-vous déjà affichés
    const displayedAppointments = new Set<number>();

    for (let h = this.START_HOUR; h < this.END_HOUR; h++) {
      for (let m = 0; m < 60; m += this.DISPLAY_STEP) {
        const time = this.hm(h, m);
        const slotStart = h * 60 + m;
        const slotEndDisplay = slotStart + this.DISPLAY_STEP;      // pour "busy" visuel
        const slotEndReserve = slotStart + this.duration;          // pour réserver

        const isPast = this.date === todayStr && slotStart < nowMin;

        // RDV du même pont qui chevauchent l'affichage (15 min)
        const overlapAppt = this.findOverlap(slotStart, slotEndDisplay);

        // Fenêtre complète disponible pour la durée demandée ?
        const windowFree = this.isWindowFree(slotStart, slotEndReserve);

        if (isPast) {
          out.push({ time, state: 'past' });
        } else if (overlapAppt) {
          const apptStart = this.parseHm(overlapAppt.time);
          const apptDuration = overlapAppt.duration || this.DISPLAY_STEP;
          const apptEnd = apptStart + apptDuration;

          // Afficher un seul slot groupé pour tout le rendez-vous
          const isFirstOfGroup = slotStart === apptStart;

          if (isFirstOfGroup && overlapAppt.id && !displayedAppointments.has(overlapAppt.id)) {
            // Marquer ce rendez-vous comme affiché
            displayedAppointments.add(overlapAppt.id);

            // Calculer l'heure de fin
            const endHour = Math.floor(apptEnd / 60);
            const endMin = apptEnd % 60;
            const endTime = this.hm(endHour, endMin);

            out.push({
              time,
              endTime,
              state: 'busy',
              clientName: overlapAppt.clientName,
              serviceType: overlapAppt.serviceType,
              carDescription: overlapAppt.carDescription,
              appointmentId: overlapAppt.id,
              isFirstOfGroup: true,
              isLastOfGroup: true,
              isMiddleOfGroup: false,
              slotCount: Math.ceil(apptDuration / this.DISPLAY_STEP),
              duration: apptDuration
            });
          }
          // Ne rien ajouter pour les slots suivants du même rendez-vous
        } else if (!windowFree && !this.readOnly) {
          // En mode readOnly (Dashboard), on ignore la vérification de durée
          out.push({
            time,
            state: 'indispo',
            note: this.i18n.t('slot.notEnoughSpace', { duration: String(this.duration) })
          });
        } else {
          out.push({ time, state: 'free' });
        }
      }
    }

    this.slots = out;
  }

  // ---------- Utils chevauchements ----------
  private isWindowFree(startMin: number, endMin: number): boolean {
    // Hors horaires ?
    if (!this.withinOpeningHours(startMin, endMin)) return false;

    // Aucun rendez-vous ne doit chevaucher [startMin, endMin[
    return !this.items.some(a => {
      if (a.bay !== this.bay) return false;
      const aStart = this.parseHm(a.time);
      const aEnd = aStart + (a.duration || this.DISPLAY_STEP);
      return this.overlap(startMin, endMin, aStart, aEnd);
    });
  }

  private findOverlap(startMin: number, endMin: number): Appointment | undefined {
    return this.items.find(a => {
      if (a.bay !== this.bay) return false;
      const aStart = this.parseHm(a.time);
      const aEnd = aStart + (a.duration || this.DISPLAY_STEP);
      return this.overlap(startMin, endMin, aStart, aEnd);
    });
  }

  private overlap(s1: number, e1: number, s2: number, e2: number): boolean {
    // chevauchement strict sur [start, end[
    return !(e1 <= s2 || e2 <= s1);
  }

  private withinOpeningHours(s: number, e: number): boolean {
    const open = this.START_HOUR * 60;
    const close = this.END_HOUR * 60;
    return s >= open && e <= close;
  }

  private hm(h: number, m: number) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private parseHm(hm: string) {
    const [h, m] = hm.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  trackByTime(_: number, s: SlotVM) {
    return `${s.time}-${s.state}-${s.appointmentId || 'free'}`;
  }

  // ---------- Interaction ----------
  onClick(time: string, state: SlotState) {
    // Mode lecture seule = pas de clic
    if (this.readOnly) return;

    // On ne clique que sur 'free'
    if (state !== 'free') return;

    if (!this.canBook) {
      const reason: 'service' | 'client' | 'both' =
        (this.needClient && this.needService)
          ? 'both'
          : (this.needClient ? 'client' : 'service');
      this.blocked.emit(reason);
      return;
    }

    this.pick.emit(time);
  }

  onDelete(event: Event, appointmentId: number | undefined) {
    // Mode lecture seule = pas de suppression
    if (this.readOnly) return;

    event.stopPropagation(); // Empêcher le clic sur le bouton parent
    if (appointmentId) {
      this.deleteAppointment.emit(appointmentId);
    }
  }
}
