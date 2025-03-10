import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { AuthData } from '../auth/auth.model';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-users',
  imports: [RouterLink, CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users: AuthData[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.loadUser();
    this.authService.users$.subscribe(users => {
      this.users = users; // Amint az adat megérkezik, frissül a `users` tömb
      console.log("Users updated:", this.users);
    });
  }
}
