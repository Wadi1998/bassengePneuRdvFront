export const STEP = 15;

export const toMin = (hhmm: string) => {
  const [h,m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const toHHMM = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
};

export const rangesOverlap = (aTime: string, aDur: number, bTime: string, bDur: number) => {
  const aS = toMin(aTime), aE = aS + aDur;
  const bS = toMin(bTime), bE = bS + bDur;
  return aS < bE && bS < aE; // [start, end)
};
