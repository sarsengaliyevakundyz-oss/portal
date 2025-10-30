import {Component, OnInit} from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AdminCategoriesService} from '../../../shared/services/admin-categories.service';
import {NewsCategory} from '../../../shared/models/news.model';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [NgForOf, NgIf, ReactiveFormsModule],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.css'
})
export class AdminCategoriesComponent implements OnInit {

  showAddModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  addForm!: FormGroup;
  editForm!: FormGroup;
  selectedIndex: number | null = null;

  loading: boolean = false;
  tableData: NewsCategory[] = [];

  constructor(private readonly formBuilder: FormBuilder,
              private readonly service: AdminCategoriesService) {}

  ngOnInit(): void {
    this.addForm = this.formBuilder.group({
      nameRu: ['', Validators.required],
      nameKz: ['', Validators.required],
      icon: [''],
      active: [true, Validators.required]
    });

    this.editForm = this.formBuilder.group({
      nameRu: ['', Validators.required],
      nameKz: ['', Validators.required],
      icon: [''],
      active: [true, Validators.required]
    });
    this.loadCategories();
  }

  private loadCategories(): void {
    this.loading = true;
    this.service.getCategories({ isActive: true }).subscribe({
      next: (res) => {
        this.tableData = res;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onAdd(): void { this.showAddModal = true; }

  onEdit(): void {
    if (this.selectedIndex === null) return;
    const item = this.tableData[this.selectedIndex];
    this.editForm.setValue({
      nameRu: item.name?.ru ?? '',
      nameKz: item.name?.kz ?? '',
      icon: '',
      active: item.active
    });
    this.showEditModal = true;
  }

  onDelete(): void {
    if (this.selectedIndex === null) return;
    this.showDeleteModal = true;
  }

  onRowSelect(index: number): void {
    this.selectedIndex = index === this.selectedIndex ? null : index;
  }

  onCancelAdd(): void {
    this.showAddModal = false;
    this.addForm.reset({ active: true });
  }

  onSaveAdd(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    const v = this.addForm.value;
    this.service.addCategory({
      imagePath: '',
      loginCreated: '',
      nameKk: v.nameKz,
      nameRu: v.nameRu
    }).subscribe({
      next: () => { this.onCancelAdd(); this.loadCategories(); },
      error: () => {}
    });
  }

  onCancelEdit(): void { this.showEditModal = false; }

  onSaveEdit(): void {
    if (this.editForm.invalid || this.selectedIndex === null) {
      this.editForm.markAllAsTouched();
      return;
    }
    const id = this.tableData[this.selectedIndex].id;
    const v = this.editForm.value;
    this.service.updateCategory({
      categoryId: id,
      imagePath: '',
      loginUpdated: '',
      nameKk: v.nameKz,
      nameRu: v.nameRu
    }).subscribe({
      next: () => { this.showEditModal = false; this.loadCategories(); },
      error: () => {}
    });
  }

  confirmDelete(): void {
    if (this.selectedIndex === null) return;
    const id = this.tableData[this.selectedIndex].id;
    const currentlyActive = this.tableData[this.selectedIndex].active;
    this.service.toggleActive({ categoryId: id, isActive: currentlyActive, loginDeleted: '' })
      .subscribe({
        next: () => { this.selectedIndex = null; this.showDeleteModal = false; this.loadCategories(); },
        error: () => {}
      });
  }

  cancelDelete(): void { this.showDeleteModal = false; }

  private today(): string {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  // данные приходят из API через loadCategories
}


