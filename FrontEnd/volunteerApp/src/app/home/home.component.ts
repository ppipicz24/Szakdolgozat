import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { EventModel } from '../new-date/event.model';
import { EventService } from './event.service';
import { CommonModule } from '@angular/common';
import { ErrorService } from '../shared/error.service';
import { ActivatedRoute, Router } from '@angular/router';
import { GoogleCalendarService } from './calendar.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  isApplied: boolean = false;
  name: any | null = null;


  isAdmin: boolean = false;

  events: EventModel[] = [];
  registeredEventIds: Set<string> = new Set();

  registeredEvents: EventModel[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 5;

  isCalendarConnected: boolean = false;
  googleAccessToken: string | null = null;
  googleRefreshToken: string | null = null;


  get paginatedEvents(): EventModel[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.events.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.events.length / this.itemsPerPage);
  }

  registeredCurrentPage: number = 1;
  registeredItemsPerPage: number = 5;

  get paginatedRegisteredEvents(): EventModel[] {
    const start = (this.registeredCurrentPage - 1) * this.registeredItemsPerPage;
    const end = start + this.registeredItemsPerPage;
    return this.registeredEvents.slice(start, end);
  }

  get registeredTotalPages(): number {
    return Math.ceil(this.registeredEvents.length / this.registeredItemsPerPage);
  }

  constructor(
    private authService: AuthService,
    private eventService: EventService,
    private errorService: ErrorService,
    private router: Router,
    private googleCalendarService: GoogleCalendarService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.authService.getProfile().subscribe((user) => {
      this.name = user.name;
      this.isAdmin = user.role === 'admin';

      const calendarData = user.googleCalendar || {};
      this.isCalendarConnected = calendarData.connected ?? false;
      this.googleAccessToken = calendarData.accessToken || null;
      this.googleRefreshToken = calendarData.refreshToken || null;

      // Frissítés localStorage-ben is, ha máshol szükség lenne rá
      localStorage.setItem('user', JSON.stringify(user));
      this.authService.userSubject.next(user);
    });

    this.eventService.loadEvents();

    this.eventService.events$.subscribe((events) => {
      this.events = events.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });

    this.eventService.getMyEventIds().subscribe({
      next: (eventIds: string[]) => {
        this.registeredEventIds = new Set(eventIds);
        this.registeredEvents = this.events.filter((event) =>
          this.registeredEventIds.has(event.id)
        );
      },
      error: (err) => {
        console.error('Nem sikerült betölteni a saját jelentkezéseket:', err);
      },
    });

    // 👇 Token cseréje, ha a Google auth-ból tért vissza
    this.handleGoogleRedirect();
    this.checkGoogleCalendarConnection();
  }

  checkGoogleCalendarConnection(): void {
    const accessToken = localStorage.getItem('google_access_token');
    const refreshToken = localStorage.getItem('google_refresh_token');

    this.isCalendarConnected = !!(accessToken && refreshToken);
  }

  handleGoogleRedirect() {
    const code = this.route.snapshot.queryParamMap.get('code');
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    console.log('🔑 code:', code);

    console.log('🔁 redirect param:', redirect);

    if (code) {
      this.googleCalendarService.exchangeCodeForTokens(code).subscribe({
        next: (res) => {
          localStorage.setItem('google_access_token', res.access_token);
          localStorage.setItem('google_refresh_token', res.refresh_token);

          this.authService.refreshUser(); // 🔁 Itt frissítjük a user-t

          const redirect = this.route.snapshot.queryParamMap.get('redirect');
          this.router.navigate([redirect || '/events']);
        },
        error: (err) => {
          console.error('Hiba a token cserénél', err);
        }
      });
    }
  }



  exportEventToGoogle(eventId: string) {
    if (!this.googleAccessToken || !this.googleRefreshToken) {
      console.warn('Nincs Google token. Előbb hitelesíteni kell!');
      return;
    }

    this.googleCalendarService
      .exportToGoogleCalendar(eventId, this.googleAccessToken, this.googleRefreshToken)
      .subscribe({
        next: (res) => {
          console.log('Exportálva Google Calendarba:', res);
        },
        error: (err) => {
          console.error('Hiba exportáláskor:', err);
        },
      });
  }



  onClickApply(eventId: string) {
    if (this.registeredEventIds.has(eventId)) {
      // Lejelentkezés
      this.eventService.unregisterFromEvent(eventId).subscribe({
        next: () => {
          // Frissítjük a Set-et
          const newSet = new Set(this.registeredEventIds);
          newSet.delete(eventId);
          this.registeredEventIds = newSet;

          // Eltávolítjuk az eseményt a registeredEvents tömbből is
          this.registeredEvents = this.registeredEvents.filter(
            (event) => event.id !== eventId
          );
        },
        error: (err) => console.error('Lejelentkezés hiba:', err),
      });
    } else {
      // Jelentkezés
      this.eventService.registerToEvent(eventId).subscribe({
        next: () => {
          this.registeredEventIds = new Set([
            ...this.registeredEventIds,
            eventId,
          ]);

          const eventToAdd = this.events.find((event) => event.id === eventId);
          if (eventToAdd) {
            this.registeredEvents = [...this.registeredEvents, eventToAdd];
          }
        },
        error: (err) => console.error('Jelentkezés hiba:', err),
      });
    }
  }

  deleteEvent(eventId: string) {
    this.eventService.deleteEvent(eventId).subscribe({
      next: () => {
        console.log('Event deleted:', eventId);

        this.events = this.events.filter((event) => event.id !== eventId);

        const newSet = new Set(this.registeredEventIds);
        newSet.delete(eventId);
        this.registeredEventIds = newSet;

        this.registeredEvents = this.registeredEvents.filter(
          (event) => event.id !== eventId
        );
      },
      error: (err) => {
        console.error('Esemény törlése sikertelen:', err);
        this.errorService.showError(err.message);
      },
    });
  }

  eventDetails(eventId: string) {

    this.router.navigate(['/event-details'], {
      queryParams: { eventId: eventId },
    });

    this.eventService.getRegisteredUsers(eventId).subscribe({
      next: (event) => {

        console.log('Esemény részletei:', event);
      },
      error: (err) => {
        console.error('Esemény részleteinek betöltése sikertelen:', err);
        this.errorService.showError(err.message);
      },
    });
  }

  onConnectGoogleCalendar(): void {
    this.googleCalendarService.redirectToGoogleAuth();
  }




}



