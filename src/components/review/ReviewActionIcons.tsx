interface HeartIconProps {
  filled: boolean;
}

export function HeartIcon({ filled }: HeartIconProps) {
  return (
    <svg viewBox="0 0 24 24" className="review-action-button__svg" aria-hidden="true">
      <path
        d="M12 21s-6.716-4.309-9.193-8.19C1.25 10.387 2.17 6.9 5.41 5.61c1.98-.788 4.183-.145 5.59 1.495 1.408-1.64 3.611-2.283 5.59-1.495 3.24 1.29 4.16 4.777 2.603 7.2C18.716 16.691 12 21 12 21Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="review-action-button__svg" aria-hidden="true">
      <path
        d="M6.5 5.5h11A2.5 2.5 0 0 1 20 8v6A2.5 2.5 0 0 1 17.5 16.5H11l-4.5 3.5v-3.5h0A2.5 2.5 0 0 1 4 14V8a2.5 2.5 0 0 1 2.5-2.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.75 10.75h.5M12 10.75h.5M15.25 10.75h.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
