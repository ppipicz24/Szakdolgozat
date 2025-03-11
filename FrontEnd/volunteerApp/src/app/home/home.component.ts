import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  isApplied: boolean = false;
  username: any | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    
    this.authService.getUser().subscribe(user => {
      console.log("Lekérdezett user:", user); // Debug log

      if (user && typeof user === 'object' && user.username) {
        this.username = user.username; // **Csak akkor állítsuk be, ha létezik**
      } else {
        this.username = null; // **Ha kijelentkezik, töröljük a nevet**
      }
    });
  }


  onClickApply(index: number) {

    this.isApplied = !this.isApplied;
  }

}
