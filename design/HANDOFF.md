# Sudoku · Quay lui - design handoff

A 4-page teaching site for CS112 "Phân tích và thiết kế thuật toán": it shows, step by step, how backtracking ("quay lui mô hình 1") solves Sudoku. The person grading it is the lecturer. She watches the solver and checks that it follows her pseudocode exactly.

**The one thing the build must make obvious:** at every moment, which pseudocode line is running, on which cell, with which digit, and why a digit was rejected.

This is a teaching tool, not a game. No timer, score, hint, difficulty selector, login, language switch, confetti, gradients, blur, glow or emoji. (A light/dark switch was added later at Jason's request - see section 7.)

---

## 1. What is in this folder

| Path | What it is | How to use it |
|---|---|---|
| `tokens.css` | Every color, space, radius, type size and shadow, light + dark | Import it as-is. Use only these variables. |
| `frames/*.html` | The 13 design frames as plain static HTML + CSS (open in a browser) | **Reference for exact markup, classes, sizes and states.** Rebuild, don't copy blindly: the grid, slots and messages must be generated from solver state. |
| `screenshots/*.png` | The same frames rendered with the real fonts, plus 3 responsive checks | Visual target. Compare your build against these. |
| `source/` | The original canvas files (`.dc.html`, `canvas.json`) | Only if you need the raw source. They use a canvas-only wrapper (`<x-dc>`, `<sc-for>`, `renderVals()`); do **not** port that wrapper. |
| `PROMPT.md` | The prompt to paste into Claude Code (React + Vite + TypeScript, Netlify) | Start here. |

All on-screen text is Vietnamese and must be used **verbatim** from the frames. Do not translate or invent copy.

## 2. Frames

| # | File | Size | Shows |
|---|---|---|---|
| 00 | `00-luong-nguoi-dung` | 2448 | **End-to-end user flow**: every screen, every transition, happy / edge / error colour-coded, the lecturer's main path in bold blue. Read this first. |
| 01 | `01-component-sheet` | 1440 | Every component and state, light and dark side by side |
| 02 | `02-trang-chu` | 1440 | Home |
| 03 | `03-giai-san-sang` | 1366 × 680 | Solver, ready (Đề 3 loaded, nothing run) |
| 04 | `04-giai-dang-thu-bi-loai` | 1366 × 680 | Solver after 814 tries: cell (4, 7) tries 2, rejected (row 4 has 2 at (4, 8)) |
| 05 | `05-giai-quay-lui` | 1366 × 680 | Solver right after try 803: backtrack, digit 8 removed from (4, 1) |
| 06 | `06-giai-da-giai` | 1366 × 680 | Solved: 1.909 / 227 / 187 |
| 07 | `07-giai-de-sai` | 1366 × 680 | Invalid input: user typed 7 at (4, 1), row 4 already has 7 at (4, 4) |
| 08 | `08-giai-vo-nghiem` | 1366 × 680 | Đề 7, no solution: (1, 1) rejected all 9 digits |
| 09 | `09-giai-dan-de` | 1366 × 680 | Paste-puzzle dialog |
| 10 | `10-giai-mobile` | 390 × 844 | Phone version of 04 |
| 11 | `11-giai-dark` | 1366 × 680 | 04 in dark mode |
| 12 | `12-thuat-toan` | 1440 | Algorithm article |
| 13 | `13-gioi-thieu` | 1440 | About |
| 14 | `14-khong-tim-thay` | 1440 | 404 - unknown route |
| 15 | `15-loi-ung-dung` | 1440 | App error (React error boundary, failed chunk after a redeploy) |
| 16 | `16-giai-dan-de-loi` | 1366 × 680 | Paste dialog with a format error (8 lines pasted) |
| 18 | `18-giai-dang-thu-chap-nhan` | 1366 × 680 | Try 804 of Đề 3: cell (4, 1) accepts 9 ("đúng" tag), right after the backtrack in frame 05 |
| 17 | `17-giai-dang-giai-lau` | 1366 × 680 | "Giải ngay" running in the background on Đề 5, real state at try 200.000 |

Responsive checks in `screenshots/`: `resp-04-phone-390.png`, `resp-04-tablet-820.png`, `resp-02-phone-390.png`, `resp-14-phone-390.png`.

Every message used anywhere (happy, error and edge cases) is also collected in frame 01, section "Edge cases · messages".

**Prototype links:** on the canvas the frames are clickable (03 → Tự động → 05 → Từng bước → 18 → Từng bước → 04 → Giải ngay → 06 → Đặt lại → 03, plus Dán đề, Hủy, Đặt lại and the nav). To make that work, some buttons in `frames/*.html` are `<a class="btn …" href="…">`. **Build every action as a real `<button>`**; only navigation between pages is a link.

## 3. Hard constraint: solver fits 1366 × 680 without scrolling

680 = a 768 px laptop screen minus browser chrome. The project video is recorded at this size. Measured in the frames:

- Top bar 56 · main padding 12 top / 12 bottom.
- **Left column (480 wide, ends at y = 668):** heading 20 · gap 8 · column numbers 16 + 4 · grid 400 (9 × 44 + 2 × 2 border) · legend 20 (margin-top 12) · gap 8 · row "Đề mẫu / Dán đề / Kiểm tra đề" 36 · gap 8 · row "Từng bước / Tự động-Tạm dừng / Giải ngay / Đặt lại" 36 · gap 8 · speed row 24.
- **Right column (≈ 688 wide, ends at y ≤ 666):** panel "Mã giả" (title + caption on one line, 12-line code block 14/22) · gap 12 · panel "S = (S₁, …, Sₙ)" (slots scroll after 2 rows, max-height 64) · gap 12 · panel "Diễn biến" (title + 3 counters on one line, status message under).
- Panel padding 12 vertical / 16 horizontal. Columns 480 + 32 gap + rest, inside a 1200 px content box.

If you change anything on the solver page, re-check at 1366 × 680 that `document.documentElement.scrollHeight === 680`.

## 4. Responsive rules

| Width | Behaviour |
|---|---|
| ≥ 1120 | Desktop layout above. |
| 601-1119 | Right column drops under the grid (flex-wrap). Everything else as desktop. |
| ≤ 767 | Top-bar nav hides; a ghost button "Menu" (Lucide `menu` icon + label) replaces it on every page. The menu panel itself is not designed: a simple dropdown/sheet listing the 4 links, current page in the `primary-soft` pill. |
| ≤ 600 | Phone solver = frame 10: grid full width (cells `min(44px, (100vw - 36px) / 9)`), row/column numbers hidden, legend hidden; "Diễn biến" (message + counters, no title) moves first; "Từng bước", play/pause and "Giải ngay" become a bottom bar fixed to the screen (44 px targets); "Đặt lại", "Đề mẫu", "Dán đề", "Kiểm tra đề" and the speed slider move into a "Tùy chọn" sheet opened by the "Tùy chọn" button next to the heading. Side padding 16. |

**Not drawn, build it:** on phones "Mã giả" and "Lời giải S" are collapsible sections, **collapsed by default**. "Mã giả" shows the currently highlighted line (with its đúng/sai tag) as its summary; "Lời giải S" shows "i = 16 / 40" in its summary. Use `<details>/<summary>`. Frame 10 is the visual target. The "Tùy chọn" sheet is not drawn either: a bottom sheet with those controls in the desktop order.

## 5. States (table 3.3 of the brief)

Each state has a background, a digit color and a **non-color cue**. Never use color alone.

| State | Label | Cell | S slot |
|---|---|---|---|
| Given | Đề cho | `given` colors, digit weight 600 | - |
| Filled by algorithm | Đã ghi nhận | `recorded` colors, digit weight 400 | `recorded` colors |
| Trying now | Đang thử | `trying` colors + 3 px inset border `trying-cue` | `trying` colors + 2 px inset ring |
| Rejected | Bị loại | `rejected` colors, digit struck through 2 px. The cell that causes the conflict gets a 2 px `rejected-cue` ring and keeps its own colors. | `rejected` colors + 2 px ring (frame 08 only) |
| Just restored | Vừa trả lại | `restored` colors + 2 px dashed `restored-cue` border; the removed digit stays as an 11 px struck-through ghost in the top-right corner | `restored` colors, dashed outline, digit struck through |
| Solved | Đã giải | the filled cells switch to `solved` colors; givens keep their style; check icon in the message | slots stay `recorded` |
| Input error | Đề sai | `rejected` colors + 2 px solid ring on every conflicting cell; warning icon in the message | - |

Empty slot = 1 px dashed `grid-cell-line` outline with its index.

Status message line (panel "Diễn biến"): a 14/20 box tinted with the state it describes, icon on the left (Lucide, 20 px, 1.5 stroke), the cell reference in weight 600:

| Situation | Box | Icon |
|---|---|---|
| Ready / info | `sunken` + `text` | `info` |
| Rejected try / no solution | `rejected` bg + digit | `circle-x` |
| Backtrack | `restored` bg + digit | `undo-2` |
| Solved | `solved` bg + digit | `circle-check` |
| Invalid puzzle | `rejected` bg + digit, `role="alert"` | `triangle-alert` |

Use `role="status"` / `aria-live="polite"` for normal messages. Throttle announcements while auto-playing (e.g. only announce on pause, solved, invalid, no solution).

Pseudocode panel: the running line gets a `primary-soft` background, a 3 px `primary` bar on its left edge and weight 600. When it is the `if` check, a tag at the end of the line says **"đúng"** (`solved` colors) or **"sai"** (`rejected` colors). The pseudocode is the lecturer's slide - keep every character and line break, and **turn ligatures off** (`font-feature-settings: "liga" 0, "calt" 0`) or JetBrains Mono turns `-->` into an arrow.

## 6. The algorithm and its instrumentation

Model: number the blank cells row by row, left to right: 1 … n. `S = (S₁, …, Sₙ)`, `Sᵢ ∈ {1..9}`. `try(i)` loops `j = 1 → 9`; `j` is acceptable if it is not already in the cell's row, column or 3×3 box. **Stop at the first solution** (no restore after "Xuất lời giải").

Counters:

- **Lần thử** = number of times the `if (khả năng j chấp nhận được)` check runs (accepted or not).
- **Ghi nhận** = number of times a digit is written ("Ghi nhận trạng thái mới").
- **Trả lại** = number of times a digit is removed ("Trả lại trạng thái cũ").

Write the solver as a generator (or event list) that yields one event per pseudocode step, so "Từng bước", "Tự động" (timed by the speed slider) and "Giải ngay" all replay the same events. Suggested events → highlighted line (1-based, 12 lines):

| Event | Line | Grid / slot | Message |
|---|---|---|---|
| check j at cell i → accepted | 3 + tag "đúng" | cell shows j as Đang thử | "Ô (h, c) - thử số j: chấp nhận được." (frame 18; Đang thử colours, Lucide `circle-dot`) |
| check j at cell i → rejected | 3 + tag "sai" | cell shows j as Bị loại, conflicting cell ringed | "Ô (h, c) - thử số j: bị loại vì j đã có ở hàng h." |
| record | 5 | cell becomes Đã ghi nhận, Sᵢ filled | - |
| descend | 7 | next slot becomes current | - |
| solution | 9 | all filled cells → Đã giải | "Đã giải xong: X lần thử, Y lần trả lại." |
| restore | 10 | cell becomes Vừa trả lại with ghost digit | "Quay lui: trả lại ô (h, c), xóa số d. Tiếp theo thử số d+1 ở ô này." |

Report the first violated rule in the order row → column → box. The brief gives the wording for row and column only ("đã có ở hàng 4", "đã có ở cột 1"). **Ask Jason for the 3×3-box wording** before inventing one. After `d = 9` the restore message's second sentence must change (there is no next digit). Ask Jason for that wording too.

Number format everywhere: Vietnamese, dot as thousands separator (`n.toLocaleString('vi-VN')` → `1.909`). All counters, `i = 16 / 40` and the S slots use `font-variant-numeric: tabular-nums` (they change up to 60 times a second).

### Acceptance tests (from the brief - your solver must reproduce these exactly)

| Đề | Ô trống | Lần thử | Ghi nhận | Trả lại |
|---|---|---|---|---|
| 1. Rất dễ | 1 | 1 | 1 | 0 |
| 2. Dễ | 5 | 27 | 5 | 0 |
| 3. Vừa | 40 | 1.909 | 227 | 187 |
| 4. Wikipedia | 51 | 37.652 | 4.208 | 4.157 |
| 5. Arto Inkala | 60 | 445.778 | 49.558 | 49.498 |
| 6. Lưới trống | 81 | 3.195 | 391 | 310 |
| 7. Vô nghiệm | 72 | 9 | 0 | 0 |

Plus the three mid-run snapshots for Đề 3 (frame 18: try 804 accepts 9 at (4, 1), counters 804 / 93 / 81, S₁₃ = 9 being tried): after try 814 the state equals frame 04 (96 records, 81 restores, S₁…S₁₅ = 7 8 6 2 8 1 7 7 3 4 5 8 9 5 3); right after try 803 it equals frame 05 (93 / 81, S₁…S₁₂ = 7 8 6 2 8 1 7 7 3 4 5 8, digit 8 just removed from (4, 1)).

These definitions were checked: a straightforward implementation (blanks row-major, j = 1 → 9, row/column/box check, stop at first solution) reproduces every row below that has data, and both snapshots, exactly.

Puzzle data (81 characters, `.` = blank):

```
Đề 3 - Vừa          5346..912....9534.19...2.6....761.2...6..37...1.9248....1....842..41.635.4.2.617.
Đề 4 - Wikipedia    53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79
Đề 5 - Arto Inkala  8..........36......7..9.2...5...7.......457.....1...3...1....68..85...1..9....4..
Đề 6 - Lưới trống   .................................................................................
Đề 7 - Vô nghiệm    .234567891.......................................................................
```

Đề 4 is also the text pre-filled in the paste dialog (frame 09). **Ask Jason for Đề 1 and Đề 2.**

## 7. Behaviour that the frames imply

- "Tự động" (primary, `play` icon) and "Tạm dừng" (`pause` icon) are **one toggle button**. One primary button per view.
- Speed slider "Tốc độ", 1 to 1.000 tries per second, label shows e.g. "20 lần thử/giây". A logarithmic mapping is suggested so low speeds are reachable.
- Disabled = whole button at 40% opacity + `cursor: not-allowed`. Never a lighter color only.
  - Invalid puzzle (07): "Từng bước", "Tự động", "Giải ngay" disabled.
  - Solved (06) and no solution (08): "Từng bước", "Tự động", "Giải ngay" disabled; "Đặt lại" is the next action.
- "Kiểm tra đề" validates the grid (duplicate in a row, column or box) and produces the frame 03 or 07 message.
- "Dán đề" opens the dialog (frame 09): 560 px wide, `color-scrim` backdrop, textarea 9 rows in JetBrains Mono. Accept 9 lines of 9 tokens (digits, `X` = blank, separated by spaces, the 9-line format) or one 81-character string (`.` = blank). "Hủy" (ghost) closes, "Dùng đề này" (primary) loads and validates. Trap focus, close on Esc, return focus to "Dán đề".
- Cells are editable before running (frame 07 shows a typed 7). Givens loaded from a puzzle are not editable.
- Motion: state changes at most 150 ms ease-out; a rejected cell flashes once (no shake); `prefers-reduced-motion` → instant.
- Focus: 2 px `primary` ring with 2 px offset on every interactive element. Visible keyboard focus everywhere.
- Lucide icons only, 20 px, 1.5 stroke. No icon-only buttons on desktop.

### Theme switch "Sáng / Tối"

- Two-option control at the right of the top bar, after a 1 px divider: Lucide `sun` and `moon`, **icon-only** - the one agreed exception to the "no icon-only buttons on desktop" rule. Each is a real `<button aria-pressed>` 36 × 34 px with `aria-label` and a `title` tooltip ("Sáng", "Tối"), inside one 36 px box with a `grid-cell-line` border. Inactive icon: `text-muted`. Active: `sunken` background, `text` colour and a heavier 2.25 stroke (a non-colour cue) - deliberately **not** the `primary-soft` pill, so it never reads as the current page. Group: `role="group" aria-label="Giao diện"`.
- **Default follows the system** (`prefers-color-scheme`). There is no third "system" option: before the first click, the pressed button reflects the system theme and follows live system changes (`matchMedia('(prefers-color-scheme: dark)').addEventListener('change', …)`).
- The first click stores the choice (`localStorage` key `theme` = `light` | `dark`, wrapped in try/catch) and sets `<html data-theme>`. From then on the stored choice wins.
- No flash on load: a tiny inline script in `index.html` `<head>`, before the CSS, reads the stored value and sets `data-theme` before first paint. `tokens.css` already handles both the system default and `data-theme`.
- At ≤ 767 px the switch moves into the "Menu" panel, where it shows the text labels "Sáng" and "Tối" next to the icons (44 px tall).
- On the canvas the switch works in every frame; the frame's "dark" Tweak stands in for the system setting.

## 8. Errors, fallbacks and edge cases

Copy comes from the frames and frame 01. `{n}`, `{d}`, `{k}` are values filled in at runtime (Vietnamese number format).

### App level

| Case | What to show | Frame |
|---|---|---|
| Unknown route | 404 page: caption "404", H1 "Không tìm thấy trang", text, primary "Về trang chủ" (`/`), secondary "Mở trình giải" (`/solver`). Tab title "Không tìm thấy trang · Sudoku · Quay lui". No nav item marked current. | 14 |
| Render crash | Error boundary around the routes: H1 "Đã xảy ra lỗi", text, primary "Tải lại trang" (`location.reload()`), secondary "Về trang chủ". Container `role="alert"`. Log the error to the console. | 15 |
| Failed lazy chunk after a Netlify redeploy | Same as render crash: catch the dynamic `import()` failure (`ChunkLoadError` / "Failed to fetch dynamically imported module") and show frame 15; "Tải lại trang" fixes it. | 15 |
| Route loading (`Suspense` fallback) | Nothing for the first 300 ms, then one line "Đang tải…" (14/20, `text-muted`) where the page content goes. Top bar stays. No skeletons, no spinner. | 01 |
| JavaScript disabled | `<noscript>`: "Trang này cần bật JavaScript để chạy trình giải." | 01 |

### Solver

| Case | Behaviour | Message | Frame |
|---|---|---|---|
| Valid puzzle loaded | Ready | "Đề hợp lệ, có {n} ô trống. Bấm Từng bước hoặc Tự động để bắt đầu." | 03 |
| Duplicate in a row / column / box | All conflicting cells get the Đề sai ring; run buttons disabled | frame 07 wording | 07 |
| No solution | First blank cell outlined red; run buttons disabled | frame 08 wording | 08 |
| Puzzle already complete (0 blanks) and valid | Run buttons disabled; "Đặt lại" available | "Đề đã đủ, không còn ô trống để giải." | 01 |
| Paste: not 9 lines (9-line form) | Dialog stays open, text kept, textarea `aria-invalid="true"` with red border, message under it (`role="alert"`, linked with `aria-describedby`) | "Cần đúng 9 dòng, mỗi dòng 9 ký tự. Bạn đã dán {n} dòng." | 16 |
| Paste: bad character | same | "Dòng {d} có ký tự không hợp lệ: "{k}". Chỉ dùng số 1 → 9 và X." | 01 |
| Paste: 81-character form, wrong length | same | "Chuỗi cần đúng 81 ký tự, hiện có {n}." | 01 |
| Paste: valid format but duplicates | Close the dialog, load the puzzle, show the Đề sai state | frame 07 wording | 07 |
| "Giải ngay" takes long | Run the solver in a **Web Worker**. Post progress about 10 times a second: counters, `i`, S and the grid snapshot. Từng bước, Tự động, Giải ngay disabled; "Dừng" (secondary, Lucide `square`) inside the message; "Đặt lại" still works and terminates the worker. Show the message only if solving takes more than 300 ms. | "Đang giải… {n} lần thử" | 17 |
| User presses "Dừng" | Pause the worker (it runs in batches and checks for a pause message between them, so the generator keeps its place); keep the last snapshot; "Giải ngay" enabled again and resumes from there. Only "Đặt lại" or changing the puzzle terminates the worker. | "Đã dừng sau {n} lần thử. Bấm Giải ngay để chạy tiếp." | 01 |
| Puzzle changed / pasted / reset while running | Stop silently and reset; no confirmation | - | - |
| Non-digit typed into a cell | Ignore the key; Backspace/Delete clears; arrow keys move between cells | - | - |
| Tab hidden during "Tự động" | Pause the timer (rAF stops anyway); resume on return only if the user had not paused | - | - |
| About-page link still `#` | Hide that link card until the real URL exists | - | 13 |

## 9. Changes from the original brief (all agreed with Jason)

1. Grid cells 44 px with 24 px digits (brief: 48 / 26), so the solver fits 680 px.
2. Pseudocode caption "Ở bài này: …" sits on the panel title line, not under the code (the pseudocode is 12 lines, not 11).
3. "Diễn biến" title shares a line with the counters; panel padding 12 / 16.
4. S slots scroll after 2 rows (max-height 64, brief said 104) so frame 08 (72 slots + 2-line message) still fits.
5. Left column 480 px wide (brief: grid width) because the four play buttons need ~470 px. Icon-to-label gap in buttons is 4 px.
6. The status message is a small box tinted with its state colors, so colored text always sits on its own state background.
7. Secondary button borders, input borders and empty slots use `grid-cell-line` (the `border` token is too faint on white for controls).
8. The "Đề mẫu" label is visually hidden (still the accessible name of the select), so the longest puzzle names fit.
9. Đang thử ring is 2 px on 26 px slots and 18 px legend swatches (3 px makes the digit unreadable there); 3 px on cells.
10. Highlighted pseudocode line is also weight 600.
11. Frame 08: S₁ uses the Bị loại style (nothing is "being tried" any more); (1, 1) is outlined in red without a background.
12. Added tokens: `color-on-primary`, `color-scrim`.
13. Added frames 14-18, the flow map (00) and the edge-case messages in frame 01 (not in the brief).
15. Added the "Sáng / Tối" theme switch (the brief said no toggle; changed at Jason's request). Default = system setting. Icon-only on desktop - the only exception to the label rule.
14. Trang chủ and Thuật toán: the hero / page title sits on a full-width `surface` band with a 1 px `border` line under it; the rest of the page is on `page`. No gradients (rule 9 of the brief stands).

## 10. Open questions for Jason

- Wording of a rejection caused by the 3×3 box.
- Confirm the accepted-step message drafted for frame 18: "Ô (h, c) - thử số j: chấp nhận được."
- Wording of the backtrack message when the removed digit was 9.
- Puzzle data for Đề 1 and Đề 2.
- Real links for "Video demo", "Report (PDF)", "Mã nguồn" on the About page.
- Default sample puzzle on first load (frames assume Đề 3).
- Long-solve safety cap: should "Giải ngay" stop on its own after some number of tries, or only when the user presses "Dừng"? (Frames assume only "Dừng".)
