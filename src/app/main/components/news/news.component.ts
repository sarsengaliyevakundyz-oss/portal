import { Component } from '@angular/core';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {NewsItem} from '../../../shared/models/news';
import {TranslatePipe} from "@ngx-translate/core";

@Component({
  selector: 'app-news',
  standalone: true,
    imports: [
        NgIf,
        DatePipe,
        NgForOf,
        TranslatePipe
    ],
  templateUrl: './news.component.html',
  styleUrl: './news.component.css'
})
export class NewsComponent {

  months = [
    'Month.January', 'Month.February', 'Month.March', 'Month.April',
    'Month.May', 'Month.June', 'Month.July', 'Month.August',
    'Month.September', 'Month.October', 'Month.November', 'Month.December'
  ];
  selectedMonthIndex = new Date().getMonth();
  selectedYear = new Date().getFullYear();

  currentMonthIndex = new Date().getMonth();
  currentYear = new Date().getFullYear();


  news: NewsItem[] = [
    {
      id: 1,
      date: '2022-12-13',
      title: 'Новые правила работы скорой помощи: что изменится для казахстанцев?',
      shortText: '"Скорая помощь больше не сможет обслуживать круглосуточно всех пациентов без исключения". Осенью эта новость прогремела на всю страну. Корреспондент Tengrinews.kz познакомилась с работой столичной станции скорой, где узнала, как распределяются вызовы, почему важно правильно сообщать все детали диспетчеру и что делать, если помощь требуется немедленно.',
      fullText: 'Полный текст новости...',
      mainImageUrl: 'news/news_image.png'
    },
    {
      id: 2,
      date: '2024-11-04',
      title: 'ПРОДЛЕНИЕ СРОКОВ',
      shortText: 'По статистической форме 29-сх (один раз в год) срок сдачи отчетности в режиме он-лайн продлен до 15 ноября 2024 года включительно.',
      fullText: 'Полный текст новости...',
      mainImageUrl: ''
    },
    {
      id: 3,
      date: '2024-10-30',
      title: 'ПРОДЛЕНИЕ СРОКОВ',
      shortText: 'По статистической форме 1-П (квартальная) срок сдачи отчетности в режиме он-лайн продлен до 31 октября 2024 года включительно.',
      fullText: 'Полный текст новости...',
      mainImageUrl: ''
    },
    {
      id: 4,
      date: '2024-10-18',
      title: 'ТЕЛЕФОНОГРАММА',
      shortText: 'АО «Национальные информационные технологии» сообщает, что с 19 по 20 октября 2024 года будут проводиться плановые работы по информационным системам согласно приложению с указанием даты и времени проведения работ.',
      fullText: 'Полный текст новости...',
      mainImageUrl: ''
    },
    // {
    //   id: 4,
    //   date: '2024-11-05',
    //   title: 'Новый закон о цифровых валютах принят в Казахстане',
    //   shortText: 'Правительство Казахстана приняло новый закон, который регулирует использование и оборот цифровых валют на территории страны...',
    //   fullText: 'Полный текст новости...',
    //   mainImageUrl: 'news/news_image.png'
    // }
  ];
  get selectedMonthName(): string {
    return this.months[this.selectedMonthIndex];
  }

  prevMonth(): void {
    this.selectedMonthIndex--;
    if (this.selectedMonthIndex < 0) {
      this.selectedMonthIndex = 11;
      this.selectedYear--;
    }
    this.getNews();
  }

  nextMonth(): void {
    this.selectedMonthIndex++;
    if (this.selectedMonthIndex > 11) {
      this.selectedMonthIndex = 0;
      this.selectedYear++;
    }
    this.getNews();
  }

  private getNews() {

  }
}
