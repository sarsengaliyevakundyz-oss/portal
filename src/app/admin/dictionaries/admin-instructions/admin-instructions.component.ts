import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { forkJoin, Subscription } from 'rxjs';
import { DocumentsService, DocumentDto, PageResponse } from '../../../shared/services/documents.service';
import { CategoryModel } from '../../../shared/models/category.model';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPaginationComponent } from 'ng-zorro-antd/pagination';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-admin-instructions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, ReactiveFormsModule,
    TranslatePipe, SharedModule,
    NzModalModule, NzFormModule, NzInputModule,
    NzButtonModule, NzIconModule, NzSpinModule,
    NzPaginationComponent,
  ],
  providers: [NzMessageService],
  templateUrl: './admin-instructions.component.html',
  styleUrls: ['./admin-instructions.component.css']
})
export class AdminInstructionsComponent implements OnInit, OnDestroy {
  viewMode: 'menu' | 'documents' = 'menu';

  categories: CategoryModel[] = [];
  categoriesRu: CategoryModel[] = [];
  categoriesKz: CategoryModel[] = [];
  selectedCategory?: CategoryModel;
  loadingCategories = false;

  documents: DocumentDto[] = [];
  columns: any[] = [];
  loadingDocuments = false;
  openIndex: number | null = null;
  currentPage = 1;
  pageSize = 10;
  totalElements = 0;

  isDocModalVisible = false;
  isSaving = false;
  editingDoc: DocumentDto | null = null;
  docForm: FormGroup;

  isCatModalVisible = false;
  isCatSaving = false;
  editingCat: CategoryModel | null = null;
  catForm: FormGroup;

  private langSub?: Subscription;

  constructor(
    private documentsService: DocumentsService,
    private translate: TranslateService,
    private message: NzMessageService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.docForm = this.fb.group({
      title: ['', Validators.required],
      originalFileName: [''],
      fileUrl: [''],
    });
    this.catForm = this.fb.group({
      nameRu: ['', Validators.required],
      nameKz: [''],
    });
  }

  ngOnInit(): void {
    this.loadCategories();

    // При смене языка обновляем список категорий
    this.langSub = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.categories = event.lang === 'kz' ? this.categoriesKz : this.categoriesRu;
      // Если внутри категории — обновляем название
      if (this.viewMode === 'documents' && this.selectedCategory) {
        const updated = this.categories.find(c => c.id === this.selectedCategory!.id);
        if (updated) this.selectedCategory = updated;
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  loadCategories(): void {
    this.loadingCategories = true;
    forkJoin({
      ru: this.documentsService.getCategories('ru'),
      kz: this.documentsService.getCategories('kk'),
    }).subscribe({
      next: ({ ru, kz }) => {
        this.categoriesRu = ru;
        this.categoriesKz = kz;
        this.categories = this.translate.currentLang === 'kz' ? kz : ru;
        this.loadingCategories = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingCategories = false; this.cdr.detectChanges(); }
    });
  }

  openCategory(cat: CategoryModel): void {
    this.selectedCategory = cat;
    this.viewMode = 'documents';
    this.currentPage = 1;
    this.openIndex = null;
    this.updateColumns(cat);
    this.loadDocuments();
  }

  updateColumns(cat: CategoryModel): void {
    this.columns = [];
    if (cat.uiSchema) {
      try {
        const schema = typeof cat.uiSchema === 'string' ? JSON.parse(cat.uiSchema) : cat.uiSchema;
        if (schema?.columns) this.columns = schema.columns.filter((c: any) => c?.key && c?.title);
      } catch { this.columns = []; }
    }
  }

  loadDocuments(): void {
    if (!this.selectedCategory) return;
    this.loadingDocuments = true;
    const lang = this.translate.currentLang === 'kz' ? 'kk' : 'ru';
    this.documentsService.getDocumentsByCategory(
      this.selectedCategory.id, lang, this.currentPage - 1, this.pageSize
    ).subscribe({
      next: (res: PageResponse<DocumentDto>) => {
        this.documents = res.content;
        this.totalElements = res.totalElements;
        this.loadingDocuments = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingDocuments = false; this.documents = []; this.cdr.detectChanges(); }
    });
  }

  toggleAccordion(index: number): void {
    this.openIndex = this.openIndex === index ? null : index;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.openIndex = null;
    this.loadDocuments();
  }

  goBack(): void {
    this.viewMode = 'menu';
    this.selectedCategory = undefined;
    this.documents = [];
    this.openIndex = null;
    this.cdr.detectChanges();
  }

  openEditCatModal(cat: CategoryModel, event: Event): void {
    event.stopPropagation();
    this.editingCat = cat;
    const ruCat = this.categoriesRu.find(c => c.id === cat.id);
    const kzCat = this.categoriesKz.find(c => c.id === cat.id);
    this.catForm.patchValue({
      nameRu: ruCat?.name || '',
      nameKz: kzCat?.name || '',
    });
    this.isCatModalVisible = true;
  }

  handleCatModalCancel(): void { this.isCatModalVisible = false; }

  handleCatModalSubmit(): void {
    if (this.catForm.invalid) return;
    this.isCatSaving = true;
    // TODO: PUT /categories/{id} с { nameRu, nameKz }
    setTimeout(() => {
      this.message.success('Категория сохранена');
      this.isCatSaving = false;
      this.isCatModalVisible = false;
      this.loadCategories();
    }, 500);
  }

  openAddDocModal(): void {
    this.editingDoc = null;
    this.docForm.reset();
    this.isDocModalVisible = true;
  }

  openEditDocModal(doc: DocumentDto, event: Event): void {
    event.stopPropagation();
    this.editingDoc = doc;
    this.docForm.patchValue({
      title: doc.title || '',
      originalFileName: doc.originalFileName || '',
      fileUrl: doc.downloadUrl || '',
    });
    this.isDocModalVisible = true;
  }

  handleDocModalCancel(): void { this.isDocModalVisible = false; this.editingDoc = null; }

  handleDocModalSubmit(): void {
    if (this.docForm.invalid) return;
    this.isSaving = true;
    // TODO: POST/PUT эндпоинт с { title, originalFileName, fileUrl }
    setTimeout(() => {
      this.message.success('Сохранено');
      this.isSaving = false;
      this.isDocModalVisible = false;
      this.loadDocuments();
    }, 500);
  }

  deleteDoc(doc: DocumentDto, event: Event): void {
    event.stopPropagation();
    // TODO: DELETE эндпоинт
    this.message.warning('Удаление...');
  }

  download(doc: DocumentDto, event: Event): void {
    event.stopPropagation();
    if (!doc.downloadUrl) return;
    window.open(doc.downloadUrl, '_blank');
  }

  getDocName(doc: DocumentDto): string {
    return doc.title || doc.originalFileName || 'Документ';
  }

  getDynamicValue(doc: DocumentDto, key: string): any {
    return (doc as any)[key] ?? '-';
  }
}
