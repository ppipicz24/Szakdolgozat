// import { Component, OnInit } from '@angular/core';
// import { Router, RouterLink } from '@angular/router';
// import { AuthService } from '../auth/auth.service';
// import { Subscription } from 'rxjs';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-header',
//   imports: [RouterLink, CommonModule],
//   templateUrl: './header.component.html',
//   styleUrl: './header.component.css'
// })
// export class HeaderComponent implements OnInit {
//   isAuth = false;
//   private authSubscription!: Subscription; // **Feliratkozás kezelése**

//   constructor(private authService: AuthService, private router: Router) {}

//   ngOnInit() {
//     this.authSubscription = this.authService.token$.subscribe(token => {
//       this.isAuth = !!token; // **Ha van token, akkor isAuth = true**
//     });
//   }

//   onLogout() {
//     this.authService.logout();
//     this.router.navigate(['/auth']);
//   }

//   ngOnDestroy() {
//     if (this.authSubscription) {
//       this.authSubscription.unsubscribe(); // **Előfizetés törlése, hogy ne legyen memória szivárgás**
//     }
//   }
// }

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

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // **Figyeljük a token állapotát**
    this.authSubscription = this.authService.token$.subscribe(token => {
      this.isAuth = !!token;
    });

    // **Figyeljük a felhasználói adatokat, hogy frissüljenek a fejlécben**
    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        console.log("User updated in header:", user);
        this.isAuth = true; // **Ha van felhasználó, akkor be van jelentkezve**
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

