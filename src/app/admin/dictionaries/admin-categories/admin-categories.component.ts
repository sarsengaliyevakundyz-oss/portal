import {Component, OnInit} from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

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

  constructor(private readonly formBuilder: FormBuilder) {}

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
  }

  onAdd(): void { this.showAddModal = true; }

  onEdit(): void {
    if (this.selectedIndex === null) return;
    const item = this.tableData[this.selectedIndex];
    this.editForm.setValue({
      nameRu: item.nameRu,
      nameKz: item.nameKz,
      icon: item.icon,
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
    const payload = {
      ...this.addForm.value,
      updatedAt: this.today()
    };
    this.tableData = [payload, ...this.tableData];
    this.onCancelAdd();
  }

  onCancelEdit(): void { this.showEditModal = false; }

  onSaveEdit(): void {
    if (this.editForm.invalid || this.selectedIndex === null) {
      this.editForm.markAllAsTouched();
      return;
    }
    const updated = {
      ...this.tableData[this.selectedIndex],
      ...this.editForm.value,
      updatedAt: this.today()
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

  cancelDelete(): void { this.showDeleteModal = false; }

  private today(): string {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  tableData = [
    { nameRu: 'Наименование', nameKz: 'Наименование', icon: 'category', active: true,  updatedAt: '12.12.2024' },
    { nameRu: 'Наименование', nameKz: 'Наименование', icon: 'category', active: false, updatedAt: '12.12.2024' },
    { nameRu: 'Наименование', nameKz: 'Наименование', icon: 'category', active: true,  updatedAt: '12.12.2024' },
    { nameRu: 'Наименование', nameKz: 'Наименование', icon: 'category', active: true,  updatedAt: '12.12.2024' },
    { nameRu: 'Наименование', nameKz: 'Наименование', icon: 'category', active: false, updatedAt: '12.12.2024' }
  ];
}


