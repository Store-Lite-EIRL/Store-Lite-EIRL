export type MaterialSelectEvent = Event & {
  target: EventTarget & { value?: string };
  detail?: { value?: string };
};

export const getMaterialSelectValue = (event: MaterialSelectEvent, fallback = '') =>
  event.target.value ?? event.detail?.value ?? fallback;

export const getMaterialSwitchSelected = (event: unknown) => {
  const target = (event as { target?: { selected?: boolean } } | null)?.target;
  return Boolean(target?.selected);
};
