export type Point = [number, number];

type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const distance = ([x1, y1]: Point, [x2, y2]: Point): number =>
  ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** (1 / 2);

export const closest = (reference: Point, points: Point[]): Point => {
  const distances = points.map(point => distance(reference, point));
  let closestDistance = distances[0];

  return points.reduce((closestPoint, point, i) => {
    if (distances[i] < closestDistance) {
      closestDistance = distances[i];
      return point;
    }
    return closestPoint;
  });
};

export const measureSides = (coords: Point[]): number[] =>
  coords.map((coord, i) => distance(coord, coords[i < coords.length - 1 ? i + 1 : 0]));

export const isPointInsideRect = (point: Point, rect: Rectangle) =>
  point[0] >= rect.x &&
  point[1] >= rect.y &&
  point[0] <= rect.x + rect.width &&
  point[0] <= rect.y + rect.height;
