# Prompt for Claude Design - Sudoku backtracking website

How to use: paste **Prompt 1** as the first message in a new Claude Design canvas. After reviewing the result, use the follow-up prompts in section "Follow-ups" one at a time.

---

## Prompt 1 (paste everything between the two lines)

---

Design a 4-page website that teaches how the backtracking algorithm solves Sudoku, step by step. All on-screen text is Vietnamese, given verbatim below. Do not translate it and do not invent extra copy.

### 1. Who looks at this and what they must understand

- The main viewer is a university lecturer grading a student project for the course CS112 "Phân tích và thiết kế thuật toán". She will watch the solver run and check that it follows exactly her "backtracking model 1" pseudocode.
- The single thing the design must make obvious: **at every moment, which line of the pseudocode is running, on which cell, with which digit, and why a digit was rejected.**
- This is a teaching tool, not a game. No timers, scores, confetti, or difficulty badges.

### 2. Frames to produce

Name the frames exactly like this, in this order:

1. `01 Component sheet` - every component and every cell state from section 5, light and dark side by side.
2. `02 Trang chủ - desktop 1440`
3. `03 Giải Sudoku - sẵn sàng - desktop 1366`
4. `04 Giải Sudoku - đang thử, bị loại - desktop 1366`
5. `05 Giải Sudoku - quay lui - desktop 1366`
6. `06 Giải Sudoku - đã giải - desktop 1366`
7. `07 Giải Sudoku - đề sai - desktop 1366`
8. `08 Giải Sudoku - vô nghiệm - desktop 1366`
9. `09 Giải Sudoku - dán đề (hộp thoại) - desktop 1366`
10. `10 Giải Sudoku - đang thử, bị loại - mobile 390`
11. `11 Giải Sudoku - đang thử, bị loại - dark - desktop 1366`
12. `12 Thuật toán - desktop 1440`
13. `13 Giới thiệu - desktop 1440`

Hard size constraint for frames 03-09 and 11: the whole solver (grid, controls, and the right-hand panel) must fit in a **1366 × 680** viewport without scrolling. 680 is a 768-pixel laptop screen minus browser chrome. The project video is recorded at this size.

### 3. Design tokens - use these exactly, add nothing

Every color below has been checked against WCAG 2.1 AA (ratios listed). Do not introduce any other color, tint, gradient, or opacity variation of these. If you believe you need a new color, stop and ask.

#### 3.1 Neutrals and brand - light mode

| Token | Hex | Use | Checked contrast |
|---|---|---|---|
| `page` | `#F8FAFC` | page background | - |
| `surface` | `#FFFFFF` | cards, panels, the grid | - |
| `sunken` | `#F1F5F9` | code block, inputs, table header | - |
| `border` | `#E2E8F0` | card borders, dividers | - |
| `grid-cell-line` | `#CBD5E1` | thin lines between cells | - |
| `grid-box-line` | `#334155` | thick lines around each 3×3 box and the grid edge | 10.35 on surface |
| `text` | `#0F172A` | headings, body, given digits | 17.85 on surface |
| `text-muted` | `#475569` | secondary text, labels, captions | 7.24 on page |
| `primary` | `#2563EB` | primary button fill, focus ring, active nav | white text 5.17 |
| `primary-strong` | `#1D4ED8` | primary hover, links, digits filled by the algorithm | 6.70 on surface |
| `primary-soft` | `#DBEAFE` | highlighted pseudocode line, selected nav pill | text 14.63 |

There is deliberately **no third grey text color**. `#64748B` fails on `sunken` (4.34), so it is not used anywhere.

#### 3.2 Neutrals and brand - dark mode

| Token | Hex | Checked contrast |
|---|---|---|
| `page` | `#0B1120` | - |
| `surface` | `#111827` | - |
| `sunken` | `#1E293B` | - |
| `border` | `#1F2A3C` | - |
| `grid-cell-line` | `#334155` | - |
| `grid-box-line` | `#94A3B8` | 6.92 on surface |
| `text` | `#E2E8F0` | 14.39 on surface |
| `text-muted` | `#94A3B8` | 6.92 on surface, 5.71 on sunken |
| `primary` | `#60A5FA` | button text uses `#0B1120` on it, 7.41 |
| `primary-strong` | `#93C5FD` | links and digits filled by the algorithm |
| `primary-soft` | `#1E3A8A` | highlighted pseudocode line, text 8.40 |

#### 3.3 Algorithm state colors

Each state has a background, a digit color, and a **non-color cue**. The non-color cue is mandatory: amber and red backgrounds look similar to people with red-green color blindness, so color alone must never carry the meaning.

| State | Vietnamese label | Light bg / digit | Dark bg / digit | Non-color cue | Contrast (light / dark) |
|---|---|---|---|---|---|
| Given digit | Đề cho | `#FFFFFF` / `#0F172A` | `#111827` / `#F1F5F9` | digit weight 600 | 17.85 / 16.19 |
| Filled by algorithm | Đã ghi nhận | `#EFF6FF` / `#1D4ED8` | `#172554` / `#93C5FD` | digit weight 400 | 6.16 / 8.15 |
| Trying now | Đang thử | `#FEF3C7` / `#92400E` | `#422006` / `#FCD34D` | 3 px inset border `#D97706` (dark `#F59E0B`) | 6.37 / 10.11 |
| Rejected | Bị loại | `#FEE2E2` / `#B91C1C` | `#450A0A` / `#FCA5A5` | digit has a 2 px strike-through line; the cell that causes the conflict gets a 2 px ring in the same red | 5.30 / 8.51 |
| Just restored (backtrack) | Vừa trả lại | `#EDE9FE` / `#6D28D9` | `#2E1065` / `#C4B5FD` | 2 px **dashed** border `#7C3AED` (dark `#A78BFA`); the removed digit stays as a small struck-through ghost in the top-right corner, 11 px | 5.98 / 8.25 |
| Solved | Đã giải | `#CCFBF1` / `#0F766E` | `#042F2E` / `#5EEAD4` | a check icon next to the status message; given digits keep their own style | 4.86 / 9.78 |
| Input error | Đề sai | same as Rejected | same as Rejected | 2 px solid ring + warning icon in the message | - |

The four state hues (amber, red, violet, teal) plus the brand blue are the whole palette. Nothing else.

#### 3.4 Typography

- Two typefaces only. Both support Vietnamese diacritics:
  - **Be Vietnam Pro** for everything except code. Weights 400, 500, 600, 700.
  - **JetBrains Mono** for the pseudocode, input text, and inline code. Weights 400 and 600.
- Scale (px, line-height): 12/16 caption, 14/20 small, 16/24 body, 20/28 h3, 24/32 h2, 32/40 h1, 40/48 home hero only.
- Article text on the Algorithm page: 17/28, max width 68 characters.
- **All counters and the S vector use tabular numerals** (`font-variant-numeric: tabular-nums`). During the animation these numbers change up to 60 times a second; proportional digits would make them jitter.
- Vietnamese number format: dot as thousands separator, `1.909`, `445.778`.
- Sentence case for every label and button: "Giải ngay", not "GIẢI NGAY" or "Giải Ngay".

#### 3.5 Spacing, radius, elevation, motion

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64. No other values.
- Radius: 6 for buttons, inputs, and S-vector slots; 10 for cards and panels; 8 for the outer grid. Cells inside the grid have no radius.
- Elevation: one shadow only, `0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.10)`, for cards and the dialog. In dark mode use the `border` color instead of a shadow.
- Motion: at most 150 ms ease-out for state changes. A rejected cell flashes once, it does not shake. With `prefers-reduced-motion`, state changes are instant.
- Icons: Lucide only, 20 px, 1.5 px stroke. Never icon-only buttons on desktop; every button has a text label.

### 4. Global layout

- Top bar, 56 px tall, `surface` with a 1 px `border` bottom line:
  - Left: wordmark **"Sudoku · Quay lui"** (Be Vietnam Pro 600, 18 px). No logo image.
  - Right: nav links **"Trang chủ" · "Giải Sudoku" · "Thuật toán" · "Giới thiệu"**. The current page uses the `primary-soft` pill with `primary-strong` text.
  - On mobile the nav collapses into a menu icon with the label "Menu".
- Footer (not on the Solver page, to save height): one line in `text-muted`, "CS112 - Phân tích và thiết kế thuật toán · 2026".
- Content max width 1200 px, 24 px side padding on desktop, 16 px on mobile.

### 5. The Solver page - "Giải Sudoku" (most important)

#### 5.1 Desktop layout at 1366 × 680

Two columns with 32 px between them.

**Left column - the grid and the controls (width = grid width):**

- Small heading row above the grid: "Quay lui mô hình 1" in 14 px `text-muted`.
- The 9×9 grid:
  - Cells 48 × 48, digits 26 px.
  - Thin cell lines 1 px `grid-cell-line`; box lines and outer edge 2 px `grid-box-line`.
  - Row and column numbers 1-9 outside the grid in 12 px `text-muted`, because every message refers to cells as "(hàng, cột)".
- Under the grid, a legend row of six small swatches with labels: "Đề cho", "Đang thử", "Bị loại", "Đã ghi nhận", "Vừa trả lại", "Đã giải". Each swatch shows its non-color cue too.
- Controls, two rows:
  - Row 1:
    - a select labelled "Đề mẫu", showing the current puzzle;
    - secondary button "Dán đề";
    - secondary button "Kiểm tra đề".
  - Row 2:
    - secondary button "Từng bước" (icon step-forward);
    - **primary** button "Tự động" (icon play). While running, the same button becomes "Tạm dừng" (icon pause), so it is one toggle button, not two;
    - secondary button "Giải ngay" (icon zap);
    - ghost button "Đặt lại" (icon rotate-ccw).
  - Row 3: a speed slider labelled "Tốc độ", range 1 to 1.000, with the current value shown as e.g. "20 lần thử/giây".
- Button height 36 px on desktop. One primary button per screen.

**Right column - three stacked panels (cards):**

1. **Panel "Mã giả - mô hình quay lui 1"**. This is the lecturer's pseudocode, copied exactly from her slide, in JetBrains Mono 14/22. Keep the Vietnamese text and the line breaks exactly:

   ```
   try(i) =
   {   for (j = 1 --> k)
           if (khả năng j chấp nhận được)
           {   Xác định Sᵢ theo j;
               Ghi nhận trạng thái mới của bài toán (nếu có);
               if (i < n)
                   try(i+1);
               else
                   Xuất lời giải S = (S₁, S₂, …, Sₙ);
               Trả lại trạng thái cũ của bài toán;
           }
   }
   ```

   - The running line has a `primary-soft` background and a 3 px `primary` bar on its left edge.
   - When the running line is the `if` check, a small tag at the end of the line shows the result: "đúng" in teal (Solved colors) or "sai" in red (Rejected colors).
   - Under the code, one caption line in `text-muted`: "Ở bài này: k = 9 (thử các số 1 → 9) · n = số ô trống".
2. **Panel "Lời giải S"**:
   - Title row: "S = (S₁, …, Sₙ)" on the left, "i = 16 / 40" on the right.
   - Below it, a wrapping row of small slots, 26 × 30, one per blank cell. Each slot shows its index as a subscript and its current digit.
   - Slot styles:
     - filled slots use the "Đã ghi nhận" colors;
     - the current slot uses "Đang thử" (or "Vừa trả lại" during backtracking);
     - empty slots are dashed `border` outlines.
   - n can be anywhere from 1 to 81. With 81 slots the area scrolls inside the panel (max height 104 px) and keeps the current slot in view.
3. **Panel "Diễn biến"**:
   - Three counters side by side, each a big number (24 px, tabular) over a 12 px label:
     - "Lần thử";
     - "Ghi nhận";
     - "Trả lại".
   - Under the counters, one status message line in 14 px. This line is the sentence a viewer reads, so give it real prominence:
     - an icon on the left;
     - the cell reference in 600 weight.

#### 5.2 Exact state for each Solver frame

All data below comes from actually running the algorithm on puzzle "Đề 3 - Vừa (40 ô trống)". Use these exact digits. Notation in the grids:
- plain digit = given;
- `d*` = filled by the algorithm;
- `.` = empty;
- `[d]` = the cell being tried with digit d.

**Puzzle "Đề 3" (shown in frame 03, before running):**
```
5 3 4 | 6 . . | 9 1 2
. . . | . 9 5 | 3 4 .
1 9 . | . . 2 | . 6 .
------+-------+------
. . . | 7 6 1 | . 2 .
. . 6 | . . 3 | 7 . .
. 1 . | 9 2 4 | 8 . .
------+-------+------
. . 1 | . . . | . 8 4
2 . . | 4 1 . | 6 3 5
. 4 . | 2 . 6 | 1 7 .
```

**Frame 03 - sẵn sàng (ready):**
- Grid: the puzzle above, givens only.
- Pseudocode: no highlighted line.
- S panel: 40 empty slots, "i = 0 / 40".
- Counters: 0 / 0 / 0.
- Message: "Đề hợp lệ, có 40 ô trống. Bấm Từng bước hoặc Tự động để bắt đầu."

**Frame 04 - đang thử, bị loại (trying, rejected) - after 814 tries:**
```
5  3  4  | 6  7* 8* | 9  1  2
6* 2* 8* | 1* 9  5  | 3  4  7*
1  9  7* | 3* 4* 2  | 5* 6  8*
---------+----------+---------
9* 5* 3* | 7  6  1  |[2] 2  .
.  .  6  | .  .  3  | 7  .  .
.  1  .  | 9  2  4  | 8  .  .
---------+----------+---------
.  .  1  | .  .  .  | .  8  4
2  .  .  | 4  1  .  | 6  3  5
.  4  .  | 2  .  6  | 1  7  .
```
- Cell (4, 7) shows digit 2 in the **Rejected** style: red background, struck-through 2. The given 2 at cell (4, 8) gets the red conflict ring.
- Pseudocode: line `if (khả năng j chấp nhận được)` highlighted, tag "sai".
- S panel: S₁…S₁₅ = 7 8 6 2 8 1 7 7 3 4 5 8 9 5 3. S₁₆ is the current slot. "i = 16 / 40".
- Counters: Lần thử **814** · Ghi nhận **96** · Trả lại **81**.
- Message: "Ô (4, 7) - thử số 2: bị loại vì 2 đã có ở hàng 4."
- Speed slider at 20 lần thử/giây. The main button shows "Tạm dừng" because it is running.

**Frame 05 - quay lui (backtracking) - right after try 803:**
- Context: the algorithm went down a wrong branch. Cell (5, 1) ran out of digits, so it backed up through (4, 9), (4, 7), (4, 3), (4, 2), and has just removed digit 8 from (4, 1).
```
5  3  4  | 6  7* 8* | 9  1  2
6* 2* 8* | 1* 9  5  | 3  4  7*
1  9  7* | 3* 4* 2  | 5* 6  8*
---------+----------+---------
.  .  .  | 7  6  1  | .  2  .
.  .  6  | .  .  3  | 7  .  .
.  1  .  | 9  2  4  | 8  .  .
---------+----------+---------
.  .  1  | .  .  .  | .  8  4
2  .  .  | 4  1  .  | 6  3  5
.  4  .  | 2  .  6  | 1  7  .
```
- Cell (4, 1) is in the **Just restored** style: dashed violet border, small struck-through ghost "8" in its corner.
- Pseudocode: line `Trả lại trạng thái cũ của bài toán;` highlighted.
- S panel: S₁…S₁₂ = 7 8 6 2 8 1 7 7 3 4 5 8. S₁₃ is in the Just-restored style. "i = 13 / 40".
- Counters: Lần thử **803** · Ghi nhận **93** · Trả lại **81**.
- Message: "Quay lui: trả lại ô (4, 1), xóa số 8. Tiếp theo thử số 9 ở ô này."
- Note: row 2 here reads 6 2 8 1, but in the final answer it is 6 7 2 1. The viewer is literally watching a wrong branch being undone, which is the point of the frame.

**Frame 06 - đã giải (solved):**
```
5 3 4 | 6 7 8 | 9 1 2
6 7 2 | 1 9 5 | 3 4 8
1 9 8 | 3 4 2 | 5 6 7
------+-------+------
8 5 9 | 7 6 1 | 4 2 3
4 2 6 | 8 5 3 | 7 9 1
7 1 3 | 9 2 4 | 8 5 6
------+-------+------
9 6 1 | 5 3 7 | 2 8 4
2 8 7 | 4 1 9 | 6 3 5
3 4 5 | 2 8 6 | 1 7 9
```
- Givens keep the given style; the 40 filled cells use the **Solved** style.
- Pseudocode: line `Xuất lời giải S = (S₁, S₂, …, Sₙ);` highlighted.
- All 40 S slots filled. "i = 40 / 40".
- Counters: **1.909** · **227** · **187**.
- Message with check icon: "Đã giải xong: 1.909 lần thử, 187 lần trả lại."
- The main button returns to "Tự động" and is disabled. "Đặt lại" is the obvious next action.

**Frame 07 - đề sai (invalid puzzle):**
- Grid: the Đề 3 puzzle, but the user typed a 7 into cell (4, 1). Row 4 already has a given 7 at (4, 4).
- Both cells get the **Input error** ring.
- Message (red, warning icon): "Đề không hợp lệ: số 7 xuất hiện 2 lần ở hàng 4 (cột 1 và cột 4). Sửa lại rồi bấm Kiểm tra đề."
- "Từng bước", "Tự động", and "Giải ngay" are disabled. Disabled means 40% opacity on the whole button plus `cursor: not-allowed`, never a lighter color only.

**Frame 08 - vô nghiệm (no solution):**
- Puzzle "Đề 7 - Vô nghiệm (72 ô trống)":
  - row 1 is `. 2 3 4 5 6 7 8 9`;
  - row 2 is `1 . . . . . . . .`;
  - all other rows are empty.
- Cell (1, 1) is outlined in the Rejected red. It is the first blank cell, and every digit 1-9 was rejected there, so the algorithm never got past it.
- Counters: **9** · **0** · **0**. "i = 1 / 72".
- Message: "Đề không có lời giải. Ô (1, 1) thử cả 9 số đều bị loại: số 1 đã có ở cột 1, các số 2 → 9 đã có ở hàng 1."

**Frame 09 - dán đề (paste dialog):**
- Modal, 560 px wide, over a dimmed page (`#0F172A` at 40%).
- Title: "Dán đề Sudoku".
- Body text: "Dán 9 dòng (các số cách nhau bởi dấu cách, X là ô trống), hoặc một chuỗi 81 ký tự (dấu chấm là ô trống)."
- A JetBrains Mono textarea, 9 rows tall, pre-filled with:
  ```
  5 3 X X 7 X X X X
  6 X X 1 9 5 X X X
  X 9 8 X X X X 6 X
  8 X X X 6 X X X 3
  4 X X 8 X 3 X X 1
  7 X X X 2 X X X 6
  X 6 X X X X 2 8 X
  X X X 4 1 9 X X 5
  X X X X 8 X X 7 9
  ```
- Buttons: ghost "Hủy" and primary "Dùng đề này".

#### 5.3 Mobile 390 × 844 (frame 10)

- Same state as frame 04.
- Grid full width with 16 px gutters: 358 px, cells about 39 px, digits 22 px. Hide the row/column numbers.
- Order under the grid:
  1. the status message;
  2. the three counters in one row;
  3. "Mã giả" as a collapsible section, collapsed but showing the highlighted line as its summary;
  4. "Lời giải S" as a collapsible section.
- A bottom bar fixed to the screen with "Từng bước", the play/pause toggle, and "Giải ngay". Touch targets at least 44 px. "Dán đề", "Kiểm tra đề", "Đặt lại", and the speed slider go into a "Tùy chọn" sheet.

#### 5.4 Dark (frame 11)

Frame 04 rebuilt with the dark tokens. The dark mode follows the operating system setting; there is no toggle.

### 6. Home page - "Trang chủ" (frame 02)

- Hero, two columns:
  - Left column:
    - H1: "Xem thuật toán quay lui giải Sudoku, từng bước một."
    - Paragraph (max 60 characters per line): "Thuật toán bám đúng mô hình quay lui 1 trên lớp: thử từng số cho từng ô trống, gặp mâu thuẫn thì trả lại trạng thái cũ và lùi về ô trước."
    - Buttons: primary "Mở trình giải", secondary "Đọc về thuật toán".
  - Right column: a static, slightly smaller copy of the frame 04 grid with its state colors. This is the only visual. No illustrations, no 3D, no photos.
- Below the hero, three cards in one row:
  - "Bài toán" - "Điền đủ lưới 9×9 sao cho mỗi hàng, mỗi cột, mỗi khối 3×3 có đủ các số 1 → 9."
  - "Cách giải" - "Quay lui: thử số 1 → 9 cho ô trống thứ i. Số nào vi phạm thì loại ngay, không đi tiếp nhánh đó."
  - "Số đo thật" - "Đề Arto Inkala có 60 ô trống. Thuật toán giải xong sau 445.778 lần thử, trong khi cận xấu nhất là 9⁶⁰."

### 7. Algorithm page - "Thuật toán" (frame 12)

A long reading page with a 720 px article column and a sticky table of contents on the right, titled "Nội dung". Sections and their real content:

1. **"Bài toán"** - two short blocks:
   - "Input": "Ma trận 9×9, mỗi ô là số 1 → 9 hoặc X (ô trống)."
   - "Output": "Ma trận 9×9 hợp lệ, giữ nguyên các số đã cho."
2. **"Mô hình hóa lời giải"** - three bullets:
   - "Đánh số các ô trống theo thứ tự hàng rồi cột: 1, 2, …, n."
   - "S = (S₁, …, Sₙ), Sᵢ ∈ {1, …, 9} là số điền vào ô trống thứ i."
   - "Sᵢ = j chấp nhận được khi j chưa có ở hàng, cột và khối 3×3 của ô đó."
3. **"Đối chiếu với mô hình 1"** - a 2-column table with headers "Mô hình 1" and "Trong bài này":
   | Mô hình 1 | Trong bài này |
   |---|---|
   | `for (j = 1 --> k)` | thử j = 1 → 9 |
   | `if (khả năng j chấp nhận được)` | j chưa có ở hàng, cột, khối |
   | `Xác định Sᵢ theo j` | `S[i] = j` |
   | `Ghi nhận trạng thái mới` | ghi j vào lưới, đánh dấu j đã dùng ở hàng, cột, khối |
   | `if (i < n) try(i+1)` | sang ô trống kế tiếp |
   | `Xuất lời giải` | in lưới đã điền đủ |
   | `Trả lại trạng thái cũ` | xóa j khỏi lưới, bỏ đánh dấu |
4. **"Độ phức tạp"** - a JetBrains Mono block on `sunken`:
   ```
   T(n) = 9·T(n − 1) + c₂,   T(0) = c₁
   T(n) = 9ⁱ·T(n − i) + c₂·(9ⁱ⁻¹ + … + 9 + 1)
   Dừng khi n − i = 0 ⟺ i = n
   ⟹ T(n) = 9ⁿ·c₁ + c₂·(9ⁿ − 1)/8 ∈ O(9ⁿ)
   ```
5. **"Số đo thật"** - a table with tabular numerals, numbers right-aligned:
   | Đề | Ô trống | Lần thử | Ghi nhận | Trả lại |
   |---|---|---|---|---|
   | 1. Rất dễ | 1 | 1 | 1 | 0 |
   | 2. Dễ | 5 | 27 | 5 | 0 |
   | 3. Vừa | 40 | 1.909 | 227 | 187 |
   | 4. Wikipedia | 51 | 37.652 | 4.208 | 4.157 |
   | 5. Arto Inkala | 60 | 445.778 | 49.558 | 49.498 |
   | 6. Lưới trống | 81 | 3.195 | 391 | 310 |
   | 7. Vô nghiệm | 72 | 9 | 0 | 0 |

   Caption under it: "Lưới trống có 81 ô trống nhưng giải nhanh hơn đề Wikipedia. Số ô trống không quyết định độ khó; số lần phải quay lui mới quyết định."

### 8. About page - "Giới thiệu" (frame 13)

Simple definition list in one card, max width 720 px:

- "Môn học": "CS112 - Phân tích và thiết kế thuật toán"
- "Giảng viên": "Huỳnh Thị Thanh Thương"
- "Sinh viên": "Lã Xuân Hồng - 25410056". Design this row so it can be removed without breaking the layout.
- "Bài gốc": "Sudoku, quay lui mô hình 1"
- "Công cụ": "Claude Code (viết code), Claude Design (thiết kế giao diện)"

Below the card, a row of three link cards:
- "Video demo";
- "Report (PDF)";
- "Mã nguồn".

### 9. Rules - do not break any of these

- No gradients anywhere, including text and buttons. No glassmorphism, blur, glow, or neon.
- No emoji. No stock illustrations, mascots, 3D shapes, or decorative blobs.
- No pure black `#000000` and no pure-white text on dark mode surfaces; use the tokens.
- Never use color as the only signal. Every state has its non-color cue from 3.3.
- Every text and background pair must come from the token tables. Do not place `text-muted` on a state background.
- Visible keyboard focus on every interactive element: 2 px `primary` ring with 2 px offset.
- Minimum text size 12 px, and only for captions and legend labels. Body text 16 px. Article text 17 px.
- Alignment: everything sits on the 4 px spacing grid from 3.5. Numbers in tables and counters are right-aligned or centered, never left-aligned in a column.
- One primary button per view. Destructive or reset actions are ghost buttons.
- Disabled is shown by opacity plus cursor, never by a new color.
- Do not add features that are not listed: no timer, no hint button, no difficulty selector, no login, no theme toggle, no language switch.

---

## Follow-ups

Use these one at a time after reviewing the canvas.

**Follow-up A - tighten the solver height**
> Check frames 03-09 and 11 again against the 1366 × 680 constraint. Measure the total height from the top bar to the last control. If it exceeds 680, reduce the space in this order: panel padding (24 → 16), legend row (move it to the right column under the counters), cell size (48 → 46). Do not shrink text below the type scale.

**Follow-up B - state consistency pass**
> Go through every frame and list each cell that is not plain given or empty, with the state you applied. Compare it with section 5.2 of my brief and fix any mismatch. Then confirm that every state uses exactly the colors and non-color cue in table 3.3, in both light and dark.

**Follow-up C - export tokens for implementation**
> Produce a single list of every design token used across all frames: name, light value, dark value, and where it is used. Use these names in kebab-case: `color-page`, `color-surface`, `color-sunken`, `color-border`, `color-grid-cell-line`, `color-grid-box-line`, `color-text`, `color-text-muted`, `color-primary`, `color-primary-strong`, `color-primary-soft`, and `color-state-<given|recorded|trying|rejected|restored|solved>-<bg|digit|cue>`, plus `space-*`, `radius-*`, `font-size-*`, `shadow-card`. If any value in the frames is not in this list, tell me where it is so I can decide.
