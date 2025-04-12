import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-profile',
  imports: [RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  user: any = null;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.getProfile().subscribe({
      next: (userData) => {
        this.user = userData;
      },
      error: (err) => {
        this.errorMessage = "Nem sikerült lekérni a profiladatokat.";
        this.router.navigate(['/auth']); // Ha nincs bejelentkezve, loginra irányítjuk
      }
    });
  }
}
