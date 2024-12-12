import { Component } from '@angular/core';
import {NgForOf} from '@angular/common';
import {RouterModule} from '@angular/router';

@Component({
  selector: 'app-systems',
  standalone: true,
  imports: [
    NgForOf,
    RouterModule
  ],
  templateUrl: './systems.component.html',
  styleUrl: './systems.component.css'
})
export class SystemsComponent {
  items = [
    { id: '1', title: 'Сбор данных', icon: 'systems/sbor.png' },
    { id: '2', title: 'Новый сбор данных', icon: 'systems/sbor.png' },
    { id: '3', title: 'Административные данные', icon: 'systems/sbor.png' },
    { id: '4', title: 'Кабинет сотрудника', icon: 'systems/sbor.png' },
    { id: '5', title: 'Первичные данные', icon: 'systems/sbor.png' },
    { id: '6', title: 'Агрегированные показатели', icon: 'systems/sbor.png' },
    { id: '7', title: 'Регистр населения', icon: 'systems/sbor.png' },
    { id: '8', title: 'Статистический бизнес регистр', icon: 'systems/sbor.png' },
    { id: '9', title: 'Жилищный регистр', icon: 'systems/sbor.png' },
    { id: '10', title: 'Каталоги СРЖФ', icon: 'systems/sbor.png' },
    { id: '11', title: 'Обработка данных', icon: 'systems/sbor.png' },
    { id: '12', title: 'Перепись населения', icon: 'systems/sbor.png' },
    { id: '13', title: 'Метаданные', icon: 'systems/sbor.png' },
    { id: '14', title: 'Информационно-аналитическая система Талдау', icon: 'systems/sbor.png' },
    { id: '15', title: 'Сельскохозяйственный регистр', icon: 'systems/sbor.png' },
    { id: '16', title: 'КЛАСС', icon: 'systems/sbor.png' },
    { id: '17', title: 'Компьютеризированная система индивидуального опроса', icon: 'systems/sbor.png' },
    { id: '18', title: 'Интеграционный компонент', icon: 'systems/sbor.png' },
    { id: '19', title: 'Компьютеризированная система телефонного опроса', icon: 'systems/sbor.png' }
  ];

}
