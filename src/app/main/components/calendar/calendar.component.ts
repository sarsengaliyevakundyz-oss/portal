import {Component, OnInit} from '@angular/core';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {CommonModule, NgForOf, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CalendarModel, CalendarQuery, CalendarTypeEnum} from '../../../shared/models/calendar.model';
import {CalendarService} from '../../../shared/services/calendar.service';
import {TranslatePipe} from '@ngx-translate/core';
import {NzModalComponent, NzModalService} from 'ng-zorro-antd/modal';
import {NzTableComponent} from 'ng-zorro-antd/table';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    NgForOf,
    FormsModule,
    NgIf,
    NzSelectComponent,
    NzOptionComponent,
    CommonModule,
    TranslatePipe,
    NzModalComponent,
    NzTableComponent
  ],
  providers: [NzModalService], // Add the provider here,
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit{
  months = [
    'Month.January', 'Month.February', 'Month.March', 'Month.April',
    'Month.May', 'Month.June', 'Month.July', 'Month.August',
    'Month.September', 'Month.October', 'Month.November', 'Month.December'
  ];

  // currentMonthIndex = new Date().getMonth();
  currentYear = new Date().getFullYear();
  CalendarTypeEnum = CalendarTypeEnum;

  query: CalendarQuery = {type: CalendarTypeEnum.Region, year: new Date().getFullYear(), month:new Date().getMonth()} as CalendarQuery;

  allEvents: CalendarModel[] = [];
  nextEvents: CalendarModel[] = [];
  calendarDays: { date: number, isPast: boolean, isCurrent: boolean, isHoliday: boolean, isNextMonth: boolean }[] = [];
  isLoading: boolean = false;
  isShowAllEvents: boolean =false;


  constructor(private service: CalendarService) {
  }

  ngOnInit(): void {
    this.generateCalendar();
  }

  get selectedMonthName(): string {
    return this.months[this.query.month];
  }

  prevMonth(): void {
    this.query.month--;
    if (this.query.month < 0) {
      this.query.month = 11;
      this.query.year--;
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    this.query.month++;
    if (this.query.month > 11) {
      this.query.month = 0;
      this.query.year++;
    }
    this.generateCalendar();
  }

  selectPreviousYear(): void {
    this.query.year--;
    this.query.month = 11;
    this.generateCalendar();
  }

  selectNextYear(): void {
    this.query.year++;
    this.query.month = 0;
    this.generateCalendar();
  }

  generateCalendar(): void {
    this.allEvents = []; this.nextEvents = [];
    // const query = {
    //   ...this.query, // Create a shallow copy of the object
    //   month: this.query.month++ // Increment month safely
    // };
    this.isLoading = true;
    this.service.getList(this.query).subscribe(res=>{
      const today = new Date();

      this.allEvents = res.result.map(item => ({
        ...item, // Spread all other properties
        dateEnd: new Date(item.dateEnd) // Convert dateEnd string to Date object
      }))
        .filter(z=>z.dateEnd.getMonth() === this.query.month)
        .sort((a, b) => a.dateEnd.getDate() - b.dateEnd.getDate());
      this.nextEvents = this.allEvents
        .filter(z => {
          return (
            z.dateEnd.getFullYear() === today.getFullYear() &&
            z.dateEnd.getMonth() === today.getMonth() &&
            z.dateEnd.getDate() >= today.getDate()
          );
        });
      this.printCalendar();
    })
  }

  private printCalendar() {
    this.isLoading = true;
    this.calendarDays = [];
    const firstDayOfMonth = new Date(this.query.year, this.query.month, 1).getDay();
    const daysInMonth = new Date(this.query.year, this.query.month + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.query.year, this.query.month, 0).getDate();

    // Заполнение предыдущего месяца
    let startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const today = new Date();
    const nextDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1); // Normalize to start of the day
    console.log(nextDay)
    for (let i = startDay; i > 0; i--) {
      this.calendarDays.push({
        date: daysInPrevMonth - i + 1,
        isPast: true,
        isCurrent: false,
        isHoliday: false,
        isNextMonth: false
      });
    }

    // Заполнение текущего месяца
    const events = this.allEvents.map(z=>z.dateEnd.getDate());

    for (let i = 1; i <= daysInMonth; i++) {
      const isPast = new Date(this.query.year, this.query.month, i) < nextDay;
      const isHoliday = events.includes(i);
      this.calendarDays.push({
        date: i,
        isPast: isPast,
        isCurrent: !isPast,
        isHoliday: isHoliday,
        isNextMonth: false
      });
    }

    // Заполнение следующего месяца
    const remainingDays = (this.calendarDays.length >35 ? 42:35) - this.calendarDays.length; // 35-42 ячейки для 6 недель
    for (let i = 1; i <= remainingDays; i++) {
      this.calendarDays.push({
        date: i,
        isPast: false,
        isCurrent: false,
        isHoliday: false,
        isNextMonth: true
      });
    }
    this.isLoading = false;

  }
}
