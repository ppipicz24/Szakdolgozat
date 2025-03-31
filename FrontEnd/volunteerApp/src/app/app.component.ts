import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { ErrorModalComponent } from './shared/modal/error-modal/error-modal.component';
import { ErrorService } from './shared/error.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, ErrorModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'volunteerApp';

  errorService = inject(ErrorService);

  error = this.errorService.error;
}
