import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
// import { Router } from 'express';
// import { AuthComponent } from '../auth/auth.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  isAuth = false;
  private authSubscription!: Subscription; // **Feliratkozás kezelése**

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authSubscription = this.authService.token$.subscribe(token => {
      this.isAuth = !!token; // **Ha van token, akkor isAuth = true**
    });
  }

  onLogout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe(); // **Előfizetés törlése, hogy ne legyen memória szivárgás**
    }
  }
}
