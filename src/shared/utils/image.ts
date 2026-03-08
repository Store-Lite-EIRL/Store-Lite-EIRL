/**
 * Optimizes an image file by resizing and compressing it using Canvas.
 */
export async function optimizeImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8,
): Promise<File> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  let { width, height } = img;

  // Calculate new dimensions
  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
  );

  if (!blob) {
    throw new Error('Canvas to Blob conversion failed');
  }

  return new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
