import {Component, OnInit} from '@angular/core';
import {NgForOf, NgIf, NgTemplateOutlet} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';
import {NzPaginationComponent} from 'ng-zorro-antd/pagination';
import {SystemsService} from '../../../shared/services/systems.service';
import {SystemChildInfoModel, SystemListModel} from '../../../shared/models/system.model';
import {SharedModule} from '../../../shared/shared.module';
import {environment} from '../../../../environments/environment';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzModalComponent, NzModalService} from 'ng-zorro-antd/modal';
import {AddSystemComponent} from './add-ssytem/add-system.component';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { FormsModule } from '@angular/forms';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    TranslatePipe,
    NzPaginationComponent,
    SharedModule,
    NzButtonComponent,
    NzModalComponent,
    NgTemplateOutlet,
    AddSystemComponent,
    NzIconModule,
    NzFormModule,
    NzInputModule,
    NzSwitchModule,
    FormsModule,
    NzSpinModule
  ],
  providers: [NzModalService, NzMessageService],
  templateUrl: './admin-systems.component.html',
  styleUrl: './admin-systems.component.css'
})
export class AdminSystemsComponent implements OnInit {
  constructor(
    private service: SystemsService,
    private message: NzMessageService
  ) {
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

  openEditModal(systemId: number): void {
    this.isEditModalVisible = true;
    this.isLoading = true;
    this.editSystemData = null;

    this.service.getSystemById(systemId.toString()).subscribe({
      next: (res) => {
        this.editSystemData = res.result;
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

  handleEditCancel(): void {
    this.isEditModalVisible = false;
    this.editSystemData = null;
    this.isSaving = false;
  }

  handleEditSubmit(): void {
    if (this.editSystemData) {
      this.isSaving = true;
      
      console.log('Данные для сохранения:', this.editSystemData);
      
      setTimeout(() => {
        this.isSaving = false;
        this.isEditModalVisible = false;
        this.message.success('Изменения успешно сохранены');
        this.loadData();
      }, 1000);
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
