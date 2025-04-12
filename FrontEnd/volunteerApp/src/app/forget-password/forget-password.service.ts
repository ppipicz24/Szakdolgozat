import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ForgotPasswordService {
  private apiUrl = 'http://localhost:3000/auth/forgot-password'; 

  constructor(private http: HttpClient) {}

  requestNewPassword(email: string): Observable<any> {
    return this.http.post(this.apiUrl, { email });
  }
}
