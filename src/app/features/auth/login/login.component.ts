import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BackendApiService } from '../../../core/services/backend-api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  redirectTo = '/history';
  oauthError = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private backendApi: BackendApiService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.redirectTo =
      this.route.snapshot.queryParamMap.get('redirectTo') || '/history';

    if (this.route.snapshot.queryParamMap.get('error') === 'true') {
      this.oauthError = 'Google login failed. Please try again.';
    }
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.backendApi.login({ email, password }).subscribe({
        next: (response) => {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userEmail', email);

          if (response?.token) {
            localStorage.setItem('authToken', response.token);
          }

          if (!localStorage.getItem('userName')) {
            const derivedName = typeof email === 'string' ? email.split('@')[0] : 'User';
            localStorage.setItem('userName', derivedName || 'User');
          }

          this.router.navigate([this.redirectTo]);
        },
        error: (error) => {
          const message =
            error?.error?.message || error?.error || 'Login failed. Please try again.';
          alert(message);
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  continueWithGoogle(): void {
    window.location.href = this.backendApi.getGoogleOauthUrl();
  }
}