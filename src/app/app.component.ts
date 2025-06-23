import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CurrentUserService } from './shared/services/current-user.service';
import { UmamiService } from './core/services/Umami.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'vip';

  constructor(
    private route: ActivatedRoute,
    private currentUserService: CurrentUserService,
    private router: Router,
    private umamiService: UmamiService
  ) {}

  ngOnInit(): void {
    if (!this.currentUserService.isAuthenticated()) {
      this.currentUserService.logout();
      return;
    }

    this.route.queryParams.subscribe(params => {
      const token = params['access_token'];
      const refresh = params['refresh_token'];
      if (token) {
        this.currentUserService.setUser(token, refresh);
        this.router.navigate(['/']);
      }
    });

    this.umamiService.initializeManualPageTracking();

    this.setBackground();
  }

  private setBackground(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (this.router.url === '/') {
          document.body.classList.add('home-background');
          document.body.classList.remove('partial-background');
        } else {
          document.body.classList.remove('home-background');
          document.body.classList.add('partial-background');
        }
      }
    });
  }
}
