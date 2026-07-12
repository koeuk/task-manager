import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'user_theme';
  private readonly darkClass = 'dark-theme';
  private darkSubject = new BehaviorSubject<boolean>(this.resolveInitial());
  isDark$ = this.darkSubject.asObservable();

  constructor() {
    this.apply(this.darkSubject.value);
  }

  get isDark(): boolean {
    return this.darkSubject.value;
  }

  toggle(): void {
    this.setDark(!this.darkSubject.value);
  }

  setDark(dark: boolean): void {
    this.darkSubject.next(dark);
    localStorage.setItem(this.storageKey, dark ? 'dark' : 'light');
    this.apply(dark);
  }

  private apply(dark: boolean): void {
    const classList = document.body.classList;
    dark ? classList.add(this.darkClass) : classList.remove(this.darkClass);
  }

  private resolveInitial(): boolean {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      return stored === 'dark';
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
