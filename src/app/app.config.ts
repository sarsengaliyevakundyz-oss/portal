import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withComponentInputBinding } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { CoreModule } from './core/core.module';

import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HashLocationStrategy, LocationStrategy, registerLocaleData } from '@angular/common';
import ru from '@angular/common/locales/ru';
import { firstValueFrom } from 'rxjs';

// 👇 НОВЫЕ ИМПОРТЫ ДЛЯ ИКОНОК
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import {
  UserOutline,
  DownOutline,
  RightOutline,
  FolderOpenOutline,
  // Добавьте другие иконки, если используете
} from '@ant-design/icons-angular/icons';

registerLocaleData(ru);

export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
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

// 👇 Регистрируем иконки
const antDesignIcons: IconDefinition[] = [
  UserOutline,
  DownOutline,
  RightOutline,
  FolderOpenOutline
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      // withViewTransitions({
      //   onViewTransitionCreated(transitionInfo) {
      //     // Плавный переход
      //   }
      // }),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
      withComponentInputBinding()
    ),
    importProvidersFrom(CoreModule),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),

    // 👇 ДОБАВЬТЕ ЭТО: регистрация модуля иконок
    importProvidersFrom(
      NzIconModule.forRoot(antDesignIcons)  // Регистрируем иконки
    ),

    // 👇 ИЛИ используйте провайдер (можно оба способа, но лучше один)
    {
      provide: NZ_ICONS,
      useValue: antDesignIcons
    },

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
    // { provide: LocationStrategy, useClass: HashLocationStrategy }
  ]
};
