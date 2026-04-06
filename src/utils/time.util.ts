export function getCurrentUnixTimestamp() {
  return Math.floor(Date.now() / 1000);
}

export function toUnixTimestamp(date: Date) {
  return Math.floor(date.getTime() / 1000);
}
