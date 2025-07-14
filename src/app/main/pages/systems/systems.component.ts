import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForOf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SystemsService } from '../../../shared/services/systems.service';
import { SystemModel } from '../../../shared/models/system.model';
import { SharedModule } from '../../../shared/shared.module';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { environment } from "../../../../environments/environment";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-systems',
  standalone: true,
  imports: [
    NgForOf,
    RouterModule,
    SharedModule,
    TranslatePipe
  ],
  templateUrl: './systems.component.html',
  styleUrl: './systems.component.css'
})
export class SystemsComponent implements OnInit, OnDestroy {
  items: SystemModel[] = [];
  loading = false;
  private langChangeSub!: Subscription;

  constructor(
    private service: SystemsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.getData();
    this.subscribeToLangChanges();
  }

  private getData(): void {
    this.loading = true;
    this.service.getList().subscribe({
      next: (res) => {
        this.items = res.result;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading systems:', err);
        this.loading = false;
      }
    });
  }

  private subscribeToLangChanges(): void {
    this.langChangeSub = this.translate.onLangChange.subscribe(() => {
      this.getData();
    });
  }

  onImgError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'systems/default_system.png';
  }

  ngOnDestroy(): void {
    if (this.langChangeSub) {
      this.langChangeSub.unsubscribe();
    }
  }

  protected readonly environment = environment;
}
