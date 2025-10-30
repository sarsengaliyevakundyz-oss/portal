import {Component, OnInit} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {NgForOf, NgIf} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

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
  addForm!: FormGroup;
  uploadedKazFileName: string = '';
  uploadedRusFileName: string = '';

  constructor(private readonly formBuilder: FormBuilder) {
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
  }

  onAdd(): void {
    this.showAddModal = true;
  }

  onEdit(): void {
    console.log('Редактировать запись');
  }

  onDelete(): void {
    console.log('Удалить запись');
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
    const payload = {
      ...this.addForm.value,
      kazFileName: this.uploadedKazFileName,
      rusFileName: this.uploadedRusFileName
    };
    console.log('Сохранить новость', payload);
    this.onCancelAdd();
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

  tableData = [
    {
      category: 'META',
      date: '12.12.2024',
      locale: '',
      title: '',
      shortDescription: 'Наименование',
      mainText: '',
      hidden: false,
      updatedAt: '12.12.2024',
    },
    {
      category: 'META',
      date: '12.12.2024',
      locale: '',
      title: '',
      shortDescription: 'Наименование',
      mainText: '',
      hidden: true,
      updatedAt: '12.12.2024',
    },
    {
      category: 'META',
      date: '12.12.2024',
      locale: '',
      title: '',
      shortDescription: 'Наименование',
      mainText: '',
      hidden: false,
      updatedAt: '12.12.2024',
    },
    {
      category: 'META',
      date: '12.12.2024',
      locale: '',
      title: '',
      shortDescription: 'Наименование',
      mainText: '',
      hidden: true,
      updatedAt: '12.12.2024',
    },
    {
      category: 'META',
      date: '12.12.2024',
      locale: '',
      title: '',
      shortDescription: 'Наименование',
      mainText: '',
      hidden: true,
      updatedAt: '12.12.2024',
    }
  ];
}
