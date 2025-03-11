import { inject, Injectable, signal } from "@angular/core";
import { ErrorService } from "../shared/error.service";
import { HttpClient } from "@angular/common/http";
import { AuthData } from "./auth.model";
import { BehaviorSubject, catchError, map, tap, throwError } from "rxjs";

@Injectable({providedIn: 'root'})
export class AuthService{
  private errorService = inject(ErrorService);
  private httpClient = inject(HttpClient);

  private usersSubject = new BehaviorSubject<AuthData[]>([]);
  users$ = this.usersSubject.asObservable(); // Külső komponensek ezt figyelik

  private tokenSubject = new BehaviorSubject<string | null>(null);
  token$ = this.tokenSubject.asObservable();

  fetchUser(url: string) {
    return this.httpClient.get<{ users: AuthData[] }>(url).pipe(
      tap(resData => console.log("API response:", resData)),
      catchError(error => {
        console.error("Error fetching users:", error);
        this.errorService.showError(error.message);
        return throwError(() => new Error(error.message));
      })
    );
  }

  loadUser() {
    this.fetchUser('http://localhost:3000/users').subscribe({
      next: (users: any) => {
        console.log("Users loaded:", users);
        this.usersSubject.next(users); // Frissítjük a BehaviorSubject-et
      },
      error: err => console.error("Error loading users:", err)
    });
  }

  addUser(user: AuthData){
    return this.httpClient.post<AuthData>('http://localhost:3000/register', user).subscribe({
      next: (user) => {
        console.log("User added:", user);
        const currentUsers = this.usersSubject.value; // **Megkapjuk a jelenlegi usereket**
        this.usersSubject.next([...currentUsers, user]); // **Új felhasználó hozzáadása**
      },
      error: err => {
        console.error("Error adding user:", err);
        this.errorService.showError(err.message);
      }
    });
  }

  login(username: string, password: string) {
    console.log("Bejelentkezési kérés elküldve:", { username, password });

    return this.httpClient.post<{ token: string }>(`http://localhost:3000/login`, { username, password }, {
      observe: 'response' // Fontos, hogy a teljes választ figyeljük, ne csak a body-t
    }).pipe(
      tap(response => {
        console.log("Login válasz:", response); // **Megnézzük a szerver válaszát**

        const token = response.body?.token;
        if (!token) {
          throw new Error("Hibás szerver válasz! Token hiányzik.");
        }

        localStorage.setItem('token', token); // Token mentése a LocalStorage-ba
        this.tokenSubject.next(token); // Token beállítása

        // Ellenőrizzük, hogy a válasz tartalmazza-e az `Authorization` fejlécet
        const authHeader = response.headers.get('Authorization');
        console.log("Backend küldte Authorization Header-t?:", authHeader);
      }),
      catchError(error => {
        console.error("Login sikertelen:", error);
        return throwError(() => new Error("Hibás felhasználónév vagy jelszó!"));
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    this.tokenSubject.next(null);
  }

}
