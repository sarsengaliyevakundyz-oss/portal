import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SharedModule } from '../../../shared/shared.module';
import { ITranslateName, Lang } from '../../../shared/pipes/name-translate.pipe';
import { DocumentsService } from '../../../shared/services/documents.service';
import { InstructionModel } from '../../../shared/models/instruction.model';

interface DocumentItem {
  id: number;
  component: string;
  subsystem: string;
  name: ITranslateName;
  date: string;
  fileSize: string;
  fileType: string;
  fileRuPath: string;
  fileKzPath: string;
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
  selectedInstructionId: number | null = null; 
  instructions: InstructionModel[] = [];
  childSystems: any[] = []; 
  selectedChildSystem: number | null = null; 
  
  items: DocumentItem[] = [];

  isComponentChecked = true;

  constructor(private documentsService: DocumentsService, private translate: TranslateService) { }

  ngOnInit(): void {
    this.loadDocuments();
    this.loadInstructions();
  }

  loadDocuments(): void {
    this.documentsService.getInstructionsList().subscribe({
      next: (res) => {
        if (res && res.result) {
          this.items = res.result.map(instruction => ({
            id: instruction.id,
            component: instruction.systemName,
            subsystem: instruction.subsystemName,
            name: { ru: instruction.title, kz: instruction.title },
            date: new Date(instruction.createdAt).toLocaleDateString(),
            fileSize: instruction.size,
            fileType: instruction.contentType.split('/')[1],
            fileRuPath: instruction.filePath,
            fileKzPath: instruction.filePath
          }));
        }
      },
      error: (err) => {
        console.error('Error loading documents:', err);
      }
    });
  }

  loadInstructions(): void {
    this.documentsService.getInstructionsList().subscribe({
      next: (res) => {
        if (res && res.result) {
          this.instructions = res.result;
        }
      },
      error: (err) => {
        console.error('Error loading instructions:', err);
      }
    });
  }

  onInstructionChange(instructionId: number): void {
    this.selectedInstructionId = instructionId;
    this.childSystems = []; 
    const selectedInstruction = this.instructions.find(inst => inst.id === instructionId);
    if (selectedInstruction) {
      this.childSystems = [
        { id: 1, name: `Подсистема 1 для ${selectedInstruction.systemName}` },
        { id: 2, name: `Подсистема 2 для ${selectedInstruction.systemName}` }
      ];
    }
  }

  search(): void {
    console.log('Searching for:', this.searchValue);
  }
  
  download(item: DocumentItem): void {
    const lang = this.translate.currentLang;
    let filePath = '';
    if (lang === Lang.RU) {
      filePath = item.fileRuPath;
    } else if (lang === Lang.Kz) {
      filePath = item.fileKzPath;
    }
    
    if (filePath) {
      window.open(filePath, '_blank');
    } else {
      console.warn('No file path available for download.');
    }
  }
}
