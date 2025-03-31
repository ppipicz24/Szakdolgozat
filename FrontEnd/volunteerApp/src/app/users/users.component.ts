import { Component, OnInit} from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { AuthData } from '../auth/auth.model';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-users',
  imports: [CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users: AuthData[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 5;

  get paginatedUsers(): AuthData[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.users.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.users.length / this.itemsPerPage);
  }

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.loadUser();
    this.authService.users$.subscribe(users => {
      this.users = users; // Amint az adat megérkezik, frissül a `users` tömb
      console.log("Users updated:", this.users);
    });
  }
}
