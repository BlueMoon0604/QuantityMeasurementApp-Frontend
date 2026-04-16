import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const hasToken = !!localStorage.getItem('authToken');

  if (isLoggedIn && hasToken) {
    return true;
  }

  router.navigate(['/login'], {
    queryParams: { redirectTo: state.url }
  });

  return false;
};