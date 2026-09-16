import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { CampingParceiroService } from './camping-parceiro.service';

describe('CampingParceiroService', () => {
  let service: CampingParceiroService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/campings/parceiros`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CampingParceiroService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('criar faz POST com o payload', () => {
    const payload = {
      nome: 'Camping X',
      tipo: 'camping' as const,
      cidade: 'São Carlos',
      estado: 'SP',
      latitude: -22,
      longitude: -47,
      recursosIds: [1, 2],
    };
    service.criar(payload).subscribe();
    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('reivindicar faz POST no id', () => {
    service.reivindicar(7).subscribe();
    const req = http.expectOne(`${base}/7/reivindicar`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('listarMeus faz GET em /meus', () => {
    service.listarMeus().subscribe();
    http.expectOne(`${base}/meus`).flush([]);
  });

  it('obterPainel faz GET em /{id}/painel', () => {
    service.obterPainel(3).subscribe();
    http.expectOne(`${base}/3/painel`).flush({});
  });

  it('buscarProximos envia lat e lng como query', () => {
    service.buscarProximos(-22.5, -47.25).subscribe();
    const req = http.expectOne((r) => r.url === `${base}/proximos`);
    expect(req.request.params.get('lat')).toBe('-22.5');
    expect(req.request.params.get('lng')).toBe('-47.25');
    req.flush([]);
  });

  it('listarRecursos faz GET em /recursos', () => {
    service.listarRecursos().subscribe();
    http.expectOne(`${environment.apiUrl}/recursos`).flush([]);
  });
});
