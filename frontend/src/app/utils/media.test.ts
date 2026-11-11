import { describe, expect, it } from 'vitest';
import { getMediaUrl } from './media';

describe('getMediaUrl', () => {
  it('returns an empty string when there is no path', () => {
    expect(getMediaUrl(undefined)).toBe('');
    expect(getMediaUrl(null)).toBe('');
    expect(getMediaUrl('')).toBe('');
  });

  it('returns Supabase public URLs unchanged', () => {
    const url = 'https://demo-ref.supabase.co/storage/v1/object/public/media/voice_notes/a.webm';
    expect(getMediaUrl(url)).toBe(url);
  });

  it('returns blob URLs unchanged', () => {
    expect(getMediaUrl('blob:http://localhost/123')).toBe('blob:http://localhost/123');
  });

  it('maps legacy relative paths to the backend storage folder', () => {
    expect(getMediaUrl('voice_notes/a.webm')).toMatch(/\/storage\/voice_notes\/a\.webm$/);
    expect(getMediaUrl('/storage/gps_photos/b.jpg')).toMatch(/\/storage\/gps_photos\/b\.jpg$/);
    expect(getMediaUrl('voice_notes/a.webm')).not.toContain('/api/');
  });
});
