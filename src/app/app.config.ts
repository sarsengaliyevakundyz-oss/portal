import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import {
  provideRouter,
  withInMemoryScrolling,
  withComponentInputBinding,
  DefaultUrlSerializer,
  UrlSerializer,  // ✅ добавили
  UrlTree
} from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { PoweroffOutline } from '@ant-design/icons-angular/icons';

import { routes } from './app.routes';
import { CoreModule } from './core/core.module';

import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { registerLocaleData } from '@angular/common';
import ru from '@angular/common/locales/ru';
import { firstValueFrom } from 'rxjs';

import { NzIconModule } from 'ng-zorro-antd/icon';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import {
  UserOutline,
  DownOutline,
  RightOutline,
  FolderOpenOutline,
  PlusOutline,
  EditOutline,
  EyeOutline,
  EyeInvisibleOutline,
  DeleteOutline
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

export class TrailingSlashUrlSerializer extends DefaultUrlSerializer {
  override parse(url: string): UrlTree {
    const urlWithoutSlash = url.replace(/\/(\?|#|$)/, '$1');
    return super.parse(urlWithoutSlash);
  }
}

const antDesignIcons: IconDefinition[] = [
  UserOutline,
  DownOutline,
  RightOutline,
  FolderOpenOutline,
  PoweroffOutline,
  PlusOutline,
  EditOutline,
  EyeOutline,
  EyeInvisibleOutline,
  DeleteOutline
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'disabled',
        anchorScrolling: 'enabled',
      }),
      withComponentInputBinding()
    ),
    // ✅ Убираем trailing slash глобально
    { provide: UrlSerializer, useClass: TrailingSlashUrlSerializer },
    importProvidersFrom(CoreModule),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(
      NzIconModule.forRoot(antDesignIcons)
    ),
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
  ]
};
