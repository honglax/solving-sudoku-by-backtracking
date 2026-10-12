# Kế hoạch bài tập lớn CS112 - Demo giải Sudoku bằng quay lui

Mình dựng một **website dạy và chia sẻ kiến thức về thuật toán quay lui**, lấy Sudoku làm ví dụ xuyên suốt, đưa lên mạng bằng Netlify, ai có link là mở được. Người học nhập đề Sudoku, xem thuật toán điền từng ô, thử từng số, gặp mâu thuẫn thì xóa và lùi lại; rồi so sánh các cách tổ chức dữ liệu và các chiến lược chọn ô để hiểu vì sao thuật toán nhanh hay chậm. Thuật toán chính theo đúng mô hình 1 (mô hình chung của quay lui trên slide). Mọi phần (website, testcase, video, report) viết với góc nhìn đó: một dự án dạy học, không phải lời giải một bài tập cụ thể.

Hạn nộp: **23:59 Chủ nhật 18/10/2026**. Cô ghi rõ không nhận trễ, không gia hạn. Lập ngày 3/10; cập nhật 6/10 theo yêu cầu chính thức của cô (còn 12 ngày).

---

## 1. Cô yêu cầu gì

**Ngày 6/10/2026 cô ra yêu cầu chính thức, thay toàn bộ yêu cầu Buổi 8.** Nguyên văn ở `requirements.md`. Tóm tắt:

- Demo có giao diện cho phép **nhập Input**, **theo dõi từng bước** thuật toán, **xem Output**. Bài lấy từ ví dụ trên lớp, Wecode hoặc tài liệu tham khảo. Sudoku là bài quay lui đã học, đạt điều kiện.
- Nộp **một thư mục gồm 4 thư mục con** (quá lớn thì gửi link, phải mở được ngay, không chờ xin quyền):
  1. **Source code**: toàn bộ mã nguồn.
  2. **Video demo**: chạy thử, nhập dữ liệu và giải, giới thiệu **đầy đủ chức năng** và **từng thành phần trên giao diện**, minh họa quá trình giải. Không nói cũng được, cho hiện chữ.
  3. **Bộ testcase**: đủ đa dạng, đủ lớn, đủ phức tạp.
  4. **Report**: file nguồn (LaTeX) và PDF.
- Report có các mục bắt buộc (mục 9). Mục **tường thuật quá trình thiết kế và xây dựng, kể cả dùng AI, là QUAN TRỌNG NHẤT**.
- Yêu cầu chung: bài toán - mô hình - CTDL - thuật toán - demo - testcase - thực nghiệm - đánh giá phải **thống nhất** với nhau.
- Cô nhắc phần thiết kế thuật toán trong bài thi của nhiều bạn rất yếu. Report phải trình bày phần này đúng khuôn cô dạy (`On-thi/Huong-dan-lam-bai.md`, mục "Phần thiết kế").
- Tiêu chí chấm: (1) đủ sản phẩm và đủ mục report; (2) mức độ đầu tư: demo, giao diện, độ chi tiết minh họa, **quy mô bộ testcase**, phân tích trong report; (3) **sáng tạo**: biến thể, nhiều tham số, **giải nhiều cách rồi so sánh**, chế độ minh họa.
- Bài này cộng với 2 assignment Wecode (quay lui, QHĐ) thành **điểm thực hành**.

**Còn chưa rõ:** tên file / cách nộp (zip hay link). Chốt sau khi làm xong mọi thứ (12.5).

---

## 2. Bài toán

Mô tả theo đúng cách cô bắt trình bày Input/Output (B6 2:30, B8 0:24).

**Input**
- Một ma trận 9×9. Mỗi ô là một số nguyên từ 1 đến 9 (ô đã điền sẵn), hoặc ký tự `X` (ô trống).
- Ma trận chia thành 9 khối 3×3.
- Cho nhập từ 0 đến 81 ô trống.

**Output**
- Một ma trận 9×9 hợp lệ: mỗi hàng, mỗi cột, mỗi khối 3×3 là một hoán vị của 1…9, và giữ nguyên các số đã cho.
- Mặc định xuất lời giải đầu tiên tìm được; chế độ "Tìm mọi lời giải" xuất tất cả (4.1 B).
- Phải xử lý: **đề sai ngay từ đầu** (hai số trùng nhau trong cùng hàng, cột hoặc khối, ký tự lạ, thiếu ô) và **đề không có lời giải**.

---

## 3. Thuật toán

### 3.1 Mô hình hóa lời giải
- Đánh số các ô trống theo thứ tự hàng rồi cột: ô trống thứ 1, 2, …, n. Ví dụ đề Wikipedia có n = 51.
- Ký hiệu theo đúng slide mô hình 1 của cô: **n** là số thành phần của lời giải (ở đây là số ô trống, khớp biến `n` trong `sudoku.py`), **k** là số khả năng mỗi Sᵢ có thể chọn (ở đây k = 9).
- Lời giải là S = (S₁, S₂, …, Sₙ). Sᵢ là số điền vào ô trống thứ i, Sᵢ ∈ {1, …, 9}.
- **Chấp nhận được:** số j chưa xuất hiện ở hàng, cột và khối 3×3 của ô trống thứ i.
- **Trạng thái:** lưới `grid` và 3 mảng đánh dấu `row_used`, `column_used`, `box_used`. Mỗi lần kiểm tra chỉ đọc 3 ô nhớ, không cần quét lại cả hàng hay cột.

### 3.2 Đối chiếu từng dòng `sudoku.py` với mô hình 1 của cô
Bản JS sẽ giữ đúng cấu trúc này, chỉ thêm các điểm báo sự kiện để giao diện vẽ lại (mục 5.2).

| Mô hình 1 (slide cô) | Bản cài đặt đầu tiên (`Lab01/sudoku.py`) |
|---|---|
| `try(i)` | dòng 27 `def try_step(i)` |
| `for (j = 1 → k)` | dòng 28 `for j in range(1, SIZE + 1)` |
| `if (khả năng j chấp nhận được)` | dòng 29, gọi `is_acceptable` ở dòng 13-17 |
| Xác định Sᵢ theo j | dòng 30 `S[i] = j` |
| Ghi nhận trạng thái mới | dòng 33-36: ghi vào `grid`, bật 3 cờ |
| `if (i < n) try(i+1)` | dòng 37-38 |
| `else` Xuất lời giải | dòng 39-40 `write_solution()` |
| Trả lại trạng thái cũ | dòng 41-44: xóa ô, tắt 3 cờ |

### 3.3 Độ phức tạp, viết theo cách cô dạy
Gọi T(n) là chi phí khi còn n ô trống:
- Mỗi lần gọi thử 9 giá trị, mỗi giá trị có thể gọi đệ quy một bài toán con còn n − 1 ô.
- Mỗi lần kiểm tra tốn hằng số nhờ 3 mảng đánh dấu.

```
T(n) = 9·T(n − 1) + c₂,   T(0) = c₁
Truy hồi: T(n) = 9ⁱ·T(n − i) + c₂·(9ⁱ⁻¹ + … + 9 + 1)
Dừng khi n − i = 0 ⟺ i = n
⟹ T(n) = 9ⁿ·c₁ + c₂·(9ⁿ − 1)/8 ∈ O(9ⁿ)
```

Đây là cận xấu nhất. Thực tế nhỏ hơn rất nhiều vì nhánh nào vi phạm thì bị cắt ngay. Bảng ở 3.4 cho thấy rõ điều này: đề Inkala 60 ô trống chỉ tốn khoảng 446 nghìn lần thử, trong khi 9⁶⁰ là một số có 58 chữ số. Report sẽ dùng chính bảng này.

### 3.4 Số đo thật (đã chạy hôm nay bằng logic của `sudoku.py`)
Quy ước đếm:
- "Lần thử" = số lần xét một số j cho một ô.
- "Ghi nhận" = số lần j được chấp nhận và điền vào.
- "Trả lại" = số lần xóa ô để quay lui.

Thuật toán dừng ngay ở lời giải đầu tiên (chế độ mặc định).

| Đề mẫu | Số ô trống | Lần thử | Ghi nhận | Trả lại | Python |
|---|---|---|---|---|---|
| 1. Rất dễ | 1 | 1 | 1 | 0 | ~0 s |
| 2. Dễ (đề 1 xóa thêm 4 ô) | 5 | 27 | 5 | 0 | ~0 s |
| 3. Đề vừa, 40 ô (tự tạo từ lời giải Wikipedia) | 40 | 1.909 | 227 | 187 | ~0 s |
| 4. Đề Wikipedia (`53..7....6..195...`) | 51 | 37.652 | 4.208 | 4.157 | 0,007 s |
| 5. Đề Arto Inkala ("khó nhất thế giới") | 60 | 445.778 | 49.558 | 49.498 | 0,082 s |
| 6. Lưới trống hoàn toàn | 81 | 3.195 | 391 | 310 | 0,001 s |
| 7. Đề vô nghiệm (ô 1,1 chỉ còn số 1 nhưng cột 1 đã có 1) | 72 | 9 | 0 | 0 | ~0 s |

Từ bảng này rút ra 3 điều cho thiết kế:
Thanh tốc độ tính bằng **lần thử/giây**, cùng đơn vị với bộ đếm, người xem dễ hình dung.
- **Hoạt ảnh chậm chỉ dùng cho đề 1, 2, 3.** Đề 3 có 1.909 lần thử. Ở 20 lần thử/giây là khoảng 1,5 phút, vừa đủ cho video.
- **Đề 4 phải bật tốc độ cao.** 37.652 lần thử: 20 lần/giây thì mất 31 phút, 1.000 lần/giây thì 38 giây.
- **Đề 5 chỉ dùng nút "Giải ngay".** 445.778 lần thử, ở tốc độ tối đa vẫn mất hơn 7 phút. Bấm "Giải ngay" rồi hiện bộ đếm là đủ ấn tượng.

Lưới trống (đề 6) giải nhanh hơn đề Wikipedia dù nhiều ô trống hơn. Đây là ví dụ hay để nói trong video: số ô trống không quyết định độ khó, số lần phải quay lui mới quyết định.

---

## 4. Demo làm được gì

Kể theo một lần dùng thật:

1. Mở link Netlify (ví dụ `https://sudoku-quay-lui.netlify.app`, tên thật chốt lúc deploy). Vào trang **Giải Sudoku**.
2. Chọn "Đề 3 - vừa (40 ô)" trong danh sách đề mẫu. Hoặc tự gõ vào lưới. Hoặc dán đề dạng 9 dòng (số cách nhau dấu cách, `X` là ô trống) hay chuỗi 81 ký tự (dấu chấm là ô trống), định dạng phổ biến trên các trang Sudoku. Hoặc mở một file trong bộ testcase.
3. Bấm **Kiểm tra đề**. Nếu hàng 4 có hai số 7 thì báo đúng hai ô đó và tô đỏ, không cho chạy.
4. Bấm **Từng bước**. Mỗi lần bấm, thuật toán đi một bước. Ví dụ ô (1,2), thử số 1:
   - số 1 bị loại, khung thông báo ghi "1 đã có ở cột 2";
   - thử số 2, được chấp nhận, ô chuyển xanh;
   - đi tiếp sang ô trống kế.
5. Bấm **Tự động** và kéo thanh tốc độ từ 1 đến 1.000 lần thử/giây.
6. Gặp ngõ cụt: ô đang xét thử hết 1…9 mà không số nào được. Ô đó chuyển cam, ô trước bị xóa số, thuật toán lùi về thử số kế tiếp ở ô trước.
7. Xong: lưới hoàn chỉnh, bộ đếm dừng ở "1.909 lần thử · 227 ghi nhận · 187 trả lại". Con số này phải khớp đúng bảng 3.4.
8. Với đề 5, bấm **Giải ngay**: kết quả và bộ đếm hiện sau khoảng 1 giây, trong lúc đó bộ đếm chạy liên tục (khung 17).

Bên phải lưới luôn có 3 thứ:
- **Mã giả mô hình 1 của cô**, tô sáng dòng đang chạy.
- **Bảng S = (S₁ … Sₙ)**, đánh dấu Sᵢ đang xét.
- **Bộ đếm và độ sâu i hiện tại.**

Đây là phần làm demo khác một trang giải Sudoku bình thường: người xem thấy đúng từng dòng của mô hình 1 đang chạy.

**Không làm:**
- Chế độ chính luôn là mô hình 1, xét ô theo thứ tự hàng rồi cột, vì đây là dạng người học gặp đầu tiên và khớp mã giả trên slide. Chọn ô ít khả năng trước (MRV) là cách cải tiến để so sánh (4.1 C), không thay chế độ chính.
- Không làm máy chủ, không làm đăng nhập, không lưu dữ liệu người dùng. Trang chạy được trên điện thoại nhưng ưu tiên màn hình laptop.
- Website không sinh đề ngẫu nhiên có lời giải duy nhất. Bộ testcase thì có sinh đề ngẫu nhiên (mục 7.2), không cần lời giải duy nhất.

### 4.1 Phần mở rộng (thêm 6/10, cho tiêu chí sáng tạo)

Thứ tự làm: **A → B → C → D**. Trễ lịch thì cắt từ D trở lên.

**A. So sánh 3 cách tổ chức dữ liệu cho bước "chấp nhận được"** (trang mới "So sánh")

> **Đã làm 6/10** (trang `/compare`, mục menu "So sánh"): bảng + 2 biểu đồ thanh ngang (số lần thử, thời gian) cho 6 cách = 2 thứ tự xét ô × 3 cách kiểm tra, đo trong Web Worker, mỗi cách chạy lặp tới khi đủ 300 ms rồi lấy trung bình. Code ở `src/comparison/`. Số đo trên Chrome, đề Inkala: quét lưới 9,7 ms, 3 mảng đánh dấu 3,8-4,1 ms, bitmask 3,9-4 ms; MRV 90.665 lần thử nhưng 21-86 ms.

| Cách | Dữ liệu dùng thêm | Kiểm tra số j cho một ô | Ghi nhận / trả lại |
|---|---|---|---|
| Quét lưới | không có, chỉ lưới 9×9 | đọc 27 ô (hàng, cột, khối) | ghi 1 ô |
| 3 mảng đánh dấu (chế độ chính) | `rowUsed`, `columnUsed`, `boxUsed`, mỗi mảng 9 × 10 giá trị đúng/sai | đọc 3 ô nhớ | ghi 1 ô + bật/tắt 3 cờ |
| Bitmask | `rowMask`, `columnMask`, `boxMask`, mỗi mảng 9 số nguyên, bit thứ j là số j | 3 phép AND | ghi 1 ô + 3 phép OR / AND |

- Ba cách cùng thứ tự xét ô và thử j, nên số lần thử, ghi nhận, trả lại **giống hệt nhau**. Chỉ khác chi phí mỗi lần kiểm tra và bộ nhớ. Đây là điều đáng nói trong report: cấu trúc dữ liệu không đổi cây tìm kiếm, chỉ đổi hằng số c trong T(n) = 9·T(n − 1) + c.
- Đo bằng bản đệ quy thường, không dùng generator, vì generator chậm hơn khoảng 170 lần (5.2) sẽ che mất khác biệt. Mỗi cách chạy nhiều lần, lấy trung vị. Ngoài thời gian (phụ thuộc máy) còn hiện **số lần đọc ô nhớ khi kiểm tra** (không phụ thuộc máy).
- Việc đo chạy trong Web Worker để trang không treo khi đo đề khó. Quyết định 12.12 (không Web Worker) vẫn giữ cho trình giải, vì đây là chức năng khác.
- Test: cả 3 cách cho cùng lời giải và cùng 3 con số với generator, trên mọi đề của bộ testcase.

**B. Chế độ "Tìm mọi lời giải"**, đúng nguyên văn mô hình 1 trên slide

> **Đã làm 6/10, thành trang riêng `/all-solutions` ("Mọi lời giải" trên menu)** theo lựa chọn của bạn, trang Giải Sudoku giữ nguyên. Bộ giải có tùy chọn `findsAllSolutions` (2 sự kiện mới `solutionListed`, `searchExhausted`); Chạy dừng ở mỗi lời giải, Tìm hết chạy một mạch; mã giả sáng đúng dòng "Xuất lời giải" rồi "Trả lại trạng thái cũ"; bộ sưu tập tối đa 100 lời giải, tô ô khác lời giải 1. Bản Python `checks/reference_all_solutions.py`. Phát hiện: đề mẫu "Vừa" có 4 lời giải, "Nhiều lời giải" có 18; với Inkala, đi hết cây cần 18.619.020 lần thử, gấp 42 lần tìm lời giải đầu.
- Trên slide, sau "Xuất lời giải" thuật toán vẫn chạy tiếp: trả lại trạng thái cũ, thử j kế tiếp. Vậy chế độ này không phải thuật toán mới, mà là mô hình 1 đầy đủ; dừng ở lời giải đầu tiên mới là biến thể (đủ khi chỉ cần một lời giải).
- Công tắc trên trình giải: "Dừng ở lời giải đầu tiên" (mặc định) / "Tìm mọi lời giải".
- Bộ đếm thêm "Số lời giải". Lời giải tìm được hiện trong một danh sách, bấm vào để xem.
- Dùng để kiểm tra đề có lời giải duy nhất hay không. Lưới trống có khoảng 6,67 × 10²¹ lời giải, nên danh sách chỉ giữ một số lời giải đầu, còn bộ đếm vẫn tăng, bấm "Dừng" để ngừng.
- Độ phức tạp: chế độ này luôn đi hết cây, không dừng sớm, nên đo được đúng kích thước cây tìm kiếm.
- `checks/` thêm bản Python đếm mọi lời giải để đối chiếu.

**D. Kích thước khác: 4×4, 9×9, 16×16** (k = 4, 9, 16; khối 2×2, 3×3, 4×4)
- Vẫn mô hình 1, chỉ đổi tham số k. Cho thấy T(n) = k·T(n − 1) + c, ra O(kⁿ).
- Hiện `SIZE`, `BOX_SIZE` là hằng toàn cục trong `src/solver/sudokuRules.ts`. Phải đổi thành tham số đi qua lưới, parser, validator, CSS, đề mẫu và bộ đếm. Đây là phần tốn công nhất trong 3 phần nên làm sau cùng.
- Trước khi làm, đo xem đề 16×16 nào giải được trong thời gian hợp lý với thứ tự xét ô tuần tự.

**C. Chọn ô ít khả năng nhất trước (MRV)**, đã chốt 6/10

> **Đã làm 6/10.** Bộ giải từng bước (`solveByBacktracking(puzzle, 'fewestCandidates')`) chạy được MRV, khớp bản Python `checks/reference_fewest_candidates.py` cả 12 đề. Trang So sánh mở đầu bằng **cuộc đua 2 lưới**: cùng đề, cùng tốc độ, bên trái điền lần lượt, bên phải điền ô dễ nhất trước; mỗi ô trống hiện số khả năng còn lại. Chưa đưa MRV vào trang Giải Sudoku.
- Vẫn khung mô hình 1, chỉ đổi cách chọn ô cho Sᵢ: thay vì ô trống kế tiếp theo hàng rồi cột, chọn ô trống còn ít số hợp lệ nhất. Sᵢ lúc này là "ô được chọn ở bước i", nên bảng S phải hiện thêm ô nào ứng với Sᵢ.
- Bài học cho người xem: cùng một thuật toán, thứ tự xét quyết định kích thước cây tìm kiếm. Trang So sánh đặt số lần thử của hai thứ tự cạnh nhau trên cùng đề; trình giải có thể chạy từng bước bằng MRV.
- Cận xấu nhất vẫn O(9ⁿ); cái giá là mỗi bước phải tìm ô ít khả năng nhất (quét các ô trống còn lại). Report phân tích cả phần này.
- Không có trong slide: trích nguồn (Wikipedia "Sudoku solving algorithms", bài của Peter Norvig "Solving Every Sudoku Puzzle"), ghi rõ là cải tiến.
- Đo trước bằng bản Python tham chiếu để có số thật trước khi làm giao diện.

**Thêm để nối demo với report và testcase**
- **Đề minh họa** cho chương 5 của report: tự tạo, khoảng 50-80 lần thử, có 1-2 lần quay lui. Thêm vào danh sách đề mẫu với tên chung, không nhắc tới report.
  > **Đã làm 8-9/10:** đề 13 "Ngắn, có quay lui" (16 ô trống, 79 lần thử, 3 lần quay lui, lời giải duy nhất), tìm bằng `checks/find_illustration_puzzle.py` (seed 7). Quay lui nằm gọn trong 35 lần thử đầu trên hàng 1, có một lần lùi dây chuyền qua 2 ô. Các bước xuất bằng `report/tools/exportIllustrationTrace.ts` ra `report/data/` (83 bước, 5 ảnh lưới), dùng chính bộ giải của website.
- Script xuất **toàn bộ** các bước của đề minh họa (bảng Lịch sử trên web chỉ giữ 100 bước), cùng một bộ giải với website. Report dùng bảng này cùng ảnh chụp demo ở các bước then chốt, nên hai bên khớp nhau.
- Hộp "Dán đề" thêm nút **mở file testcase**: chọn một file nhóm rồi chọn đề trong file, để mở thẳng một testcase trong demo.

---

## 5. Thiết kế kỹ thuật

### 5.1 Công nghệ và deploy
- **React + Vite + TypeScript**, một website nhiều trang (4 trang, mục 5.3), chạy hoàn toàn trên trình duyệt, không có máy chủ.
  - React: header và menu viết một lần trong `SiteHeader`, dùng cho cả 4 trang. Trang Giải Sudoku có nhiều thứ đổi cùng lúc (lưới, bảng S, bộ đếm, dòng mã giả đang chạy). Với React, màn hình được tính ra từ một chỗ giữ trạng thái, không phải tự sửa tay từng phần.
  - TypeScript: kiểu dữ liệu nằm ngay trong code, đọc là hiểu. Ví dụ `type SolverEvent = { kind: 'rejectCandidate'; cell: number; digit: number; reason: RejectReason }` tự nói sự kiện đó chứa gì, không cần comment.
  - Vite: chạy thử bằng `yarn dev`, build bằng `yarn build` ra thư mục `website/dist/`.
- **Quản lý gói: Yarn 4** (chốt 4/10), ghim trong dự án qua `website/.yarnrc.yml` (`yarnPath`), nên máy bạn và Netlify chạy cùng một phiên bản. Dùng `nodeLinker: node-modules` thay cho chế độ Plug'n'Play mặc định, để VS Code, TypeScript, oxlint và Vitest chạy không cần cấu hình thêm. Yarn 4 không cài phiên bản gói mới phát hành chưa đủ 24 giờ (`npmMinimalAgeGate`), mình giữ nguyên lớp bảo vệ này.
- **Chuyển trang bằng React Router.** Trên Netlify cần thêm file `public/_redirects` một dòng `/*  /index.html  200`. Thiếu dòng này thì bấm F5 ở `/solver` sẽ ra lỗi 404.
- **Thuật toán không biết React tồn tại.** Mọi file trong `src/solver/` là TypeScript thuần, không import React. Nhờ vậy Node chạy thẳng được các file này để đối chiếu với Python. Node 24 chạy được file `.ts` trực tiếp, với điều kiện chỉ dùng cú pháp TypeScript "xóa được" (không `enum`, không `namespace`). Đằng nào mình cũng dùng union kiểu chuỗi thay `enum`.
- **Deploy: Netlify, gói miễn phí.**
  - Cách làm: `yarn dlx netlify-cli deploy --build --prod` trong thư mục `website/`. Netlify tự chạy `yarn build` và đưa `dist/` lên.
  - Bạn phải tự đăng nhập Netlify bằng tài khoản của bạn (mình không tạo tài khoản thay được). Mỗi lần đưa bản mới lên mạng, mình hỏi bạn trước.
  - Dự phòng nếu Netlify trục trặc: Cloudflare Pages. Cũng miễn phí, cũng build được dự án Vite.
- **Font: Be Vietnam Pro** (hiển thị tiếng Việt có dấu đẹp, giấy phép mở OFL), cài qua gói `@fontsource/be-vietnam-pro`. Font được đóng gói cùng website, không phụ thuộc Google Fonts.
- **Chưa lo chạy offline.** Bản nộp là link Netlify + mã nguồn. Nếu cô cập nhật yêu cầu phải chạy được không cần mạng, thêm `vite-plugin-singlefile` lúc đó (khoảng nửa buổi).

### 5.2 Làm hoạt ảnh mà vẫn giữ thuật toán đệ quy
- Vấn đề: hàm đệ quy chạy một mạch, giao diện không kịp vẽ.
- Cách làm: viết `tryStep(i)` thành **generator** của JS (`function*`). Ở mỗi dòng của mô hình 1, hàm `yield` ra một sự kiện. Lời gọi đệ quy viết là `yield* tryStep(i + 1)`.
  - Cấu trúc vẫn y hệt mô hình 1, đối chiếu từng dòng với bảng 3.2 được.
  - Giao diện lấy từng sự kiện ra theo nhịp của thanh tốc độ.
- Cách khác bị loại: chạy hết rồi ghi lại toàn bộ sự kiện để phát lại. Đề Inkala sinh ra 941.055 sự kiện, lưu hết vào bộ nhớ là lãng phí.
- **Vẽ theo khung hình, không vẽ theo sự kiện.** Hook `useSolverPlayback` mỗi khung hình (60 lần/giây) rút một loạt sự kiện theo tốc độ đang chọn, áp vào trạng thái, rồi mới báo React vẽ lại **một lần**. Vẽ lại 81 ô và panel bên phải tốn khoảng 1-2 ms, trong khi một khung hình có khoảng 16 ms. Nếu báo React vẽ lại sau từng sự kiện thì tab treo ngay ở tốc độ cao.
- **"Giải ngay" dùng chung generator, chạy theo lát thời gian** (chốt 4/10, thay quyết định ngày 3/10). Số đo trên đề Inkala (3/10):

  | Cách chạy | Đếm được | Thời gian |
  |---|---|---|
  | Đệ quy thường, giống `sudoku.py` | 445.778 lần thử | 3,7 ms |
  | Generator với `yield*` | 941.055 sự kiện | 623 ms |

  - Generator chậm hơn khoảng 170 lần, vì mỗi sự kiện phải đi ngược qua từng tầng `yield*`, có lúc tới 60 tầng. Chậm chỉ thành vấn đề khi chạy một mạch làm treo trang.
  - Nên "Giải ngay" vẫn là vòng phát lại đó, chỉ bỏ giới hạn tốc độ: mỗi khung hình rút sự kiện trong khoảng 10 ms rồi nhường lại cho trình duyệt, khoảng 10 lần/giây vẽ lại lưới và bộ đếm. Đề Inkala mất khoảng 1 giây, trang không treo, và hiện đúng khung 17 ("Đang giải… 200.000 lần thử").
  - Lợi hơn bản đệ quy thường riêng: chỉ có **một** cài đặt thuật toán để đối chiếu với Python; "Dừng" rồi bấm "Giải ngay" để chạy tiếp là tự nhiên, vì generator giữ nguyên chỗ đang dừng; không cần Web Worker.

Các loại sự kiện (dòng mã giả đánh số 1-12 như khung thiết kế):

| Sự kiện | Dòng mô hình 1 | Giao diện làm gì |
|---|---|---|
| `acceptCandidate` | 3, tag "đúng" | ô nền vàng hổ phách, viền 3 px; "Ô (h, c) - thử số j: chấp nhận được." |
| `rejectCandidate` | 3, tag "sai" | nền đỏ, số bị gạch ngang, ô gây trùng có vòng đỏ; "… bị loại vì j đã có ở hàng / cột / khối …" |
| `recordState` | 5 | ô giữ số j màu xanh dương, Sᵢ điền vào bảng S |
| `descend` | 7 | ô trống kế tiếp thành ô đang xét |
| `solutionFound` | 9 | các ô do thuật toán điền chuyển xanh ngọc, dừng |
| `restoreState` | 10 | xóa ô, nền tím viền nét đứt, số vừa xóa còn mờ ở góc ô |
| `noSolution` | - | `try(1)` kết thúc mà không xuất được lời giải |

Bộ đếm: **Lần thử** = số sự kiện `acceptCandidate` + `rejectCandidate`; **Ghi nhận** = số `recordState`; **Trả lại** = số `restoreState`.

### 5.3 Cấu trúc thư mục
Mọi tên file, tên thư mục đều bằng tiếng Anh, kể cả tài liệu. Nội dung tài liệu và chữ trên giao diện vẫn là tiếng Việt. Sắp xếp lại ngày 4/10: test riêng trong `tests/`, hook trong `hooks/`, CSS tách khỏi thư mục component, mọi chữ giao diện trong một file JSON.
```
final-project/
  plan.md  work-log.md
  design/                        bộ bàn giao của Claude Design
  checks/
    reference_solver.py          bản Python tham chiếu (độc lập với bản TypeScript), có bộ đếm, ghi ra expected_counts.json
    expected_counts.json         12 đề + 4 thời điểm giữa chừng, làm đáp án cho test
  website/
    netlify.toml  index.html  package.json  .yarnrc.yml
    vitest.config.ts             test đơn vị: tests/unit
    playwright.config.ts         test end-to-end: tests/e2e, chạy bằng Chrome có sẵn trên máy
    src/
      main.tsx  App.tsx  sitePages.ts
      locales/vi.json            MỌI chữ hiện lên giao diện (chuẩn bị đa ngôn ngữ)
      i18n/                      đọc vi.json, điền {placeholder}, đọc <strong>/<nowrap>
      solver/                    thuật toán, TypeScript thuần, không React
      solverView/                biến trạng thái thuật toán thành thứ hiện lên màn hình (hàm thuần)
      playback/                  playbackEngine.ts: Từng bước / Tự động / Giải ngay / Xem lại
      hooks/                     mọi custom hook
      theme/                     ThemeProvider
      components/                header, footer, nút Sáng / Tối, RichText
      components/solver/         lưới, các panel, nút điều khiển, hộp dán đề, bảng lịch sử
      pages/  layout/
      styles/                    tokens.css, base.css, và CSS của từng phần theo cây giống trên:
                                 styles/components/..., styles/components/solver/..., styles/pages/...
    tests/
      unit/solver/  unit/solverView/  unit/i18n/      Vitest
      e2e/                       Playwright: trạng thái thiết kế, phát lại, lịch sử, bố cục, toàn trang
      e2e/support/               hàm dùng chung (bấm tới lần thử n, đo bố cục)
  testcases/                     bộ testcase nộp (mục 7.2)
  report/                        LaTeX: main.tex, preamble.tex, các chương, hình (mục 9)
  video/
```

Thư mục nộp (tên chốt sau, 12.5):
```
1. Source code/    website/ (bỏ node_modules, dist, test-results), checks/, README cách chạy
2. Video demo/     video đã nén
3. Testcase/       nội dung testcases/
4. Report/         file .tex, hình, và PDF
```
`plan.md`, `work-log.md`, `requirements.md` và `design/` là ghi chú làm việc. Chưa quyết có đưa `design/` vào Source code không.
Trang **Thuật toán** dùng lại nội dung mục 3 của file này. Người xem web không cần đọc report cũng hiểu bài.

### 5.4 Quy ước code
- **Mọi thứ trong code bằng tiếng Anh**: tên file code, tên biến, hàm, component, sự kiện, CSS class. Chỉ chữ hiện lên màn hình cho người xem mới là tiếng Việt.
- **Code tự giải thích, không comment.** Đọc tên là hiểu: `isAcceptable(row, column, digit)` chứ không phải `check(r, c, d)`; `rowUsed[row][digit]` chứ không phải `ru[r][d]`.
- **Tường minh, không viết tắt, không số ma**: `SIZE = 9`, `BOX_SIZE = 3`, `EMPTY_MARK = 'X'`. Hằng suy ra được thì viết thành biểu thức: `SIZE = BOX_SIZE * BOX_SIZE`.
- Không dùng mẹo rút gọn khó đọc (toán tử ba ngôi lồng nhau, chuỗi `&&` thay `if`). Hàm ngắn, mỗi hàm làm một việc.
- Mảng đánh số từ 1 để `S[1..n]` khớp ký hiệu S₁…Sₙ.
- Tên hàm khớp mô hình 1: `tryStep`, `isAcceptable`, `writeSolution`.
- File component đặt tên PascalCase trùng tên component (`SudokuGrid.tsx`). File còn lại camelCase (`puzzleParser.ts`). Script Python theo kiểu Python (`reference_solver.py`).
- TypeScript bật `strict`. Không dùng `any`, không dùng `enum`.

---

## 6. Giao diện

### 6.1 Thiết kế bằng Claude Design trước, code sau
Mình không code giao diện từ con số 0. Làm theo 3 bước:
1. **Vẽ bản thiết kế trên Claude Design** (loại Artifact "Design" trên claude.ai, tài khoản bạn có sẵn). Vẽ 4 màn hình: Trang chủ, Giải Sudoku (máy tính), Giải Sudoku (điện thoại), Thuật toán.
   - Mỗi màn hình có đủ các trạng thái của lưới: số đề, đang thử, bị loại, đã ghi nhận, quay lui, đã giải, báo lỗi.
2. **Bạn xem và chỉnh trên canvas** đến khi ưng. Không ưng chỗ nào thì sửa ở bản thiết kế, đừng để tới lúc code mới sửa (sửa trên canvas nhanh hơn nhiều).
3. **Chuyển sang component React**: mỗi khối trên bản thiết kế thành một component ở 5.3. Màu, cỡ chữ, khoảng cách, bo góc đặt thành biến CSS trong `src/styles/`. Code bám theo bản thiết kế, không tự chế thêm.

Lưu ảnh chụp các màn hình đã chốt vào `design/`. Report sẽ dùng các ảnh này để kể "thiết kế giao diện bằng AI như thế nào".

Prompt gửi Claude Design nằm ở `design/claude-design-prompt.md`. Trong đó có bảng màu đã đo độ tương phản theo WCAG AA, và trạng thái thật của lưới lấy từ lần chạy đề 3 (lần thử 803, 814 và lúc giải xong). Bản thiết kế vì vậy khớp với những gì thuật toán thật sự làm.

### 6.2 Yêu cầu cho bản thiết kế
- Gọn, hiện đại, nền sáng. Có chế độ tối theo cài đặt của máy.
- Không dùng hình minh họa trang trí. Phần nổi bật nhất trên trang phải là lưới 9×9.
- Màu trạng thái phải phân biệt được cả với người khó phân biệt đỏ/xanh lá. Ngoài màu, mỗi trạng thái còn có thêm dấu hiệu khác: viền đậm cho ô đang thử, gạch chéo cho số bị loại.
- Đường kẻ khối 3×3 đậm hơn đường kẻ ô, nhìn là thấy ngay 9 khối.
- Toàn bộ chữ tiếng Việt. Cô đọc và chấm bằng tiếng Việt.
- Laptop 1366×768 phải thấy đủ lưới và panel mà không cuộn, để quay video gọn.

### 6.3 Bố cục trang Giải Sudoku (bản phác để đưa vào Claude Design)
```
+-------------------------------------------------------------------------+
| Sudoku · Quay lui        Trang chủ   Giải Sudoku   Thuật toán   Giới thiệu|
+------------------------------+------------------------------------------+
|                              |  Mã giả mô hình 1 (dòng đang chạy tô sáng)|
|        Lưới 9×9              |  try(i) {                                |
|                              |    for (j = 1 → 9)                       |
|                              |      if (j chấp nhận được) { …           |
|                              |------------------------------------------|
|                              |  S = (S₁ … Sₙ)   i hiện tại = 17 / 40    |
|                              |  [3][7][1][ ][ ] …                       |
|                              |------------------------------------------|
|                              |  Lần thử 812 · Ghi nhận 96 · Trả lại 70  |
|                              |  "5 đã có ở khối 3 (hàng 1-3, cột 7-9)"  |
+------------------------------+------------------------------------------+
| [Đề mẫu ▾] [Dán đề] [Kiểm tra đề] [Từng bước] [Tự động] [Tạm dừng]      |
| [Giải ngay] [Đặt lại]          Tốc độ: 1 ━━━━━●━━━━ 1.000 lần thử/giây  |
+-------------------------------------------------------------------------+
```

## 7. Kiểm thử

### 7.1 Kiểm thử trong lúc làm

**Đối chiếu tự động (`checks/`)**
- Bản Python tham chiếu và bản TypeScript cùng thứ tự xét ô, cùng thứ tự thử j. Nên với cùng một đề, hai bản phải cho **đúng cùng lời giải và đúng cùng 3 con số**.
- Ngoài 7 đề còn so 3 thời điểm giữa chừng mà bản thiết kế vẽ lại, chụp đúng lúc xét lần thử: đề 3 lần thử 804 (khung 05 và 18) và 814 (khung 04), đề 5 lần thử 200.000 (khung 17). So lưới, bảng S, i, bộ đếm, số đang thử và lý do bị loại.
- Chỉ cần lệch 1 lần thử ở bất kỳ đề nào trong 7 đề là có lỗi.
- Lệnh chạy: `python3 checks/reference_solver.py` (một lần, ra `expected_counts.json`), rồi `yarn test` trong `website/` (Vitest).
- `yarn build` phải qua kiểm tra kiểu của TypeScript, không lỗi, không cảnh báo.

**Kiểm tra lời giải:** một hàm riêng kiểm tra 27 nhóm (9 hàng, 9 cột, 9 khối) đều là hoán vị 1…9, và các số đề cho không bị đổi.

**Test tự động trong `website/`:**
- `yarn test`: 69 test đơn vị (Vitest) - thuật toán khớp Python, hiển thị đúng từng khung thiết kế, lịch sử, i18n.
- `yarn test:e2e`: 31 test end-to-end (Playwright, Chrome có sẵn) - mọi trạng thái thiết kế trên trình duyệt thật, Tự động / Giải ngay / Dừng, lịch sử, bố cục ở 6 cỡ màn hình máy tính và điện thoại, header không nhảy, nhớ giao diện Sáng / Tối, đường dẫn đề chống quay lui. Khoảng 15 giây.
- Chạy cả hai trước mỗi lần deploy.

**Kiểm tra sau khi deploy:**
- Mở trang Giải Sudoku trên một máy Windows (thanh cuộn thật chiếm chỗ, khác Mac): panel phải vẫn nằm cạnh lưới, không có thanh cuộn ngang.
- Mở link Netlify trên Chrome, Safari, và một điện thoại thật.
- Chạy lại đề 3 và đề 5, so bộ đếm với bảng 3.4.
- Chuyển qua lại giữa 4 trang, rồi bấm F5 ở từng trang: không có trang lỗi 404.

**Tình huống phải thử bằng tay:**

| Tình huống | Kết quả đúng |
|---|---|
| Đề 1 (1 ô trống) | ô (4,8) = 1, khớp `sudoku-example.png` |
| Đề dán dạng 9 dòng và dạng chuỗi 81 ký tự | đọc đúng, giải đúng |
| Hai số 7 ở hàng 4 | báo trùng, tô đỏ 2 ô, không cho chạy |
| Gõ chữ `a` hoặc số `0` vào ô | không nhận, giữ ô trống |
| Đề 7 vô nghiệm | dừng sau 9 lần thử, báo "Đề không có lời giải" |
| 0 ô trống (lưới đã đầy và hợp lệ) | báo đã hoàn chỉnh, không chạy |
| Bấm Tạm dừng rồi Từng bước | đi tiếp đúng 1 bước, bộ đếm tăng đúng |
| Đang Tự động mà bấm Đặt lại | dừng hẳn, lưới về trạng thái đề ban đầu |
| Đề 5 bấm Giải ngay | ra kết quả, bộ đếm 445.778 / 49.558 / 49.498 |

### 7.2 Bộ testcase nộp (thư mục 3, làm ngày 6/10)

Chi tiết đầy đủ ở `testcases/README.md`. Tóm tắt:

- **294 đề, 6 nhóm, mỗi nhóm một file `.txt`** (`01-small.txt` … `06-invalid.txt`), cộng `manifest.csv`. Ban đầu mỗi đề 2 file `.in` / `.out` (588 file); bạn thấy quá nhiều nên gom lại theo nhóm (12.31).
- Mỗi đề là một khối `=== mã · mô tả` / `--- input` / `--- expected`. Phần input giữ nguyên từng ký tự (dòng trống, tab, CRLF), dùng đúng định dạng hộp "Dán đề".

| Nhóm | Nội dung | Số đề |
|---|---|---|
| Nhỏ | 1-5 ô trống | 40 |
| Thông thường | 20-50 ô trống, lời giải duy nhất (riêng đề mẫu "Vừa" có 4 lời giải) | 150 |
| Lớn / khó | 51-56 ô trống lời giải duy nhất; 58-70 ô trống nhiều lời giải; Wikipedia, Inkala, AI Escargot, Easter Monster, đề 17 số (Royle), đề chống quay lui | 45 |
| Biên | 0 / 80 / 81 ô trống, 1 ô ở đầu / cuối, trống trọn hàng / cột / khối / đường chéo / 3 hàng, ô duy nhất có đáp án 1 hoặc 9 | 13 |
| Đặc biệt | nhiều lời giải, đúng 2 lời giải, vô nghiệm ngay / phải tìm mới biết, 3 định dạng đề, dòng trống, CRLF, tab | 21 |
| Không hợp lệ | trùng hàng / cột / khối, ký tự lạ, thiếu / thừa dòng / ô, chuỗi sai độ dài, file rỗng | 25 |
| Kích thước khác (nếu làm D) | 4×4, 16×16 | chưa làm |

- **Sinh đề** (`testcases/tools/generate_testcases.py`, seed cố định): lưới đầy sinh bằng quay lui với thứ tự số xáo trộn. Bản đầu dùng một lưới mẫu rồi hoán vị hàng / cột / đổi tên số; cách đó thực chất chỉ ra một họ lưới, và không bao giờ có hình chữ nhật đổi chỗ được, nên đã bỏ. Đề sinh ngẫu nhiên cần hơn 1 triệu lần thử thì bỏ, sinh đề khác.
- **Đáp án từ 2 chương trình Python độc lập với website:** bản tham chiếu mô hình 1 (lời giải đầu, 3 bộ đếm, số lần bị loại theo hàng / cột / khối) và một bộ đếm lời giải dùng MRV + bitmask. Hai bên không khớp thì script dừng.
- **Chạy** (`yarn testcases` trong `website/`): gọi đúng `website/src/solver`, so kết quả, bộ đếm và độ phủ 20 nhánh xử lý; ghi `testcases/results/results.csv`. `yarn test` cũng chạy cả bộ (trừ 2 đề chậm). Mỗi đề có giới hạn số lần thử bằng đáp án, nên bộ giải bị lỗi không chạy mãi.
- **Đã kiểm tra chính bộ test** bằng cách cố tình làm sai bộ giải (xem README). Lần đầu, lỗi "kiểm tra cột trước hàng" lọt qua vì đáp án chưa ghi lý do bị loại, và lỗi "bỏ qua khối" làm bộ giải chạy mãi trên đề trùng khối; đã thêm 3 cột số lần bị loại và giới hạn số lần thử.
- Còn làm: chạy 3 cách tổ chức dữ liệu (A) và 2 thứ tự xét ô (C) trên cả bộ, ra bảng so sánh cho mục Đánh giá của report.

---

## 8. Video (khoảng 7-8 phút)

Cô yêu cầu video có: chạy thử hệ thống, nhập dữ liệu và giải, giới thiệu **đầy đủ chức năng**, giới thiệu **từng thành phần hiển thị trên giao diện**, minh họa quá trình giải. Không nói cũng được, cho hiện chữ.

| Đoạn | Nội dung |
|---|---|
| 1 | Mở link Netlify, đi qua Trang chủ, Thuật toán, Giới thiệu |
| 2 | Trình giải: giới thiệu từng thành phần: lưới và chú thích màu (rê chuột lên ô), mã giả, bảng S, tab Lịch sử, bộ đếm, câu thông báo, thanh tốc độ, nút Sáng / Tối |
| 3 | Nhập dữ liệu 4 cách: chọn đề mẫu, gõ vào lưới, dán đề, mở một đề từ file testcase; Kiểm tra đề |
| 4 | Đề minh họa chạy **Từng bước** và **Lùi một bước**: bị loại kèm lý do, ghi nhận, quay lui; khớp bảng trong report |
| 5 | Đề 3 chạy **Tự động**, dừng ở lần quay lui đầu, "Tới lần quay lui kế"; xem lại bằng bảng Lịch sử |
| 6 | Đề Inkala bấm **Giải ngay**: 445.778 lần thử, so với cận 9⁶⁰ |
| 7 | Đề sai, đề vô nghiệm, đề đã đầy: demo báo đúng |
| 8 | Phần mở rộng: Tìm mọi lời giải (đề nhiều lời giải); trang So sánh (3 cách tổ chức dữ liệu, thứ tự tuần tự và MRV); 4×4 / 16×16 nếu có |
| 9 | Giao diện điện thoại |
| 10 | Chạy script bộ testcase trong terminal, ra bảng đạt / không đạt |

- Quay bằng QuickTime. Tự nói tiếng Việt, hoặc chèn chữ nếu không muốn nói (12.3).
- Trước khi quay, dò lại danh sách thành phần giao diện để không sót.
- Nén bằng `ffmpeg`. Dung lượng lớn thì gửi link (cô cho phép).

---

## 9. Report

Viết bằng LaTeX trong `report/`, dùng lại `HW02/preamble.tex`, xuất PDF. Giữ đúng quy tắc các bài HW: **không comment trong file `.tex`**, compile không cảnh báo, gạch ngang dùng `-`. Report là bài nộp nên được ghi tên môn, MSSV (khác website).

Chương mục bám đúng danh sách mục cô yêu cầu:

- **Trang bìa:** tên môn, "Bài tập lớn", họ tên, MSSV, lớp, giảng viên, ngày nộp.
- **Mục lục.**
- **Ch.1 Giới thiệu bài toán**
  - Mục tiêu: một website giúp người học hiểu quay lui bằng cách nhìn thấy nó chạy, rồi tự so sánh các cách làm.
  - Lý do thật (cô yêu cầu viết thật): bạn phân vân giữa Dijkstra và Sudoku; Claude khuyên bỏ Dijkstra vì trên lớp chưa học; Claude khuyên Sudoku vì bài giải bằng quay lui và có đủ thử, loại, quay lui để nhìn thấy trên hình.
  - Nguồn gốc của Sudoku và ứng dụng (bài toán thỏa mãn ràng buộc, xếp lịch, tô màu đồ thị). Mỗi thông tin đều có trích nguồn.
- **Ch.2 Mô tả bài toán:** viết theo kiểu cô ra đề (mô tả, Input, Output, ví dụ), cho bài Sudoku tổng quát: số ô trống bất kỳ, có thể sai đề, vô nghiệm hoặc nhiều lời giải.
- **Ch.3 Mô hình bài toán:** Input / Output theo khuôn cô dạy (tên biến, kiểu, miền giá trị, vai trò); điều kiện ràng buộc; ví dụ Input / Output (đề có lời giải, nhiều lời giải, vô nghiệm, đề sai).
- **Ch.4 Thiết kế cấu trúc dữ liệu và thuật toán:** cô nói nhiều bạn làm yếu phần này, nên trình bày kỹ nhất theo khuôn trong `On-thi/Huong-dan-lam-bai.md`.
  - Phân tích đặc trưng → chọn quay lui (lời giải gồm nhiều bước, mỗi bước nhiều lựa chọn); mô hình hóa S = (S₁, …, Sₙ), n, k, điều kiện chấp nhận được, trạng thái.
  - Cấu trúc dữ liệu và vai trò từng biến: `grid`, danh sách ô trống, `S[1..n]`, 3 mảng đánh dấu.
  - Mã giả mô hình 1 cho Sudoku, đánh số bước; bảng đối chiếu slide ↔ code (3.2).
  - Độ phức tạp bằng truy hồi đủ 4 bước, ra dạng đóng (3.3); bảng số đo (3.4) để thấy tác dụng của việc cắt nhánh.
  - Các biến thể A, B, C, D (4.1) và độ phức tạp của từng biến thể.
  - Cấu trúc dữ liệu của phần minh họa: dòng sự kiện từ generator, vẽ theo khung hình, lịch sử 100 bước xem lại bằng hoàn tác.
- **Ch.5 Ví dụ minh họa:** đề minh họa (4.1). Bảng từng bước: lần thử, ô, số j, chấp nhận / bị loại và lý do, thao tác (ghi nhận / trả lại), S sau bước; ảnh chụp demo ở các bước then chốt; kết quả cuối.
- **Ch.6 Tường thuật quá trình thiết kế và xây dựng: QUAN TRỌNG NHẤT, viết trước tiên.**
  - Theo dòng thời gian `work-log.md`. Mỗi giai đoạn ghi đủ: công cụ / model / thư viện; công đoạn dùng AI; **prompt nguyên văn**; kết quả nhận được; vấn đề gặp phải và cách giải quyết; mình kiểm chứng và chỉnh sửa thế nào (test đối chiếu Python, cố tình làm sai thuật toán để thử bộ test, so ảnh với bản thiết kế, đo bố cục, góp ý người dùng thử).
  - Prompt nguyên văn lấy từ transcript của Claude Code trên máy, không viết lại theo trí nhớ.
  - Tách rõ phần mình tự làm / tự quyết và phần AI làm.
- **Ch.7 Thiết kế thực nghiệm:** nội dung mục 7.2.
- **Ch.8 Đánh giá:** kết quả bộ testcase theo nhóm; thời gian; so sánh cấu trúc dữ liệu và thứ tự xét ô; test tự động (đơn vị + end-to-end); giao diện (độ tương phản WCAG, góp ý người dùng thử); hạn chế (generator chậm, đề chống quay lui mất khoảng 15 phút); hướng phát triển.
- **Tài liệu tham khảo:** slide CS112_0708, phần Backtracking của Levitin (TLTK[1]), Wikipedia "Sudoku solving algorithms", Peter Norvig "Solving Every Sudoku Puzzle", SudokuWiki, Sudoku Snake, nguồn các đề nổi tiếng, các thư viện đã dùng.
- **Phụ lục:** link website, cách chạy mã nguồn, cấu trúc thư mục nộp.

`work-log.md` vẫn ghi ngay sau mỗi buổi làm. Đây là nguồn chính của Ch.6.

---

## 10. Lịch

Lịch cũ (3/10) đã xong tới phần website. Lịch mới từ 6/10, ngày thường 1-2 tiếng buổi tối, cuối tuần nhiều hơn.

| Ngày | Việc | Xong khi |
|---|---|---|
| T3 6/10 | Cập nhật plan theo yêu cầu mới; commit đầu tiên (khi bạn đồng ý) | Plan khớp `requirements.md` |
| T4 7/10 - T5 8/10 | Bộ testcase (7.2): sinh đề, đáp án Python, script chạy, test Vitest; đề minh họa | Cả bộ chạy đạt, mọi nhánh đều có đề chạm tới |
| T6 9/10 - T7 10/10 | Phần mở rộng A (trang So sánh), B (Tìm mọi lời giải), C (MRV); nút mở file testcase | Test khớp 3 cách; khớp bản Python đếm lời giải và bản Python MRV |
| CN 11/10 | **Deploy bản thử lên Netlify**; đo trước D | Link chạy được trên laptop và điện thoại |
| T2 12/10 - T3 13/10 | Phần mở rộng D (4×4, 16×16), cắt nếu trễ; chạy bảng kiểm tra mục 7, sửa lỗi | Mọi tình huống đúng trên bản đã deploy |
| T4 14/10 - T5 15/10 | Report: Ch.6 trước, rồi Ch.1-5, Ch.7-8 | PDF compile không cảnh báo |
| T6 16/10 | Quay video, chụp ảnh cho report | Video đủ 10 đoạn ở mục 8 |
| T7 17/10 | Hoàn thiện report; đóng gói 4 thư mục; quyết cách nộp (12.5); **nộp** | Nộp xong, sớm hơn hạn 1 ngày |
| CN 18/10 | Dự phòng | - |

## 11. Rủi ro

| Có thể xảy ra | Cách xử lý |
|---|---|
| Cô cập nhật yêu cầu khác hẳn (ví dụ bắt buộc ngôn ngữ, mẫu report) | Thuật toán và giao diện tách riêng (5.3), đổi phần nào sửa phần đó. Có 2 mốc kiểm tra e-learning. |
| Hoạt ảnh đề khó chạy hàng giờ, video lê thê | Chỉ quay hoạt ảnh đề 2 và 3; đề 5 dùng "Giải ngay" (đã đo ở 3.4). |
| Bản TypeScript ra số khác bản Python | Test Vitest bắt lỗi trước khi làm giao diện; chưa khớp 7/7 thì chưa sang bước giao diện. |
| Hoạt ảnh tốc độ cao làm treo tab | Vẽ theo khung hình, không theo sự kiện (5.2). Thử ở 1.000 lần thử/giây trên đề 4 trước khi quay video. |
| Video vượt giới hạn upload | Nén bằng ffmpeg; nếu vẫn quá thì hỏi trên group lớp có được nộp link Drive không. |
| Cô coi giao diện đẹp mà thuật toán "của AI" | Report ghi đúng ai làm gì, kèm bảng đối chiếu từng dòng 3.2 với mã giả slide. |
| Netlify lỗi hoặc đổi chính sách gói miễn phí sát hạn | Deploy thử sớm từ 11/10. Dự phòng Cloudflare Pages. |
| Cô yêu cầu chạy được không cần mạng | Thêm `vite-plugin-singlefile` để build ra 1 file `index.html` (5.1). |
| Bản thiết kế đẹp nhưng code lại không giống | Chép thông số trực tiếp từ bản thiết kế; so ảnh chụp bản thiết kế với trang thật trước khi quay video. |
| Phần mở rộng ăn hết thời gian viết report | Report là phần nặng điểm nhất. Trễ lịch thì cắt D, rồi cắt giao diện của A (giữ bảng số đo trong report). Ch.6 viết từ 14/10 dù code chưa xong hẳn. |
| Link nộp không mở được với cô | Kiểm tra bằng cửa sổ ẩn danh, chưa đăng nhập, trước khi nộp. |
| Video thiếu thành phần cô yêu cầu | Dò theo bảng mục 8 trước khi quay. |
| Không kịp | Thứ tự ưu tiên: thuật toán đúng → lưới + Từng bước → mã giả + bảng S → deploy → trang Thuật toán → các trang còn lại → hiệu ứng. Cắt từ cuối danh sách lên. |

---

## 12. Các quyết định

| # | Nội dung | Trạng thái |
|---|---|---|
| 12.1 | Cho nhập từ 0 đến 81 ô trống | **Đã chốt** (3/10) |
| 12.2 | Report viết bằng LaTeX, dùng lại preamble HW02 | **Đã chốt** (3/10, xác nhận lại 6/10) |
| 12.3 | Video tự nói tiếng Việt | **Đã chốt** (3/10) |
| 12.4 | Dùng `git` trong `final-project/`, mình chỉ commit khi bạn đồng ý | **Đã chốt** (3/10) |
| 12.5 | Cách nộp (zip hay link) và tên file nộp | Chốt sau khi hoàn tất mọi thứ (6/10). Yêu cầu của cô không quy định tên |
| 12.6 | Website hoàn chỉnh nhiều trang, deploy Netlify | **Đã chốt** (3/10) |
| 12.7 | Giao diện thiết kế bằng Claude Design trước khi code | **Đã chốt** (3/10) |
| 12.8 | Có hiện **họ tên** trên website công khai không | **Đã chốt** (4/10): có, ở trang Giới thiệu (dòng "Tác giả"), không ghi MSSV. Thẻ "Mã nguồn" ẩn cho tới khi bạn quyết có công khai code không |
| 12.9 | Tên miền con trên Netlify | Bạn quyết lúc deploy. Đề xuất: `sudoku-quay-lui.netlify.app` (nếu còn trống) |
| 12.10 | React + Vite + TypeScript; mọi tên trong code (kể cả tên file) bằng tiếng Anh | **Đã chốt** (3/10) |
| 12.11 | Chưa làm bản chạy offline | **Đã chốt** (3/10) |
| 12.12 | "Giải ngay" dùng chung generator, chạy theo lát thời gian; không có bản đệ quy riêng, không Web Worker | **Đã chốt** (4/10), thay ý cũ ngày 3/10 |
| 12.13 | Câu bị loại vì khối: "Ô (4, 7) - thử số 5: bị loại vì 5 đã có ở khối (hàng 4-6, cột 7-9)." | **Đã chốt** (4/10) |
| 12.14 | Câu chấp nhận: "Ô (h, c) - thử số j: chấp nhận được." | **Đã chốt** (4/10) |
| 12.15 | Quay lui sau số 9: "Quay lui: trả lại ô (h, c), xóa số 9. Ô này đã thử hết 1 → 9, lùi về ô trống trước." | **Đã chốt** (4/10) |
| 12.16 | Đề mặc định: Đề 3. "Giải ngay" không giới hạn số lần thử, chỉ dừng khi bấm "Dừng". Trang Giới thiệu ẩn link video/report cho tới khi có | **Đã chốt** (4/10) |
| 12.17 | Dùng Yarn 4 (ghim trong dự án, `nodeLinker: node-modules`) thay npm | **Đã chốt** (4/10) |
| 12.18 | Website viết cho người muốn hiểu thuật toán, không phải bài nộp: không chữ "Lab", "Wecode", "CS112", tên môn trên giao diện. Đề 1 "Rất dễ", Đề 2 "Dễ"; trên lưới "Thử từng số, sai thì lùi lại"; panel "Mã giả quay lui", chú thích "Với Sudoku: …"; footer "Minh họa thuật toán quay lui · 2026". Mã giả vẫn chép đúng slide. Thông tin môn học, MSSV để trong report | **Đã chốt** (4/10) |
| 12.19 | 4 câu thông báo thiết kế chưa có: dòng thiếu ô "Dòng {d} có {n} ô, cần đúng 9 ô."; ký tự sai trong chuỗi 81 "Ký tự thứ {n} không hợp lệ: "{k}". Chỉ dùng số 1 → 9 và dấu chấm."; trùng ở cột và trùng ở khối (theo mẫu câu trùng ở hàng) | **Đã chốt** (4/10) |
| 12.20 | Bảng "Lịch sử" trong panel S (tab "Lời giải S" / "Lịch sử"), cuộn được, giữ 100 bước gần nhất; bấm một dòng để xem lại trạng thái lúc đó. Gọi là "Xem lại", không dùng chữ "quay lui" để khỏi nhầm với bước của thuật toán. Lý do chọn 100: đo trên đề 3, 4, 5, một nhánh sai dài trung vị 21-31 bước; 100 bước thấy trọn khoảng 80% nhánh sai, 15 bước chỉ khoảng 30% | **Đã chốt** (4/10), làm ở bước 8 |
| 12.21 | Thêm 4 đề mẫu (tổng 11 đề trong danh sách): "Nhiều lời giải", "Vô nghiệm, phải tìm mới biết", "AI Escargot", "Easter Monster"; đổi Đề 7 thành "Vô nghiệm ngay ô đầu". AI Escargot và Easter Monster đã đối chiếu với SudokuWiki và Sudoku Snake | **Đã chốt** (4/10) |
| 12.22 | Đề "Chống quay lui" (622.577.597 lần thử) không nằm trong danh sách, mà thành một mục riêng trên trang Thuật toán giải thích vì sao quay lui chậm, kèm nút mở đề trong trình giải (`/solver?puzzle=…`). Giải ngay đề này mất khoảng 15 phút trên laptop | **Đã chốt** (4/10) |
| 12.23 | Trang Giải Sudoku co giãn theo chiều cao màn hình: ô lưới từ 44 px (đúng thiết kế ở 1366 × 680) tới 96 px; mã giả và ô S lớn theo; panel phải cao bằng lưới | **Đã chốt** (4/10) |
| 12.24 | Mọi trang dùng chung một độ rộng: 1200 px tới màn hình 1440 px (đúng các khung thiết kế), rộng dần tới 1600 px trên màn hình lớn. Header không còn nhảy khi chuyển trang | **Đã chốt** (4/10) |
| 12.25 | Yêu cầu chính thức ngày 6/10 thay yêu cầu Buổi 8 (nguyên văn trong `requirements.md`) | **Đã chốt** (6/10) |
| 12.26 | Phần mở rộng: A (so sánh 3 cách tổ chức dữ liệu) và B (Tìm mọi lời giải) làm trước, D (4×4, 16×16) sau | **Đã chốt** (6/10) |
| 12.27 | Bộ testcase khoảng 300 đề, 7 nhóm, đáp án từ bản Python tham chiếu, có seed cố định (7.2) | **Đã chốt** hướng làm (6/10); số lượng từng nhóm chỉnh khi làm |
| 12.28 | Thêm MRV (C) làm cách giải để so sánh, làm sau A, B | **Đã chốt** (6/10) |
| 12.29 | Đề minh họa cho Ch.5 tự tạo (50-80 lần thử, có quay lui), thêm vào danh sách đề mẫu; script xuất toàn bộ các bước | **Đã chốt** (6/10) |
| 12.30 | Mọi phần (plan, testcase, report, video) viết như dự án website dạy học về quay lui, không xoay quanh bài tập cũ. Report không nhắc Lab01/Wecode. `checks/lab01_counts.py` đổi tên thành `checks/reference_solver.py` | **Đã chốt** (6/10) |
| 12.31 | Bộ testcase gom mỗi nhóm một file `.txt` (6 file + `manifest.csv`) thay vì 2 file mỗi đề | **Đã chốt** (6/10) |
