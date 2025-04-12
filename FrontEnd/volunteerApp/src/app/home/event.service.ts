import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EventModel } from '../new-date/event.model';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { ErrorService } from '../shared/error.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private apiUrl = 'http://localhost:3000/events/events';

  private myEventsUrl = 'http://localhost:3000/events/my-events';
  private errorService = inject(ErrorService);

  private eventSubject = new BehaviorSubject<EventModel[]>([]);
  events$ = this.eventSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  fetchEvents() {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/auth']);
      return new Observable();
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http
      .get<{ events: EventModel[] }>(this.apiUrl, { headers })
      .pipe(
        catchError((error) => {
          this.errorService.showError(error.message);
          return throwError(() => new Error(error.message));
        })
      );
  }

  loadEvents() {
    this.fetchEvents().subscribe({
      next: (events: any) => {
        this.eventSubject.next(events);
      },
      error: (err) => console.error('Error loading events:', err),
    });
  }

  addEvent(event: EventModel) {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/auth']);
      return new Observable();
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .post<EventModel>(this.apiUrl, event, { headers })
      .subscribe({
        next: (event) => {
          const currentEvents = this.eventSubject.value;
          this.eventSubject.next([...currentEvents, event]);
        },
        error: (err) => {
          this.errorService.showError(err.message);
        },
      });
  }

  deleteEvent(id: string): Observable<any> {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/auth']);
      return new Observable();
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }

  registerToEvent(eventId: string) {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/auth']);
      return new Observable();
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .post(`${this.apiUrl}/${eventId}/register`, {}, { headers })
      .pipe(
        catchError((err) => {
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
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .delete(`${this.apiUrl}/${eventId}/unregister`, { headers })
      .pipe(
        catchError((error) => {
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
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<string[]>(`${this.myEventsUrl}`, { headers }).pipe(
      catchError((error) => {
        this.errorService.showError(error.message);
        return throwError(() => new Error(error.message));
      })
    );
  }

  getRegisteredUsers(eventId: string): Observable<any> {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/auth']);
      return new Observable();
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .get<any>(`${this.apiUrl}/${eventId}/registered-users`, { headers })
      .pipe(
        catchError((error) => {
          this.errorService.showError(error.message);
          return throwError(() => new Error(error.message));
        })
      );
  }


}
