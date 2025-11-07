import { Injectable } from '@angular/core';
import FR from '../i18n/fr';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class I18nService {
  // keep a fallback resource for synchronous lookups if needed
  private fallback: Record<string, any> = { fr: FR };

  constructor(private translate: TranslateService) {
    // Ensure default language is set
    this.translate.setDefaultLang('fr');
    if (!this.translate.currentLang) this.translate.use('fr');
  }

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
          const v = String((safeParams as any)[k]);
          // replace both {key} and {{key}} forms (with optional spaces)
          out = out.replace(new RegExp(`\\{\\{\s*${k}\s*\\}\\}`, 'g'), v);
          out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        }
      }
      return out;
    }

    // Fallback to local FR resources for sync lookup
    const parts = key.split('.');
    let cur: any = this.fallback[this.currentLang] || {};
    for (const p of parts) {
      cur = cur?.[p];
      if (cur === undefined) return key;
    }
    let out = String(cur);
    if (safeParams) {
      for (const k of Object.keys(safeParams)) {
        out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String((safeParams as any)[k]));
      }
    }
    return out;
  }
}
