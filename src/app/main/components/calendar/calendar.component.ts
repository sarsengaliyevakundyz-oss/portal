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
    NgIf
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent {
  months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  selectedMonthIndex = new Date().getMonth();
  selectedYear = new Date().getFullYear();

  currentMonthIndex = new Date().getMonth();
  currentYear = new Date().getFullYear();
  selectedRegion = 1;

  get selectedMonthName(): string {
    return this.months[this.selectedMonthIndex];
  }

  prevMonth(): void {
    this.selectedMonthIndex--;
    if (this.selectedMonthIndex < 0) {
      this.selectedMonthIndex = 11;
      this.selectedYear--;
    }
  }

  nextMonth(): void {
    this.selectedMonthIndex++;
    if (this.selectedMonthIndex > 11) {
      this.selectedMonthIndex = 0;
      this.selectedYear++;
    }
  }


  isHoliday(date: Date): boolean {
    // Пример проверки на праздники (можно заменить на реальную логику)
    return date.getDate() === 11;
  }

  selectPreviousYear() {
    this.selectedYear--;
    this.selectedMonthIndex = 11;
  }

  selectNextYear() {
    this.selectedYear++;
    this.selectedMonthIndex = 0;
  }

}
