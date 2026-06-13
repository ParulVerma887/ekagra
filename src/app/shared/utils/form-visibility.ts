import { FormGroup } from '@angular/forms';

export interface VisibleWhen {
  field: string;
  value: unknown;
}

export interface VisibleField {
  visibleWhen?: VisibleWhen;
}

export function isFieldVisible(field: VisibleField, form: FormGroup | null): boolean {
  if (!field.visibleWhen) return true;
  const ctrl = form?.get(field.visibleWhen.field);
  return ctrl?.value === field.visibleWhen.value;
}
