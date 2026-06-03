export type CreateAuthorPromptProps = {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export function CreateAuthorPrompt({
  open,
  onAccept,
  onDecline,
}: CreateAuthorPromptProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-author-prompt-title"
        className="w-full max-w-md space-y-6 rounded-xl border border-white/10 bg-[#0b0710] p-8 shadow-xl"
      >
        <div className="space-y-2 text-center">
          <h2
            id="create-author-prompt-title"
            className="text-xl font-semibold tracking-tight"
          >
            Vuoi creare la tua pagina autore?
          </h2>
          <p className="text-sm text-white/60">
            Puoi pubblicare il tuo profilo su Andromeda oppure continuare come
            lettore senza una pagina autore.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onAccept}
            className="rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white hover:bg-andromeda-dark"
          >
            Sì, crea la pagina
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5"
          >
            No, resto lettore
          </button>
        </div>
      </div>
    </div>
  );
}
