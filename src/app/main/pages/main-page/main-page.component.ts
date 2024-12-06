import { Component } from '@angular/core';
import {CalendarComponent} from '../../components/calendar/calendar.component';
import {NewsComponent} from "../../components/news/news.component";

@Component({
  selector: 'app-main-page',
  standalone: true,
    imports: [
        CalendarComponent,
        NewsComponent
    ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent {

}
