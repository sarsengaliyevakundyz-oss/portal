import { Component } from '@angular/core';
import {CalendarComponent} from '../../components/calendar/calendar.component';
import {NewsComponent} from "../../components/news/news.component";
import {TranslatePipe} from "@ngx-translate/core";
import {RouterLink} from '@angular/router';
import { CurrentUserService } from '../../../shared/services/current-user.service';
import { NgIf } from '@angular/common';

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
export class MainPageComponent {
  isAuthChecked = false;
  isAuthenticated = false;

  constructor(public currentUser: CurrentUserService) {}

  ngOnInit() {
    this.checkAuthentication();
  }

  async checkAuthentication() {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.isAuthenticated = this.currentUser.isAuthenticated();
    this.isAuthChecked = true;
  }
}
