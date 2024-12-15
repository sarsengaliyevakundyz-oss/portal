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

  months =[
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  selectedMonthIndex = new Date().getMonth();
  selectedYear = new Date().getFullYear();

  currentMonthIndex = new Date().getMonth();
  currentYear = new Date().getFullYear();


  news: NewsItem[] = [
    {
      id: 1,
      date: '2022-05-13',
      title: 'Новые правила работы скорой помощи: что изменится для казахстанцев?',
      shortText: '"Скорая помощь больше не сможет обслуживать круглосуточно всех пациентов без исключения". Осенью эта новость прогремела на всю страну. Корреспондент Tengrinews.kz познакомилась с работой столичной станции скорой, где узнала, как распределяются вызовы, почему важно правильно сообщать все детали диспетчеру и что делать, если помощь требуется немедленно.',
      fullText: 'Полный текст новости...',
      mainImageUrl: 'news/news_image.png'
    },
    {
      id: 2,
      date: '2022-05-13',
      title: 'ТЕЛЕФОНОГРАММА',
      shortText: 'Сообщаем, что в период с 15:00 часов 14 мая до 07:00 часов 16 мая 2022 года в связи с проверкой 2022 года в связи...',
      fullText: 'Полный текст новости...',
      mainImageUrl: ''
    },
    {
      id: 3,
      date: '2022-05-13',
      title: 'ПРОДЛЕНИЕ СРОКОВ',
      shortText: 'По статистической форме 29-сх (один раз в год) срок сдачи отчетности в режиме он-лайн продлен до 15 ноября 2024 года включительно.',
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
