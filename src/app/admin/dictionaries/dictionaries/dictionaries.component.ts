import { Component } from '@angular/core';
import {RouterOutlet} from '@angular/router';

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

}
