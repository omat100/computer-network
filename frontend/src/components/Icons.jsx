export function Logo({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="2.4" />
      <circle cx="19" cy="5" r="2.4" />
      <circle cx="19" cy="19" r="2.4" />
      <path d="M7.2 10.9 16.8 6.1M7.3 13.1l9.5 4.8" />
    </svg>
  )
}
