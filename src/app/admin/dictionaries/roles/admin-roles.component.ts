import {Component, OnInit} from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';
import {NzPaginationComponent} from 'ng-zorro-antd/pagination';
import {Role} from '../../../shared/models/user.model';
import {SystemsService} from '../../../shared/services/systems.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    TranslatePipe,
    NzPaginationComponent
  ],
  templateUrl: './admin-roles.component.html',
  styleUrl: './admin-roles.component.css'
})
export class AdminRolesComponent implements OnInit {
  constructor(private service: SystemsService) {
  }
  tableData: Role[] = [];

  pageSize = 10; // Количество элементов на странице
  currentPage = 1;
  paginatedData : Role[] = [];

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
    this.service.getRoles().subscribe((res) => {
      this.tableData = res;
      this.updatePagination();
    })
  }
}
