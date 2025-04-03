import { Component } from '@angular/core';
import {CalendarComponent} from '../../components/calendar/calendar.component';
import {NewsComponent} from "../../components/news/news.component";
import {TranslatePipe} from "@ngx-translate/core";
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    CalendarComponent,
    NewsComponent,
    TranslatePipe,
    RouterLink
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent {

    protected readonly window = window;
}
