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
      next: (res: any) => {
        if (!res) {
          this.isLoading = false;
          return;
        }
        console.log("res - ", res);
        
        this.processCalendarData(res.data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading calendar data:', err);
        this.isLoading = false;
      }
    });
  }

  private processCalendarData(data: any[] | undefined): void {
    console.log('[1] Starting processCalendarData with raw data:', data);
  
    if (!data || !Array.isArray(data)) {
      console.log('[2] No data or data is not array');
      this.allEvents = [];
      this.printCalendar([]);
      return;
    }
  
    this.allEvents = data.map(item => {
      console.log('[3] Processing item:', item);
      
      const [day, month, year] = item.dateEnd.split('.').map(Number);
      const date = new Date(year, month - 1, day);
      
      console.log(`[4] Parsed date: day=${day}, month=${month}, year=${year}, jsDate=${date}`);
      
      return {
        ...item,
        date: date,
        jsMonth: month - 1,
        year: year,
        day: day
      };
    });
  
    console.log('[5] All processed events:', this.allEvents);
  
    const currentMonthEvents = this.allEvents.filter(event => {
      const matches = event.year === this.query.year && event.jsMonth === this.query.month - 1;
      console.log(`[6] Checking event: ${event.dateEnd} | matches=${matches} | queryMonth=${this.query.month}, eventMonth=${event.jsMonth + 1}`);
      return matches;
    });
  
    console.log('[7] Current month events:', currentMonthEvents);
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.nextEvents = this.allEvents
      .filter(event => {
        const isUpcoming = event.date >= today;
        console.log(`[8] Checking upcoming: ${event.dateEnd} | isUpcoming=${isUpcoming}`);
        return isUpcoming;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  
    console.log('[9] Next events:', this.nextEvents);
  
    this.printCalendar(currentMonthEvents);
  }

  private printCalendar(events: any[]): void {
    console.log('[10] Starting printCalendar with events:', events);
  
    this.calendarDays = [];
    const firstDayOfMonth = new Date(this.query.year, this.query.month - 1, 1).getDay();
    const daysInMonth = new Date(this.query.year, this.query.month, 0).getDate();
    const daysInPrevMonth = new Date(this.query.year, this.query.month - 1, 1).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    console.log(`[11] Calendar params: year=${this.query.year}, month=${this.query.month}, daysInMonth=${daysInMonth}, firstDay=${firstDayOfMonth}`);
  
    const eventsByDay: { [key: number]: any[] } = {};
    
    events.forEach(event => {
      const eventDay = event.date.getDate();
      console.log(`[12] Processing event: ${event.dateEnd} -> day ${eventDay}`);
      
      if (!eventsByDay[eventDay]) {
        eventsByDay[eventDay] = [];
      }
      eventsByDay[eventDay].push(event);
    });
  
    console.log('[13] Events grouped by day:', eventsByDay);
  
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
    console.log('[14] Final calendar days:', this.calendarDays.map(day => ({
      date: day.date,
      isHoliday: day.isHoliday,
      eventType: day.eventType,
      events: day.events?.map(e => e.dateEnd)
    })));
  }
}
