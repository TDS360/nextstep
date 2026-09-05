/* =====================================================
   ICONS
   Minimal stroke icons, 24x24, no external icon library.
   Shared across every page — import only what you need.
===================================================== */

const iconBase = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
};

export const LeafIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M5 19C5 10 12 6 19 6c0 8-4 13-13 13-1 0-2-.1-2.6-.3" />
    <path d="M5 19c1-3 3.5-5.5 7-7.5" />
  </svg>
);

export const PinIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.25" />
  </svg>
);

export const WindIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M3 8h11a3 3 0 1 0-3-3" />
    <path d="M3 13h15a3 3 0 1 1-3 3" />
    <path d="M3 18h8a2.5 2.5 0 1 1-2.5 2.5" />
  </svg>
);

export const ThermometerIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M12 14.5V5a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0z" />
    <path d="M10 8h1" />
  </svg>
);

export const DropletIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M12 3s6 6.4 6 10.5a6 6 0 1 1-12 0C6 9.4 12 3 12 3z" />
  </svg>
);

export const TreeIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M12 3l4 6h-2.5l3.5 5h-3l3 5H7l3-5H7l3.5-5H8l4-6z" />
    <path d="M12 19v2" />
  </svg>
);

export const ShieldIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6l7-3z" />
  </svg>
);

export const SparkleIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4z" />
    <path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" />
  </svg>
);

export const SettingsIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.5-2-3.4-2.2.7a7.6 7.6 0 0 0-2.6-1.5L14 2h-4l-.5 2.3a7.6 7.6 0 0 0-2.6 1.5l-2.2-.7-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3L2.7 15l2 3.4 2.2-.7c.75.65 1.63 1.16 2.6 1.5L10 22h4l.5-2.3a7.6 7.6 0 0 0 2.6-1.5l2.2.7 2-3.4-1.9-1.5z" />
  </svg>
);

export const ArrowRightIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const InfoIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 8v.01" />
  </svg>
);

export const ExternalLinkIcon = (props) => (
  <svg viewBox="0 0 24 24" {...iconBase} {...props}>
    <path d="M14 4h6v6M20 4l-9 9M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
  </svg>
);