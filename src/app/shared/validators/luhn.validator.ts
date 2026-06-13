import { AbstractControl, ValidationErrors } from '@angular/forms';

export function luhnCheck(value: string): boolean {
  const digits = value.replace(/\s/g, '');
  if (!/^\d+$/.test(digits) || digits.length < 13) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function luhnValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  return luhnCheck(control.value) ? null : { luhn: true };
}
