import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.css'
})
export class EditComponent {
  user: any = { name: '', username: '', phoneNumber: '', email: '' };
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.getProfile().subscribe({
      next: (userData) => {
        this.user = userData;
      },
      error: (err) => {
        this.errorMessage = "Nem sikerült lekérni a profiladatokat.";
      }
    });
  }

  onSubmit() {
    const updatedData: any = {};

    if (this.user.name) updatedData.name = this.user.name;
    if (this.user.phoneNumber) updatedData.phoneNumber = this.user.phoneNumber;
    if (this.user.email) updatedData.email = this.user.email;

    if (Object.keys(updatedData).length === 0) {
      this.errorMessage = "Legalább egy mezőt módosítani kell!";
      return;
    }

    this.authService.updateProfile(updatedData).subscribe({
      next: (response) => {
        this.successMessage = "Profil sikeresen módosítva!";
        this.errorMessage = null;

        this.authService.getProfile().subscribe({
          next: (user) => {
            if (user) {
              this.authService.userSubject.next(user);
            }
          }
        });

        setTimeout(() => this.router.navigate(['/profile']), 2000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || "Nem sikerült frissíteni a profilodat.";
      }
    });
  }
}
