import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const loginGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  if (localStorage.getItem('isLoggedIn') === 'true') {
    return true;
  }

  return router.parseUrl('/login');
};
