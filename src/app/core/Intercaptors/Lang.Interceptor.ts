import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class LangParamInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Check if it's a GET request from the translate service
    // For example, all translate files are in `/assets/i18n/`
    const isTranslateRequest = req.method === 'GET';

    if (isTranslateRequest) {
      const lang = 'kz'; // or dynamically get from a service or settings

      let newUrl = req.url;
      if (newUrl.includes('?')) {
        // Already has query parameters
        newUrl = `${newUrl}&lang=${lang}`;
      } else {
        // No query parameters yet
        newUrl = `${newUrl}?lang=${lang}`;
      }

      const modifiedReq = req.clone({ url: newUrl });
      return next.handle(modifiedReq);
    }

    return next.handle(req);
  }
}
