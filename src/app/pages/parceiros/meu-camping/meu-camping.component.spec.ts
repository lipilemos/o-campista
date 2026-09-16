import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampingPainel, CampingParceiro } from '../../../core/models/camping-parceiro.model';
import { CampingParceiroService } from '../../../core/services/camping-parceiro.service';
import { MeuCampingComponent } from './meu-camping.component';

const camping = (id: number, donoStatus: 'pendente' | 'aprovado'): CampingParceiro => ({
  id,
  nome: `Camping ${id}`,
  tipo: 'camping',
  cidade: 'X',
  estado: 'SP',
  latitude: 0,
  longitude: 0,
  ativo: donoStatus === 'aprovado',
  donoStatus,
  criadoEm: '2026-09-01T00:00:00Z',
});

const painel = (campingId: number): CampingPainel => ({
  campingId,
  checkins30Dias: 4,
  checkinsTotal: 10,
  visitantesUnicos: 7,
  avaliacaoMedia: 4.5,
  totalAvaliacoes: 3,
  totalFavoritos: 2,
  statusOcupacao: null,
  checkinsPorDia: Array.from({ length: 30 }, (_, i) => ({
    data: `2026-08-${String(i + 1).padStart(2, '0')}`,
    quantidade: i % 3,
  })),
});

describe('MeuCampingComponent', () => {
  let fixture: ComponentFixture<MeuCampingComponent>;
  let component: MeuCampingComponent;
  const service = { listarMeus: vi.fn(), obterPainel: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [MeuCampingComponent],
      providers: [provideRouter([]), { provide: CampingParceiroService, useValue: service }],
    }).compileComponents();
  });

  function criar() {
    fixture = TestBed.createComponent(MeuCampingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('mostra estado vazio sem campings', () => {
    service.listarMeus.mockReturnValue(of([]));
    criar();
    expect(component.campings()).toEqual([]);
    expect(component.painel()).toBeNull();
    expect(service.obterPainel).not.toHaveBeenCalled();
  });

  it('seleciona o primeiro camping e carrega o painel', () => {
    service.listarMeus.mockReturnValue(of([camping(1, 'pendente'), camping(2, 'aprovado')]));
    service.obterPainel.mockImplementation((id: number) => of(painel(id)));
    criar();
    expect(component.selecionado()?.id).toBe(1);
    expect(service.obterPainel).toHaveBeenCalledWith(1);
    expect(component.painel()?.checkins30Dias).toBe(4);
  });

  it('trocar de camping recarrega o painel', () => {
    service.listarMeus.mockReturnValue(of([camping(1, 'pendente'), camping(2, 'aprovado')]));
    service.obterPainel.mockImplementation((id: number) => of(painel(id)));
    criar();
    component.selecionar(2);
    expect(service.obterPainel).toHaveBeenLastCalledWith(2);
    expect(component.painel()?.campingId).toBe(2);
  });

  it('marca erro quando o painel falha', () => {
    service.listarMeus.mockReturnValue(of([camping(1, 'aprovado')]));
    service.obterPainel.mockReturnValue(throwError(() => new Error('x')));
    criar();
    expect(component.erro()).toBe(true);
  });

  it('calcula a altura das barras proporcional ao máximo', () => {
    service.listarMeus.mockReturnValue(of([camping(1, 'aprovado')]));
    service.obterPainel.mockReturnValue(of(painel(1)));
    criar();
    const barras = component.barras();
    expect(barras.length).toBe(30);
    expect(Math.max(...barras.map((b) => b.altura))).toBe(100);
  });
});
