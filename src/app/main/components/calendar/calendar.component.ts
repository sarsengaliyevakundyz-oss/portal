import { Component, OnInit } from '@angular/core';
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModel, CalendarQuery, CalendarTypeEnum } from '../../../shared/models/calendar.model';
import { CalendarService } from '../../../shared/services/calendar.service';
import { TranslatePipe } from '@ngx-translate/core';
import { NzModalComponent, NzModalService } from 'ng-zorro-antd/modal';
import { NzTableComponent } from 'ng-zorro-antd/table';

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
  providers: [NzModalService],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit {
  months = [
    'Month.January', 'Month.February', 'Month.March', 'Month.April',
    'Month.May', 'Month.June', 'Month.July', 'Month.August',
    'Month.September', 'Month.October', 'Month.November', 'Month.December'
  ];

  // currentMonthIndex = new Date().getMonth();
  currentYear = new Date().getFullYear();
  CalendarTypeEnum = CalendarTypeEnum;

  query: CalendarQuery = { 
    type: CalendarTypeEnum.Region, 
    year: new Date().getFullYear(), 
    month: new Date().getMonth() 
  } as CalendarQuery;

  allEvents: any[] = [];
  nextEvents: any[] = [];
  calendarDays: { 
    date: number, 
    isPast: boolean, 
    isCurrent: boolean, 
    isHoliday: boolean, 
    isNextMonth: boolean,
    events?: any[] 
  }[] = [];
  
  isLoading: boolean = false;
  isShowAllEvents: boolean = false;

  constructor(private service: CalendarService) {}

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
    this.allEvents = []; 
    this.nextEvents = [];
    this.isLoading = true;
    
    this.service.getList(this.query).subscribe({
      next: (res) => {
        this.processCalendarData(res.result);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading calendar data:', err);
        this.isLoading = false;
      }
    });
  }

  private processCalendarData(data: any[]): void {
    this.allEvents = data.map(item => ({
      ...item,
      date: new Date(item.date),
      month: item.month - 1 
    }));

    const currentMonthEvents = this.allEvents.filter(event => 
      event.year === this.query.year && 
      event.month === this.query.month
    );

    currentMonthEvents.sort((a, b) => a.date.getDate() - b.date.getDate());

    this.printCalendar(currentMonthEvents);
  }

  private printCalendar(events: any[]): void {
    this.calendarDays = [];
    const firstDayOfMonth = new Date(this.query.year, this.query.month, 1).getDay();
    const daysInMonth = new Date(this.query.year, this.query.month + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.query.year, this.query.month, 0).getDate();
    const today = new Date();
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const eventsByDay: { [key: number]: any[] } = {};
    events.forEach(event => {
      const day = event.date.getDate();
      if (!eventsByDay[day]) {
        eventsByDay[day] = [];
      }
      eventsByDay[day].push(event);
    });

    let startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    for (let i = startDay; i > 0; i--) {
      this.calendarDays.push({
        date: daysInPrevMonth - i + 1,
        isPast: true,
        isCurrent: false,
        isHoliday: false,
        isNextMonth: false
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(this.query.year, this.query.month, i);
      const isPast = date < currentDate;
      const dayEvents = eventsByDay[i] || [];
      
      this.calendarDays.push({
        date: i,
        isPast: isPast,
        isCurrent: !isPast,
        isHoliday: dayEvents.length > 0,
        isNextMonth: false,
        events: dayEvents
      });

      if (!isPast && dayEvents.length > 0) {
        this.nextEvents.push(...dayEvents);
      }
    }

    const remainingDays = (this.calendarDays.length > 35 ? 42 : 35) - this.calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      this.calendarDays.push({
        date: i,
        isPast: false,
        isCurrent: false,
        isHoliday: false,
        isNextMonth: true
      });
    }
  }
}
