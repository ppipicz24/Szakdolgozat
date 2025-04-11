import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-google-callback',
  template: `<p>Bejelentkezés folyamatban...</p>`,
})
export class GoogleCallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const accessToken = this.route.snapshot.queryParamMap.get('access_token');
    const refreshToken = this.route.snapshot.queryParamMap.get('refresh_token');
    const redirect = this.route.snapshot.queryParamMap.get('state') || '/';

    if (accessToken && refreshToken) {
      localStorage.setItem('google_access_token', accessToken);
      localStorage.setItem('google_refresh_token', refreshToken);
    } else {
      console.warn('Hiányzik a token!');
    }

    this.router.navigateByUrl(redirect);
  }
}
