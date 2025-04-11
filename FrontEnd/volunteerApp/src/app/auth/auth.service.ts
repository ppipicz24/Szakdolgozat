import { inject, Injectable } from '@angular/core';
import { ErrorService } from '../shared/error.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthData } from './auth.model';
import {
  BehaviorSubject,
  catchError,
  Observable,
  tap,
  throwError,
} from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private errorService = inject(ErrorService);
  private httpClient = inject(HttpClient);

  private usersSubject = new BehaviorSubject<AuthData[]>([]);
  users$ = this.usersSubject.asObservable(); // Külső komponensek ezt figyelik

  userSubject = new BehaviorSubject<any | null>(this.getUserFromStorage());
  user$ = this.userSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(null);
  token$ = this.tokenSubject.asObservable();

  private apiUrl = 'http://localhost:3000';
  private tokenExpirationTimer: any;

  constructor(private router: Router) {
    this.autoLogin();
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000); // jelenlegi idő másodpercben
      return decoded.exp < now;
    } catch (e) {
      return true; // ha hiba van, tekintsd érvénytelennek
    }
  }

  autoLogin() {
    const token = localStorage.getItem('token');
    const user = this.getUserFromStorage();

    if (token && user && !this.isTokenExpired(token)) {
      this.tokenSubject.next(token);
      this.userSubject.next(user);
    } else {
      this.logout();
      this.router.navigate(['/auth']);
    }
  }

  autoLogout(expirationDuration: number) {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }

    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
      this.router.navigate(['/auth']);
    }, expirationDuration);
  }

  private getUserFromStorage() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  fetchUser(url: string) {
    const token = localStorage.getItem('token');

            if (!token) {
              this.router.navigate(['/auth']); // Ha nincs token, átirányítás loginra
              return new Observable();
            }

        const headers = new HttpHeaders({
              Authorization: `Bearer ${token}`
        });

    return this.httpClient.get<{ users: AuthData[] }>(url, {headers}).pipe(
      tap((resData) => console.log('API response:', resData)),
      catchError((error) => {
        this.errorService.showError(error.message);
        return throwError(() => new Error(error.message));
      })
    );
  }

  loadUser() {
    this.fetchUser(`${this.apiUrl}/users`).subscribe({
      next: (users: any) => {
        this.usersSubject.next(users); // Frissítjük a BehaviorSubject-et
      },
      error: (err) => console.error('Error loading users:', err),
    });
  }

  addUser(user: AuthData) {
    return this.httpClient
      .post<AuthData>(`${this.apiUrl}/register`, user)
      .subscribe({
        next: (user) => {
          const currentUsers = this.usersSubject.value; // **Megkapjuk a jelenlegi usereket**
          this.usersSubject.next([...currentUsers, user]); // **Új felhasználó hozzáadása**
        },
        error: (err) => {
                    this.errorService.showError(err.message);
        },
      });
  }

  login(email: string, password: string) {

    return this.httpClient
      .post<{ token: string; user: any }>(
        `${this.apiUrl}/login`,
        { email, password },
        { observe: 'response' }
      )
      .pipe(
        tap((response) => {

          const token = response.body?.token;
          const user = response.body?.user;

          if (!token || !user) {
            throw new Error('Hibás szerver válasz! Token vagy user hiányzik.');
          }

          // Mentés localStorage-ba
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          console.log(user)

          // Állapot frissítése
          this.tokenSubject.next(token);
          this.userSubject.next(user);

          // ⏱️ Token lejárat figyelése
          const decoded: any = jwtDecode(token);
          const expiresInMs = decoded.exp * 1000 - Date.now(); // ms-ben
          this.autoLogout(expiresInMs);
        }),
        catchError((error) => {
          return throwError(
            () => new Error('Hibás felhasználónév vagy jelszó!')
          );
        })
      );
  }

  getUser() {
    return this.userSubject.asObservable(); // **Reaktívan követjük a user változásait**
  }

  refreshUser(): void {
    this.getProfile().subscribe({
      next: (user) => {
        this.userSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user)); // 💾 fontos!
      },
      error: (err) => {
        console.error('Nem sikerült frissíteni a user-t:', err);
      }
    });
  }


  logout() {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_refresh_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.tokenSubject.next(null);
    this.userSubject.next(null); // **Felhasználói adatok törlése**
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getProfile(): Observable<any> {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/auth']); // Ha nincs token, átirányítás loginra
      return new Observable();
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.httpClient.get(`${this.apiUrl}/profile`, { headers });
  }

  updateProfile(updatedData: any): Observable<any> {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('No authentication token found');
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.httpClient
      .patch(`${this.apiUrl}/profile`, updatedData, { headers })
      .pipe(
        tap((response) => {
          // **Frissítsük a helyi user adatokat**
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            const updatedUser = { ...user, ...updatedData }; // **Csak a módosított mezők frissülnek**

            // **Frissített user mentése és behavior subject frissítése**
            localStorage.setItem('user', JSON.stringify(updatedUser));
            this.userSubject.next(updatedUser);
          }
        })
      );
  }

  updateUserRole(userId: string, role: string) {
    const token = localStorage.getItem('token');
    if (!token) return new Observable();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.httpClient.patch(`${this.apiUrl}/users/${userId}/role`, { role }, { headers }).pipe(
      tap(() => console.log("Szerepkör frissítve:", role)),
      catchError(err => {
        this.errorService.showError(err.message);
        return throwError(() => new Error(err.message));
      })
    );
  }
}
