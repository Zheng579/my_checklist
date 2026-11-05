export async function copyToClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fall through for browsers that expose the API but deny direct access.
    }
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
  } finally {
    textArea.remove();
  }
}

export interface ClipboardColors {
  background: string;
  text: string;
}

export async function readColorsFromClipboard(): Promise<ClipboardColors | null> {
  if (!navigator.clipboard?.readText) return null;
  const value = await navigator.clipboard.readText();
  const background = value.match(/Background:\s*(#[0-9a-f]{3,8})/i)?.[1];
  const text = value.match(/Text:\s*(#[0-9a-f]{3,8})/i)?.[1];
  return background && text ? { background, text } : null;
}
