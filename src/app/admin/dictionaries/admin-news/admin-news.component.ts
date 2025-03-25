import {Component, OnInit} from '@angular/core';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-admin-news',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './admin-news.component.html',
  styleUrl: './admin-news.component.css'
})
export class AdminNewsComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
      throw new Error('Method not implemented.');
  }
}
