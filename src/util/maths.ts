export const distance = ([x1, y1]: number[], [x2, y2]: number[]): number =>
  ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** (1 / 2);

export const closest = (reference: number[], points: number[][]): number[] => {
  const minDistance = distance(reference, points[0]);
  return points.reduce((min, point) => (distance(reference, point) < minDistance ? point : min));
};

export const measureSides = (coords: number[][]): number[] =>
  coords.map((coord, i) => distance(coord, coords[i < coords.length - 1 ? i + 1 : 0]));
