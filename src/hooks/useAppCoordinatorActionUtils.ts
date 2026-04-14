export function formatCoordinatorErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return '요청을 처리하지 못했어요. 조금 뒤에 다시 시도해 주세요.';
}

export function reportCoordinatorBackgroundError(error: unknown) {
  console.error(error);
}
