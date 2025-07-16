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
    month: new Date().getMonth() + 1
  } as CalendarQuery;

  allEvents: any[] = [];
  nextEvents: any[] = [];
  calendarDays: { 
    date: number, 
    isPast: boolean, 
    isCurrent: boolean, 
    isHoliday: boolean, 
    isNextMonth: boolean,
    events?: any[],
    eventType?: 'region' | 'respondent'
  }[] = [];
  
  isLoading: boolean = false;
  isShowAllEvents: boolean = false;

  constructor(private service: CalendarService) {}

  ngOnInit(): void {
    this.generateCalendar();
  }

  get selectedMonthName(): string {
    return this.months[this.query.month - 1];
  }

  prevMonth(): void {
    this.query.month--;
    if (this.query.month < 1) {
      this.query.month = 12;
      this.query.year--;
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    this.query.month++;
    if (this.query.month > 12) {
      this.query.month = 1;
      this.query.year++;
    }
    this.generateCalendar();
  }

  selectPreviousYear(): void {
    this.query.year--;
    this.query.month = 12;
    this.generateCalendar();
  }

  selectNextYear(): void {
    this.query.year++;
    this.query.month = 1;
    this.generateCalendar();
  }

  generateCalendar(): void {
    this.allEvents = []; 
    this.nextEvents = [];
    this.isLoading = true;
    
    this.service.getList(this.query).subscribe({
      next: (res) => {
        if (!res) {
          this.isLoading = false;
          return;
        }
        this.processCalendarData(res.result);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading calendar data:', err);
        this.isLoading = false;
      }
    });
  }

  private processCalendarData(data: any[] | undefined): void {
    if (!data || !Array.isArray(data)) {
      this.allEvents = [];
      this.printCalendar([]);
      return;
    }
  
    console.log('Raw API data:', data);

    this.allEvents = data.map(item => {
      const dateParts = item.dateEnd.split(/[\.\/]/);
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const year = parseInt(dateParts[2], 10);
      
      return {
        ...item,
        date: new Date(year, month, day),
        month: month,
        year: year,
        day: day
      };
    });
  
    console.log('Processed events:', this.allEvents);
  
    const currentMonthEvents = this.allEvents.filter(event => 
      event.year === this.query.year && 
      event.month === this.query.month - 1
    );
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.nextEvents = this.allEvents
      .filter(event => event.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  
    this.printCalendar(currentMonthEvents);
  }

  private printCalendar(events: any[]): void {
    console.log('Events for printCalendar:', events);
    
    this.calendarDays = [];
    const firstDayOfMonth = new Date(this.query.year, this.query.month - 1, 1).getDay();
    const daysInMonth = new Date(this.query.year, this.query.month, 0).getDate();
    const daysInPrevMonth = new Date(this.query.year, this.query.month - 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventsByDay: { [key: number]: any[] } = {};
    events.forEach(event => {
      const eventDay = event.date.getDate();

      if (!eventsByDay[eventDay]) {
        eventsByDay[eventDay] = [];
      }
      eventsByDay[eventDay].push(event);
    });

    console.log('Events by day:', eventsByDay);
  
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
  
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.query.year, this.query.month - 1, day);
      const isPast = date < today;
      const dayEvents = eventsByDay[day] || [];
      
      let eventType: 'region' | 'respondent' | undefined;
      if (dayEvents.length > 0) {
        const eventTypes = new Set(dayEvents.map(e => e.type.toString()));
        
        if (eventTypes.has('1')) eventType = 'region';
        if (eventTypes.has('2')) eventType = 'respondent';
      }
  
      this.calendarDays.push({
        date: day,
        isPast: isPast,
        isCurrent: date.toDateString() === today.toDateString(),
        isHoliday: dayEvents.length > 0, 
        isNextMonth: false,
        events: dayEvents,
        eventType: eventType 
      });
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

    console.log('Generated calendar days:', this.calendarDays);
  }
}
