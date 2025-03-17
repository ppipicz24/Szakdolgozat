import { Component } from '@angular/core';
import { ForgotPasswordService } from './forget-password.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-forget-password',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.css'
})
export class ForgetPasswordComponent {
  email: string = '';
  message: string = '';
  error: string = '';
  success: boolean = false;

  constructor(private forgotPasswordService: ForgotPasswordService, private router: Router) {}

  onSubmit(): void {
    if (!this.email) {
      this.error = 'Az email mező nem lehet üres!';
      return;
    }

    this.forgotPasswordService.requestNewPassword(this.email).subscribe({
      next: (response) => {
        this.message = 'Ellenőrizd az e-mail fiókodat az új jelszóért!';
        this.error = '';
        this.success = true;
        this.router.navigate(['/auth']);
      },
      error: (err) => {
        this.error = 'Hiba történt, próbáld újra!';
        this.message = '';
        this.success = false;
      }
    });
  }
}
