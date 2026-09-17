/** Lucide has a box truck. Today is a pickup. */
export function PickupTruck({
  className,
  strokeWidth = 2,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      <path d="M5 18H3v-6l3-5h7v4h7v7h-1" />
      <path d="M13 11v7" />
      <path d="M9 18h6" />
    </svg>
  );
}
