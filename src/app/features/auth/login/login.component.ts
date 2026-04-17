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
  isLoading = false;

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

    const redirectParam = this.route.snapshot.queryParamMap.get('redirectTo');
    this.redirectTo =
      redirectParam && redirectParam.trim() ? redirectParam : '/history';
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const payload = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.backendApi.login(payload).subscribe({
      next: (response) => {
        if (response?.token) {
          localStorage.setItem('authToken', response.token);
        }

        if (response?.email) {
          localStorage.setItem('userEmail', response.email);
        } else {
          localStorage.setItem('userEmail', payload.email);
        }

        if (response?.name) {
          localStorage.setItem('userName', response.name);
        }

        this.isLoading = false;

        this.router.navigateByUrl(this.redirectTo || '/history', {
          replaceUrl: true
        });
      },
      error: (error) => {
        this.isLoading = false;

        console.error('Login full error:', error);
        console.error('Login status:', error?.status);
        console.error('Login body:', error?.error);

        const message =
          typeof error?.error === 'string'
            ? error.error
            : error?.error?.message || 'Login failed. Please try again.';

        alert(message);
      }
    });
  }

  continueWithGoogle(): void {
    window.location.href = this.backendApi.getGoogleOauthUrl();
  }
}