const MAX_UPLOAD_DIMENSION = 1600;
const MAX_UPLOAD_BYTES = 1_400_000;
const JPEG_QUALITY = 0.82;

function replaceExtension(fileName: string, nextExtension: string) {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1) {
    return `${fileName}.${nextExtension}`;
  }
  return `${fileName.slice(0, dotIndex)}.${nextExtension}`;
}

async function drawImageToCanvas(file: File) {
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('이미지를 읽지 못했어요.'));
      element.src = imageUrl;
    });

    const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('이미지 캔버스를 준비하지 못했어요.');
    }
    context.drawImage(image, 0, 0, width, height);
    return { canvas, width, height };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, fileType: string, quality?: number) {
  return await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), fileType, quality);
  });
}

export async function prepareReviewImageUpload(file: File) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }
  if (!file.type.startsWith('image/')) {
    return file;
  }
  if (file.size <= MAX_UPLOAD_BYTES) {
    return file;
  }

  try {
    const { canvas } = await drawImageToCanvas(file);
    const compressedBlob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
    if (!compressedBlob) {
      return file;
    }
    if (compressedBlob.size >= file.size) {
      return file;
    }
    return new File([compressedBlob], replaceExtension(file.name, 'jpg'), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}