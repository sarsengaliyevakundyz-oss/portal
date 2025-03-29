import {Component, OnInit} from '@angular/core';
import {NgForOf} from '@angular/common';
import {CurrentUserService} from '../../../shared/services/current-user.service';
import {SystemsService} from '../../../shared/services/systems.service';
import {UserInfo, UserTokenInfo} from '../../../shared/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    NgForOf
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: UserInfo | null = null;
  constructor(private currentUser: CurrentUserService, private system: SystemsService) {
  }

  ngOnInit(): void {
    const currentUser = this.currentUser.getCurrentUser();
    this.system.getUserRoles().subscribe(userRoles => {
      if (currentUser) {
        this.user = {
          ...currentUser,
          roles: userRoles.map(x=>x.roleName) ?? [], // Ensure roles exist
        };
      } else {
        this.user = null;
      }
    })

  }
}
