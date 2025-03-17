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
  name: any | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {

    this.authService.getUser().subscribe(user => {
      console.log("Lekérdezett user:", user); // Debug log

      if (user && typeof user === 'object' && user.name) {
        this.name = user.name; // **Csak akkor állítsuk be, ha létezik**
      } else {
        this.name = null; // **Ha kijelentkezik, töröljük a nevet**
      }
    });
  }


  onClickApply(index: number) {

    this.isApplied = !this.isApplied;
  }

}
