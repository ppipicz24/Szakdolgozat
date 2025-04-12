import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChangePasswordService {
  private apiUrl = 'http://localhost:3000/auth/new-password'; // Backend API URL

  constructor(private http: HttpClient) {}

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post(this.apiUrl, { oldPassword, newPassword }, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } // JWT Token küldése
    });
  }
}
