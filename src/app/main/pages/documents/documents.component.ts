import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { TranslatePipe, TranslateService, LangChangeEvent } from '@ngx-translate/core';
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
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();

    // Подписываемся на смену языка
    this.langChangeSubscription = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      console.log('Language changed to:', event.lang);
      console.log('Translations:', event.translations);
      // Полностью перезагружаем все данные
      this.refreshAllData();
    });
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  // Полное обновление всех данных
  refreshAllData(): void {
    // Сохраняем текущий режим и выбранную категорию
    const currentViewMode = this.viewMode;
    const currentCategoryId = this.selectedCategory?.id;

    // Перезагружаем категории
    this.loadCategories(() => {
      // После загрузки категорий восстанавливаем состояние
      if (currentViewMode === 'documents' && currentCategoryId) {
        const restoredCategory = this.categories.find(c => c.id === currentCategoryId);
        if (restoredCategory) {
          this.selectedCategory = restoredCategory;
          this.updateColumns(restoredCategory);
          this.loadDocuments();
        } else {
          // Если категория не найдена, возвращаемся в меню
          this.viewMode = 'menu';
          this.selectedCategory = undefined;
          this.documents = [];
          this.columns = [];
        }
      } else if (currentViewMode === 'menu') {
        // Просто обновляем отображение категорий
        this.cdr.detectChanges();
      }
    });
  }

  // Обновление данных без полной перезагрузки (для текущего вида)
  refreshData(): void {
    if (this.viewMode === 'menu') {
      this.loadCategories();
    } else if (this.viewMode === 'documents' && this.selectedCategory) {
      this.updateColumns(this.selectedCategory);
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
        this.cdr.detectChanges();
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
          // Переводим заголовки колонок, если они есть в переводе
          this.columns = schema.columns
            .filter((c: any) => c && c.key && c.title)
            .map((col: any) => ({
              ...col,
              title: this.getTranslatedColumnTitle(col.key, col.title)
            }));
        } else {
          this.columns = [];
        }

      } catch (e) {
        console.error('Ошибка парсинга uiSchema:', category.uiSchema, e);
        this.columns = [];
      }
    }

    console.log('Обновленные columns:', this.columns);
    this.cdr.detectChanges();
  }

  // Получение переведенного заголовка колонки
  getTranslatedColumnTitle(key: string, defaultTitle: string): string {
    // Пытаемся получить перевод по ключу
    const translationKey = `documents.table.${key}`;
    let translated = this.translate.instant(translationKey);

    // Если перевод не найден, возвращаем оригинальный заголовок
    if (translated === translationKey) {
      return defaultTitle;
    }
    return translated;
  }

  // 🔹 загрузка категорий
  loadCategories(callback?: () => void): void {
    this.loadingCategories = true;
    const lang = this.translate.currentLang === 'kz' ? 'kk' : 'ru';

    // console.log('Loading categories with lang:', lang);

    this.documentsService.getCategories(lang).subscribe({
      next: (data: CategoryModel[]) => {
        this.categories = data;
        this.loadingCategories = false;

        // Обновляем переводы имен категорий
        this.updateCategoryNames();

        this.cdr.detectChanges();

        if (callback) {
          callback();
        }
      },
      error: (err) => {
        console.error(err);
        this.message.error(this.translate.instant('message.error.loadCategories') || 'Ошибка загрузки категорий');
        this.loadingCategories = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Обновление имен категорий с переводом
  updateCategoryNames(): void {
    // Если категории уже имеют переведенные имена, ничего не делаем
    // Или можно дополнительно обработать
    this.cdr.detectChanges();
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

    this.cdr.detectChanges();
  }

  // 🔹 загрузка документов по категории
  loadDocuments(): void {
    if (!this.selectedCategory) return;

    this.loadingDocuments = true;
    const lang = this.translate.currentLang === 'kz' ? 'kk' : 'ru';

    console.log('Loading documents with lang:', lang, 'category:', this.selectedCategory.id);

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
        console.log('documents loaded:', this.documents);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.message.error(this.translate.instant('message.error.loadDocuments') || 'Ошибка загрузки документов');
        this.loadingDocuments = false;
        this.documents = [];
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.message.error(this.translate.instant('message.error.search') || 'Ошибка поиска');
        this.loadingDocuments = false;
        this.cdr.detectChanges();
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
      this.message.error(this.translate.instant('message.error.fileNotFound') || 'Путь к файлу не найден');
      return;
    }

    window.open(document.downloadUrl, '_blank');
  }

  goBack(): void {
    this.viewMode = 'menu';
    this.selectedCategory = undefined;
    this.documents = [];
    this.columns = [];
    this.searchValue = '';
    this.currentPage = 0;
    this.cdr.detectChanges();
  }

  // Форматирование даты с учетом языка
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const lang = this.translate.currentLang === 'kz' ? 'kk-KZ' : 'ru-RU';
    return date.toLocaleDateString(lang, {
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
