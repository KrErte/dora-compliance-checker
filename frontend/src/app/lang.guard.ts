import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { LangService, Lang } from './lang.service';

const VALID_LANGS: ReadonlySet<string> = new Set(['en', 'et', 'lv', 'lt']);

export const langActivateGuard: CanActivateFn = (route) => {
  const lang = route.url[0]?.path;
  if (lang && VALID_LANGS.has(lang)) {
    inject(LangService).setLang(lang as Lang);
  }
  return true;
};
