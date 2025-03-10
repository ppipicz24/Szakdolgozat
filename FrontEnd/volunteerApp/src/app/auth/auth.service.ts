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
}
