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
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  signupForm: FormGroup;
  redirectTo = '/history';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private backendApi: BackendApiService
  ) {
    this.signupForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.pattern(/^(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/)
        ]
      ]
    });

    const redirectParam = this.route.snapshot.queryParamMap.get('redirectTo');
    this.redirectTo =
      redirectParam && redirectParam.trim() ? redirectParam : '/history';
  }

  get fullName() {
    return this.signupForm.get('fullName');
  }

  get email() {
    return this.signupForm.get('email');
  }

  get password() {
    return this.signupForm.get('password');
  }

  onSubmit(): void {
    if (this.signupForm.invalid || this.isLoading) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const payload = {
      name: this.signupForm.value.fullName,
      email: this.signupForm.value.email,
      password: this.signupForm.value.password
    };

    this.backendApi.signup(payload).subscribe({
      next: () => {
        this.backendApi.login({
          email: payload.email,
          password: payload.password
        }).subscribe({
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
            } else {
              localStorage.setItem('userName', payload.name);
            }

            this.isLoading = false;

            this.router.navigateByUrl(this.redirectTo || '/history', {
              replaceUrl: true
            });
          },
          error: () => {
            this.isLoading = false;
            alert('Signup successful, but auto-login failed. Please login manually.');

            this.router.navigate(['/login'], {
              queryParams: { redirectTo: this.redirectTo || '/history' },
              replaceUrl: true
            });
          }
        });
      },
      error: (error) => {
        this.isLoading = false;

        console.error('Signup full error:', error);
        console.error('Signup status:', error?.status);
        console.error('Signup body:', error?.error);

        const message =
          typeof error?.error === 'string'
            ? error.error
            : error?.error?.message || 'Signup failed. Please try again.';

        alert(message);
      }
    });
  }

  continueWithGoogle(): void {
    window.location.href = this.backendApi.getGoogleOauthUrl();
  }
}