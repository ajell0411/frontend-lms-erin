export function onlyDigits(value: string, maxLength?: number): string {
  const digits = value.replace(/\D/g, "");
  return maxLength ? digits.slice(0, maxLength) : digits;
}

export function isDigits(value: string): boolean {
  return /^\d+$/.test(value);
}

export function digitInputProps(maxLength?: number) {
  return {
    inputMode: "numeric" as const,
    pattern: "[0-9]*",
    maxLength,
    autoComplete: "off",
  };
}