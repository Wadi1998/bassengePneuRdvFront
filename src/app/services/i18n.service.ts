import { Injectable, inject } from '@angular/core';
import FR from '../i18n/fr';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class I18nService {
  // keep a fallback resource for synchronous lookups if needed
  // fallback typed as unknown to avoid `any` usage
  private fallback: Record<string, unknown> = { fr: FR };

  // Prefer inject() for TranslateService and run init inline
  private translate = inject(TranslateService);
  // initialize default language
  private _init = (() => {
    this.translate.setDefaultLang('fr');
    if (!this.translate.currentLang) this.translate.use('fr');
    return true;
  })();

  // get current language
  get currentLang(): string { return this.translate.currentLang || 'fr'; }

  // change language at runtime
  setLang(lang: string) {
    this.translate.use(lang);
  }

  // Async-friendly translation (returns translated string, using translate.instant fallback)
  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    // ngx-translate expects params without null/undefined; convert them
    const safeParams: Record<string, string | number> | undefined = params
      ? Object.fromEntries(Object.entries(params).map(([k, v]) => [k, v == null ? '' : v]))
      : undefined;

    // Try synchronous instant() first; if not available, fallback to our static resource
    const instant = this.translate.instant(key, safeParams);

    // If ngx-translate returned a translation (different from key) we still want to
    // ensure parameters of the form `{param}` are replaced (some resources use `{param}`
    // instead of ngx-translate's default `{{param}}`). Also support `{{param}}`.
    if (instant && instant !== key) {
      let out = String(instant);
      if (safeParams) {
        for (const k of Object.keys(safeParams)) {
          const paramVal = safeParams[k];
          const v = String(paramVal);
          // replace both {key} and {{key}} forms (with optional spaces)
          out = out.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), v);
          out = out.replace(new RegExp(`{${k}}`, 'g'), v);
        }
      }
      return out;
    }

    // Fallback to local FR resources for sync lookup
    const parts = key.split('.');
    let cur: unknown = this.fallback[this.currentLang] || {};
    for (const p of parts) {
      // drill into the fallback object safely
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
