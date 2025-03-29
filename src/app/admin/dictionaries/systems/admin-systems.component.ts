import {Component, OnInit} from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';
import {NzPaginationComponent} from 'ng-zorro-antd/pagination';
import {Role} from '../../../shared/models/user.model';
import {SystemsService} from '../../../shared/services/systems.service';
import {SystemModel} from '../../../shared/models/system.model';
import {SharedModule} from '../../../shared/shared.module';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    TranslatePipe,
    NzPaginationComponent,
    SharedModule
  ],
  templateUrl: './admin-systems.component.html',
  styleUrl: './admin-systems.component.css'
})
export class AdminSystemsComponent implements OnInit {
  constructor(private service: SystemsService) {
  }

  pageSize = 10; // Количество элементов на странице
  currentPage = 1;
  paginatedData : SystemModel[] = [];
  tableData: SystemModel[] = [];

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
      this.tableData = res;
      this.updatePagination();
    })
  }
}
