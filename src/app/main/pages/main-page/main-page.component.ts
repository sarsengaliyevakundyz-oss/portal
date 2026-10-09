import { Component, OnInit, OnDestroy } from '@angular/core';
import {CalendarComponent} from '../../components/calendar/calendar.component';
import {NewsComponent} from "../../components/news/news.component";
import {TranslatePipe} from "@ngx-translate/core";
import {RouterLink, RouterOutlet} from '@angular/router';
import { CurrentUserService } from '../../../shared/services/current-user.service';
import { NgIf } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';
import { ChatWidgetComponent } from '../../components/chat/chat-widget.component';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    CalendarComponent,
    NewsComponent,
    TranslatePipe,
    RouterLink,
    NgIf,
    ChatWidgetComponent,
    RouterOutlet
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
    this.authSubscription = combineLatest([
      this.currentUser.isAuthenticated$,
      this.currentUser.isAuthChecked$
    ]).subscribe(([isAuthenticated, isAuthChecked]) => {
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
