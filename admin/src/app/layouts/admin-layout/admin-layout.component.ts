import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { Router } from '@angular/router';

interface NavItem {
  title: string;
  route: string;
  icon: string;
  badge?: number;
}

interface AppNotification {
  icon: string;
  title: string;
  time: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {
  sidenavOpened = true;
  collapsed = false;
  currentUser$;

  // No notification backend yet — start empty so the badge reflects reality
  // instead of a hardcoded count. Push items here (or wire a service) as needed.
  notifications: AppNotification[] = [];
  
  navItems: NavItem[] = [
    { title: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { title: 'Users', route: '/users', icon: 'people' },
    { title: 'Projects', route: '/projects', icon: 'folder' },
    { title: 'Tasks', route: '/tasks', icon: 'assignment' },
    { title: 'Reports', route: '/reports', icon: 'analytics' },
    { title: 'Settings', route: '/settings', icon: 'settings' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
    private notificationService: NotificationService,
    public appSettings: AppSettingsService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Populate the bell with real recent-activity notifications
    this.notificationService.loadNotifications().subscribe(items => {
      this.notifications = items.map(n => ({
        icon: n.icon,
        title: n.title,
        time: n.subtitle + (n.time ? ' · ' + this.relativeTime(n.time) : '')
      }));
    });
  }

  private relativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    if (isNaN(then)) return '';
    const diff = Date.now() - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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