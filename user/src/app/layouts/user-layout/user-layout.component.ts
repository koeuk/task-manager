import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService, AppNotification } from '../../core/services/notification.service';
import { LoginDialogComponent } from '../../features/auth/login-dialog/login-dialog.component';
import { Observable } from 'rxjs';
import { User } from '../../core/models/user.model';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.scss']
})
export class UserLayoutComponent implements OnInit {
  currentUser$: Observable<User | null>;
  collapsed = false;
  /** Set when the avatar URL fails to load, so we fall back to initials. */
  avatarBroken = false;

  /** Primary nav only — account pages live in the footer menu. */
  menuItems: MenuItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'folder', label: 'Projects', route: '/projects' },
    { icon: 'task_alt', label: 'My Tasks', route: '/tasks' },
    { icon: 'calendar_month', label: 'Calendar', route: '/calendar' },
    { icon: 'history', label: 'Activity Log', route: '/activity' }
  ];

  notifications: AppNotification[] = [];

  constructor(
    private authService: AuthService,
    public themeService: ThemeService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.currentUser$.subscribe(user => {
      if (user) {
        this.loadNotifications();
      } else {
        this.notifications = [];
      }
    });
  }

  openAuthDialog(mode: 'login' | 'register' = 'login'): void {
    this.dialog.open(LoginDialogComponent, {
      width: '420px',
      maxWidth: '95vw',
      restoreFocus: true,
      panelClass: 'auth-dialog',
      data: { initialMode: mode }
    });
  }

  loadNotifications(): void {
    this.notificationService.loadNotifications().subscribe(items => {
      this.notifications = items;
    });
  }

  toggleSidenav(): void {
    // Collapse to an icon-only rail instead of hiding the sidebar entirely
    this.collapsed = !this.collapsed;
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  logout(): void {
    this.authService.logout();
  }
}
