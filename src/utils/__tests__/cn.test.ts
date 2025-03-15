import { cn } from '../cn';

describe('cn utility', () => {
  it('should merge class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', { 'conditional': true, 'not-included': false })).toBe('base conditional');
  });

  it('should handle undefined and null values', () => {
    expect(cn('base', undefined, null, 'valid')).toBe('base valid');
  });

  it('should handle array of classes', () => {
    expect(cn('base', ['array1', 'array2'])).toBe('base array1 array2');
  });

  it('should merge Tailwind classes correctly', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6');
    expect(cn('text-sm text-gray-500', 'text-lg')).toBe('text-lg text-gray-500');
  });
}); 