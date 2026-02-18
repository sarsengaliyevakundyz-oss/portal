import {APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZoneChangeDetection} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import {HttpClient, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
 
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { CoreModule } from './core/core.module';

import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import {HashLocationStrategy, LocationStrategy, registerLocaleData} from '@angular/common';
import ru from '@angular/common/locales/ru';
import {environment} from '../environments/environment';
import {firstValueFrom} from 'rxjs';

// Factory function for the loader
registerLocaleData(ru);
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  // Load translations from assets (public/i18n/*.json)
  return new TranslateHttpLoader(http, './i18n/', '.json');
}

export function initLanguageFactory(translate: TranslateService): () => Promise<unknown> {
  return async () => {
    const savedLang = localStorage.getItem('vip_lang') || 'kz';
    localStorage.setItem('vip_lang', savedLang);
    translate.setDefaultLang(savedLang);
    await firstValueFrom(translate.use(savedLang));
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(CoreModule),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    // Import and configure TranslateModule
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    ),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [TranslateService],
      useFactory: initLanguageFactory
    },
    // Add HashLocationStrategy to use # in routing
    { provide: LocationStrategy, useClass: HashLocationStrategy }
  ]
};
