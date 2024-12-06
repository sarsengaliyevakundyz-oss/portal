import { Component, OnInit } from '@angular/core';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {CommonModule, NgForOf, NgIf} from '@angular/common';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {FormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    NgForOf,
    FormsModule,
    NgIf,
    NzSelectComponent,
    NzOptionComponent,
    CommonModule
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit{
  months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  selectedMonthIndex = new Date().getMonth();
  selectedYear = new Date().getFullYear();

  currentMonthIndex = new Date().getMonth();
  currentYear = new Date().getFullYear();
  selectedRegion = 1;

  holidays = [1, 9, 14]; // Пример дат праздников
  days: { date: number, isPast: boolean, isCurrent: boolean, isHoliday: boolean }[] = [];

  ngOnInit(): void {
    this.generateCalendar();
  }

  get selectedMonthName(): string {
    return this.months[this.selectedMonthIndex];
  }

  prevMonth(): void {
    this.selectedMonthIndex--;
    if (this.selectedMonthIndex < 0) {
      this.selectedMonthIndex = 11;
      this.selectedYear--;
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    this.selectedMonthIndex++;
    if (this.selectedMonthIndex > 11) {
      this.selectedMonthIndex = 0;
      this.selectedYear++;
    }
    this.generateCalendar();
  }

  selectPreviousYear(): void {
    this.selectedYear--;
    this.selectedMonthIndex = 11;
    this.generateCalendar();
  }

  selectNextYear(): void {
    this.selectedYear++;
    this.selectedMonthIndex = 0;
    this.generateCalendar();
  }

  generateCalendar(): void {
    this.days = [];
    const firstDayOfMonth = new Date(this.selectedYear, this.selectedMonthIndex, 1).getDay();
    const daysInMonth = new Date(this.selectedYear, this.selectedMonthIndex + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.selectedYear, this.selectedMonthIndex, 0).getDate();

    // Заполнение предыдущего месяца
    let startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    for (let i = startDay; i > 0; i--) {
      this.days.push({
        date: daysInPrevMonth - i + 1,
        isPast: true,
        isCurrent: false,
        isHoliday: false
      });
    }

    // Заполнение текущего месяца
    for (let i = 1; i <= daysInMonth; i++) {
      const isPast = new Date(this.selectedYear, this.selectedMonthIndex, i) < new Date();
      const isHoliday = this.holidays.includes(i);
      this.days.push({
        date: i,
        isPast: isPast,
        isCurrent: !isPast,
        isHoliday: isHoliday
      });
    }

    // Заполнение следующего месяца
    const remainingDays = (this.days.length >35 ? 42:35) - this.days.length; // 42 ячейки для 6 недель
    for (let i = 1; i <= remainingDays; i++) {
      this.days.push({
        date: i,
        isPast: true,
        isCurrent: false,
        isHoliday: false
      });
    }
  }

}
