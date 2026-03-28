export async function generateCollageCanvas(images, label, showShadow = true) {
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

  if (label) {
    const pin = '📍';
    const text = formatLabel(label);
    const fontSize = 40;
    ctx.font = `700 ${fontSize}px "Proxima Nova", "Helvetica Neue", Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    const textY = height * 0.44;

    const pinWidth = ctx.measureText(pin).width;
    const textWidth = ctx.measureText(text).width;
    const totalWidth = pinWidth + textWidth;
    const startX = (width - totalWidth) / 2;

    // Draw emoji without shadow
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(pin, startX, textY);

    // Draw text with optional shadow
    const textX = startX + pinWidth;
    if (showShadow) {
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      ctx.strokeText(text, textX, textY);
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, textX, textY);
  }

  return canvas;
}

export async function downloadCollage(collage, showShadow = true) {
  const canvas = await generateCollageCanvas(collage.images, collage.name, showShadow);
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

export async function downloadAllCollages(collages, showShadow = true) {
  for (const collage of collages) {
    await downloadCollage(collage, showShadow);
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
}

export function formatLabel(name) {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function parseFilename(filename) {
  // Remove extension, then strip macOS duplicate suffixes like " 2", " (1)", " copy"
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
  const cleaned = nameWithoutExt.replace(/\s+(\(\d+\)|\d+|copy.*)$/i, '');
  const parts = cleaned.split('_');

  if (parts.length < 2) return null;

  const lastPart = parts[parts.length - 1];

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
