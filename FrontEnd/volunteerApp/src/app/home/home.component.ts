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

  isAdmin: boolean = false;

  events: EventModel[] = []
  registeredEventIds: Set<string> = new Set();


  constructor(private authService: AuthService, private eventService: EventService) {}

  // ngOnInit() {

  //   this.authService.getUser().subscribe(user => {
  //     console.log("Lekérdezett user:", user); // Debug log

  //     if (user && typeof user === 'object' && user.name) {
  //       this.name = user.name; // **Csak akkor állítsuk be, ha létezik**
  //       if (user.role === 'admin') {
  //         this.isAdmin = true; // **Ha admin, akkor beállítjuk az admin változót**
  //       }
  //     } else {
  //       this.name = null; // **Ha kijelentkezik, töröljük a nevet**
  //     }
  //   });

  //   this.eventService.loadEvents();
  //   this.eventService.events$.subscribe(events => {
  //     this.events = events; // Amint az adat megérkezik, frissül az `events` tömb
  //     console.log("Events updated:", this.events);
  //   });
  // }

  ngOnInit() {
    this.authService.getUser().subscribe(user => {
      if (user && typeof user === 'object' && user.name) {
        this.name = user.name;
        if (user.role === 'admin') this.isAdmin = true;
      } else {
        this.name = null;
      }
    });

    this.eventService.loadEvents();

    this.eventService.events$.subscribe(events => {
      this.events = events;
    });

    this.eventService.getMyEventIds().subscribe({
      next: (eventIds: string[]) => {
        this.registeredEventIds = new Set(eventIds);
      },
      error: err => {
        console.error("Nem sikerült betölteni a saját jelentkezéseket:", err);
      }
    });
  }



  // onClickApply(eventId: string) {
  //   this.eventService.registerToEvent(eventId).subscribe({
  //     next: () => {
  //       this.isApplied = true; // vagy akár eseményenként is kezelheted, ha több gombod van
  //       console.log("User successfully registered.");
  //     },
  //     error: err => {
  //       this.isApplied = false;
  //       console.error("Registration failed:", err);
  //     }
  //   });
  // }

  onClickApply(eventId: string) {
    if (this.registeredEventIds.has(eventId)) {
      // Lejelentkezés
      this.eventService.unregisterFromEvent(eventId).subscribe({
        next: () => {
          const newSet = new Set(this.registeredEventIds);
          newSet.delete(eventId);
          this.registeredEventIds = newSet;
        },
        error: err => console.error("Lejelentkezés hiba:", err)
      });
    } else {
      // Jelentkezés
      this.eventService.registerToEvent(eventId).subscribe({
        next: () => {
          this.registeredEventIds = new Set([...this.registeredEventIds, eventId]);
        },
        error: err => console.error("Jelentkezés hiba:", err)
      });
    }
  }



  deleteEvent(index: string) {
    this.eventService.deleteEvent(index)
    this.eventService.loadEvents();

  }


}
