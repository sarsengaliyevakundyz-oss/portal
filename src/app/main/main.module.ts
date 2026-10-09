import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { MainPageComponent } from './pages/main-page/main-page.component';
import { ChatWidgetComponent } from './components/chat/chat-widget.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MainRoutingModule,
    MainPageComponent,
    ChatWidgetComponent
  ],
  exports: [
    MainPageComponent,
    ChatWidgetComponent
  ]
})
export class MainModule {}
