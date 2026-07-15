import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule
  ],
  template: `
    <div class="page">
      <h1 class="page-title">Settings</h1>

      <mat-card class="settings-card">
        <mat-card-header><mat-card-title>Appearance</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="setting-row">
            <div class="setting-label">
              <mat-icon>{{ (themeService.isDark$ | async) ? 'dark_mode' : 'light_mode' }}</mat-icon>
              <div>
                <p class="setting-name">Dark mode</p>
                <p class="setting-desc">Use a darker color scheme across the app</p>
              </div>
            </div>
            <mat-slide-toggle
              [checked]="(themeService.isDark$ | async) ?? false"
              (change)="onToggleTheme($event.checked)">
            </mat-slide-toggle>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="settings-card">
        <mat-card-header><mat-card-title>Account</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="setting-row">
            <div class="setting-label">
              <mat-icon>person</mat-icon>
              <div>
                <p class="setting-name">Profile & password</p>
                <p class="setting-desc">Update your personal information or change your password</p>
              </div>
            </div>
            <a mat-stroked-button color="primary" routerLink="/profile">Open Profile</a>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="settings-card">
        <mat-card-header><mat-card-title>About</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="info-row"><span>Application</span><span>Task Manager</span></div>
          <div class="info-row"><span>Version</span><span>1.0.0</span></div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page { max-width: 760px; }
    .page-title { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 20px; color: #1e293b; }
    .settings-card { margin-bottom: 16px; }
    .setting-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .setting-label { display: flex; align-items: center; gap: 14px; }
    .setting-label > mat-icon { color: #94a3b8; }
    .setting-name { margin: 0; font-weight: 600; color: #1e293b; }
    .setting-desc { margin: 2px 0 0; font-size: 13px; color: #6b7280; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .info-row:last-child { border-bottom: none; }
    .info-row span:first-child { color: #6b7280; }

    :host-context(.dark-theme) .page-title,
    :host-context(.dark-theme) .setting-name { color: #e5e7eb; }
    :host-context(.dark-theme) .setting-desc { color: #9ca3af; }
    :host-context(.dark-theme) .info-row { border-bottom-color: #262c40; }
  `]
})
export class SettingsComponent {
  constructor(public themeService: ThemeService) {}

  onToggleTheme(dark: boolean): void {
    this.themeService.setDark(dark);
  }
}
