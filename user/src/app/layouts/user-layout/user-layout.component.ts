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
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { Observable } from 'rxjs';
import { User } from '../../core/models/user.model';

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
    MatTooltipModule
  ],
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.scss']
})
export class UserLayoutComponent implements OnInit {
  currentUser$: Observable<User | null>;
  sidenavOpen = true;
  collapsed = false;

  menuItems = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'folder', label: 'Projects', route: '/projects' },
    { icon: 'task', label: 'My Tasks', route: '/tasks' },
    { icon: 'calendar_month', label: 'Calendar', route: '/calendar' },
    { icon: 'person', label: 'Profile', route: '/profile' }
  ];

  constructor(
    private authService: AuthService,
    public themeService: ThemeService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {}

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

  /** True when browsing as the shared guest account (no real login). */
  get isGuest(): boolean {
    return this.authService.isGuest;
  }

  /** End the guest session and show the login form so a user can sign into their own account. */
  login(): void {
    this.authService.logout();
  }
}