import { cn } from "@/lib/utils/cn";

const sizes = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
} as const;

const paths: Record<string, React.ReactNode> = {
  sparkles: (
    <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3zM19 15l.9 2.1 2.1.9-2.1.9L19 21l-.9-2.1-2.1-.9 2.1-.9L19 15zM5 15l.9 2.1L8 18l-2.1.9L5 21l-.9-2.1L2 18l2.1-.9L5 15z" />
  ),
  today: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  inbox: (
    <>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  folder: (
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" strokeLinejoin="round" />
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3v5h5M12 7v5l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </>
  ),
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" strokeLinejoin="round" />,
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" strokeLinecap="round" />,
  check: <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />,
  trash: (
    <>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </>
  ),
  x: <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />,
  chevronDown: <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />,
  chevronLeft: <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />,
  chevronRight: <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />,
  more: (
    <>
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  file: (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" strokeLinejoin="round" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" strokeLinejoin="round" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-4.35-4.35a2 2 0 0 0-2.83 0L3 21" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  logOut: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m16 17 5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  offline: <path d="m2 2 20 20M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.8M2 8.8A15 15 0 0 1 7 5.7M12 20h.01M12 20h.01" strokeLinecap="round" strokeLinejoin="round" />,
  user: (
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
};

export type IconName = keyof typeof paths;

interface IconProps {
  name: IconName;
  className?: string;
  filled?: boolean;
}

export function Icon({ name, className, filled }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      className={cn(sizes.md, className)}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
