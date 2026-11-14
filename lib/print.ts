export function printDataList() {
  const className = "printing-list";
  const cleanup = () => document.body.classList.remove(className);

  document.body.classList.add(className);
  window.addEventListener("afterprint", cleanup, { once: true });

  try {
    window.print();
  } finally {
    window.setTimeout(cleanup, 1500);
  }
}
