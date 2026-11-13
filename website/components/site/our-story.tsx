import { story } from "@/lib/content"

export function OurStory() {
  return (
    // Full width so the Unisphere can sit half off the right edge of the page;
    // overflow-x-clip hides the other half without adding a sideways scroll.
    <section id="our-story" className="relative w-full overflow-x-clip">
      {/* Centered on the right edge of the page, so only its left half shows.
          Large screens only, where it clears the timeline. */}
      <Unisphere className="pointer-events-none absolute top-1/2 right-0 hidden w-[48rem] translate-x-1/2 -translate-y-1/2 text-primary lg:block xl:w-[56rem]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
        <h2 className="font-display text-6xl uppercase tracking-tight text-white sm:text-8xl">
          {story.heading}
        </h2>
        <ol className="mt-12 border-l-4 border-primary">
          {story.milestones.map((milestone) => (
            <li key={milestone.title} className="pb-10 pl-6 last:pb-0 sm:pl-10">
              <p className="font-semibold text-signal">{milestone.when}</p>
              <h3 className="mt-1 text-2xl font-bold tracking-tight">{milestone.title}</h3>
              <p className="mt-2 max-w-prose text-lg leading-relaxed">{milestone.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Globe                                                                      */
/* -------------------------------------------------------------------------- */

// Globe geometry, in the SVG's units.
const CX = 200
const CY = 190
const R = 150
// The point on Earth facing the viewer: tipped so the northern hemisphere
// leans toward us, and turned so the Americas sit on the visible left half.
const LON0 = -40
const LAT0 = 22
const RAD = Math.PI / 180

type LonLat = [number, number]

/** Orthographic projection onto the globe. Points on the far side are pulled
 *  onto the rim, so outlines that run around the back stay closed. */
function project([lon, lat]: LonLat): [number, number] {
  const l = (lon - LON0) * RAD
  const p = lat * RAD
  const p0 = LAT0 * RAD
  let x = Math.cos(p) * Math.sin(l)
  let y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l)
  const facing = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l)
  if (facing < 0) {
    const len = Math.hypot(x, y) || 1
    x /= len
    y /= len
  }
  return [CX + R * x, CY - R * y]
}

const isFacing = ([lon, lat]: LonLat) =>
  Math.sin(LAT0 * RAD) * Math.sin(lat * RAD) + Math.cos(LAT0 * RAD) * Math.cos(lat * RAD) * Math.cos((lon - LON0) * RAD) >= 0

const toPath = (points: LonLat[], close = true) =>
  points.map((pt, i) => `${i ? "L" : "M"}${project(pt).map((n) => n.toFixed(1)).join(" ")}`).join("") + (close ? "Z" : "")

/** Grid lines, only where they face the viewer, split where they go round
 *  the back. */
function gridLine(points: LonLat[]) {
  const runs: LonLat[][] = []
  let run: LonLat[] = []
  for (const pt of points) {
    if (isFacing(pt)) run.push(pt)
    else if (run.length) {
      runs.push(run)
      run = []
    }
  }
  if (run.length) runs.push(run)
  return runs.filter((r) => r.length > 1).map((r) => toPath(r, false)).join("")
}

const range = (from: number, to: number, step: number) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step)

const GRID = [
  ...[-60, -30, 0, 30, 60].map((lat) => gridLine(range(-180, 180, 4).map((lon): LonLat => [lon, lat]))),
  ...range(-180, 150, 30).map((lon) => gridLine(range(-90, 90, 3).map((lat): LonLat => [lon, lat]))),
].join("")

// Simplified coastlines as [longitude, latitude] points.
const CONTINENTS: Record<string, LonLat[]> = {
  northAmerica: [
    [-168, 66], [-162, 70], [-156, 71.3], [-141, 69.6], [-128, 70], [-115, 68.5], [-104, 68], [-95, 71.5], [-88, 68.5],
    [-82, 69.5], [-80, 63], [-87, 64], [-94, 59.5], [-92.5, 57], [-85, 55.3], [-82, 53], [-79, 51.5], [-77, 56],
    [-78, 62.3], [-72, 61.6], [-69.5, 59], [-64.5, 60.3], [-61.5, 56], [-56, 52], [-59.5, 48], [-64.5, 49], [-66, 45],
    [-70, 43.5], [-70.5, 41.6], [-74, 40.5], [-76, 37], [-75.5, 35.3], [-78, 33.8], [-81, 31.5], [-80, 27],
    [-80.4, 25.2], [-81.8, 26.5], [-83, 29], [-85, 29.7], [-89.5, 30.2], [-90, 29], [-94, 29.6], [-97.3, 27.5],
    [-97.6, 24], [-97, 21.5], [-95, 18.7], [-91.5, 18.5], [-90.4, 21], [-87, 21.5], [-87.5, 18.4], [-88.2, 16],
    [-84, 15.8], [-83.3, 12], [-83.6, 10.6], [-81.5, 8.8], [-79.5, 9.5], [-77.4, 8.6], [-78.3, 7.4], [-80.4, 7.3],
    [-82, 8.2], [-85.6, 10], [-87.6, 13], [-91.5, 14], [-94.5, 16.1], [-97, 15.9], [-101.5, 17.6], [-105.3, 20],
    [-105.6, 23], [-109, 25.6], [-112.2, 29], [-114.7, 31.7], [-113, 28], [-110, 23.2], [-112, 24.8], [-115, 29.5],
    [-117.2, 32.6], [-120.6, 34.5], [-122.5, 37.6], [-124, 40.3], [-124.2, 43.5], [-123.9, 46.2], [-124.6, 48.4],
    [-127.4, 50.8], [-130.5, 54.3], [-134.5, 58], [-139.5, 59.6], [-146, 60.8], [-151.5, 59.4], [-154, 57.4],
    [-158, 56.6], [-164.5, 54.6], [-158, 58.6], [-162, 59.9], [-165.4, 61.5], [-164.6, 63.2], [-161, 64.3],
    [-166, 64.6],
  ],
  greenland: [
    [-73, 78.3], [-66, 80.6], [-55, 82.3], [-35, 83.6], [-21, 82.4], [-18.5, 79.5], [-20, 75], [-22, 71],
    [-26, 68.6], [-33, 68.3], [-40.5, 65], [-43.3, 60], [-48.5, 61], [-51.5, 64.5], [-53.5, 68.3], [-54, 71.3],
    [-58, 75.5], [-66, 76],
  ],
  southAmerica: [
    [-77.4, 8.6], [-75.6, 10.7], [-71.8, 12.4], [-71, 11], [-68.2, 10.6], [-64, 10.6], [-61.6, 10.2], [-60, 8.5],
    [-57.2, 5.9], [-52, 4.8], [-50, 1.8], [-49.6, -0.2], [-44.5, -2.4], [-40, -2.8], [-35, -5.4], [-34.9, -8],
    [-37, -11], [-39, -13.6], [-39.2, -17.6], [-40.8, -21.8], [-44.6, -23.3], [-48.5, -26], [-48.8, -28.6],
    [-52, -31.8], [-53.6, -34], [-56.4, -36.4], [-57.6, -38.2], [-62.3, -38.8], [-62.2, -40.6], [-65, -41.2],
    [-64.6, -42.6], [-67.4, -46], [-65.8, -47.8], [-69, -50.5], [-68.4, -52.3], [-71, -53.8], [-74, -52.7],
    [-75.6, -48.6], [-74, -45], [-73.6, -40], [-71.6, -35.8], [-71.4, -30.2], [-70.6, -25.4], [-70.2, -20],
    [-71.4, -17.6], [-76.2, -14], [-79, -8.4], [-81.2, -5.8], [-80.4, -2.5], [-80.6, 0.4], [-78.8, 1.6],
    [-77.6, 4], [-77.2, 7],
  ],
  cuba: [
    [-84.9, 21.9], [-82, 22.7], [-79, 22.6], [-77, 21.6], [-74.2, 20.2], [-77.5, 19.9], [-78.6, 21.6], [-81.8, 22.2],
  ],
  hispaniola: [[-74.4, 18.5], [-72.8, 19.9], [-70, 19.7], [-68.4, 18.5], [-71.2, 17.6], [-74.4, 18.1]],
  africa: [
    [-17.1, 21], [-16.5, 16], [-17.2, 14.7], [-15, 10.8], [-13, 8], [-8, 4.4], [-3, 5], [1.8, 6.2], [4.4, 6.4],
    [8.6, 4.4], [9.6, 2.4], [9.4, -1], [11.8, -4.8], [13.2, -8.8], [12.4, -13.6], [11.8, -17.4], [14.4, -22.6],
    [16.4, -28.6], [18.4, -34], [20, -34.8], [25.6, -34], [30, -31.4], [32.6, -27.6], [35.4, -24], [35.4, -21.2],
    [34.6, -19.6], [37.6, -17.4], [40.6, -14.8], [40.4, -10.6], [39.2, -6.6], [39.6, -4.6], [41.6, -1.6],
    [44, 1.8], [47.6, 5.2], [51.2, 11.4], [43.4, 11.6], [42.6, 14.6], [39.4, 17.6], [37.2, 21], [35.6, 24],
    [33.6, 28], [32.4, 31.2], [29.6, 31.2], [25, 31.6], [20, 30.8], [19.8, 32.4], [15.2, 32.4], [11, 33.6],
    [10.2, 36.8], [3, 36.8], [-1.6, 35.2], [-5.8, 35.8], [-9.6, 33.2], [-9.8, 29.8], [-13.2, 27.6], [-14.8, 24.2],
  ],
  europe: [
    [-9.4, 36.9], [-8.9, 42.6], [-4.4, 43.4], [-1.6, 43.4], [-1.2, 46.2], [-4.6, 48.4], [-1.6, 49.6], [1.6, 50.8],
    [4.4, 51.6], [5.8, 53.4], [8.6, 53.8], [8.4, 56.4], [10.4, 57.6], [10.6, 56.2], [12.6, 55.6], [14.2, 54],
    [19.6, 54.4], [21.2, 56], [23.8, 57.4], [24.2, 59.4], [28, 59.6], [22.8, 59.8], [21.4, 61.4], [25.2, 65],
    [21.6, 65.6], [17.6, 62.4], [19, 59.8], [16.6, 56.4], [14.4, 55.6], [12.8, 56.6], [11.6, 58.6], [10.6, 59],
    [8, 58], [5.6, 58.8], [5, 61.6], [8.2, 63.4], [12.4, 65.8], [15.6, 68.6], [19.4, 69.8], [25.6, 71.1],
    [31, 70.2], [33, 69.2], [40.6, 67.8], [44, 68.4], [53.6, 68.8], [60, 69.8], [60, 56], [50, 46.6],
    [47.2, 45.4], [39.6, 47.2], [37.6, 45.4], [35.2, 45.2], [32.4, 46.6], [30.2, 45.8], [28.6, 44.4], [28, 42],
    [26.2, 40.6], [24, 40.8], [22.6, 40.2], [24, 38.2], [21.8, 36.8], [21, 39.6], [19.4, 41.8], [16, 43.6],
    [13.6, 45.6], [12.4, 44.2], [16, 41.4], [18.4, 40.2], [16.6, 38.8], [15.8, 38], [12.6, 41.2], [10.2, 43.8],
    [8.6, 44.4], [6.6, 43.2], [3.2, 43.2], [3, 41.8], [0.8, 41], [-0.4, 39.4], [0.2, 38.8], [-2, 36.8],
    [-5.6, 36.1],
  ],
  britain: [
    [-5.6, 50.1], [-3, 50.6], [1.4, 51.2], [1.7, 52.7], [0.2, 53.4], [-1.4, 55], [-2, 56], [-1.8, 57.6], [-3.4, 58.6],
    [-5, 58.6], [-6, 56.8], [-5.6, 55.4], [-3, 54.8], [-3.2, 53.4], [-4.6, 52.8], [-5.2, 51.8], [-3.4, 51.4],
  ],
  ireland: [[-6, 52.2], [-6.2, 54.6], [-7.6, 55.2], [-10, 54.2], [-10.4, 51.8], [-8, 51.6]],
  iceland: [[-24.4, 65.6], [-21.4, 66.4], [-15.6, 66.4], [-13.6, 65.2], [-15, 64.2], [-18.6, 63.4], [-22.6, 63.8]],
}

const CONTINENT_PATHS = Object.entries(CONTINENTS).map(([name, points]) => ({ name, d: toPath(points) }))

// New York City, where the pin goes.
const NYC = project([-74, 40.7])

// The Unisphere in Flushing Meadows, Queens, as a flat red cutout: the open
// steel grid of the globe with its continents and the three orbit rings around
// it. Everything is drawn in currentColor.
function Unisphere({ className }: { className?: string }) {
  return (
    <svg viewBox="0 -10 400 400" role="img" aria-label="The Unisphere in Queens" className={className}>
      <defs>
        <clipPath id="unisphere-globe">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
      </defs>

      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* Orbit rings around the globe. */}
        <g strokeWidth={5}>
          <ellipse cx={CX} cy={CY} rx={188} ry={44} transform={`rotate(-18 ${CX} ${CY})`} />
          <ellipse cx={CX} cy={CY} rx={182} ry={40} transform={`rotate(32 ${CX} ${CY})`} />
          <ellipse cx={CX} cy={CY} rx={176} ry={36} transform={`rotate(78 ${CX} ${CY})`} />
        </g>

        {/* The open grid: rim, and the parallels and meridians facing us. */}
        <circle cx={CX} cy={CY} r={R} strokeWidth={6} />
        <path d={GRID} strokeWidth={2.2} clipPath="url(#unisphere-globe)" />
      </g>

      {/* Continents, as solid plates on the grid. */}
      <g fill="currentColor" clipPath="url(#unisphere-globe)">
        {CONTINENT_PATHS.map((c) => (
          <path key={c.name} d={c.d} />
        ))}
      </g>

      {/* A white map pin on New York City, its tip on the spot. */}
      <g transform={`translate(${NYC[0].toFixed(1)} ${NYC[1].toFixed(1)})`}>
        <ellipse cy={0.5} rx={4} ry={1.6} fill="#000" opacity={0.35} />
        <path d="M0 0C-2.6 -5.4 -8 -9.6 -8 -15.5A8 8 0 1 1 8 -15.5C8 -9.6 2.6 -5.4 0 0Z" fill="#f4f1ee" />
        <circle cy={-15.5} r={3.2} fill="currentColor" />
      </g>
    </svg>
  )
}
