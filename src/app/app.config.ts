import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, HttpClient } from '@angular/common/http';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { CoreModule } from './core/core.module';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import {HashLocationStrategy, LocationStrategy, registerLocaleData} from '@angular/common';
import ru from '@angular/common/locales/ru';
import {environment} from '../environments/environment';

// Factory function for the loader
registerLocaleData(ru);
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, 'internalportalfront/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(CoreModule),
    provideAnimations(),
    provideHttpClient(),
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
    // Add HashLocationStrategy to use # in routing
    // { provide: LocationStrategy, useClass: HashLocationStrategy }
  ]
};
