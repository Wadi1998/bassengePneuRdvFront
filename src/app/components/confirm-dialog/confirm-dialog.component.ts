import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-[70] flex items-center justify-center">
      <!-- Overlay -->
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
        (click)="onCancel()"
        aria-hidden="true"
      ></div>

      <!-- Dialog -->
      <div
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="'confirm-title-' + dialogId"
        [attr.aria-describedby]="'confirm-desc-' + dialogId"
        class="relative w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200"
      >
        <div class="card-dark p-6 rounded-2xl shadow-xl border border-white/10">
          <!-- Icon -->
          <div class="flex justify-center mb-4">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center"
              [ngClass]="iconContainerClass"
            >
              <svg
                class="w-6 h-6"
                [ngClass]="iconClass"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <ng-container *ngIf="data?.type === 'danger' || !data?.type">
                  <path d="M12 9v4m0 4h.01M12 3l9.5 16.5H2.5L12 3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </ng-container>
                <ng-container *ngIf="data?.type === 'warning'">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M12 8v4m0 4h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </ng-container>
                <ng-container *ngIf="data?.type === 'info'">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M12 16v-4m0-4h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </ng-container>
              </svg>
            </div>
          </div>

          <!-- Title -->
          <h3
            [id]="'confirm-title-' + dialogId"
            class="text-lg font-semibold text-center mb-2"
          >
            {{ data?.title }}
          </h3>

          <!-- Message -->
          <p
            [id]="'confirm-desc-' + dialogId"
            class="text-sm text-slate-300 text-center mb-6"
          >
            {{ data?.message }}
          </p>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              type="button"
              (click)="onCancel()"
              class="flex-1 btn-secondary py-2.5 justify-center"
            >
              {{ data?.cancelText || 'Annuler' }}
            </button>
            <button
              type="button"
              (click)="onConfirm()"
              class="flex-1 font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              [ngClass]="confirmButtonClass"
            >
              <svg
                *ngIf="data?.type === 'danger' || !data?.type"
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ data?.confirmText || 'Confirmer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() data: ConfirmDialogData | null = null;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly dialogId = Math.random().toString(36).substring(2, 9);

  get iconContainerClass(): string {
    switch (this.data?.type) {
      case 'warning': return 'bg-amber-500/20';
      case 'info': return 'bg-sky-500/20';
      default: return 'bg-red-500/20';
    }
  }

  get iconClass(): string {
    switch (this.data?.type) {
      case 'warning': return 'text-amber-400';
      case 'info': return 'text-sky-400';
      default: return 'text-red-400';
    }
  }

  get confirmButtonClass(): string {
    switch (this.data?.type) {
      case 'warning': return 'bg-amber-600 hover:bg-amber-700 text-white';
      case 'info': return 'bg-sky-600 hover:bg-sky-700 text-white';
      default: return 'bg-red-600 hover:bg-red-700 text-white';
    }
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
