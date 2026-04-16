import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { HistoryComponent } from './features/history/history.component';
import { LoginComponent } from './features/auth/login/login.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { OAuth2CallbackComponent } from './features/auth/oauth2-callback/oauth2-callback.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home',            component: HomeComponent },
  { path: 'login',           component: LoginComponent },
  { path: 'signup',          component: SignupComponent },
  { path: 'oauth2/callback', component: OAuth2CallbackComponent },  // ← NEW

  {
    path: 'history',
    component: HistoryComponent,
    canActivate: [authGuard]
  },

  { path: '**', redirectTo: 'home' }
];