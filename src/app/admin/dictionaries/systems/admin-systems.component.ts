import {Component, OnInit} from '@angular/core';
import {NgForOf, NgIf, NgTemplateOutlet, JsonPipe} from '@angular/common'; 
import {TranslatePipe} from '@ngx-translate/core';
import {NzPaginationComponent} from 'ng-zorro-antd/pagination';
import {SystemsService} from '../../../shared/services/systems.service';
import {SystemChildInfoModel, SystemListModel} from '../../../shared/models/system.model';
import {SharedModule} from '../../../shared/shared.module';
import {environment} from '../../../../environments/environment';
import {NzModalService} from 'ng-zorro-antd/modal';
import {AddSystemComponent} from './add-ssytem/add-system.component';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { 
  FormBuilder, 
  FormGroup, 
  FormArray, 
  Validators, 
  ReactiveFormsModule,
  FormsModule 
} from '@angular/forms';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    TranslatePipe,
    NzPaginationComponent,
    SharedModule,
    NzButtonModule,
    NzModalModule,
    NgTemplateOutlet,
    JsonPipe,
    AddSystemComponent,
    NzIconModule,
    NzFormModule,
    NzInputModule,
    NzSwitchModule,
    FormsModule,
    NzSpinModule,
    ReactiveFormsModule,
    NzDividerModule,
    NzAlertModule,
  ],
  providers: [NzMessageService],
  templateUrl: './admin-systems.component.html',
  styleUrl: './admin-systems.component.css'
})
export class AdminSystemsComponent implements OnInit {
  editForm: FormGroup;

  constructor(
    private service: SystemsService,
    private message: NzMessageService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      codeName: ['', Validators.required],
      nameRu: ['', Validators.required],
      nameKz: [''],
      descriptionRu: [''],
      descriptionKz: [''],
      fullImgPath: [''],
      active: [true],
      kurator: this.fb.array([])
    });
  }

  pageSize = 10;
  currentPage = 1;
  paginatedData : SystemChildInfoModel[] = [];
  tableData: SystemChildInfoModel[] = [];

  isEditModalVisible = false;
  isShowCreateForm = false;
  isLoading = false;
  isSaving = false;
  
  editSystemData: SystemChildInfoModel | null = null;
  selectedSystem: SystemChildInfoModel | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedData = this.tableData.slice(startIndex, endIndex);
  }

  private loadData() {
    this.service.getSystemsList().subscribe({
      next: (res) => {
        this.tableData = res.result.map(system => this.mapSystemListToChildInfo(system));
        this.updatePagination();
      },
      error: (err) => console.error('Error loading systems:', err)
    });
  }

  private mapSystemListToChildInfo(system: SystemListModel): SystemChildInfoModel {
    const imgPath = system.fullImgPath || '';
    
    return {
      systemInfo: {
        id: system.id,
        codeName: system.codeName,
        name: { ru: system.nameRu, kz: system.nameKz, en: '' },
        description: { ru: system.descriptionRu, kz: system.descriptionKz, en: '' },
        kurator: system.kurator.map(k => ({
          name: { ru: k.kuratorNameRu, kz: k.kuratorNameKz, en: '' },
          department: { ru: k.kuratorDepartmentRu, kz: k.kuratorDepartmentKz, en: '' }
        })),
        pathImg: { ru: imgPath, kz: imgPath, en: '' },
        fullPathImg: imgPath,
        active: system.active 
      },
      children: []
    };
  }

  get kuratorControls(): FormArray {
    return this.editForm.get('kurator') as FormArray;
  }
  
  addKurator(kurator?: any): void {
    const kuratorGroup = this.fb.group({
      nameKz: [kurator?.name?.kz || ''],
      nameRu: [kurator?.name?.ru || ''],
      departmentKz: [kurator?.department?.kz || ''],
      departmentRu: [kurator?.department?.ru || '']
    });
    
    this.kuratorControls.push(kuratorGroup);
  }
  
  removeKurator(index: number): void {
    this.kuratorControls.removeAt(index);
  }

  openEditModal(systemId: number): void {
    this.isEditModalVisible = true;
    this.isLoading = true;
  
    this.service.getSystemById(systemId.toString()).subscribe({
      next: (res: any) => {
        this.populateEditForm(res);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading system data:', err);
        this.message.error('Ошибка загрузки данных системы');
        this.isLoading = false;
        this.isEditModalVisible = false;
      }
    });
  }

  private populateEditForm(systemData: any): void {
    this.editForm.patchValue({
      codeName: systemData.codeName,
      nameRu: systemData.nameRu,
      nameKz: systemData.nameKz,
      descriptionRu: systemData.descriptionRu,
      descriptionKz: systemData.descriptionKz,
      fullImgPath: systemData.fullImgPath,
      active: systemData.active
    });
    this.kuratorControls.clear();
    if (systemData.kurator && systemData.kurator.length > 0) {
      systemData.kurator.forEach((k: any) => {
        this.addKurator(k);
      });
    }
  }

  handleEditCancel(): void {
    this.isEditModalVisible = false;
    this.editSystemData = null;
    this.isSaving = false;
  }

  handleEditSubmit(): void {
    if (this.editForm.valid) {
      this.isSaving = true;
      
      const formData = this.editForm.value; 
    }
  }

  protected readonly environment = environment;

  isModalVisible = false;

  openChild(system: SystemChildInfoModel): void {
    this.selectedSystem = system;
    this.isModalVisible = true;
  }

  handleCancel(): void {
    this.isModalVisible = false;
  }
  openCreateModal() {
    this.isShowCreateForm = true;
  }

  handleFormSubmit(data: any) {
    this.service.addSystem(data).subscribe((res) => {
      this.isShowCreateForm = false;
      this.loadData();
    })
  }
}
