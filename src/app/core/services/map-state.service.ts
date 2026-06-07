import { Injectable, signal } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class MapStateService {

    campingAberto = signal(false);
    presenteAberto = signal(false);
}
