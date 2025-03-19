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
}