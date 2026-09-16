import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampingParceiroService } from '../../../core/services/camping-parceiro.service';
import { LocationService } from '../../../core/services/location.service';
import { ToastService } from '../../../core/services/toast.service';
import { CadastrarCampingComponent } from './cadastrar-camping.component';

describe('CadastrarCampingComponent', () => {
  let fixture: ComponentFixture<CadastrarCampingComponent>;
  let component: CadastrarCampingComponent;
  const service = {
    criar: vi.fn(),
    reivindicar: vi.fn(),
    buscarProximos: vi.fn(() => of([])),
    listarRecursos: vi.fn(() => of([{ id: 1, nome: 'Banheiro' }])),
  };
  const toast = { success: vi.fn(), error: vi.fn() };
  const router = { navigate: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [CadastrarCampingComponent],
      providers: [
        { provide: CampingParceiroService, useValue: service },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
        {
          provide: LocationService,
          useValue: { getCurrentPosition: () => of({ latitude: -22.0174, longitude: -47.8903 }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastrarCampingComponent);
    component = fixture.componentInstance;
    // O mapa Google não existe no jsdom: o componente só o cria quando `google` está definido.
  });

  it('começa no passo de posição', () => {
    expect(component.passo()).toBe('posicao');
  });

  it('não avança sem posição marcada', () => {
    component.posicao.set(null);
    component.continuar();
    expect(component.passo()).toBe('posicao');
  });

  it('avança para dados com posição marcada', () => {
    component.posicao.set({ lat: -22, lng: -47 });
    component.continuar();
    expect(component.passo()).toBe('dados');
  });

  it('reivindicar chama o serviço e navega para /parceiros', () => {
    service.reivindicar.mockReturnValue(of({ id: 5 }));
    component.reivindicar(5);
    expect(service.reivindicar).toHaveBeenCalledWith(5);
    expect(toast.success).toHaveBeenCalledWith('parceiro.cadastro.claimed');
    expect(router.navigate).toHaveBeenCalledWith(['/parceiros']);
  });

  it('reivindicar com 409 mostra erro de conflito', () => {
    service.reivindicar.mockReturnValue(throwError(() => ({ status: 409 })));
    component.reivindicar(5);
    expect(toast.error).toHaveBeenCalledWith('parceiro.cadastro.claim-conflict');
  });

  it('não envia formulário inválido', () => {
    component.posicao.set({ lat: -22, lng: -47 });
    component.continuar();
    component.enviar();
    expect(service.criar).not.toHaveBeenCalled();
  });

  it('envia com posição e recursos selecionados', () => {
    service.criar.mockReturnValue(of({ id: 9 }));
    component.posicao.set({ lat: -22, lng: -47 });
    component.continuar();
    component.form.patchValue({
      nome: 'Camping X',
      tipo: 'pesca',
      cidade: 'Rio Claro',
      estado: 'SP',
    });
    component.alternarRecurso(1);
    component.enviar();
    expect(service.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Camping X',
        tipo: 'pesca',
        latitude: -22,
        longitude: -47,
        recursosIds: [1],
      }),
    );
    expect(toast.success).toHaveBeenCalledWith('parceiro.cadastro.created');
    expect(router.navigate).toHaveBeenCalledWith(['/parceiros']);
  });
});
