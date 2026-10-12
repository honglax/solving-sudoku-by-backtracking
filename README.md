# Thuật toán quay lui giải Sudoku như thế nào?

Website cho người mới học thuật toán xem máy giải Sudoku bằng quay lui, từng ô một. Bản chạy thử: https://solving-sudoku-by-backtracking.vercel.app/

Bạn nhập hoặc dán một đề, bấm **Từng bước**, và theo dõi bốn thứ cùng lúc: lưới màu theo trạng thái ô, dòng mã giả đang chạy, vectơ lời giải S, và một câu giải thích bằng lời. Đề Arto Inkala cần 445.778 lần thử. Bấm **Giải ngay** thì xong trong khoảng 0,6 giây trên Chrome.

## Website có gì

- **Giải Sudoku:** nhập đề, dán đề, chọn một trong 13 đề mẫu. Các nút Từng bước, Lùi một bước, Tự động, Giải ngay, Tới lần quay lui kế. Bảng lịch sử giữ 100 bước gần nhất, bấm một dòng để xem lại.
- **Thuật toán:** mã giả quay lui, cách tính độ phức tạp, và đề "chống quay lui" cần 622.577.597 lần thử với 64 ô trống.
- **So sánh:** cuộc đua hai lưới (điền lần lượt và điền ô dễ nhất trước), cùng bảng đo thời gian của 6 cách giải.
- **Mọi lời giải:** đi hết cây tìm kiếm và liệt kê mọi lời giải của một đề.
- Có chế độ sáng và tối, dùng được trên điện thoại.

## Chạy trên máy

Cần Node 24 và Chrome. Yarn 4.18.1 đã ghim trong dự án, bật bằng Corepack:

```
cd website
corepack enable
yarn install
yarn dev
```

Mở http://localhost:5173. Các lệnh khác, đều chạy trong `website/`:

| Lệnh | Việc làm |
|---|---|
| `yarn build` | Build ra `website/dist/` |
| `yarn test` | 723 test đơn vị (Vitest) |
| `yarn test:e2e` | 60 test trên Chrome thật (Playwright) |
| `yarn lint` | Soát code bằng oxlint |
| `yarn testcases` | Chạy 292 đề nhanh của bộ testcase, khoảng 9 giây |
| `yarn testcases --include-slow` | Chạy cả 294 đề, khoảng 19 phút vì có 2 đề cần hàng trăm triệu lần thử |

`yarn test` và `yarn testcases` đọc thêm `checks/` và `testcases/` ở thư mục ngoài `website/`, nên cần giữ nguyên cấu trúc thư mục.

## Cấu trúc thư mục

```
website/     website React 19, Vite 8, TypeScript 6; test nằm ở website/tests
checks/      các bản Python tham chiếu và file đáp án JSON để đối chiếu với bộ giải
testcases/   bộ testcase: 294 đề chia 6 nhóm, mỗi nhóm một file .txt, kèm manifest.csv
report/      report LaTeX (main.tex) và file PDF
design/      bản thiết kế giao diện: khung hình, màu, hướng dẫn bàn giao
plan.md      kế hoạch của dự án
work-log.md  nhật ký làm việc
```

Chi tiết từng phần:

- **Bộ giải** nằm trong `website/src/solver/`, là TypeScript thuần, không phụ thuộc React. Hàm `solveByBacktracking` viết thành generator: mỗi bước phát ra một sự kiện để giao diện vẽ.
- **Bộ testcase:** định dạng và cách chạy nằm trong [testcases/README.md](testcases/README.md).
- **Đáp án:** sinh lại bằng `python3 checks/reference_solver.py` (cần Python 3.9 trở lên, vài phút vì phải giải đề chống quay lui) và `python3 testcases/tools/generate_testcases.py`. Hạt giống ngẫu nhiên cố định nên hai lệnh cho ra đúng bộ đề cũ.
- **Report:** `cd report && python3 tools/build_report_tables.py && latexmk -xelatex main.tex`.

## Đưa lên mạng

Website là trang tĩnh, build bằng `yarn build` ra `website/dist/`. Trên Vercel, chọn **Root Directory** là `website`. Các thiết lập còn lại nằm trong `website/vercel.json`, gồm cả quy tắc chuyển mọi đường dẫn về `index.html` để bấm F5 ở `/solver` không ra lỗi 404.

## Ai làm gì

Phần lớn code, test và script do Claude Code viết theo yêu cầu của tác giả. Report kể rõ từng bước làm, prompt đã dùng và cách kiểm chứng ở Chương 6.
