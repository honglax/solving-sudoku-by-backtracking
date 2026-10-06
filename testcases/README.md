# Bộ testcase - Sudoku bằng quay lui

294 đề, chia 6 nhóm, dùng để kiểm thử bộ giải của website: đọc đề, kiểm tra đề, giải bằng quay lui, và đếm từng bước.

## Cấu trúc

```
testcases/
  manifest.csv         mỗi đề một dòng: nhóm, định dạng, số ô trống, kết quả mong đợi, số lời giải, các bộ đếm
  01-small.txt         40 đề
  02-normal.txt        150 đề
  03-large.txt         45 đề
  04-boundary.txt      13 đề
  05-special.txt       21 đề
  06-invalid.txt       25 đề
  tools/
    generate_testcases.py   sinh toàn bộ đề và đáp án
    testcaseRunner.ts       chạy một đề bằng bộ giải của website rồi so với đáp án
    runTestcases.ts         chạy cả bộ, in bảng tổng hợp
  results/results.csv  kết quả lần chạy gần nhất
```

## Định dạng

**Mỗi nhóm là một file `.txt`.** Mỗi đề trong file là một khối:

```
=== small-001 · Đề mẫu "Dễ nhất": 1 ô trống
--- input
5 8 1 6 7 2 4 3 9
...
--- expected
5 8 1 6 7 2 4 3 9
...
```

**Phần `input`** giữ nguyên từng ký tự của đề, kể cả dòng trống, tab, xuống dòng kiểu Windows. Phần này dùng đúng các định dạng mà hộp "Dán đề" trên website nhận:

- 9 dòng, các số cách nhau dấu cách, `X` là ô trống (phần lớn các đề);
- 9 dòng viết liền, không dấu cách;
- một chuỗi 81 ký tự, dấu chấm là ô trống.

**Phần `expected`** là một trong ba dạng:

- lời giải: 9 dòng, các số cách nhau dấu cách;
- `NO SOLUTION`: đề không có lời giải;
- `INVALID` và các dòng lý do bên dưới, ví dụ `duplicate 7 in row 4`, `line 3: wrong cell count: 8`, `position 5: invalid character "0"`.

**`manifest.csv`** ghi thêm cho mỗi đề:

- `solutionCount`: số lời giải, đếm tới 1000 (`1000+` là từ 1000 trở lên);
- `tryCount`, `recordCount`, `restoreCount`: số lần thử, ghi nhận, trả lại khi giải theo mô hình 1 (xét ô theo hàng rồi cột, thử số từ 1 đến 9, dừng ở lời giải đầu tiên);
- `rowRejectCount`, `columnRejectCount`, `boxRejectCount`: số lần một số bị loại vì đã có ở hàng / cột / khối;
- `isSlow`: đề cần hơn 10 triệu lần thử.

## Các nhóm

| Nhóm | Nội dung | Số đề |
|---|---|---|
| Nhỏ | 1-5 ô trống, người học tự kiểm bằng tay được; gồm đề mẫu "Dễ nhất", "Dễ" | 40 |
| Thông thường | 149 đề sinh ngẫu nhiên 20-50 ô trống, mỗi đề có **đúng một lời giải**; cộng đề mẫu "Vừa" (40 ô trống, 4 lời giải) | 150 |
| Lớn / khó | 51-56 ô trống có lời giải duy nhất; 58-70 ô trống nhiều lời giải; các đề nổi tiếng: Wikipedia, Arto Inkala, AI Escargot, Easter Monster, đề 17 số của Gordon Royle, đề chống quay lui | 45 |
| Biên | 0 ô trống, 81 ô trống, 80 ô trống, 1 ô trống ở ô đầu / ô cuối, trống trọn một hàng / cột / khối / đường chéo / 3 hàng, ô trống duy nhất có đáp án 1 hoặc 9 | 13 |
| Đặc biệt | nhiều lời giải, đúng 2 lời giải, vô nghiệm ngay ô đầu, vô nghiệm phải tìm mới biết; cùng một đề viết theo 3 định dạng; dòng trống xen giữa, xuống dòng kiểu Windows, nhiều dấu cách và tab | 21 |
| Không hợp lệ | trùng ở hàng / cột / khối / nhiều chỗ; số 0, chữ cái, số 10, dấu chấm, dấu gạch; thiếu / thừa dòng, thiếu / thừa ô; chuỗi 80 / 82 ký tự; file rỗng | 25 |

## Cách tạo

- **Lưới đầy ngẫu nhiên** được sinh bằng quay lui với thứ tự số xáo trộn, nên mỗi lưới khác nhau thật sự, không phải cùng một lưới đổi tên số.
- **Đề có lời giải duy nhất:** xóa lần lượt từng ô theo thứ tự ngẫu nhiên, chỉ giữ lại lần xóa nào mà đề vẫn có đúng một lời giải, cho tới khi đủ số ô trống cần có.
- **Đề vô nghiệm:** lấy một đề có lời giải duy nhất, đổi một số cho sẵn thành số khác mà không tạo ra số trùng, rồi kiểm tra đề mới không còn lời giải nào.
- **Đề đúng 2 lời giải:** xóa 4 ô tạo thành hình chữ nhật mà hai số ở hai góc đối nhau đổi chỗ được.
- **Seed cố định** (`20261006`): chạy lại script ra đúng bộ đề cũ.
- Đề sinh ngẫu nhiên nào cần hơn 1 triệu lần thử thì bỏ và sinh đề khác, để bộ test chạy nhanh. Các đề khó thật sự nằm ở nhóm đề nổi tiếng.

## Đáp án đến từ đâu

Đáp án không lấy từ chính bộ giải được kiểm thử, mà từ hai chương trình Python độc lập:

1. **Bản Python tham chiếu** (`checks/reference_solver.py`): cài đặt mô hình 1 riêng, cùng thứ tự xét ô và thử số với website. Từ đây có lời giải đầu tiên và các bộ đếm.
2. **Bộ đếm lời giải** trong `generate_testcases.py`: dùng cách khác hẳn (chọn ô ít khả năng nhất trước, đánh dấu bằng bitmask) để đếm số lời giải.

Script dừng ngay nếu hai chương trình không khớp nhau, hoặc lời giải không đúng luật (27 hàng, cột, khối phải là hoán vị của 1-9, giữ nguyên các số đề cho).

## Độ phủ

Khi chạy, mỗi đề ghi lại những nhánh xử lý mà nó đi qua. Cả bộ phải đi qua đủ 20 nhánh sau, thiếu nhánh nào là báo lỗi:

- 3 định dạng đề;
- 5 loại lỗi định dạng;
- trùng ở hàng, cột, khối;
- đề đã đầy, giải được, giải được nhưng nhiều lời giải, vô nghiệm ngay (không ghi nhận lần nào), vô nghiệm sau khi tìm;
- bị loại vì hàng, cột, khối;
- quay lui sau khi đã thử tới số 9.

## Cách chạy

```
cd website
yarn testcases                    chạy cả bộ, bỏ 2 đề chậm
yarn testcases --include-slow     chạy cả 2 đề chậm (đo ngày 6/10: 18 phút 45 giây)
yarn test                         test đơn vị, gồm luôn bộ testcase

python3 ../testcases/tools/generate_testcases.py    sinh lại bộ đề (khoảng 4 phút)
```

## Bộ test có bắt được lỗi không?

Đã thử cố tình làm sai bộ giải của website, rồi chạy lại cả bộ (292 đề, trừ 2 đề chậm):

| Lỗi cố ý | Bộ test phát hiện |
|---|---|
| Chỉ thử số 1-8, bỏ số 9 | 229 đề sai; báo thiếu nhánh "quay lui sau số 9" |
| Kiểm tra đề bỏ qua khối 3×3 | 5 đề trùng khối bị báo sai; báo thiếu nhánh "trùng ở khối" |
| Nhận số 0 là ô trống | 1 đề sai (đề có số 0 ở dòng 2) |
| Kiểm tra cột trước hàng | 262 đề sai: số lần bị loại theo hàng / cột lệch |

Hai lỗ hổng tìm ra trong lần thử đầu và đã vá:

- Lỗi "cột trước hàng" lọt qua, vì đáp án chỉ ghi lời giải và 3 bộ đếm, mà thứ tự kiểm tra không làm đổi các con số đó. Đã thêm 3 cột số lần bị loại theo hàng / cột / khối.
- Lỗi "bỏ qua khối" làm bộ giải chạy mãi trên đề trùng khối. Giờ mỗi đề có giới hạn số lần thử bằng đúng đáp án (đề không hợp lệ: 0 lần), vượt là dừng và báo sai.
