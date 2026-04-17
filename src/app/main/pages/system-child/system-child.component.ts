import {Component, OnInit} from '@angular/core';
import {SystemsService} from '../../../shared/services/systems.service';
import {ActivatedRoute} from '@angular/router';
import {SystemChildInfoModel, SystemChildModel} from '../../../shared/models/system.model';
import {CurrentUserService} from '../../../shared/services/current-user.service';
import {SharedModule} from "../../../shared/shared.module";
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {ITranslateName} from '../../../shared/pipes/name-translate.pipe';
import {UmamiService} from '../../../core/services/Umami.service';
import { Location } from '@angular/common';
import { NgForOf, NgIf } from '@angular/common';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-system-child',
  standalone: true,
  imports: [
    NgForOf,
    SharedModule, NgIf,NzSpinModule,
    TranslatePipe
  ],
  templateUrl: './system-child.component.html',
  styleUrl: './system-child.component.css'
})

export class SystemChildComponent implements OnInit{
  id: string = '';
  info: SystemChildInfoModel | null = null; // ✅ null вместо пустого объекта
  constructor(private service: SystemsService, private route: ActivatedRoute, private currentUser: CurrentUserService,
              private translate: TranslateService, private umami: UmamiService,  private location: Location  // ✅ добавь
  ) {
  }
  ngOnInit(): void {
    this.info = null; // ✅ сбрасываем при каждом входе
    this.id = this.route.snapshot.paramMap.get('id') as string;
    this.service.getSystemInfo(this.id).subscribe(res => {
      this.info = res.result;
    });
  }

  openModule(module: SystemChildModel) {
    if (!this.info) return; // ✅ защита от null

    this.umami.trackButtonClick(

      module.name.ru,
      this.info.systemInfo.name.ru,
      this.currentUser.getCurrentUser()?.full_name
    );

    const url = module.url[this.translate.currentLang as keyof ITranslateName];
    const langStorage = localStorage.getItem("vip_lang");
    const lang = (langStorage === "kz" ? "kk" : "ru");

    if (!url) {
      console.error('URL is undefined or empty');
      return;
    }

    const newWin = window.open(url, '_blank');
    if (!newWin) {
      console.error('Не удалось открыть окно для модуля:', url);
      return;
    }

    newWin.addEventListener('load', () => {
      const message = {
        type: 'AUTH_SECRET_CODE',
        secretCode: this.currentUser.getSecretCode(),
        lang
      };
      const targetOrigin = new URL(url).origin;
      console.log('PostMessage data:', {
        message: message,
        targetOrigin: targetOrigin
      });
      newWin.postMessage(message, targetOrigin);
    });
  }

  goBack(): void {
    this.location.back();
  }
  onImgError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/default_user.png';
  }
}
