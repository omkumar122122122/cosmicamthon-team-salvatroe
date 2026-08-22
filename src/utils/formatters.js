export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function percentage(value, max) {
  if (!max) return "0%";
  return `${Math.round((value / max) * 100)}%`;
}
