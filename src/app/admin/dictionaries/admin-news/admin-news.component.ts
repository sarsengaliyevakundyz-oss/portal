import {Component, OnInit} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {NgForOf, NgIf} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NewsService} from '../../../shared/services/news.service';
import {AdminCategoriesService} from '../../../shared/services/admin-categories.service';
import {NewsCategory} from '../../../shared/models/news.model';

@Component({
  selector: 'app-admin-news',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
    NgForOf,
    NgIf,
    ReactiveFormsModule
  ],
  templateUrl: './admin-news.component.html',
  styleUrl: './admin-news.component.css'
})
export class AdminNewsComponent implements OnInit {

  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  addForm!: FormGroup;
  editForm!: FormGroup;
  uploadedKazFileName: string = '';
  uploadedRusFileName: string = '';
  selectedIndex: number | null = null;

  categories: NewsCategory[] = [];

  constructor(private readonly formBuilder: FormBuilder,
              private readonly newsService: NewsService,
              private readonly categoriesService: AdminCategoriesService) {
  }

  ngOnInit(): void {
    this.addForm = this.formBuilder.group({
      category: ['', Validators.required],
      date: ['', Validators.required],
      locale: [''],
      title: ['', Validators.required],
      shortDescription: [''],
      mainText: ['']
    });

    this.editForm = this.formBuilder.group({
      category: ['', Validators.required],
      date: ['', Validators.required],
      locale: [''],
      title: ['', Validators.required],
      shortDescription: [''],
      mainText: ['']
    });

    this.loadList();
    this.loadCategories();
  }

  onAdd(): void {
    this.showAddModal = true;
  }

  onEdit(): void {
    if (this.selectedIndex === null) {
      console.warn('Не выбрана запись для редактирования');
      return;
    }
    const item = this.tableData[this.selectedIndex];
    this.editForm.setValue({
      category: item.category,
      date: this.toIsoDate(item.date),
      locale: item.locale,
      title: item.title,
      shortDescription: item.shortDescription,
      mainText: item.mainText
    });
    this.showEditModal = true;
  }

  onDelete(): void {
    if (this.selectedIndex === null) {
      console.warn('Не выбрана запись для удаления');
      return;
    }
    this.showDeleteModal = true;
  }

  onCancelAdd(): void {
    this.showAddModal = false;
    this.addForm.reset();
    this.uploadedKazFileName = '';
    this.uploadedRusFileName = '';
  }

  onSaveAdd(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    const v = this.addForm.value as any;
    this.newsService.addNews({
      categoryId: v.category,
      content: v.mainText || '',
      description: v.shortDescription || '',
      imageContent: '',
      imageDescription: '',
      lang: v.locale || '',
      loginCreated: '',
      publishDate: v.date,
      title: v.title
    }).subscribe({
      next: () => { this.onCancelAdd(); this.loadList(); },
      error: () => {}
    });
  }

  onKazFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    this.uploadedKazFileName = file ? file.name : '';
  }

  onRusFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    this.uploadedRusFileName = file ? file.name : '';
  }

  removeKazFile(): void { this.uploadedKazFileName = ''; }
  removeRusFile(): void { this.uploadedRusFileName = ''; }

  onRowSelect(index: number): void {
    this.selectedIndex = index === this.selectedIndex ? null : index;
  }

  onCancelEdit(): void {
    this.showEditModal = false;
  }

  onSaveEdit(): void {
    if (this.editForm.invalid || this.selectedIndex === null) {
      this.editForm.markAllAsTouched();
      return;
    }
    const updated = {
      ...this.tableData[this.selectedIndex],
      ...this.editForm.value,
      date: this.fromIsoDate(this.editForm.value.date)
    };
    this.tableData = this.tableData.map((x, i) => i === this.selectedIndex ? updated : x);
    this.showEditModal = false;
  }

  confirmDelete(): void {
    if (this.selectedIndex === null) return;
    this.tableData = this.tableData.filter((_, i) => i !== this.selectedIndex);
    this.selectedIndex = null;
    this.showDeleteModal = false;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
  }

  private toIsoDate(d: string): string {
    const [dd, mm, yyyy] = d.split('.');
    if (!yyyy) return d;
    return `${yyyy}-${mm}-${dd}`;
  }

  private fromIsoDate(d: string): string {
    const [yyyy, mm, dd] = d.split('-');
    if (!dd) return d;
    return `${dd}.${mm}.${yyyy}`;
  }

  tableData: any[] = [];

  ngAfterViewInit(): void {
    this.loadList();
  }

  private loadList(): void {
    this.newsService.getList({ page: 0, limit: 25, categoryId: undefined as any, year: undefined as any } as any)
      .subscribe(res => {
      const items = res?.response || [];
      this.tableData = items.map((n: any) => ({
        category: n.vipCategory,
        date: this.fromIsoDate(typeof n.publishDate === 'string' ? n.publishDate.substring(0,10) : ''),
        locale: '',
        title: n.title,
        shortDescription: n.description,
        mainText: '',
        hidden: false,
        updatedAt: this.fromIsoDate(typeof n.publishDate === 'string' ? n.publishDate.substring(0,10) : '')
      }));
    });
  }

  private loadCategories(): void {
    this.categoriesService.getCategories({ isActive: true }).subscribe({
      next: (res) => { this.categories = res; },
      error: () => { }
    });
  }
}
