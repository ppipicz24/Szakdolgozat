import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ErrorService } from '../shared/error.service';

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {
  private apiUrl = 'http://localhost:3000/google'; // állítsd be a saját backend URL-ed

  constructor(
    private http: HttpClient,
    private router: Router,
    private errorService: ErrorService
  ) { }

  redirectToGoogleAuth(): void {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user?.id) {
      this.router.navigate(['/auth']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const state = JSON.stringify({
      redirect: '/events',
      userId: user.id
    });

    const encodedState = encodeURIComponent(state);

    this.http.get<{ url: string }>(
      `${this.apiUrl}/auth/google?state=${encodedState}`,
      { headers }
    ).subscribe({
      next: (res) => {
        window.location.href = res.url;
      },
      error: (err) => {
        this.errorService.showError('Nem sikerült elindítani a Google hitelesítést');
      }
    });
  }

  exchangeCodeForTokens(code: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/google/callback?code=${code}`).pipe(
      catchError((err) => {
        this.errorService.showError('Hiba a tokencsere során');
        return throwError(() => new Error(err.message));
      })
    );
  }


  exportToGoogleCalendar(eventId: string, accessToken: string, refreshToken: string): Observable<any> {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/auth']);
      return new Observable();
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const body = {
      eventId,
      access_token: accessToken,
      refresh_token: refreshToken
    };

    return this.http
      .post(`${this.apiUrl}/export-calendar`, body, { headers })
      .pipe(
        catchError((error) => {
          this.errorService.showError(error.message);
          return throwError(() => new Error(error.message));
        })
      );
  }

}
