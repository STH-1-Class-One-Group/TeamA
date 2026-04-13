export function formatCoordinatorErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return '?遺욧퍕??筌ｌ꼶???? 筌륁궢六??곸뒄. ?醫롫뻻 ??쇰퓠 ??쇰뻻 ??뺣즲??雅뚯눘苑??';
}

export function reportCoordinatorBackgroundError(error: unknown) {
  console.error(error);
}
