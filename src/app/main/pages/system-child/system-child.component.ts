import {Component, OnInit} from '@angular/core';
import {SystemsService} from '../../../shared/services/systems.service';
import {ActivatedRoute} from '@angular/router';
import {SystemChildInfoModel, SystemChildModel} from '../../../shared/models/system.model';
import {NgForOf} from '@angular/common';
import {CurrentUserService} from '../../../shared/services/current-user.service';
import {SharedModule} from "../../../shared/shared.module";

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
  token: string | undefined = '';
  constructor(private service: SystemsService, private route: ActivatedRoute, private currentUser: CurrentUserService) {
  }
  ngOnInit(): void {
    this.token = this.currentUser.getCurrentUser()?.accessToken;
    this.id = this.route.snapshot.paramMap.get('id') as string;
    this.service.getSystemInfo(this.id).subscribe(res=>{
      this.info = res.result;
    })
  }

  openModule(module: SystemChildModel) {
    if(module.url.includes('?'))
      window.open(module.url + '&token=' + this.token, '_blank')
    else
      window.open(module.url + '?token=' + this.token, '_blank')
  }

  onImgError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/default_user.png';
  }
}
