# Prompt for Claude Code

Paste everything below the line into Claude Code in VS Code, with this `design/` folder inside your project root.

---

Build the website described in `design/HANDOFF.md`. Read that file completely before writing any code. Then open `design/screenshots/00-luong-nguoi-dung.png`: it is the end-to-end user flow (happy, edge and error paths) and every route, state and transition you build must appear on it. After that, look at `design/screenshots/` and open the matching `design/frames/*.html` when you need exact markup, sizes or class names.

## Stack

- **React + Vite + TypeScript** (`npm create vite@latest` with the `react-ts` template if the project is empty). TypeScript `strict: true`.
- **Routing:** `react-router-dom` with four **English** routes:

  | Route | Page (nav label, Vietnamese) | Design frames |
  |---|---|---|
  | `/` | Trang chủ | 02 |
  | `/solver` | Giải Sudoku | 03-11 |
  | `/algorithm` | Thuật toán | 12 |
  | `/about` | Giới thiệu | 13 |

  Any other path renders the 404 page (frame 14). Wrap the routes in an error boundary that renders frame 15, including failed lazy-route chunks after a redeploy. Set `document.title` per route from the Vietnamese page name. The nav marks the current route with `aria-current="page"`. Links inside the frames point to the frame files (`03-giai-san-sang.html` …); map them to these routes.
- **Language split:** everything a visitor reads is Vietnamese (`<html lang="vi">`). Everything a developer reads is English: routes, file and folder names, component names, CSS class names, TypeScript identifiers, test names and code comments. Example: the component for "Lời giải S" is `SolutionVector`, the event for "Trả lại trạng thái cũ" is `restore`.
- **Styling:** import `design/tokens.css` once in `main.tsx`, unchanged. Plain CSS / CSS Modules that use only its variables. No Tailwind, no UI component library, no CSS-in-JS theme: they bring their own colors and spacing.
- **Icons:** `lucide-react` only, `size={20} strokeWidth={1.5}`, `aria-hidden` on icons inside labelled buttons.
- **Fonts:** self-host with `@fontsource/be-vietnam-pro` (400, 500, 600, 700) and `@fontsource/jetbrains-mono` (400, 600), Vietnamese subsets included. No Google Fonts request at runtime.
- **Tests:** Vitest for the solver.
- **Deploy:** Netlify. Add `netlify.toml` with `command = "npm run build"`, `publish = "dist"`, a Node version, and the SPA fallback `[[redirects]] from = "/*" to = "/index.html" status = 200` so deep links like `/giai-sudoku` work.

## Rules

1. Use only the variables in `design/tokens.css`. Do not add colors, tints, gradients, opacity variants, spacing or type sizes. If you think you need one, stop and ask me.
2. All on-screen text is Vietnamese and must match the frames character for character. Do not translate or invent copy. The pseudocode must match the "Mã giả" panel exactly, including spaces and line breaks, with ligatures turned off.
3. The frames are the visual target, not code to copy. `design/frames/*.html` are static snapshots; rebuild them as React components driven by solver state (grid, S slots, counters, highlighted pseudocode line, status message).
4. **Solver architecture**
   - `src/solver/` is pure TypeScript with no React or DOM imports: puzzle parsing (Wecode 9-line format with `X`, and 81-character strings with `.`), validation, and the backtracking solver as a generator that yields one typed event per pseudocode step (section 6 of HANDOFF.md). Use a discriminated union for events.
   - The UI applies events to a state object with a reducer. "Từng bước", "Tự động"/"Tạm dừng" and "Giải ngay" all consume the same generator.
   - "Giải ngay" runs the same solver inside a Web Worker (Vite `new Worker(new URL(...), { type: "module" })`) and posts progress snapshots about 10 times a second, so a hard puzzle never freezes the page (frame 17, "Dừng").
   - Performance: at up to 1.000 tries per second, apply several events per animation frame and render at most once per frame (`requestAnimationFrame`). Memoize the 81 cells and the S slots so only changed ones re-render. "Giải ngay" runs the generator to the end without rendering intermediate states.
5. **Tests first:** before building any UI, write Vitest tests for the solver and make them pass: the acceptance table and the two Đề 3 snapshots in section 6 (frames 04 and 05), parsing of both input formats, and validation (frame 07's duplicate 7 in row 4).
6. The solver page must fit 1366 × 680 with no scrolling (section 3). Check it at that size before you call it done.
7. Implement the responsive rules in section 4, including what is marked "Not drawn, build it".
8. Implement every error, fallback and edge case in section 8. Add Vitest tests for the parser errors and the "already complete" case.
9. Accessibility: real buttons and labels, visible 2 px focus ring, `aria-live` status (throttled while auto-playing), focus trap + Esc + focus return in the paste dialog, `prefers-reduced-motion`. Theme: follow `prefers-color-scheme` by default and add the "Sáng / Tối" switch exactly as in section 7 of HANDOFF.md (stored choice, no flash on load).
10. Section 10 of HANDOFF.md lists open questions. Ask me when you reach them; do not guess the wording.

## Order of work

Show me the result after each step and wait for my OK:

1. Project setup, tokens, fonts, routing shell with the top bar and footer, `netlify.toml`.
2. `src/solver/` + Vitest tests, all green.
3. Solver page, desktop 1366 × 680 (compare with frames 03-09 and 11).
4. Solver page responsive (frame 10 and the `resp-*` screenshots).
5. Trang chủ, Thuật toán, Giới thiệu, 404 and error pages.
6. Edge cases from section 8 that are not done yet (Web Worker, paste errors, loading fallback, noscript).
7. `npm run build` passes with no TypeScript errors; preview the production build.
