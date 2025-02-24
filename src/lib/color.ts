import chroma from 'chroma-js';

interface TimerColorOptions {
  baseColor: chroma.ChromaInput;
  percentage: number;
}


export function getTimerColor({
  baseColor,
  percentage,
}: TimerColorOptions): number[] {
  const newLuminosity = Math.max(0, Math.min(100, percentage)) / 100;
  const color = chroma(baseColor).luminance(newLuminosity, 'hcl').rgb();
  // Applica la nuova luminosità e converte in RGB
  return color;
}

export function getTimerColorForPhaser({
  baseColor,
  percentage,
}: TimerColorOptions): number {
  const [r, g, b] = getTimerColor({
    baseColor,
    percentage
  });

  return (r << 16) | (g << 8) | b;
}
