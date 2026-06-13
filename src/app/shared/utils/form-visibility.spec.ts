import { FormControl, FormGroup } from '@angular/forms';
import { isFieldVisible, VisibleField } from './form-visibility';

describe('isFieldVisible', () => {
  let form: FormGroup;

  beforeEach(() => {
    form = new FormGroup({
      sameAsDelivery: new FormControl(false),
      paymentType:    new FormControl('card'),
      country:        new FormControl('IN'),
    });
  });

  describe('fields with no visibleWhen', () => {
    it('should always be visible', () => {
      const field: VisibleField = {};
      expect(isFieldVisible(field, form)).toBeTrue();
    });

    it('should be visible even when form is null', () => {
      const field: VisibleField = {};
      expect(isFieldVisible(field, null)).toBeTrue();
    });
  });

  describe('fields with a visibleWhen condition', () => {
    it('should be visible when the condition field matches the expected value', () => {
      const field: VisibleField = { visibleWhen: { field: 'sameAsDelivery', value: true } };
      form.get('sameAsDelivery')!.setValue(true);
      expect(isFieldVisible(field, form)).toBeTrue();
    });

    it('should be hidden when the condition field does not match', () => {
      const field: VisibleField = { visibleWhen: { field: 'sameAsDelivery', value: true } };
      form.get('sameAsDelivery')!.setValue(false);
      expect(isFieldVisible(field, form)).toBeFalse();
    });

    it('should react to value changes on the same form group', () => {
      const field: VisibleField = { visibleWhen: { field: 'paymentType', value: 'upi' } };

      expect(isFieldVisible(field, form)).toBeFalse();

      form.get('paymentType')!.setValue('upi');
      expect(isFieldVisible(field, form)).toBeTrue();
    });

    it('should handle string equality correctly', () => {
      const field: VisibleField = { visibleWhen: { field: 'country', value: 'US' } };
      expect(isFieldVisible(field, form)).toBeFalse();

      form.get('country')!.setValue('US');
      expect(isFieldVisible(field, form)).toBeTrue();
    });

    it('should return false when the referenced field does not exist in the form', () => {
      const field: VisibleField = { visibleWhen: { field: 'nonExistentField', value: 'x' } };
      expect(isFieldVisible(field, form)).toBeFalse();
    });

    it('should return false when form is null and visibleWhen is set', () => {
      const field: VisibleField = { visibleWhen: { field: 'sameAsDelivery', value: true } };
      expect(isFieldVisible(field, null)).toBeFalse();
    });
  });
});
