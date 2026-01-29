import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

(() => {
  const PROD_DOMAIN_HOST = 'new.e.stat.gov.kz';
  const PROD_BACKEND_HOST = '172.16.0.182';

  if (window.location.hostname === PROD_DOMAIN_HOST) {
    const url = new URL(window.location.href);
    url.hostname = PROD_BACKEND_HOST;
    window.location.replace(url.toString());
  }
})();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
