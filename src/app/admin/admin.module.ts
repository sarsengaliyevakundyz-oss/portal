import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AnalyticsComponent } from './analytics/analytics.component';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AdminRoutingModule,AnalyticsComponent
  ]
})
export class AdminModule { }
