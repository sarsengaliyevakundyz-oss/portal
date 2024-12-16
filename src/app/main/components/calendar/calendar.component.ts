import {Component, OnInit} from '@angular/core';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {CommonModule, NgForOf, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CalendarModel, CalendarQuery, CalendarTypeEnum} from '../../../shared/models/calendar.model';
import {CalendarService} from '../../../shared/services/calendar.service';
import {TranslatePipe} from '@ngx-translate/core';

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
    TranslatePipe
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit{
  months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  // currentMonthIndex = new Date().getMonth();
  currentYear = new Date().getFullYear();
  selectedRegion = 1;

  CalendarTypeEnum = CalendarTypeEnum;

  query: CalendarQuery = {type: CalendarTypeEnum.Region, year: new Date().getFullYear(), month:new Date().getMonth()} as CalendarQuery;

  // events = [
  //   {
  //     date: new Date('2024-12-01'),
  //     name: 'Статистика уровня жизни',
  //     formName: 'D 004 (квартальная)',
  //     periodName: '3 квартал 2024 г.'
  //   },
  //   {
  //     date: new Date('2024-12-11'),
  //     name: 'Статистика уровня жизни',
  //     formName: 'D 008 (пять раз в год)',
  //     periodName: '3 квартал 2024 г.'
  //   }
  // ];
  events: CalendarModel[] = [];
  days: { date: number, isPast: boolean, isCurrent: boolean, isHoliday: boolean, isNextMonth: boolean }[] = [];
  isLoading: boolean = false;


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
    // const query = {
    //   ...this.query, // Create a shallow copy of the object
    //   month: this.query.month++ // Increment month safely
    // };
    this.isLoading = true;
    this.service.getList(this.query).subscribe(res=>{
      this.events = res.result.map(item => ({
        ...item, // Spread all other properties
        dateEnd: new Date(item.dateEnd) // Convert dateEnd string to Date object
      }));
      this.printCalendar();
    })
  }

  private printCalendar() {
    this.isLoading = true;
    this.days = [];
    const firstDayOfMonth = new Date(this.query.year, this.query.month, 1).getDay();
    const daysInMonth = new Date(this.query.year, this.query.month + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.query.year, this.query.month, 0).getDate();

    // Заполнение предыдущего месяца
    let startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    for (let i = startDay; i > 0; i--) {
      this.days.push({
        date: daysInPrevMonth - i + 1,
        isPast: true,
        isCurrent: false,
        isHoliday: false,
        isNextMonth: false
      });
    }

    // Заполнение текущего месяца
    const events = this.events.map(z=>z.dateEnd.getDate());
    for (let i = 1; i <= daysInMonth; i++) {
      const isPast = new Date(this.query.year, this.query.month, i) < new Date();
      const isHoliday = events.includes(i);
      this.days.push({
        date: i,
        isPast: isPast,
        isCurrent: !isPast,
        isHoliday: isHoliday,
        isNextMonth: false
      });
    }

    // Заполнение следующего месяца
    const remainingDays = (this.days.length >35 ? 42:35) - this.days.length; // 35-42 ячейки для 6 недель
    for (let i = 1; i <= remainingDays; i++) {
      this.days.push({
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
