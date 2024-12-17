import { Injectable } from '@angular/core';
import {NavigationEnd, Router} from "@angular/router";


@Injectable({
  providedIn: 'root'  // Singleton service provided at the root level
})
export class UmamiService {
  constructor(private router: Router) {
  }
  private scriptLoaded = false;

  loadUmamiScript() {
    // Only load the script if it hasn't been loaded yet
    if (!this.scriptLoaded) {
      const umamiScript = document.createElement('script');
      umamiScript.src = 'https://cabtmp.stat.gov.kz/analytics.js'; // Replace with your Umami script URL
      umamiScript.setAttribute('data-website-id', '92cdaed1-6f6d-4f89-9dab-b9e2d298d6ff'); // Replace with your website ID
      umamiScript.async = true;  // Add async attribute
      umamiScript.defer = true;  // Add defer attribute
      document.body.appendChild(umamiScript);

      // Mark the script as loaded
      this.scriptLoaded = true;
    }
  }


  initializeManualPageTracking() {
    // Subscribe to Angular's Router events to track page views manually
    this.router.events.subscribe(event => {
      // @ts-ignore
      if (event instanceof NavigationEnd && window.umami) {
        const url = event.urlAfterRedirects;
        const referrer = document.referrer;
        console.log('hello umami')
        // @ts-ignore
        window.umami.trackView(url, referrer);
      }
    });
  }
}


