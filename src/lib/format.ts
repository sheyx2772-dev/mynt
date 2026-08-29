export function formatNumber(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatUZS(n: number): string {
  return `${formatNumber(n)} so'm`;
}
