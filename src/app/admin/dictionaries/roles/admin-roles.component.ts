import {Component, OnInit} from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';
import {NzPaginationComponent} from 'ng-zorro-antd/pagination';
import {Role} from '../../../shared/models/user.model';

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
  tableData: Role[] = [
    { id: 101, roleName: 'Administrator' },
    { id: 102, roleName: 'Editor' },
    { id: 103, roleName: 'User' },
    { id: 104, roleName: 'Manager' },
    { id: 105, roleName: 'Guest' },
    { id: 106, roleName: 'SuperUser' },
    { id: 107, roleName: 'Moderator' },
    { id: 108, roleName: 'Support' },
    { id: 109, roleName: 'Analyst' },
    { id: 110, roleName: 'Developer' }
  ];

  pageSize = 4; // Количество элементов на странице
  currentPage = 1;
  paginatedData : Role[] = [];

  ngOnInit(): void {
    this.updatePagination();
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
}
