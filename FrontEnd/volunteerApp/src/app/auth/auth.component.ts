import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';
import { AuthData } from './auth.model';
import { FormsModule, ReactiveFormsModule, NgForm } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent implements OnInit {
  constructor(private authService: AuthService) {}

  isLoginMode: boolean = true;
  error: string = '';
  formSubmitted: boolean = false;

  users: AuthData[] = [];

ngOnInit(): void {
    this.authService.loadUser();
    this.authService.users$.subscribe(users => {
      this.users = users; // Amint az adat megérkezik, frissül a `users` tömb
      console.log("Users updated:", this.users);
    });
}

  onSwitchMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  onSubmit(form: NgForm) {
    this.formSubmitted = true;

    if (!form.valid) {
      console.log('Invalid form');
      return;
    }

    const email = form.value.email;
    const password = form.value.password;
    const password2 = form.value.password2;
    const name = form.value.name;
    const phoneNumber = form.value.phone;
    const username = form.value.username;

    if (this.isLoginMode) {
      console.log('Login');
      //TODO Login
    } else {
      if (password !== password2) {
        this.error = 'A jelszavak nem egyeznek meg!';
        console.log(this.error);
        return;
      }

      console.log('Register');
      const newUser: AuthData = {
        id: Math.random().toString(), // Ideiglenes azonosító, a backend generálhat valódit
        username: username,
        name: name,
        email: email,
        password: password,
        phoneNumber: phoneNumber,
        role: 'animator',
      };
      this.authService.addUser(newUser);
      form.reset();
      this.formSubmitted = false;
      this.isLoginMode = true;
    }
  }
}
