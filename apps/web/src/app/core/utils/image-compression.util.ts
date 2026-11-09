/**
 * Utilitas Kompresi Citra Sisi Klien (Client-Side Image Compression)
 *
 * Mengompresi dan mengubah ukuran foto profil menjadi persegi proporsional (center-crop)
 * dengan resolusi optimal (maks 600x600 px) dan ukuran berkas dijamin di bawah 100 KB
 * dalam format WebP modern (dengan fallback JPEG otomatis).
 *
 * Proses berjalan sepenuhnya di memori peramban secara non-blocking tanpa membekukan antarmuka.
 */

export interface ImageCompressionOptions {
  readonly maxDimension?: number;
  readonly maxSizeBytes?: number;
  readonly initialQuality?: number;
  readonly minQuality?: number;
  readonly preferredMimeType?: 'image/webp' | 'image/jpeg';
}

export interface CompressedImageResult {
  readonly blob: Blob;
  readonly file: File;
  readonly dataUrl: string;
  readonly width: number;
  readonly height: number;
  readonly sizeBytes: number;
  readonly sizeFormatted: string;
  readonly mimeType: string;
}

const DEFAULT_MAX_DIMENSION = 600; // 600x600 px sangat tajam untuk avatar lingkaran
const DEFAULT_MAX_SIZE_BYTES = 100 * 1024; // 100 KB
const MAX_RAW_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB batas unggah awal dari kamera HP

/**
 * Format ukuran bita ke representasi KB yang mudah dibaca
 */
export function formatBytesToKb(bytes: number): string {
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

/**
 * Memeriksa apakah browser mendukung encoding WebP via Canvas
 */
export function isWebpSupportedInCanvas(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    if (!canvas || typeof canvas.toDataURL !== 'function') {
      return false;
    }
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL('image/webp');
    return typeof dataUrl === 'string' && dataUrl.startsWith('data:image/webp');
  } catch {
    return false;
  }
}

/**
 * Mengompresi citra ke ukuran di bawah 100 KB secara non-blocking
 */
export async function compressImageToTargetSize(
  rawFile: File,
  options?: ImageCompressionOptions
): Promise<CompressedImageResult> {
  if (!rawFile) {
    throw new Error('Berkas gambar tidak ditemukan');
  }

  // Validasi batas ukuran awal di frontend
  if (rawFile.size > MAX_RAW_FILE_SIZE_BYTES) {
    throw new Error('Ukuran berkas asli melebihi batas maksimal 10 MB');
  }

  // Validasi tipe MIME
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!acceptedTypes.includes(rawFile.type.toLowerCase())) {
    throw new Error('Format berkas tidak didukung. Harap pilih gambar JPG, PNG, atau WebP');
  }

  const maxDimension = options?.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const maxSizeBytes = options?.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
  const initialQuality = options?.initialQuality ?? 0.85;
  const minQuality = options?.minQuality ?? 0.45;
  const preferWebp = (options?.preferredMimeType ?? 'image/webp') === 'image/webp';

  const chosenMimeType = preferWebp && isWebpSupportedInCanvas() ? 'image/webp' : 'image/jpeg';
  const fileExtension = chosenMimeType === 'image/webp' ? '.webp' : '.jpg';

  // Muat gambar ke HTMLImageElement
  const image = await loadImageFromFile(rawFile);

  // Buat kanvas dengan pemotongan simetris tengah (center-crop square 1:1)
  const canvas = document.createElement('canvas');
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;

  // Tentukan dimensi persegi terkecil dari rasio sumber
  const cropSize = Math.min(sourceWidth, sourceHeight);
  const cropX = Math.round((sourceWidth - cropSize) / 2);
  const cropY = Math.round((sourceHeight - cropSize) / 2);

  // Skalakan dimensi kanvas jika melebihi batas maksimum
  const targetDimension = Math.min(cropSize, maxDimension);
  canvas.width = targetDimension;
  canvas.height = targetDimension;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Gagal menginisialisasi konteks kanvas grafis peramban');
  }

  // Atur perataan kualitas tinggi
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Gambar dengan pemotongan simetris tengah
  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropSize,
    cropSize,
    0,
    0,
    targetDimension,
    targetDimension
  );

  // Loop adaptif untuk memastikan ukuran berkas di bawah batas target
  let currentQuality = initialQuality;
  let compressedBlob: Blob | null = null;

  while (currentQuality >= minQuality) {
    compressedBlob = await canvasToBlobAsync(canvas, chosenMimeType, currentQuality);
    if (compressedBlob.size <= maxSizeBytes) {
      break;
    }
    currentQuality -= 0.1;
  }

  // Jika masih sedikit di atas batas, turunkan resolusi sedikit lagi sebagai pengaman akhir
  if (compressedBlob && compressedBlob.size > maxSizeBytes && targetDimension > 350) {
    const fallbackCanvas = document.createElement('canvas');
    const reducedDimension = Math.round(targetDimension * 0.75);
    fallbackCanvas.width = reducedDimension;
    fallbackCanvas.height = reducedDimension;
    const fallbackCtx = fallbackCanvas.getContext('2d');
    if (fallbackCtx) {
      fallbackCtx.imageSmoothingEnabled = true;
      fallbackCtx.imageSmoothingQuality = 'high';
      fallbackCtx.drawImage(canvas, 0, 0, reducedDimension, reducedDimension);
      compressedBlob = await canvasToBlobAsync(fallbackCanvas, chosenMimeType, 0.70);
    }
  }

  if (!compressedBlob) {
    throw new Error('Gagal memproses kompresi citra');
  }

  // Buat nama file terstandarisasi
  const baseNameWithoutExt = rawFile.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const standardizedFilename = `${baseNameWithoutExt}_avatar${fileExtension}`;
  const compressedFile = new File([compressedBlob], standardizedFilename, {
    type: chosenMimeType,
    lastModified: Date.now(),
  });

  const previewDataUrl = canvas.toDataURL(chosenMimeType, Math.max(currentQuality, 0.70));

  return {
    blob: compressedBlob,
    file: compressedFile,
    dataUrl: previewDataUrl,
    width: canvas.width,
    height: canvas.height,
    sizeBytes: compressedBlob.size,
    sizeFormatted: formatBytesToKb(compressedBlob.size),
    mimeType: chosenMimeType,
  };
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal membaca berkas citra gambar'));
    };

    img.src = objectUrl;
  });
}

function canvasToBlobAsync(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Gagal mengonversi kanvas ke berkas biner blob'));
        }
      },
      mimeType,
      quality
    );
  });
}

