import { Component } from '@angular/core';
import {CalendarComponent} from '../../components/calendar/calendar.component';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    CalendarComponent
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent {

}
