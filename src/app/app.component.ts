import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, NavigationError, Route, Router, RouterOutlet} from '@angular/router';
import {CurrentUserService} from './shared/services/current-user.service';
import {UmamiService} from './core/services/Umami.service';
import { ChatWidgetComponent } from './main/components/chat/chat-widget.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatWidgetComponent],
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
    // ✅ Перезагружаем страницу если чанки не загрузились (после деплоя)
    this.router.events.subscribe(event => {
      if (event instanceof NavigationError) {
        const error = (event as any).error;
        const isChunkError = error?.message?.includes('Failed to fetch dynamically imported module') ||
          error?.message?.includes('Loading chunk') ||
          error?.name === 'ChunkLoadError';
        if (isChunkError) {
          window.location.href = event.url; // ✅ Перезагружаем на нужный URL
        }
      }
    });

    setTimeout(() => {
      this.currentUser.getCurrentUser();
    }, 0);

    this.route.queryParams.subscribe(params => {
      const token = params['access_token'];
      const refresh = params['refresh_token'];
      if (token != undefined) {
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
