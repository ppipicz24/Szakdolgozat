import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { AuthData } from './auth.model';
import { FormsModule, ReactiveFormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) {}

  isLoginMode: boolean = true;
  error: string = '';
  formSubmitted: boolean = false;

  users: AuthData[] = [];

ngOnInit(): void {
    this.authService.users$.subscribe(users => {
      this.users = users; // Amint az adat megérkezik, frissül a `users` tömb
      console.log("Users updated:", this.users);
    });

    this.route.queryParams.subscribe(params => {
      this.isLoginMode = params['mode'] !== 'register'; // Ha mode=register, akkor regisztráció módba váltunk
    });
}

  onSwitchMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  onForgetPassword() {
    this.router.navigate(['/forget-password']);
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

    if (this.isLoginMode) {

      console.log("Bejelentkezési kísérlet:", email, password);

      this.authService.login(email, password).subscribe({
        next: () => {
          console.log("Login sikeres!");
          this.error = "";
          this.router.navigate(['/home']);
          // window.location.reload();
        },
        error: (err) => {
          console.error("Login hiba:", err);
          this.error = err.message || "Hiba történt a bejelentkezés során.";
        }
      });

    } else {
      if (password !== password2) {
        this.error = 'A jelszavak nem egyeznek meg!';
        console.log(this.error);
        return;
      }

      console.log('Register');
      const newUser: AuthData = {
        id: Math.random().toString(), // Ideiglenes azonosító, a backend generálhat valódit
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
