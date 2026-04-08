import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { SharedModule } from '../../../shared/shared.module';
import { DocumentsService, DocumentDto, PageResponse } from '../../../shared/services/documents.service';
import { CategoryModel } from '../../../shared/models/category.model';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    TranslatePipe,
    SharedModule
  ],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css']
})
export class DocumentsComponent implements OnInit, OnDestroy {

  viewMode: 'menu' | 'documents' = 'menu';

  categories: CategoryModel[] = [];
  selectedCategory?: CategoryModel;

  // Данные из API документов
  documents: DocumentDto[] = [];
  columns: any[] = [];

  searchValue = '';

  // Пагинация
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  // Состояния загрузки
  loadingCategories = false;
  loadingDocuments = false;

  // Подписка на смену языка
  private langChangeSubscription?: Subscription;

  constructor(
    private documentsService: DocumentsService,
    private translate: TranslateService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadCategories();

    // Подписываемся на смену языка
    this.langChangeSubscription = this.translate.onLangChange.subscribe(() => {
      this.refreshData();
    });
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  // Обновление данных при смене языка
  refreshData(): void {
    // Перезагружаем категории с новым языком
    this.loadCategories();

    // Если мы в режиме документов, обновляем колонки и документы
    if (this.viewMode === 'documents' && this.selectedCategory) {
      // Обновляем выбранную категорию из нового списка
      this.updateSelectedCategory();
      // Перезагружаем документы
      this.loadDocuments();
    }
  }

  // Обновить выбранную категорию из нового списка
  updateSelectedCategory(): void {
    if (this.selectedCategory && this.categories.length > 0) {
      const updatedCategory = this.categories.find(c => c.id === this.selectedCategory?.id);
      if (updatedCategory) {
        this.selectedCategory = updatedCategory;
        // Обновляем колонки с новым языком
        this.updateColumns(updatedCategory);
      }
    }
  }

  // Обновление колонок из uiSchema
  updateColumns(category: CategoryModel): void {
    this.columns = [];

    if (category.uiSchema) {
      try {
        const schema = typeof category.uiSchema === 'string'
          ? JSON.parse(category.uiSchema)
          : category.uiSchema;

        if (schema && Array.isArray(schema.columns)) {
          this.columns = schema.columns.filter((c: any) => c && c.key && c.title);
        } else {
          this.columns = [];
        }

      } catch (e) {
        console.error('Ошибка парсинга uiSchema:', category.uiSchema, e);
        this.columns = [];
      }
    }

    console.log('Обновленные columns:', this.columns);
  }

  // 🔹 загрузка категорий
  loadCategories(): void {
    this.loadingCategories = true;
    const lang = this.translate.currentLang === 'kz' ? 'kk' : 'ru';

    this.documentsService.getCategories(lang).subscribe({
      next: (data: CategoryModel[]) => {
        this.categories = data;
        this.loadingCategories = false;
        console.log('categories:', data);

        // После загрузки категорий обновляем выбранную
        this.updateSelectedCategory();
      },
      error: (err) => {
        console.error(err);
        this.message.error('Ошибка загрузки категорий');
        this.loadingCategories = false;
      }
    });
  }

  // 🔹 открытие категории
  openCategory(cat: CategoryModel): void {
    this.selectedCategory = cat;
    this.viewMode = 'documents';
    this.currentPage = 0;
    this.searchValue = '';

    // Обновляем колонки
    this.updateColumns(cat);

    // Загружаем документы
    this.loadDocuments();
  }

  // 🔹 загрузка документов по категории
  loadDocuments(): void {
    if (!this.selectedCategory) return;

    this.loadingDocuments = true;
    const lang = this.translate.currentLang === 'kz' ? 'kk' : 'ru';

    this.documentsService.getDocumentsByCategory(
      this.selectedCategory.id,
      lang,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (response: PageResponse<DocumentDto>) => {
        this.documents = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = response.number;
        this.loadingDocuments = false;
        console.log('documents:', this.documents);
      },
      error: (err) => {
        console.error(err);
        this.message.error('Ошибка загрузки документов');
        this.loadingDocuments = false;
        this.documents = [];
      }
    });
  }

  // 🔹 поиск документов
  search(): void {
    if (!this.selectedCategory) return;

    if (!this.searchValue || this.searchValue.trim() === '') {
      this.loadDocuments();
      return;
    }

    this.loadingDocuments = true;
    const lang = this.translate.currentLang === 'kz' ? 'kk' : 'ru';
    this.currentPage = 0;

    this.documentsService.searchDocumentsByCategory(
      this.selectedCategory.id,
      this.searchValue,
      lang,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (response: PageResponse<DocumentDto>) => {
        this.documents = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = response.number;
        this.loadingDocuments = false;
      },
      error: (err) => {
        console.error(err);
        this.message.error('Ошибка поиска');
        this.loadingDocuments = false;
      }
    });
  }

  // 🔹 сброс поиска
  resetSearch(): void {
    this.searchValue = '';
    this.loadDocuments();
  }

  // 🔹 смена страницы
  onPageChange(page: number): void {
    this.currentPage = page - 1;
    this.loadDocuments();
  }

  // 🔹 смена размера страницы
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadDocuments();
  }

  download(document: DocumentDto): void {
    if (!document.downloadUrl) {
      this.message.error('Путь к файлу не найден');
      return;
    }

    window.open(document.downloadUrl, '_blank');
  }

  goBack(): void {
    this.viewMode = 'menu';
    this.documents = [];
    this.columns = [];
    this.searchValue = '';
    this.currentPage = 0;
  }

  // Форматирование даты
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Форматирование размера файла
  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  getDynamicValue(doc: DocumentDto, key: string): any {
    return (doc as any)[key] ?? '-';
  }
}
