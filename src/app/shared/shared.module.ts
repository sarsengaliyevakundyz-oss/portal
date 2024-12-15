import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NameTranslatePipe} from './pipes/name-translate.pipe';


@NgModule({
  declarations: [
    NameTranslatePipe
  ],
    imports: [
        CommonModule,
    ],
    exports: [
      NameTranslatePipe
    ]

})
export class SharedModule {
}
