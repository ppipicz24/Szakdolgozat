import { Component, OnInit} from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { AuthData } from '../auth/auth.model';
import { CommonModule } from '@angular/common';
import { ErrorService } from '../shared/error.service';


@Component({
  selector: 'app-users',
  imports: [CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users: AuthData[] = [];
  isAdmin: boolean = false;
  isCoordinator: boolean = false;

  isAdminUser: boolean = false;
  isCoordinatorUser: boolean = false;

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

  constructor(private authService: AuthService, private errorService: ErrorService) {}

  ngOnInit() {
    this.authService.getUser().subscribe((user) => {

      if (user && typeof user === 'object' && user.role==='admin') {
        this.isAdmin = true;
      } else if(user && typeof user === 'object' && user.role==='coordinator'){
        this.isCoordinator = true;
      }
    });

    this.authService.loadUser();
    this.authService.users$.subscribe(users => {
      this.users = users;
      this.isAdminUser = users.some(user => user.role === 'admin');
      this.isCoordinatorUser = users.some(user => user.role === 'coordinator');

      console.log("Users updated:", this.users);
    });
  }

  updateUserRole(user: any, newRole: string): void {
    if (user.role === newRole) return;

    this.authService.updateUserRole(user.id, newRole).subscribe({
      next: () => {
        user.role = newRole;
        console.log(`${user.name} szerepköre frissítve: ${newRole}`);
      },
      error: (err) => {
        console.error("Hiba a szerepkör frissítésekor:", err);
        this.errorService.showError("Nem sikerült frissíteni a szerepkört.");
      }
    });
  }

  onRoleToggle(user: any, event: Event, newRole: string): void {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;

    const roleToSet = isChecked ? newRole : 'animator';

    this.updateUserRole(user, roleToSet);
  }

}
