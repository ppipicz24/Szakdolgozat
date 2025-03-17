import { Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { UsersComponent } from './users/users.component';
import { AuthComponent } from './auth/auth.component';
import { NewDateComponent } from './new-date/new-date.component';
import { EditComponent } from './edit/edit.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { ForgetPasswordComponent } from './forget-password/forget-password.component';

export const routes: Routes = [
  {path: '', redirectTo: '/home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent},
  {path: 'profile', component: ProfileComponent},
  {path: 'users', component: UsersComponent},
  {path: 'auth', component: AuthComponent},
  {path: 'new-date', component: NewDateComponent},
  {path: 'edit', component: EditComponent},
  {path: 'password-reset', component: PasswordResetComponent},
  {path: 'forget-password', component: ForgetPasswordComponent}


];
