import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oauth2-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;justify-content:center;align-items:center;
                height:100vh;font-family:sans-serif;color:#fff;background:#0f0f0f;">
      <p>Signing you in with Google…</p>
    </div>
  `
})
export class OAuth2CallbackComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');
    const name  = this.route.snapshot.queryParamMap.get('name');

    if (token && email) {
      localStorage.setItem('authToken',  token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail',  email);
      localStorage.setItem('userName',   name || email.split('@')[0]);
      this.router.navigate(['/history']);
    } else {
      this.router.navigate(['/login'], { queryParams: { error: 'true' } });
    }
  }
}