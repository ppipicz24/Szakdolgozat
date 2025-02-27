import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
// import { Router } from 'express';
// import { AuthComponent } from '../auth/auth.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isAuth = false;

  // constructor(private auth:AuthComponent){}
}
