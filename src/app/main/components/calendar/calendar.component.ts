import { Component, OnInit, OnDestroy } from '@angular/core';
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModel, CalendarQuery, CalendarTypeEnum } from '../../../shared/models/calendar.model';
import { CalendarService } from '../../../shared/services/calendar.service';
import { TranslatePipe } from '@ngx-translate/core';
import { NzModalComponent, NzModalService } from 'ng-zorro-antd/modal';
import { NzTableComponent } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzResizableModule, NzResizeEvent } from 'ng-zorro-antd/resizable';
import { CurrentUserService } from '../../../shared/services/current-user.service';
import { Subscription } from 'rxjs';

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
    NzTableComponent,
    NzInputModule,
    NzResizableModule
  ],
  providers: [NzModalService],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit, OnDestroy {
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

  // ==== Модалка "Предстоящие события" ====
  modalQuery: CalendarQuery = {
    type: CalendarTypeEnum.Region,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  } as CalendarQuery;
  modalEvents: any[] = [];
  searchText: string = '';
  isModalLoading: boolean = false;
  yearOptions: number[] = [];

  // Колонки таблицы модалки (с изменяемой шириной)
  cols: { title: string; width: number }[] = [
    { title: 'calendar.sector', width: 200 },
    { title: 'calendar.form', width: 150 },
    { title: 'calendar.reportingPeriod', width: 150 },
    { title: 'calendar.submissionStart', width: 115 },
    { title: 'calendar.respondentDeadline', width: 135 },
    { title: 'calendar.regionDeadline', width: 125 },
    { title: 'calendar.republicDeadline', width: 130 },
  ];

  private resizeRaf: number | null = null;

  onResize({ width }: NzResizeEvent, col: { width: number }): void {
    // применяем ширину не чаще раза за кадр — плавно, без рывков
    if (this.resizeRaf !== null) {
      cancelAnimationFrame(this.resizeRaf);
    }
    this.resizeRaf = requestAnimationFrame(() => {
      col.width = width!;
      this.resizeRaf = null;
    });
  }

  // суммарная ширина колонок — для горизонтального скролла
  get tableWidth(): number {
    return this.cols.reduce((sum, c) => sum + c.width, 0);
  }

  // Отфильтрованный список для таблицы модалки (поиск по объекту/форме и отрасли)
  get filteredModalEvents(): any[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) {
      return this.modalEvents;
    }
    return this.modalEvents.filter(e =>
      (e.formName || '').toLowerCase().includes(q) ||
      (e.sectorName || '').toLowerCase().includes(q)
    );
  }

  private authSubscription: Subscription | undefined;

  constructor(
    private service: CalendarService,
    public currentUser: CurrentUserService,  private modal: NzModalService  // ← добавить

  ) {}

  ngOnInit(): void {
    const cy = new Date().getFullYear();
    this.yearOptions = [cy - 1, cy, cy + 1];

    this.authSubscription = this.currentUser.isAuthChecked$.subscribe(isReady => {
      if (isReady) {
        if (this.currentUser.isAuthenticated()) {
          this.generateCalendar();
        } else {
          this.isLoading = false;
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
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

  // Открытие модалки: стартуем с текущими параметрами календаря
  openEventsModal(): void {
    this.modalQuery = {
      type: this.query.type,
      year: this.query.year,
      month: this.query.month
    } as CalendarQuery;
    this.isShowAllEvents = true;
    this.loadModalEvents();
  }

  // Загрузка событий модалки — дёргает сервис заново с параметрами модалки
  loadModalEvents(): void {
    if (!this.currentUser.isAuthenticated()) {
      this.modalEvents = [];
      return;
    }
    this.isModalLoading = true;
    this.service.getList(this.modalQuery).subscribe({
      next: (res: any) => {
        const data: any[] = res?.data ?? [];

        // Разбираем дату так же, как в календаре (по dateEnd)
        const mapped = data.map(item => {
          const [day, month, year] = item.dateEnd.split('.').map(Number);
          return {
            ...item,
            date: new Date(year, month - 1, day),
            jsMonth: month - 1,
            year: year,
            day: day
          };
        });

        // Та же фильтрация по выбранному месяцу/году, что и в календаре
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();

        // Сортировка: сначала сегодняшние и будущие (по возрастанию),
        // прошедшие — в конце (тоже по возрастанию)
        this.modalEvents = mapped
          .filter(e => e.year === this.modalQuery.year && e.jsMonth === this.modalQuery.month - 1)
          .sort((a, b) => {
            const aPast = a.date.getTime() < todayTime;
            const bPast = b.date.getTime() < todayTime;
            if (aPast !== bPast) {
              return aPast ? 1 : -1; // прошедшие уходят вниз
            }
            return a.date.getTime() - b.date.getTime();
          });

        this.searchText = '';
        this.isModalLoading = false;
      },
      error: (err) => {
        console.error('Error loading modal events:', err);
        this.modalEvents = [];
        this.isModalLoading = false;
      }
    });
  }

  generateCalendar(): void {
    this.isLoading = true;

    this.printCalendar([]);

    if (!this.currentUser.isAuthenticated()) {
      this.isLoading = false;
      return;
    }

    this.service.getList(this.query).subscribe({
      next: (res: any) => {
        if (!res) {
          this.allEvents = [];
          this.nextEvents = [];
          this.isLoading = false;
          return;
        }
        this.processCalendarData(res.data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading calendar data:', err);
        this.allEvents = [];
        this.nextEvents = [];
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

    this.allEvents = data.map(item => {
      const [day, month, year] = item.dateEnd.split('.').map(Number);
      const date = new Date(year, month - 1, day);
      return {
        ...item,
        date: date,
        jsMonth: month - 1,
        year: year,
        day: day
      };
    });
    const currentMonthEvents = this.allEvents.filter(event => {
      const matches = event.year === this.query.year && event.jsMonth === this.query.month - 1;
      return matches;
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.nextEvents = this.allEvents
      .filter(event => {
        const isUpcoming = event.date >= today;
        return isUpcoming;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    this.printCalendar(currentMonthEvents);
  }

  private printCalendar(events: any[]): void {
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

        if (eventTypes.has(CalendarTypeEnum.Region.toString())) {
          eventType = 'region';
        } else if (eventTypes.has(CalendarTypeEnum.Respondent.toString())) {
          eventType = 'respondent';
        }
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
  }
}
