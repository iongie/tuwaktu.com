import {
  compressImageToTargetSize,
  formatBytesToKb,
  isWebpSupportedInCanvas,
} from './image-compression.util';

describe('ImageCompressionUtil', () => {
  describe('formatBytesToKb', () => {
    it('mengonversi bita ke representasi KB dengan benar', () => {
      expect(formatBytesToKb(1024)).toBe('1.0 KB');
      expect(formatBytesToKb(51200)).toBe('50.0 KB');
      expect(formatBytesToKb(102400)).toBe('100.0 KB');
    });
  });

  describe('isWebpSupportedInCanvas', () => {
    it('mengembalikan nilai boolean yang aman di lingkungan DOM', () => {
      const isSupported = isWebpSupportedInCanvas();
      expect(typeof isSupported).toBe('boolean');
    });
  });

  describe('compressImageToTargetSize validasi', () => {
    it('menolak jika berkas melebihi batas maksimal 10 MB', async () => {
      // Simulasi berkas berukuran 11 MB
      const oversizedBlob = new Blob(['x'.repeat(1024)], { type: 'image/jpeg' });
      const oversizedFile = new File([oversizedBlob], 'huge_photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(oversizedFile, 'size', { value: 11 * 1024 * 1024 });

      await expect(compressImageToTargetSize(oversizedFile)).rejects.toThrow(
        'Ukuran berkas asli melebihi batas maksimal 10 MB'
      );
    });

    it('menolak format berkas selain gambar JPG, PNG, atau WebP', async () => {
      const textFile = new File(['konten teks'], 'dokumen.pdf', { type: 'application/pdf' });
      await expect(compressImageToTargetSize(textFile)).rejects.toThrow(
        'Format berkas tidak didukung. Harap pilih gambar JPG, PNG, atau WebP'
      );
    });
  });
});

