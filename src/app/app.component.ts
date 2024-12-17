import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Route, Router, RouterOutlet} from '@angular/router';
import {CurrentUserService} from './shared/services/current-user.service';
import {UmamiService} from './core/services/Umami.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'vip';
  constructor(private route: ActivatedRoute, private currentUser: CurrentUserService, private router: Router,
              private umamiService: UmamiService) {
  }

  ngOnInit(): void {
    this.setBackground();
    this.route.queryParams.subscribe(params => {
      const token = params['access_token'];
      const refresh = params['refresh_token'];
      if(token!=undefined){
        this.currentUser.setUser(token, refresh);
        this.router.navigate(['/']);
      }
    });
    this.umamiService.initializeManualPageTracking();
  }

  private setBackground() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (this.router.url === '/') {
          // Главная страница
          document.body.classList.add('home-background');
          document.body.classList.remove('partial-background');
        } else {
          // Другие страницы
          document.body.classList.remove('home-background');
          document.body.classList.add('partial-background');
        }
      }
    });
  }
}
