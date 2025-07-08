import {Component, OnInit} from '@angular/core';
import {SystemsService} from '../../../shared/services/systems.service';
import {ActivatedRoute} from '@angular/router';
import {SystemChildInfoModel, SystemChildModel} from '../../../shared/models/system.model';
import {NgForOf} from '@angular/common';
import {CurrentUserService} from '../../../shared/services/current-user.service';
import {SharedModule} from "../../../shared/shared.module";
import {TranslateService} from '@ngx-translate/core';
import {ITranslateName} from '../../../shared/pipes/name-translate.pipe';
import {UmamiService} from '../../../core/services/Umami.service';

@Component({
  selector: 'app-system-child',
  standalone: true,
    imports: [
        NgForOf,
        SharedModule
    ],
  templateUrl: './system-child.component.html',
  styleUrl: './system-child.component.css'
})
export class SystemChildComponent implements OnInit{
  id: string = '';
  info: SystemChildInfoModel = {} as SystemChildInfoModel;
  constructor(private service: SystemsService, private route: ActivatedRoute, private currentUser: CurrentUserService,
              private translate: TranslateService, private umami: UmamiService) {
  }
  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') as string;
    this.service.getSystemInfo(this.id).subscribe(res=>{
      this.info = res.result;
    })
  }

  openModule(module: SystemChildModel) {
    this.umami.trackButtonClick(
      module.name.ru,
      this.info.systemInfo.name.ru,
      this.currentUser.getCurrentUser()?.full_name
    );
  
    const url = module.url[this.translate.currentLang as keyof ITranslateName];
    const langStorage = localStorage.getItem("vip_lang");
    const lang = (langStorage === "kz" ? "kk" : "ru");
  
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
      newWin.postMessage(message, targetOrigin);
    });
  }
  

  onImgError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/default_user.png';
  }
}
