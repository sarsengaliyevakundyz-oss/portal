import {Component, OnInit} from '@angular/core';
import {NgForOf, NgIf, NgTemplateOutlet} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';
import {NzPaginationComponent} from 'ng-zorro-antd/pagination';
import {SystemsService} from '../../../shared/services/systems.service';
import {SystemChildInfoModel} from '../../../shared/models/system.model';
import {SharedModule} from '../../../shared/shared.module';
import {environment} from '../../../../environments/environment';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzModalComponent, NzModalService} from 'ng-zorro-antd/modal';
import {AddSystemComponent} from './add-ssytem/add-system.component';

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
    AddSystemComponent
  ],
  providers: [NzModalService],
  templateUrl: './admin-systems.component.html',
  styleUrl: './admin-systems.component.css'
})
export class AdminSystemsComponent implements OnInit {
  constructor(private service: SystemsService) {
  }

  pageSize = 10; // Количество элементов на странице
  currentPage = 1;
  paginatedData : SystemChildInfoModel[] = [];
  tableData: SystemChildInfoModel[] = [];

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
    this.service.getAllSystems().subscribe((res) => {
      this.tableData = res.result;
      this.updatePagination();
    })
  }

  protected readonly environment = environment;

  isModalVisible = false;
  selectedSystem: SystemChildInfoModel | null = null;

  openChild(system: SystemChildInfoModel): void {
    this.selectedSystem = system;
    this.isModalVisible = true;
  }

  handleCancel(): void {
    this.isModalVisible = false;
  }

  isShowCreateForm = false;
  openCreateModal() {
    this.isShowCreateForm = true;
  }

  handleFormSubmit(data: any) {
    this.isShowCreateForm = false;
    console.log('Received Data:', data);
  }
}
