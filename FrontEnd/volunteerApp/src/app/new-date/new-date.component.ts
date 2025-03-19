import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventModel } from './event.model';
import { EventService } from '../home/event.service';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-new-date',
  imports: [RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './new-date.component.html',
  styleUrl: './new-date.component.css'
})
export class NewDateComponent implements OnInit {
  error: string = '';
  formSubmitted: boolean = false;

  events: EventModel[] = [];

  constructor(private router: Router, private route: ActivatedRoute, private eventService: EventService) {}

  ngOnInit() {
    this.eventService.events$.subscribe(events => {
      this.events = events; // Amint az adat megérkezik, frissül az `events` tömb
      console.log("Events updated:", this.events);
    });
  }

  onSubmit(form: NgForm) {
    this.formSubmitted = true;

    if (!form.valid) {
      console.log('Invalid form');
      return;
    }

    const name = form.value.name;
    const date = form.value.date;
    const time = form.value.time;
    const numberOfPeople = form.value.numberOfPeople;
    const age = form.value.age;
    const isHungarian = form.value.isHungarian;

    this.eventService.addEvent({
      name,
      date,
      time,
      numberOfPeople,
      age,
      isHungarian,
      isFull: false,
    });

    this.router.navigate(['/home']);
  }

  

}
