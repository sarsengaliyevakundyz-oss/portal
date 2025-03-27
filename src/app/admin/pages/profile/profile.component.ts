import { Component } from '@angular/core';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    NgForOf
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  user = {
    family_name: "Поль",
    given_name: "Неля",
    full_name: "Неля Поль",
    email: "n.pol@stat.kz",
    preferred_username: "n.pol",
    roles: ["Админ", "Мдератор"]
  };
}
