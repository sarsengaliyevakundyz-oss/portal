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
import { SystemsService } from '../../../shared/services/systems.service';
import { SharedModule } from '../../../shared/shared.module';
import { ITranslateName } from '../../../shared/pipes/name-translate.pipe';

interface DocumentItem {
  id: number;
  component: string;
  subsystem: string;
  name: ITranslateName;
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
    TranslatePipe,
    SharedModule
  ],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css']
})
export class DocumentsComponent implements OnInit {
  searchValue = '';
  selectedType = 'type1'; 
  
  items: DocumentItem[] = [];

  isComponentChecked = true;

  constructor(private systemsService: SystemsService) { }

  ngOnInit(): void {
    this.loadDocuments();
  }
  

  loadDocuments(): void {
    this.systemsService.getParentSystems().subscribe({
      next: (res) => {
        if (res && res.result) {
          this.items = res.result.map(sys => ({
            id: sys.id,
            component: sys.codeName || '',
            subsystem: 'Формы',
            name: sys.name,
            date: '12.12.2024',
            fileSize: '23.3 KB',
            fileType: 'doc'
          }));
        }
      },
      error: (err) => {
        console.error('Error loading documents:', err);
      }
    });
  }

  search(): void {
    console.log('Searching for:', this.searchValue);
  }
  
  download(item: DocumentItem): void {
    console.log('Downloading:', item);
  }
}
