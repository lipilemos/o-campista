import { bootstrapApplication } from '@angular/platform-browser';
import 'zone.js';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

// Load Google Maps script dynamically
const loadGoogleMaps = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&loading=async&libraries=marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    document.head.appendChild(script);
  });
};

loadGoogleMaps().then(() => {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
});
