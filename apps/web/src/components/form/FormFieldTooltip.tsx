export type FormFieldTooltipProps = {
  id: string;
  content: string;
};

export function FormFieldTooltip({ id, content }: FormFieldTooltipProps) {
  return (
    <span className="group/tooltip relative inline-flex align-middle">
      <button
        type="button"
        aria-describedby={id}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[10px] font-semibold leading-none text-white/70 transition-colors hover:border-andromeda-light/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-andromeda-light/50"
      >
        <span aria-hidden="true">?</span>
        <span className="sr-only">More information</span>
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-60 -translate-x-1/2 rounded-lg border border-white/10 bg-[#0b0710] px-3 py-2 text-left text-xs leading-relaxed text-white/80 shadow-xl group-focus-within/tooltip:block group-hover/tooltip:block"
      >
        {content}
      </span>
    </span>
  );
}
