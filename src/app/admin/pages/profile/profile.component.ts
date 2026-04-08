import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { SystemsService } from '../../../shared/services/systems.service';
import { UserInfo } from '../../../shared/models/user.model';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    NzIconModule,
    NzTagModule,
    TranslatePipe,
    SharedModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: UserInfo | null = null;
  expandedSystems: boolean[] = [];
  expandedChildren: boolean[][] = [];

  private langChangeSubscription?: Subscription;

  constructor(
    private system: SystemsService,
    private translate: TranslateService  // 👈 добавить TranslateService
  ) {}

  ngOnInit(): void {
    this.loadUserData();

    // Подписываемся на смену языка
    this.langChangeSubscription = this.translate.onLangChange.subscribe(() => {
      this.loadUserData();
    });
  }

  ngOnDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  loadUserData(): void {
    // Получаем текущий язык
    const lang = this.translate.currentLang === 'kz' ? 'kk' : 'ru';

    this.system.getUserInfo(lang).subscribe(userRoles => {
      this.user = userRoles;
      if (this.user?.systems) {
        // Сохраняем состояние раскрытия
        const oldExpandedSystems = [...this.expandedSystems];
        const oldExpandedChildren = [...this.expandedChildren];

        this.expandedSystems = new Array(this.user.systems.length).fill(false);
        this.expandedChildren = this.user.systems.map(sys =>
          new Array(sys.subsystems.length).fill(false)
        );

        // Восстанавливаем состояние раскрытия
        if (oldExpandedSystems.length) {
          for (let i = 0; i < Math.min(oldExpandedSystems.length, this.expandedSystems.length); i++) {
            this.expandedSystems[i] = oldExpandedSystems[i];
          }
        }

        if (oldExpandedChildren.length) {
          for (let i = 0; i < Math.min(oldExpandedChildren.length, this.expandedChildren.length); i++) {
            if (oldExpandedChildren[i] && this.expandedChildren[i]) {
              for (let j = 0; j < Math.min(oldExpandedChildren[i].length, this.expandedChildren[i].length); j++) {
                this.expandedChildren[i][j] = oldExpandedChildren[i][j];
              }
            }
          }
        }
      }
    });
  }

  toggleSystem(index: number): void {
    this.expandedSystems[index] = !this.expandedSystems[index];

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

  getInitials(fullName: string): string {
    if (!fullName) return 'U';
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return fullName.charAt(0).toUpperCase();
  }
}
