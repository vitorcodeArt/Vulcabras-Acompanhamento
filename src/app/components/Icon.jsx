const PATHS = {
  send: ['M22 2 11 13', 'M22 2l-7 20-4-9-9-4z'],
  click: ['M5 3l14 7-6 2-2 6z'],
  check: ['M20 6 9 17l-5-5'],
  headset: ['M4 14v-2a8 8 0 0 1 16 0v2', 'M4 14h3v5H4z', 'M17 14h3v5h-3z'],
  alert: ['M12 3 2 21h20z', 'M12 10v5', 'M12 18h.01'],
  down: ['M12 5v14', 'M6 13l6 6 6-6'],
  chart: ['M4 4v16h16', 'M8 16v-5', 'M12 16V8', 'M16 16v-3'],
  clock: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7v5l3 2'],
  ban: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M5.6 5.6l12.8 12.8'],
  minus: ['M5 12h14'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  copy: ['M9 9h11v11H9z', 'M5 15V4h10'],
  back: ['M19 12H5', 'M11 18l-6-6 6-6'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v6H4V6h6'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M21 21l-5-5'],
  download: ['M12 4v11', 'M7 11l5 5 5-5', 'M5 20h14'],
  flask: ['M9 3h6', 'M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3']
}

/** Ícone decorativo (o texto ao lado sempre diz o mesmo). */
export default function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
