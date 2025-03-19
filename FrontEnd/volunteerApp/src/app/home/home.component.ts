import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { EventModel } from '../new-date/event.model';
import { EventService } from './event.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  isApplied: boolean = false;
  name: any | null = null;

  events: EventModel[] = []

  constructor(private authService: AuthService, private eventService: EventService) {}

  ngOnInit() {

    this.authService.getUser().subscribe(user => {
      console.log("Lekérdezett user:", user); // Debug log

      if (user && typeof user === 'object' && user.name) {
        this.name = user.name; // **Csak akkor állítsuk be, ha létezik**
      } else {
        this.name = null; // **Ha kijelentkezik, töröljük a nevet**
      }
    });

    this.eventService.loadEvents();
    this.eventService.events$.subscribe(events => {
      this.events = events; // Amint az adat megérkezik, frissül az `events` tömb
      console.log("Events updated:", this.events);
    });
  }


  onClickApply(index: number) {

    this.isApplied = !this.isApplied;
  }

}
