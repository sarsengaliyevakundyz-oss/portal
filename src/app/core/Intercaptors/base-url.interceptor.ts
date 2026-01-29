import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class BaseUrlInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only rewrite relative URLs. Absolute URLs should remain untouched.
    if (!req.url.startsWith('/')) {
      return next.handle(req);
    }

    const rewrittenUrl = this.rewriteUrl(req.url);
    if (rewrittenUrl === req.url) {
      return next.handle(req);
    }

    return next.handle(req.clone({ url: rewrittenUrl }));
  }

  private rewriteUrl(relativeUrl: string): string {
    const { protocol, hostname, port, origin } = window.location;
    const effectivePort = port || '9999';

    // PROD: frontend hosted on domain, backend reachable via IP
    if (hostname === 'new.e.stat.gov.kz') {
      return new URL(relativeUrl, `${protocol}//172.16.0.182:${effectivePort}`).toString();
    }

    // TEST: same host (no rewrite needed)
    if (hostname === '172.16.18.182') {
      return new URL(relativeUrl, origin).toString();
    }

    // Fallback: keep current origin
    return new URL(relativeUrl, origin).toString();
  }
}

