import {Component, OnInit} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-admin-news',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
    NgForOf,
    NgIf
  ],
  templateUrl: './admin-news.component.html',
  styleUrl: './admin-news.component.css'
})
export class AdminNewsComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }

  onAdd(): void {
    console.log('Добавить запись');
  }

  onEdit(): void {
    console.log('Редактировать запись');
  }

  onDelete(): void {
    console.log('Удалить запись');
  }

  tableData = [
    {
      category: 'META',
      date: '12.12.2024',
      locale: '',
      title: '',
      shortDescription: 'Наименование',
      mainText: '',
      hidden: false,
      updatedAt: '12.12.2024',
    },
    {
      category: 'META',
      date: '12.12.2024',
      locale: '',
      title: '',
      shortDescription: 'Наименование',
      mainText: '',
      hidden: true,
      updatedAt: '12.12.2024',
    },
    {
      category: 'META',
      date: '12.12.2024',
      locale: '',
      title: '',
      shortDescription: 'Наименование',
      mainText: '',
      hidden: false,
      updatedAt: '12.12.2024',
    },
    {
      category: 'META',
      date: '12.12.2024',
      locale: '',
      title: '',
      shortDescription: 'Наименование',
      mainText: '',
      hidden: true,
      updatedAt: '12.12.2024',
    },
    {
      category: 'META',
      date: '12.12.2024',
      locale: '',
      title: '',
      shortDescription: 'Наименование',
      mainText: '',
      hidden: true,
      updatedAt: '12.12.2024',
    }
  ];
}
