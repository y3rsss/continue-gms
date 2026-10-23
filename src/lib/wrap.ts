export const wrapIndex = (index: number, length: number): number => {
  return ((index % length) + length) % length;
};
