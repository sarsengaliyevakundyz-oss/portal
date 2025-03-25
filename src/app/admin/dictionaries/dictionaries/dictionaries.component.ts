import { Component } from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-dictionaries',
  standalone: true,
  imports: [
    RouterOutlet
  ],
  templateUrl: './dictionaries.component.html',
  styleUrl: './dictionaries.component.css'
})
export class DictionariesComponent {
  constructor(private router: Router) {
  }

  navigateToPage(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    if (selectedValue) {
      this.router.navigate([selectedValue]);
    }
  }
}
