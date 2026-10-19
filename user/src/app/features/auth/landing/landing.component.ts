import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { LoginDialogComponent } from '../login-dialog/login-dialog.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  openLogin(): void {
    const dialogRef = this.dialog.open(LoginDialogComponent, {
      width: '400px',
      restoreFocus: true,
      panelClass: 'auth-dialog'
    });

    dialogRef.afterClosed().subscribe(() => {
      if (this.authService.isAuthenticated()) {
        const user = this.authService.currentUserValue;
        if (user?.role === 'admin') {
          const token = this.authService.getToken();
          window.location.href = `http://localhost:4201?token=${token}`;
        } else {
          this.router.navigate(['/dashboard']);
        }
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
