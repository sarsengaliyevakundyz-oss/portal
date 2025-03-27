import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-news-page',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf
  ],
  templateUrl: './news-page.component.html',
  styleUrl: './news-page.component.css'
})
export class NewsPageComponent {
  categories = ['Телефонограмма', 'Продление сроков'];
  years = ['2025', '2024', '2023', '2022', '2021 и ранее'];

  selectedCategory: string = '';
  selectedYear: string = '2022';

  news = [
    { title: 'До 10 миллионов тенге...', category: 'Телефонограмма', year: '2023', image: 'assets/img1.jpg', date: '13.05.2022', description: 'В Испании готовы платить за переезд...' },
    { title: 'Занесена в красную книгу...', category: 'Продление сроков', year: '2022', image: 'assets/img2.jpg', date: '13.05.2022', description: 'В сети появилось видео с рысью...' },
    { title: 'После удара молнии...', category: 'Продление сроков', year: '2022', image: 'assets/img3.jpg', date: '13.05.2022', description: '13-летняя Мила Ванг из Миннесоты...' },
    { title: 'Занесена в красную книгу...', category: 'Продление сроков', year: '2022', image: 'assets/img2.jpg', date: '13.05.2022', description: 'В сети появилось видео с рысью...' },
    { title: 'После удара молнии...', category: 'Продление сроков', year: '2022', image: 'assets/img3.jpg', date: '13.05.2022', description: '13-летняя Мила Ванг из Миннесоты...' },
    { title: 'Занесена в красную книгу...', category: 'Продление сроков', year: '2022', image: 'assets/img2.jpg', date: '13.05.2022', description: 'В сети появилось видео с рысью...' },
    { title: 'После удара молнии...', category: 'Продление сроков', year: '2022', image: 'assets/img3.jpg', date: '13.05.2022', description: '13-летняя Мила Ванг из Миннесоты...' },
    { title: 'Занесена в красную книгу...', category: 'Продление сроков', year: '2022', image: 'assets/img2.jpg', date: '13.05.2022', description: 'В сети появилось видео с рысью...' },
    { title: 'После удара молнии...', category: 'Продление сроков', year: '2022', image: 'assets/img3.jpg', date: '13.05.2022', description: '13-летняя Мила Ванг из Миннесоты...' },
    { title: 'После удара молнии...', category: 'Продление сроков', year: '2025', image: 'assets/img3.jpg', date: '13.05.2022', description: '13-летняя Мила Ванг из Миннесоты...' },
    { title: 'После удара молнии...', category: 'Продление сроков', year: '2024', image: 'assets/img3.jpg', date: '13.05.2022', description: '13-летняя Мила Ванг из Миннесоты...' }
  ];

  get filteredNews() {
    return this.news.filter(n =>
      (this.selectedCategory ? n.category === this.selectedCategory : true) &&
      (this.selectedYear ? n.year === this.selectedYear : true)
    );
  }

}
