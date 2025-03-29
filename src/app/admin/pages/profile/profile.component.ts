import {Component, OnInit} from '@angular/core';
import {NgForOf} from '@angular/common';
import {CurrentUserService} from '../../../shared/services/current-user.service';
import {SystemsService} from '../../../shared/services/systems.service';
import {UserInfo, UserTokenInfo} from '../../../shared/models/user.model';
import {SharedModule} from '../../../shared/shared.module';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    NgForOf,
    SharedModule
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
}
