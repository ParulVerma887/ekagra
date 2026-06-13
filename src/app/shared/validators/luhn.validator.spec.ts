import { FormControl } from '@angular/forms';
import { luhnCheck, luhnValidator } from './luhn.validator';

describe('luhnCheck', () => {
  describe('valid card numbers', () => {
    it('should accept a valid Visa test number', () => {
      expect(luhnCheck('4111111111111111')).toBeTrue();
    });

    it('should accept a valid MasterCard test number', () => {
      expect(luhnCheck('5500005555555559')).toBeTrue();
    });

    it('should accept a valid Amex test number', () => {
      expect(luhnCheck('378282246310005')).toBeTrue();
    });

    it('should accept numbers with spaces', () => {
      expect(luhnCheck('4111 1111 1111 1111')).toBeTrue();
    });
  });

  describe('invalid card numbers', () => {
    it('should reject a number that fails the Luhn algorithm', () => {
      expect(luhnCheck('4111111111111112')).toBeFalse();
    });

    it('should reject a number that is too short (less than 13 digits)', () => {
      expect(luhnCheck('411111111111')).toBeFalse();
    });

    it('should reject an empty string', () => {
      expect(luhnCheck('')).toBeFalse();
    });

    it('should reject non-numeric characters', () => {
      expect(luhnCheck('4111-1111-1111-1111')).toBeFalse();
    });

    it('should reject a number with one digit changed to make checksum invalid', () => {
      // 4111111111111111 is valid; changing last digit to 2 breaks the checksum
      expect(luhnCheck('4111111111111112')).toBeFalse();
    });

    it('should reject a string of letters', () => {
      expect(luhnCheck('abcdefghijklmnop')).toBeFalse();
    });
  });
});

describe('luhnValidator', () => {
  it('should return null for a valid card number (no error)', () => {
    const ctrl = new FormControl('4111111111111111');
    expect(luhnValidator(ctrl)).toBeNull();
  });

  it('should return { luhn: true } for an invalid card number', () => {
    const ctrl = new FormControl('1234567890123456');
    expect(luhnValidator(ctrl)).toEqual({ luhn: true });
  });

  it('should return null when the control is empty (let required handle that)', () => {
    const ctrl = new FormControl('');
    expect(luhnValidator(ctrl)).toBeNull();
  });

  it('should return null when the control value is null', () => {
    const ctrl = new FormControl(null);
    expect(luhnValidator(ctrl)).toBeNull();
  });

  it('should validate a card number with spaces correctly', () => {
    const ctrl = new FormControl('4111 1111 1111 1111');
    expect(luhnValidator(ctrl)).toBeNull();
  });
});
