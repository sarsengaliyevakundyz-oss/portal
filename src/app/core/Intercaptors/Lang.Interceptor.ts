import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class LangParamInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.method === 'GET') {
      const existingHasLang = /[?&]lang=/.test(req.url);
      const isRelativeUrl = req.url.startsWith('/');
      if (!existingHasLang && isRelativeUrl) {
        const langFromStorage = localStorage.getItem('vip_lang');
        const safeLang = langFromStorage && langFromStorage.trim().length > 0 ? langFromStorage : 'kz';

        const separator = req.url.includes('?') ? '&' : '?';
        const newUrl = `${req.url}${separator}lang=${safeLang}`;
        const modifiedReq = req.clone({ url: newUrl });
        return next.handle(modifiedReq);
      }
    }

    return next.handle(req);
  }
}
