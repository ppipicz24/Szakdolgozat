import { Component } from '@angular/core';
import { ChangePasswordService } from './password-reset.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';


@Component({
  selector: 'app-password-reset',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.css'
})
export class PasswordResetComponent {
  oldPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  error: string = '';
  success: boolean = false;
  message: string = '';

  constructor(private passwordReset: ChangePasswordService, private router: Router) {}

  onSubmit(): void {
    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      this.error = 'Minden mező kitöltése kötelező!';
      this.message = '';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Az új jelszavak nem egyeznek!';
      this.message = '';
      return;
    }

    this.passwordReset.changePassword(this.oldPassword, this.newPassword).subscribe({
      next: (response) => {
        this.message = 'Jelszavad sikeresen megváltozott!';
        this.error = '';
        setTimeout(() => this.router.navigate(['/profile']), 2000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Hiba történt a jelszó frissítése közben!';
        this.message = '';
      }
    });
  }
}
