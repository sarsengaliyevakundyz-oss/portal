import { Component } from '@angular/core';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    NgForOf
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  systems = [
    { name: '', link: '/', logo: 'systems/footer/halyk_sanagy.svg' },
    { name: '', link: 'https://taldau.stat.gov.kz/', logo: 'systems/footer/taldau.svg' },
    { name: '', link: '/', logo: 'systems/footer/mics.svg' },
    { name: 'Кабинет респондента', link: 'https://cabinet.stat.gov.kz/', logo: 'systems/footer/kabinet.svg' },
  ];
}
