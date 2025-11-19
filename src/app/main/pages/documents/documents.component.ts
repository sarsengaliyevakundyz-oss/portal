import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TranslatePipe } from '@ngx-translate/core';

interface DocumentItem {
  id: number;
  component: string;
  subsystem: string;
  name: string;
  date: string;
  fileSize: string;
  fileType: string;
}

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzInputModule,
    NzButtonModule,
    NzRadioModule,
    NzCheckboxModule,
    NzIconModule,
    TranslatePipe
  ],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css']
})
export class DocumentsComponent implements OnInit {
  searchValue = '';
  selectedType = 'type1'; 
  
  items: DocumentItem[] = [
    { id: 1, component: 'META', subsystem: 'Формы', name: 'Наименование', date: '12.12.2024', fileSize: '23.3 KB', fileType: 'doc' },
    { id: 2, component: 'META', subsystem: 'Формы', name: 'Наименование', date: '12.12.2024', fileSize: '23.3 KB', fileType: 'doc' },
    { id: 3, component: 'META', subsystem: 'Формы', name: 'Наименование', date: '12.12.2024', fileSize: '23.3 KB', fileType: 'doc' },
    { id: 4, component: 'META', subsystem: 'Формы', name: 'Наименование', date: '12.12.2024', fileSize: '23.3 KB', fileType: 'doc' },
    { id: 5, component: 'META', subsystem: 'Формы', name: 'Наименование', date: '12.12.2024', fileSize: '23.3 KB', fileType: 'doc' },
  ];

  isComponentChecked = true;

  constructor() { }

  ngOnInit(): void {
  }

  search(): void {
    console.log('Searching for:', this.searchValue);
  }
  
  download(item: DocumentItem): void {
    console.log('Downloading:', item);
  }
}

