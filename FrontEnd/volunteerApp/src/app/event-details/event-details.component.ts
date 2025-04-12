import { Component } from '@angular/core';
import { EventService } from '../home/event.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-event-details',
  imports: [RouterModule, CommonModule],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.css'
})
export class EventDetailsComponent {

  eventId: string = '';
  registeredUsers: { id: string; name: string; email: string; phoneNumber:string }[] = [];

  constructor(
    private eventService: EventService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.eventId = params['eventId'];
      if (this.eventId) {
        this.loadRegisteredUsers(this.eventId);
      }
    });
  }

  loadRegisteredUsers(eventId: string): void {
    this.eventService.getRegisteredUsers(eventId).subscribe({
      next: (users) => {
        this.registeredUsers = users;
      },
      error: (err) => {
        console.error('Nem sikerült lekérni a regisztráltakat:', err);
      }
    });
  }
}
