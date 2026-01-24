import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private translate = inject(TranslateService);
  private fallback: Record<string, Record<string, unknown>> = {};

  constructor() {
    this.translate.setDefaultLang('fr');
    this.translate.use('fr');

    // Met à jour le cache quand la langue change
    this.translate.onLangChange.subscribe((ev: { lang: string; translations: Record<string, unknown> }) => {
      this.fallback[ev.lang] = ev.translations || {};
    });

    // Charge les traductions initiales via use()
    this.translate.use('fr').subscribe((t: Record<string, unknown>) => {
      this.fallback['fr'] = t || {};
    });
  }

  get currentLang(): string {
    return this.translate.currentLang || 'fr';
  }

  setLang(lang: string): void {
    this.translate.use(lang);
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    const safeParams: Record<string, string | number> | undefined = params
      ? Object.fromEntries(Object.entries(params).map(([k, v]) => [k, v == null ? '' : v]))
      : undefined;

    // Essaye ngx-translate d'abord
    const instant = this.translate.instant(key, safeParams);

    if (instant && instant !== key) {
      let out = String(instant);
      if (safeParams) {
        for (const k of Object.keys(safeParams)) {
          const v = String(safeParams[k]);
          out = out.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), v);
          out = out.replace(new RegExp(`{${k}}`, 'g'), v);
        }
      }
      return out;
    }

    // Fallback vers le cache local
    const parts = key.split('.');
    let cur: unknown = this.fallback[this.currentLang] || {};
    for (const p of parts) {
      if (cur && typeof cur === 'object' && (cur as Record<string, unknown>)[p] !== undefined) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return key;
      }
    }
    let out = String(cur);
    if (safeParams) {
      for (const k of Object.keys(safeParams)) {
        out = out.replace(new RegExp(`{${k}}`, 'g'), String(safeParams[k]));
      }
    }
    return out;
  }
}
