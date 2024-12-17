import {Component, OnInit} from '@angular/core';
import {SystemsService} from '../../../shared/services/systems.service';
import {ActivatedRoute} from '@angular/router';
import {SystemChildInfoModel, SystemChildModel} from '../../../shared/models/system.model';
import {NgForOf} from '@angular/common';
import {CurrentUserService} from '../../../shared/services/current-user.service';
import {SharedModule} from "../../../shared/shared.module";
import {TranslateService} from '@ngx-translate/core';
import {ITranslateName} from '../../../shared/pipes/name-translate.pipe';

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
              private translate: TranslateService) {
  }
  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') as string;
    this.service.getSystemInfo(this.id).subscribe(res=>{
      this.info = res.result;
    })
  }

  openModule(module: SystemChildModel) {
    const url = module.url[this.translate.currentLang as keyof ITranslateName];
    const lang = localStorage.getItem("vip_lang")
    const accessUrl = 'access_token=' + this.currentUser.getCurrentUser()?.accessToken + '&refresh_token=' + this.currentUser.getCurrentUser()?.refreshToken
      + '&lang=' + lang == "kz" ? "kk" : lang
    if (url?.includes('?'))
      window.open(url + '&' + accessUrl, '_blank')
    else
      window.open(url + '?' +accessUrl, '_blank')
  }

  onImgError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/default_user.png';
  }
}
