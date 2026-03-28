export async function generateCollageCanvas(images) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const width = 1080;
  const height = 1920;
  canvas.width = width;
  canvas.height = height;

  const cellW = width / 2;
  const cellH = height / 2;
  const positions = [
    [0, 0],
    [cellW, 0],
    [0, cellH],
    [cellW, cellH],
  ];

  const sorted = [...images].sort((a, b) => a.sequenceNum - b.sequenceNum);

  for (let i = 0; i < Math.min(4, sorted.length); i++) {
    const img = new Image();
    img.src = sorted[i].url;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const [x, y] = positions[i];
    const cellAspect = cellW / cellH;
    const imgAspect = img.width / img.height;
    let sx, sy, sw, sh;
    if (imgAspect > cellAspect) {
      sh = img.height;
      sw = img.height * cellAspect;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = img.width / cellAspect;
      sx = 0;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, cellW, cellH);
  }

  return canvas;
}

export async function downloadCollage(collage) {
  const canvas = await generateCollageCanvas(collage.images);
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${collage.collageKey}_collage.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadAllCollages(collages) {
  for (const collage of collages) {
    await downloadCollage(collage);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
}

export function parseFilename(filename) {
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  const parts = nameWithoutExt.split('_');

  if (parts.length < 2) return null;

  const lastPart = parts[parts.length - 1];

  // Match "01-04" (sequence-total) or plain "01" (sequence only)
  const fullMatch = lastPart.match(/^(\d+)-(\d+)$/);
  const plainMatch = lastPart.match(/^(\d+)$/);

  if (!fullMatch && !plainMatch) return null;

  const sequenceNum = parseInt(fullMatch ? fullMatch[1] : plainMatch[1]);
  const totalInSet = fullMatch ? parseInt(fullMatch[2]) : null;
  const collageParts = parts.slice(0, -1);
  const collageKey = collageParts.join('_').toLowerCase();

  let rowGroup;
  if (collageParts.length > 1) {
    rowGroup = collageParts[0].toLowerCase();
  } else {
    rowGroup = collageKey;
  }

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  return {
    collageKey,
    rowGroup,
    sequenceNum,
    totalInSet,
    displayName:
      collageParts.length > 1
        ? collageParts.slice(1).map(capitalize).join(' ')
        : capitalize(collageParts[0]),
    displayGroupName: capitalize(collageParts[0]),
  };
}
