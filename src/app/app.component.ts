import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Route, Router, RouterOutlet} from '@angular/router';
import {CurrentUserService} from './shared/services/current-user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'vip';
  constructor(private route: ActivatedRoute, private currentUser: CurrentUserService, private router: Router) {
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if(token!=undefined){
        this.currentUser.setUser(token);
        this.router.navigate(['/']);

      }
    });
  }
}
