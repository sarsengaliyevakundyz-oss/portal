import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent {  iframeError = false;
}
