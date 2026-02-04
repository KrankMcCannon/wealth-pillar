let tempIdCounter = 0;

export function getTempId(prefix = 'temp') {
  tempIdCounter += 1;
  return `${prefix}-${tempIdCounter}`;
}
