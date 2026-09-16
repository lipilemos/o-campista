import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  function setup(authenticated: boolean) {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { isAuthenticated: () => authenticated } }],
    });
    const router = TestBed.inject(Router);
    return { router };
  }

  it('libera quando autenticado', () => {
    setup(true);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/parceiros/cadastrar' } as never),
    );
    expect(result).toBe(true);
  });

  it('redireciona para login com returnUrl quando não autenticado', () => {
    const { router } = setup(false);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/parceiros/cadastrar' } as never),
    ) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/?returnUrl=%2Fparceiros%2Fcadastrar');
  });
});
