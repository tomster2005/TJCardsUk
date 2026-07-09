import type { ReactNode } from "react";

type IconProps = {
  className?: string;
};

function BaseIcon({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function SparkleIcon({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M12 3l1.9 4.8L19 10l-5.1 2.2L12 17l-1.9-4.8L5 10l5.1-2.2L12 3z" />
    </BaseIcon>
  );
}

export function GridIcon({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </BaseIcon>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5z" />
      <path d="M4 7h14" />
    </BaseIcon>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </BaseIcon>
  );
}

export function CartIcon({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h9.6a1 1 0 0 0 1-.8L21 8H7" />
    </BaseIcon>
  );
}

export function CollectionIcon({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M6 3h12v4H6z" />
      <path d="M4 9h16v12H4z" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </BaseIcon>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </BaseIcon>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M4 20h16" />
      <path d="M7 16v-4" />
      <path d="M12 16v-8" />
      <path d="M17 16v-2" />
    </BaseIcon>
  );
}

export function BoltIcon({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M13 2L5 13h6l-1 9 8-11h-6l1-9z" />
    </BaseIcon>
  );
}

export function ArrowUpIcon({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </BaseIcon>
  );
}

export function DotIcon({ className }: IconProps) {
  return (
    <BaseIcon className={className}>
      <circle cx="12" cy="12" r="3" />
    </BaseIcon>
  );
}
