import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {LangParamInterceptor} from './Intercaptors/Lang.Interceptor';
import {JwtInterceptor} from './Intercaptors/jwt.interceptor';




@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    },
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: LangParamInterceptor,
    //   multi: true
    // }
  ],
  exports:[

  ]
})
export class CoreModule { }
