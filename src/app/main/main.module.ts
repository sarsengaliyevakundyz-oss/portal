import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';
import { MainRoutingModule } from './main-routing.module';
import {NzSelectComponent} from 'ng-zorro-antd/select';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {FormsModule} from '@angular/forms';


@NgModule({
  declarations: [

  ],
  imports: [
    CommonModule,
    MainRoutingModule,
    NzSelectComponent,
    NzButtonComponent,
    NzIconDirective,
    FormsModule,

  ],
  exports:[

  ]
})
export class MainModule { }
