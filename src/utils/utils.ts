export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getDayTimeColor(dayTime: number): string {
  // dayTime: 0 (midnight) to 1 (next midnight)
  // 0.25 = dawn, 0.5 = noon, 0.75 = dusk
  
  const r = Math.sin(dayTime * Math.PI * 2) * 0.3 + 0.5;
  const g = Math.sin(dayTime * Math.PI * 2) * 0.3 + 0.5;
  const b = Math.sin(dayTime * Math.PI * 2) * 0.2 + 0.6;
  
  return `rgba(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)}, 0.3)`;
}

export function getSkyColor(dayTime: number): string {
  // Sky color based on time of day
  const t = dayTime;
  let r, g, b;
  
  if (t < 0.25) { // Night
    r = 20; g = 20; b = 40;
  } else if (t < 0.3) { // Dawn
    const p = (t - 0.25) / 0.05;
    r = lerp(20, 255, p);
    g = lerp(20, 150, p);
    b = lerp(40, 200, p);
  } else if (t < 0.7) { // Day
    r = 135; g = 206; b = 250;
  } else if (t < 0.75) { // Dusk
    const p = (t - 0.7) / 0.05;
    r = lerp(135, 255, p);
    g = lerp(206, 100, p);
    b = lerp(250, 50, p);
  } else { // Night
    const p = (t - 0.75) / 0.25;
    r = lerp(255, 20, p);
    g = lerp(100, 20, p);
    b = lerp(50, 40, p);
  }
  
  return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
}


