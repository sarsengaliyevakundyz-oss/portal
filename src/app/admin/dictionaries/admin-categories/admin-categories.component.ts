import {Component, OnInit} from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AdminCategoriesService} from '../../../shared/services/admin-categories.service';
import {NewsCategory} from '../../../shared/models/news.model';
import { finalize, switchMap, of } from 'rxjs';
import { CurrentUserService } from '../../../shared/services/current-user.service';
import { SystemsService } from '../../../shared/services/systems.service';

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

  uploadedIconFileName: string | null = null;
  iconFilePreview: string | null = null;

  editIconFileName: string | null = null;
  editIconPreview: string | null = null;
  currentIconUrl: string | null = null;

  addFile: File | null = null;
  editFile: File | null = null;

  adminUsername: string | null = null;

  constructor(private readonly formBuilder: FormBuilder,
              private readonly service: AdminCategoriesService,
              private readonly currentUser: CurrentUserService,
              private readonly systemsService: SystemsService) {}

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
    this.systemsService.getAdminInfo().subscribe(info => {
      this.adminUsername = info.username;
    });
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
    this.currentIconUrl = (item as any).imagePath ?? null;
    this.editIconFileName = null;
    this.editIconPreview = null;
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
    this.uploadedIconFileName = null;
    this.iconFilePreview = null;
  }

  onSaveAdd(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const v = this.addForm.value;
    const uploadFileObservable = this.addFile ?
      this.service.uploadFile(this.addFile, 'category') :
      of('');

    uploadFileObservable.pipe(
      switchMap(imagePath => {
        return this.service.addCategory({
          imagePath: imagePath || this.iconFilePreview || '',
          loginCreated: '',
          nameKk: v.nameKz,
          nameRu: v.nameRu
        });
      }),
      finalize(() => this.loading = false)
    ).subscribe({
      next: () => { this.onCancelAdd(); this.loadCategories(); },
      error: (err) => { console.error('Error saving category:', err); }
    });
  }

  onCancelEdit(): void {
    this.showEditModal = false;
    this.editIconFileName = null;
    this.editIconPreview = null;
    this.currentIconUrl = null;
  }

  onSaveEdit(): void {
    if (this.editForm.invalid || this.selectedIndex === null) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const id = this.tableData[this.selectedIndex].id;
    const v = this.editForm.value;

    const uploadFileObservable = this.editFile ?
      this.service.uploadFile(this.editFile, 'category') :
      of(this.currentIconUrl || '');

    uploadFileObservable.pipe(
      switchMap(imagePath => {
        return this.service.updateCategory({
          categoryId: id,
          imagePath: imagePath || this.editIconPreview || '',
          loginUpdated: this.adminUsername || '',
          nameKk: v.nameKz,
          nameRu: v.nameRu
        });
      }),
      finalize(() => this.loading = false)
    ).subscribe({
      next: () => { this.showEditModal = false; this.loadCategories(); },
      error: (err) => { console.error('Error updating category:', err); }
    });
  }

  confirmDelete(): void {
    if (this.selectedIndex === null) return;
    const id = this.tableData[this.selectedIndex].id;
    const currentlyActive = this.tableData[this.selectedIndex].active;
    this.service.toggleActive({ categoryId: id, isActive: false, loginDeleted: this.adminUsername || '' })
      .subscribe({
        next: () => { this.selectedIndex = null; this.showDeleteModal = false; this.loadCategories(); },
        error: () => {}
      });
  }

  cancelDelete(): void { this.showDeleteModal = false; }

  onIconFileChange(event: Event, mode: 'add' | 'edit'): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (mode === 'add') {
        this.uploadedIconFileName = file.name;
        this.iconFilePreview = result;
        this.addFile = file;
      } else {
        this.editIconFileName = file.name;
        this.editIconPreview = result;
        this.currentIconUrl = null;
        this.editFile = file;
      }
    };
    reader.readAsDataURL(file);
  }

  removeIconFile(mode: 'add' | 'edit'): void {
    if (mode === 'add') {
      this.uploadedIconFileName = null;
      this.iconFilePreview = null;
      this.addFile = null;
    } else {
      this.editIconFileName = null;
      this.editIconPreview = null;
      this.editFile = null;
    }
  }

  private today(): string {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

}


