import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppSettings {
  appName: string;
  appLogo: string;    // data URL / image URL; empty = default icon
  accent: string;     // hex color for primary buttons / brand accents
  background: string; // content-area page background (light mode)
}

export interface AccentPreset {
  name: string;
  value: string;
}

const DEFAULTS: AppSettings = {
  appName: 'Admin Panel',
  appLogo: '',
  accent: '#64748b',
  background: '#f4f6f8'
};

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private readonly storageKey = 'admin_app_settings';
  private subject = new BehaviorSubject<AppSettings>(this.load());
  settings$ = this.subject.asObservable();

  readonly accentPresets: AccentPreset[] = [
    { name: 'Slate', value: '#64748b' },
    { name: 'Blue', value: '#2563eb' },
    { name: 'Teal', value: '#0d9488' },
    { name: 'Green', value: '#16a34a' },
    { name: 'Violet', value: '#7c3aed' },
    { name: 'Rose', value: '#e11d48' },
    { name: 'Amber', value: '#d97706' }
  ];

  readonly backgroundPresets: AccentPreset[] = [
    { name: 'Default', value: '#f4f6f8' },
    { name: 'White', value: '#ffffff' },
    { name: 'Warm', value: '#f7f5f2' },
    { name: 'Mint', value: '#eef6f1' },
    { name: 'Sky', value: '#eef4fb' },
    { name: 'Lavender', value: '#f3f1fb' }
  ];

  constructor() {
    this.apply(this.subject.value);
  }

  get current(): AppSettings {
    return this.subject.value;
  }

  update(patch: Partial<AppSettings>): void {
    const next = { ...this.subject.value, ...patch };
    this.subject.next(next);
    localStorage.setItem(this.storageKey, JSON.stringify(next));
    this.apply(next);
  }

  reset(): void {
    this.update({ ...DEFAULTS });
  }

  private apply(s: AppSettings): void {
    const root = document.documentElement.style;
    root.setProperty('--app-accent', s.accent);
    root.setProperty('--app-bg', s.background);
    if (s.appName) {
      document.title = s.appName;
    }
  }

  private load(): AppSettings {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    } catch {
      return { ...DEFAULTS };
    }
  }
}
