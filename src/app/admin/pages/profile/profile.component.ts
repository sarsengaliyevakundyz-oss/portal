import {Component, OnInit} from '@angular/core';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {CurrentUserService} from '../../../shared/services/current-user.service';
import {SystemsService} from '../../../shared/services/systems.service';
import {UserInfo, UserTokenInfo} from '../../../shared/models/user.model';
import {SharedModule} from '../../../shared/shared.module';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    NgForOf,
    SharedModule,
    NgIf,
    NgClass
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: UserInfo | null = null;
  constructor(private system: SystemsService) {
  }

  ngOnInit(): void {
    this.system.getUserInfo().subscribe(userRoles => {
      this.user = userRoles;
  })
  }

  expandedSystems: boolean[] = [];
  expandedChildren: boolean[][] = [];

  toggleSystem(index: number): void {
    this.expandedSystems[index] = !this.expandedSystems[index];

    // Инициализируем детей, если их еще нет
    if (!this.expandedChildren[index]) {
      this.expandedChildren[index] = [];
    }
  }

  toggleChild(systemIndex: number, childIndex: number): void {
    if (!this.expandedChildren[systemIndex]) {
      this.expandedChildren[systemIndex] = [];
    }
    this.expandedChildren[systemIndex][childIndex] = !this.expandedChildren[systemIndex][childIndex];
  }
}
