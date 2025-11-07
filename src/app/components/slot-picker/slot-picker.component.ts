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
import { CommonModule, NgFor, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { Appointment } from '../../models/appointment.model';
import { I18nService } from '../../services/i18n.service';

type SlotState = 'free' | 'busy' | 'past' | 'indispo';

interface SlotVM {
  time: string;              // "HH:mm" (début du slot affiché)
  state: SlotState;
  clientName?: string;
  serviceType?: string;
  note?: string;
}

@Component({
  standalone: true,
  selector: 'app-slot-picker',
  templateUrl: './slot-picker.component.html',
  imports: [CommonModule, NgFor, NgIf, NgSwitch, NgSwitchCase],
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

  // ---------- Outputs ----------
  @Output() pick = new EventEmitter<string>();                         // émet l'heure "HH:mm"
  @Output() blocked = new EventEmitter<'service' | 'client' | 'both'>();

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
          out.push({
            time,
            state: 'busy',
            clientName: overlapAppt.clientName,
            serviceType: overlapAppt.serviceType
          });
        } else if (!windowFree) {
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

  trackByTime(_: number, s: SlotVM) { return s.time; }

  // ---------- Interaction ----------
  onClick(time: string, state: SlotState) {
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
}
