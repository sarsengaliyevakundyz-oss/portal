import { Component } from '@angular/core';
import {NgForOf} from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    NgForOf,
    TranslatePipe
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  systems = [
    { name: '', link: 'http://172.16.0.182:9999/sanaqui/#/home', logo: 'systems/footer/selhoz.png', largeLogo: true },
    { name: '', link: 'https://taldau.stat.gov.kz/', logo: 'systems/footer/taldau.png', largeLogo: true },
    { name: '', link: 'https://cabinet.stat.gov.kz/', logo: 'systems/footer/cabinet_res_new_logo.jpg' },
  ];
}
