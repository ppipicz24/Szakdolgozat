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

  private userSubject = new BehaviorSubject<any | null>(this.getUserFromStorage());
  user$ = this.userSubject.asObservable();

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

   // **Login metódus**
   login(username: string, password: string) {
    console.log("Bejelentkezési kérés:", { username, password });

    return this.httpClient.post<{ token: string, user: any }>(
      `http://localhost:3000/login`,
      { username, password },
      { observe: 'response' }
    ).pipe(
      tap(response => {
        console.log("Login response:", response);

        const token = response.body?.token;
        const user = response.body?.user;

        if (!token || !user) {
          throw new Error("Hibás szerver válasz! Token vagy user hiányzik.");
        }

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        this.tokenSubject.next(token);
        this.userSubject.next(user); // **Frissítjük a BehaviorSubject-et is**
      }),
      catchError(error => {
        console.error("Login sikertelen:", error);
        return throwError(() => new Error("Hibás felhasználónév vagy jelszó!"));
      })
    );
  }

  getUser() {
    return this.userSubject.asObservable(); // **Reaktívan követjük a user változásait**
  }

  private getUserFromStorage() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.tokenSubject.next(null);
    this.userSubject.next(null); // **Felhasználói adatok törlése**
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }


}
