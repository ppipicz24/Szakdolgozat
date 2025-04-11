import { Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { UsersComponent } from './users/users.component';
import { AuthComponent } from './auth/auth.component';
import { NewDateComponent } from './new-date/new-date.component';
import { EditComponent } from './edit/edit.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { ForgetPasswordComponent } from './forget-password/forget-password.component';
import { EventDetailsComponent } from './event-details/event-details.component';
import { GoogleCallbackComponent } from './home/calendar.compontent';

export const routes: Routes = [
  {path: '', redirectTo: !localStorage.getItem('token') ? '/auth' : '/home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent},
  { path: 'events', redirectTo: '/home', pathMatch: 'full' },
  {path: 'profile', component: ProfileComponent},
  {path: 'users', component: UsersComponent},
  {path: 'auth', component: AuthComponent},
  {path: 'new-date', component: NewDateComponent},
  {path: 'edit', component: EditComponent},
  {path: 'password-reset', component: PasswordResetComponent},
  {path: 'forget-password', component: ForgetPasswordComponent},
  {path: 'event-details', component: EventDetailsComponent},
  // {path: 'auth/google/callback',component: GoogleCallbackComponent},
  { path: 'google/callback', component: GoogleCallbackComponent }


];
