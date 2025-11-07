import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {CommonModule} from '@angular/common';
import { I18nService } from './services/i18n.service';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html'
})
export class AppComponent {
  open = false;          // pour le menu mobile
  today = new Date();    // <-- ajoute ceci

  // Prefer `inject()` (standalone / functional style)
  public i18n = inject(I18nService);
}
