import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isAuth = false;
  private authSubscription!: Subscription;
  private userSubscription!: Subscription;
  isAdmin = false; // **Admin jogosultság változó**
  isCoordinator = false; // **Koordinátor jogosultság változó**
  name: any | null = null;


  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authSubscription = this.authService.token$.subscribe(token => {
      this.isAuth = !!token;
    });

    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        console.log("User updated in header:", user);
        this.isAuth = true;
        this.name = user.name || null;
        this.isAdmin = user.role === 'admin';
        this.isCoordinator = user.role === 'coordinator';
      } else {
        this.isAuth = false;
        this.name = null;
        this.isAdmin = false;
        this.isCoordinator = false;
      }
    });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}

