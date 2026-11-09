import { resolveAvatarUrl } from './avatar-url.util';

describe('resolveAvatarUrl', () => {
  it('mengembalikan string kosong jika input null, undefined, atau string kosong', () => {
    expect(resolveAvatarUrl(null)).toBe('');
    expect(resolveAvatarUrl(undefined)).toBe('');
    expect(resolveAvatarUrl('')).toBe('');
    expect(resolveAvatarUrl('   ')).toBe('');
  });

  it('mempertahankan URL absolut (http, https, blob, data) secara utuh', () => {
    expect(resolveAvatarUrl('https://images.unsplash.com/photo-123')).toBe(
      'https://images.unsplash.com/photo-123'
    );
    expect(resolveAvatarUrl('http://example.com/foto.jpg')).toBe(
      'http://example.com/foto.jpg'
    );
    expect(resolveAvatarUrl('blob:http://localhost:4200/uuid')).toBe(
      'blob:http://localhost:4200/uuid'
    );
    expect(resolveAvatarUrl('data:image/webp;base64,xxx')).toBe(
      'data:image/webp;base64,xxx'
    );
  });

  it('menyambungkan path relatif API dengan apiBaseUrl backend', () => {
    const resolved = resolveAvatarUrl('/api/v1/media/avatars/avt_123.webp?exp=123&sig=abc');
    expect(resolved).toContain('/api/v1/media/avatars/avt_123.webp?exp=123&sig=abc');
    expect(resolved.startsWith('http://')).toBe(true);
  });
});

