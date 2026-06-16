type ClosableElement = HTMLElement & { close: () => void };
type ShowableElement = HTMLElement & { show: () => void };

const getElementByIdAs = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T | null;

export const closeElementById = (id: string) => {
  const element = getElementByIdAs<ClosableElement>(id);
  element?.close();
};

export const showElementById = (id: string) => {
  const element = getElementByIdAs<ShowableElement>(id);
  element?.show();
};

export const showNextSiblingElement = (element: HTMLElement) => {
  const sibling = element.nextElementSibling as ShowableElement | null;
  sibling?.show();
};

export const getFieldValue = (event: React.FormEvent<HTMLElement>) =>
  (event.target as HTMLInputElement | HTMLTextAreaElement).value;
