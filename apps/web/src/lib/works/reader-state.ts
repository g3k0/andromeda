export type ReaderStatus = "idle" | "decrypting" | "reading" | "error";

export type ReaderState = {
  status: ReaderStatus;
  text: string | null;
  errorMessage: string | null;
};

export type ReaderAction =
  | { type: "decrypt_started" }
  | { type: "decrypt_succeeded"; text: string }
  | { type: "decrypt_failed"; message: string }
  | { type: "reset" };

export function createReaderState(): ReaderState {
  return { status: "idle", text: null, errorMessage: null };
}

export function isReaderBusy(status: ReaderStatus): boolean {
  return status === "decrypting";
}

export function readerReducer(
  state: ReaderState,
  action: ReaderAction,
): ReaderState {
  switch (action.type) {
    case "decrypt_started":
      return { status: "decrypting", text: null, errorMessage: null };
    case "decrypt_succeeded":
      return { status: "reading", text: action.text, errorMessage: null };
    case "decrypt_failed":
      return { status: "error", text: null, errorMessage: action.message };
    case "reset":
      return createReaderState();
    default:
      return state;
  }
}
