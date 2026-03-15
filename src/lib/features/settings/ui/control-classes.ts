export const controlInputClass =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 shadow-sm transition focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-100";

export const controlInputWithMarginClass = `mt-2 ${controlInputClass}`;

export const controlSelectClass = `${controlInputClass} appearance-none pr-10`;

export const controlInputSpaceClass =
  "w-full sm:min-w-[16rem] sm:max-w-[22rem]";

export const controlInputSpaceItemClass = controlInputSpaceClass;

export const controlInputSpaceWrapClass =
  "grid grid-cols-1 items-start sm:[grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))]";

export const controlButtonMdClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60";

export const controlButtonMdFullClass = `${controlButtonMdClass} w-full`;

export const controlButtonSmClass =
  "inline-flex h-8 items-center justify-center rounded-md border border-zinc-300 bg-white px-2.5 text-xs text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60";

export const controlChipTextClass = "whitespace-nowrap text-sm";

export const switchTrackClass =
  "relative h-6 w-11 rounded-full bg-zinc-300 transition peer-checked:bg-zinc-900 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-900/30 peer-disabled:opacity-50 after:absolute after:left-[3px] after:top-1/2 after:h-4 after:w-4 after:-translate-y-1/2 after:rounded-full after:bg-white after:transition after:content-[''] peer-checked:after:translate-x-5";

export const keyCellInputClass =
  "h-8 min-w-0 w-full rounded-md border border-zinc-300 bg-white px-0 text-center font-mono text-sm text-zinc-900 shadow-sm transition focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-100";

export const colorNativeInputClass =
  "h-10 w-full cursor-pointer rounded border border-zinc-300";
