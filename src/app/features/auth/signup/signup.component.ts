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

    this.redirectTo =
      this.route.snapshot.queryParamMap.get('redirectTo') || '/history';
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
    if (this.signupForm.valid) {
      const payload = {
        name: this.signupForm.value.fullName,
        email: this.signupForm.value.email,
        password: this.signupForm.value.password
      };

      this.backendApi.signup(payload).subscribe({
        next: () => {
          localStorage.setItem('userName', payload.name);
          this.router.navigate(['/login'], {
            queryParams: { redirectTo: this.redirectTo }
          });
        },
        error: (error) => {
          const message = error?.error || 'Signup failed. Please try again.';
          alert(message);
        }
      });
    } else {
      this.signupForm.markAllAsTouched();
    }
  }

  continueWithGoogle(): void {
    window.location.href = this.backendApi.getGoogleOauthUrl();
  }
}