import { Component, OnInit, OnDestroy } from '@angular/core';
import {CalendarComponent} from '../../components/calendar/calendar.component';
import {NewsComponent} from "../../components/news/news.component";
import {TranslatePipe} from "@ngx-translate/core";
import {RouterLink} from '@angular/router';
import { CurrentUserService } from '../../../shared/services/current-user.service';
import { NgIf } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    CalendarComponent,
    NewsComponent,
    TranslatePipe,
    RouterLink,
    NgIf
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent implements OnInit, OnDestroy {
  isAuthChecked = false;
  isAuthenticated = false;
  private authSubscription: Subscription | undefined;

  constructor(public currentUser: CurrentUserService) {}

  ngOnInit() {
    console.log('MainPageComponent ngOnInit - initial isAuthChecked:', this.currentUser.getIsAuthChecked());
    
    this.currentUser.initializeAuthState();

    this.authSubscription = combineLatest([
        this.currentUser.isAuthenticated$, 
        this.currentUser.isAuthChecked$
    ]).subscribe(([isAuthenticated, isAuthChecked]) => {
        console.log('Auth status changed - authenticated:', isAuthenticated, 'checked:', isAuthChecked);
        this.isAuthenticated = isAuthenticated;
        this.isAuthChecked = isAuthChecked;
    });
  }

  ngOnDestroy() {
      if (this.authSubscription) {
          this.authSubscription.unsubscribe();
      }
  }
}
