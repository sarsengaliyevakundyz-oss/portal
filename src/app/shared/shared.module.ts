import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NameTranslatePipe} from './pipes/name-translate.pipe';
import {NzIconModule} from 'ng-zorro-antd/icon';


@NgModule({
  declarations: [
    NameTranslatePipe
  ],
    imports: [
        CommonModule, NzIconModule
    ],
    exports: [
      NameTranslatePipe, NzIconModule
    ]

})
export class SharedModule {
}
