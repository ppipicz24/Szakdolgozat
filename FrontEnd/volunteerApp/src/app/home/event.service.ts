import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { EventModel } from "../new-date/event.model";
import { BehaviorSubject, catchError, Observable, tap, throwError } from "rxjs";
import { ErrorService } from "../shared/error.service";
import { Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class EventService {
    private apiUrl = 'http://localhost:3000/events';

    private myEventsUrl = 'http://localhost:3000/my-events';
    private errorService = inject(ErrorService);

    private eventSubject = new BehaviorSubject<EventModel[]>([]);
    events$ = this.eventSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) { }

    fetchEvents() {
        const token = localStorage.getItem('token');

            if (!token) {
              this.router.navigate(['/auth']); // Ha nincs token, átirányítás loginra
              return new Observable();
            }

        const headers = new HttpHeaders({
              Authorization: `Bearer ${token}`
        });
        return this.http.get<{ events: EventModel[] }>(this.apiUrl, {headers}).pipe(
            tap(resData => console.log("API response:", resData)),
            catchError(error => {
                console.error("Error fetching events:", error);
                this.errorService.showError(error.message);
                return throwError(() => new Error(error.message));
            })
        );
    }

    loadEvents() {
        this.fetchEvents().subscribe({
            next: (events: any) => {
                console.log("Events loaded:", events);
                this.eventSubject.next(events);
            },
            error: err => console.error("Error loading events:", err)
        });
    }

    addEvent(event: EventModel) {
        const token = localStorage.getItem('token');

            if (!token) {
              this.router.navigate(['/auth']); // Ha nincs token, átirányítás loginra
              return new Observable();
            }

        const headers = new HttpHeaders({
              Authorization: `Bearer ${token}`
        });

        return this.http.post<EventModel>(this.apiUrl, event, {headers}).subscribe({
            next: (event) => {
                console.log("Event added:", event);
                const currentEvents = this.eventSubject.value;
                this.eventSubject.next([...currentEvents, event]);
            },
            error: err => {
                console.error("Error adding event:", err)
                this.errorService.showError(err.message);}
        });
    }

    deleteEvent(id: string): Observable<any> {
      const token = localStorage.getItem('token');

      if (!token) {
        this.router.navigate(['/auth']);
        return new Observable();
      }

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      // 🔁 Itt már NEM írjuk meg a subscribe-ot!
      return this.http.delete(`${this.apiUrl}/${id}`, { headers });
    }


    registerToEvent(eventId: string) {
      const token = localStorage.getItem('token');

      if (!token) {
        this.router.navigate(['/auth']);
        return new Observable();
      }

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      return this.http.post(`${this.apiUrl}/${eventId}/register`, {}, { headers }).pipe(
        tap(() => {
          console.log(`Successfully registered to event: ${eventId}`);
        }),
        catchError(err => {
          console.error("Error registering to event:", err);
          this.errorService.showError(err.message);
          return throwError(() => new Error(err.message));
        })
      );
    }

    unregisterFromEvent(eventId: string): Observable<any> {
  const token = localStorage.getItem('token');

  if (!token) {
    this.router.navigate(['/auth']);
    return new Observable();
  }

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.delete(`${this.apiUrl}/${eventId}/unregister`, { headers }).pipe(
    tap(() => console.log("Lejelentkezés sikeres:", eventId)),
    catchError(error => {
      this.errorService.showError(error.message);
      return throwError(() => new Error(error.message));
    })
  );
}


    getMyEventIds(): Observable<string[]> {
      const token = localStorage.getItem('token');

      if (!token) {
        this.router.navigate(['/auth']);
        return new Observable<string[]>();
      }

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      return this.http.get<string[]>(`${this.myEventsUrl}`, { headers }).pipe(
        tap(ids => console.log("✔️ Saját események ID-i:", ids)),
        catchError(error => {
          this.errorService.showError(error.message);
          return throwError(() => new Error(error.message));
        })
      );
    }

    //get users who registered to the event 
    getRegisteredUsers(eventId: string): Observable<any> {
      const token = localStorage.getItem('token');

      if (!token) {
        this.router.navigate(['/auth']);
        return new Observable();
      }

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`
      });

      return this.http.get<any>(`${this.apiUrl}/${eventId}/registered-users`, { headers }).pipe(
        tap(users => console.log("✔️ Regisztrált felhasználók:", users)),
        catchError(error => {
          this.errorService.showError(error.message);
          return throwError(() => new Error(error.message));
        })
      );
    }
}
