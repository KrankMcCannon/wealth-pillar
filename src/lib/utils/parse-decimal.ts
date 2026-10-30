/** Parse decimal text without truncation. Money accepts grouped IT/EN amounts. */
export function parseDecimal(value: string | number, decimals = 2): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  let text = value.trim().replace(/[\s\u00a0\u202f]/g, '');
  if (!/^[+-]?[\d.,]+$/.test(text)) return NaN;
  const comma = text.lastIndexOf(',');
  const dot = text.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? ',' : '.';
    const group = decimal === ',' ? '.' : ',';
    const [integer, fraction, ...rest] = text.split(decimal);
    if (
      rest.length ||
      !fraction ||
      fraction.length > decimals ||
      !new RegExp(`^[+-]?\\d{1,3}(\\${group}\\d{3})+$`).test(integer ?? '')
    )
      return NaN;
    text = (integer ?? '').split(group).join('') + '.' + fraction;
  } else if (comma >= 0) {
    if (text.split(',').length !== 2) return NaN;
    text = text.replace(',', '.');
  } else if (decimals === 2 && /^[+-]?\d{1,3}(\.\d{3}){2,}$/.test(text)) {
    text = text.replaceAll('.', '');
  }
  if (!new RegExp(`^[+-]?(?:\\d+(?:\\.\\d{0,${decimals}})?|\\.\\d{1,${decimals}})$`).test(text))
    return NaN;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : NaN;
}
