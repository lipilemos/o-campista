import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';
import { Camping } from '../models/camping.model';
import { Weather } from '../models/weather.model';
import { WeatherForecast } from '../models/weather-forecast.model';

interface WeatherCache {
  clima: Weather;
  previsao: WeatherForecast[];
  timestamp: number;
}

const DB_NAME = 'ocampista-offline';
const DB_VERSION = 1;

@Injectable({
  providedIn: 'root',
})
export class OfflineStorageService {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('campings')) {
          db.createObjectStore('campings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('weather')) {
          db.createObjectStore('weather');
        }
      },
    });
  }

  async saveCampings(campings: Camping[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction('campings', 'readwrite');
    await tx.store.clear();
    for (const camping of campings) {
      await tx.store.put(camping);
    }
    await tx.done;
  }

  async getCampings(): Promise<Camping[]> {
    const db = await this.dbPromise;
    return db.getAll('campings');
  }

  async saveWeather(clima: Weather, previsao: WeatherForecast[]): Promise<void> {
    const db = await this.dbPromise;
    const cache: WeatherCache = { clima, previsao, timestamp: Date.now() };
    await db.put('weather', cache, 'latest');
  }

  async getWeather(): Promise<WeatherCache | undefined> {
    const db = await this.dbPromise;
    return db.get('weather', 'latest');
  }
}
