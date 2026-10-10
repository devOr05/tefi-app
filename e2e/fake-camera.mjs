// Simulated camera feed for the end-to-end run. Chromium can read its fake camera from a video file
// (--use-file-for-fake-video-capture); this module writes that file so that "the camera" is looking at the
// QR code another phone shows: scaled down, slightly rotated, blurred and noisy, the way a phone camera
// held over a screen sees it. The app then has to decode it through its own scanner.
import { writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const FRAME = { width: 1280, height: 720, fps: 15, frames: 8 };
const BACKGROUND = 96; // a desk around the phone

function luma(png, x, y) {
  const i = (png.width * y + x) << 2;
  return 0.299 * png.data[i] + 0.587 * png.data[i + 1] + 0.114 * png.data[i + 2];
}

// Bilinear sample of the source image at a fractional position; outside the image is background
function sample(png, sx, sy) {
  if (sx < 0 || sy < 0 || sx > png.width - 1 || sy > png.height - 1) return BACKGROUND;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = Math.min(x0 + 1, png.width - 1);
  const y1 = Math.min(y0 + 1, png.height - 1);
  const fx = sx - x0;
  const fy = sy - y0;
  const top = luma(png, x0, y0) * (1 - fx) + luma(png, x1, y0) * fx;
  const bottom = luma(png, x0, y1) * (1 - fx) + luma(png, x1, y1) * fx;
  return top * (1 - fy) + bottom * fy;
}

/**
 * Writes a Y4M video in which the camera sees `pngDataUrl` (the QR image taken from another phone's screen).
 * `qrSide` is how many pixels of the 1280x720 frame the QR covers; `degrees` tilts it.
 */
export function pointCameraAt(pngDataUrl, y4mPath, { qrSide = 520, degrees = 4, noise = 10 } = {}) {
  const png = PNG.sync.read(Buffer.from(pngDataUrl.split(',')[1], 'base64'));
  const { width, height } = FRAME;
  const scale = png.width / qrSide;
  const angle = (degrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Each frame pixel is mapped back onto the QR image (rotation around the centre, then scale). A sensor
  // pixel collects the light of its whole area, so it is sampled at 3x3 points instead of only at its centre.
  const SUB = [-1 / 3, 0, 1 / 3];
  const sharp = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (const oy of SUB) {
        for (const ox of SUB) {
          const dx = x + ox - width / 2;
          const dy = y + oy - height / 2;
          sum += sample(png, (dx * cos + dy * sin) * scale + png.width / 2, (-dx * sin + dy * cos) * scale + png.height / 2);
        }
      }
      sharp[y * width + x] = sum / 9;
    }
  }

  // A light 3x3 blur: no camera resolves a screen pixel-perfectly
  const blurred = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const xx = x + ox;
          const yy = y + oy;
          if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
          sum += sharp[yy * width + xx];
          count++;
        }
      }
      blurred[y * width + x] = sum / count;
    }
  }

  const chroma = Buffer.alloc((width / 2) * (height / 2) * 2, 128); // grey image: U and V stay neutral
  const parts = [Buffer.from(`YUV4MPEG2 W${width} H${height} F${FRAME.fps}:1 Ip A1:1 C420jpeg\n`)];
  let seed = 12345;
  const random = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff); // repeatable sensor noise
  for (let f = 0; f < FRAME.frames; f++) {
    const lumaPlane = Buffer.alloc(width * height);
    for (let i = 0; i < lumaPlane.length; i++) {
      lumaPlane[i] = Math.max(0, Math.min(255, Math.round(blurred[i] + (random() - 0.5) * noise)));
    }
    parts.push(Buffer.from('FRAME\n'), lumaPlane, chroma);
  }
  writeFileSync(y4mPath, Buffer.concat(parts));
}

/** A camera pointed at nothing in particular: used before any QR is on screen. */
export function pointCameraAtNothing(y4mPath) {
  const { width, height } = FRAME;
  const parts = [Buffer.from(`YUV4MPEG2 W${width} H${height} F${FRAME.fps}:1 Ip A1:1 C420jpeg\n`)];
  for (let f = 0; f < 2; f++) {
    parts.push(Buffer.from('FRAME\n'), Buffer.alloc(width * height, BACKGROUND), Buffer.alloc((width / 2) * (height / 2) * 2, 128));
  }
  writeFileSync(y4mPath, Buffer.concat(parts));
}
