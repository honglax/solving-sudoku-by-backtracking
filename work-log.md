# Nhật ký làm bài tập lớn

Ghi lại từng buổi làm: làm gì, dùng công cụ nào, prompt thật, ai quyết định cái gì. Report (mục 9 của `plan.md`) lấy nội dung từ file này.

---

## 3/10/2026 (thứ Bảy) - Chọn đề, lập kế hoạch

**Công cụ:** Claude Code trong VS Code.

**Việc đã làm**
- Xem lại video Buổi 8 để biết cô yêu cầu gì (0:12-0:23, 0:43-0:45, 2:53-2:58) và thông báo "NỘP BÀI TẬP LỚN" trên e-learning.
- Chọn đề. Mình thích cả Dijkstra lẫn Sudoku. Claude khuyên không chọn Dijkstra vì trên lớp chưa học, chỉ được nhắc tới như bài của khóa trước. Mình chọn Sudoku: đây là bài Lab01 mình đã tự giải và nộp trên Wecode ngày 13/9 (`Lab01/sudoku.py`), đề bắt buộc dùng quay lui mô hình 1.
- Lập `plan.md` trước khi viết dòng code nào. Claude chạy thử logic `sudoku.py` trên 7 đề để lấy số đo thật (bảng 3.4). Các quyết định về thiết kế dựa trên số đo này, ví dụ đề Inkala 445.778 lần thử thì không thể chạy hoạt ảnh.

**Prompt chính**
> Ok, tôi đồng ý với Sudoku, nhưng chúng ta sẽ không thực hiện liền mà cần lên kế hoạch phân tích toàn bộ bài toán trước khi viết những dòng code đầu tiên. Vì vậy, hãy tạo 1 file markdown chứa toàn bộ chi tiết kế hoạch cho bài tập lớn này [...]

> 5.1. I wanna build a completely website and deploy to Netlify or any supported free server
> 6. UI must be nice, modern, can I use Claude Design for this?

> Remember everything in code should be in English, code must be easy to read, easy to understand, must be explicit, can explain itself without comment. Do you think we can use React for the website?

> Just let me know if we use React, does it affect to the performance?

**Quyết định của mình**
- Website hoàn chỉnh nhiều trang, deploy Netlify.
- React + Vite + TypeScript. Mọi thứ trong code bằng tiếng Anh, không comment.
- Giao diện vẽ bằng Claude Design trước khi code.

**Claude đo để trả lời câu hỏi hiệu năng:** trên đề Inkala, đệ quy thường mất 3,7 ms, bản generator (dùng cho hoạt ảnh) mất 623 ms. Chậm là do generator, không phải do React.

---

## 3/10 - 4/10/2026 - Thiết kế giao diện

**Công cụ:** Claude Code (viết prompt), Claude Design trên claude.ai (vẽ giao diện).

**Prompt**
> Can we build a very detail prompt then I can use to talk with Claude Design for the mockup? We should have the color pallet for the website, it should be mordern, no violate design rule.

**Việc đã làm**
- Claude Code viết `design/claude-design-prompt.md`. Trong đó có:
  - bảng màu, mỗi cặp màu chữ/nền được đo độ tương phản theo chuẩn WCAG AA. Một màu xám bị loại vì chỉ đạt 4,34 (cần 4,5);
  - mỗi trạng thái của ô có thêm dấu hiệu ngoài màu, cho người khó phân biệt đỏ/xanh;
  - trạng thái lưới lấy từ lần chạy thật của đề 3 (lần thử 803, 814 và lúc giải xong), không bịa số;
  - mã giả chép đúng từng chữ slide mô hình 1 của cô.
- Mình đưa prompt vào Claude Design. Trong lúc làm, mình yêu cầu thêm nút chuyển Sáng / Tối.
- Claude Design trả về bộ bàn giao trong `design/`: 19 khung hình, ảnh chụp, `tokens.css`, `HANDOFF.md`, `PROMPT.md`.

---

## 4/10/2026 (Chủ nhật) - Duyệt bản thiết kế

**Công cụ:** Claude Code.

**Prompt**
> Claude Design has finished their job and hand-off design in the folder design, you can take a look at this and let me know what your plan next?

**Việc đã làm**
- Claude chạy lại thuật toán để kiểm tra số liệu trong bản thiết kế: khung 04 (814 / 96 / 81), khung 05 (803 / 93 / 81), khung 17 (đề Inkala ở lần thử 200.000: 22.236 / 22.206). Cả ba khớp.
- Tìm lại dữ liệu Đề 1 (đề mẫu Wecode) và Đề 2 (đề Wecode xóa thêm 4 ô), chạy lại ra 1 / 1 / 0 và 27 / 5 / 0, khớp bảng 3.4.

**Quyết định của mình**
- "Giải ngay" dùng chung generator với hoạt ảnh, chạy theo từng lát thời gian để không treo trang. Bỏ bản đệ quy thường riêng.
- Duyệt các câu thông báo còn thiếu (bị loại vì khối 3×3, chấp nhận được, quay lui sau số 9).
- Đề mặc định khi mở trang: Đề 3. Không giới hạn số lần thử của "Giải ngay", chỉ dừng khi bấm "Dừng".

---

## 4/10/2026 (Chủ nhật) - Chuẩn bị và dựng khung website

**Công cụ:** Claude Code.

**Prompt**
> Ok, go ahead

> Remember, file name must be in English as well

**Việc đã làm**
- Gom bộ bàn giao vào `design/`, `git init` (chưa commit).
- Đổi tên tài liệu sang tiếng Anh: `plan.md`, `work-log.md`.
- `checks/lab01_counts.py`: logic Lab01 giữ nguyên cấu trúc mô hình 1, thêm 3 bộ đếm. Chạy ra đúng bảng 3.4 cho cả 7 đề, và ghi 3 thời điểm giữa chừng (đề 3 lần thử 804, 814; đề 5 lần thử 200.000) vào `checks/expected_counts.json` để làm đáp án cho test.
- Dựng khung website React + Vite + TypeScript trong `website/`:
  - thanh trên cùng, menu cho điện thoại, nút Sáng / Tối, chân trang;
  - 4 đường dẫn, trang 404, trang báo lỗi;
  - font Be Vietnam Pro và JetBrains Mono đóng gói cùng website;
  - `netlify.toml`.
- `tokens.css` chép từ bản thiết kế, giữ nguyên 129 giá trị, chỉ bỏ phần comment.

**Đổi sang Yarn 4**
> Can we use yarn v2 instead of npm?

- Yarn v2 đã ngừng hỗ trợ, nên dùng Yarn 4.18.1, cùng kiến trúc với v2. Ghim trong `website/.yarnrc.yml`.
- Sự cố: lần chạy đầu `yarn set version` ghi nhầm file vào thư mục home (`~/package.json`, `~/.yarnrc.yml`, `~/.yarn/releases/`). Lý do là có một file `~/yarn.lock` rỗng từ 26/8 làm Yarn tưởng thư mục home là dự án. Claude đã xóa đúng 3 thứ vừa tạo, giữ nguyên file cũ, rồi tạo `yarn.lock` trong `website/` trước khi chạy lại.
- Yarn 4 không cài `lucide-react` 1.51.0 vì bản này mới phát hành chưa đủ 24 giờ. Giữ lớp bảo vệ, dùng bản 1.50.0.

**Đổi tên thư mục và viết thuật toán (bước 4)**
> Yes, it should be renamed, then what's next?

- Đổi tên thư mục `Bai-tap-lon` thành `final-project`.
- `website/src/solver/`: thuật toán bằng TypeScript thuần, không dính React.
  - `backtrackingSolver.ts`: generator `tryStep(i)`, giữ đúng các bước của mô hình 1: thử j = 1 → 9, kiểm tra chấp nhận được, xác định Sᵢ, ghi nhận trạng thái, đệ quy hoặc xuất lời giải, trả lại trạng thái cũ. Mỗi bước phát ra một sự kiện cho giao diện.
  - `puzzleParser.ts` (đọc 2 định dạng đề), `puzzleValidator.ts` (tìm số trùng), `solverProgress.ts` (áp sự kiện vào trạng thái và bộ đếm).
- 29 test Vitest, tất cả đạt: 7 đề khớp bảng 3.4 từng con số, 3 thời điểm giữa chừng khớp Python, đọc đề, kiểm tra đề.
- Kiểm tra lại chính bộ test bằng cách cố tình làm sai thuật toán:
  - Bỏ số 9: 10 test báo lỗi.
  - Đảo thứ tự kiểm tra cột trước hàng: lúc đầu **không** test nào bắt được, vì 3 thời điểm chụp đều chỉ trùng ở hàng. Đã thêm test duyệt cả 1.682 lần bị loại của đề 3, giờ bắt được.

**Bỏ chữ "Lab", "Wecode" khỏi website và làm trang Giải Sudoku (bước 5)**
> Yes, please go head. But before moving forward, I don't think label "Wecode" is ok, we can use another label, right?

> I mean don't want any text relates to "Lab" "Wecode" like we're studying. Treat this website like the one to be used for people understand the algorithm, not my exercises

- Website giờ viết cho người muốn hiểu thuật toán: Đề 1 "Rất dễ", Đề 2 "Dễ", trên lưới ghi "Thử từng số, sai thì lùi lại", panel "Mã giả quay lui", footer "Minh họa thuật toán quay lui · 2026". Nội dung mã giả vẫn chép đúng slide.
- Trang Giải Sudoku: lưới (gõ số được trước khi chạy, phím mũi tên để di chuyển), chú thích màu, chọn đề mẫu, hộp dán đề, Từng bước / Tự động / Giải ngay / Đặt lại, thanh tốc độ, panel mã giả, bảng S, bộ đếm và câu thông báo.
- 49 test, tất cả đạt; thêm 20 test kiểm tra cách hiển thị đúng từng khung thiết kế (03, 04, 05, 06, 07, 08, 16, 17, 18).
- Claude viết một script điều khiển Chrome để bấm "Từng bước" tới đúng lần thử 803, 804, 814 rồi chụp màn hình so với bản thiết kế. Mọi trạng thái vừa đúng 1366 × 680, không cuộn.
- Lỗi tìm ra khi kiểm tra và đã sửa:
  - thanh trên cùng cao 57 px thay vì 56 (trang dư 1 px);
  - đề sai thì bảng S bị mất ("i = 0 / 0");
  - đóng hộp dán đề thì con trỏ bàn phím không quay về nút "Dán đề";
  - 81 ô lưới bị vẽ lại mỗi khung hình vì hàm truyền xuống ô không cố định.

**Bảng lịch sử (chốt) và giao diện điện thoại, máy tính bảng (bước 6)**
> I'm thinking about "Diễn biến" table should has history or last 10~15 steps, and can we trace back through history? Does it cost more performance?

> History table should be scrollable. How many last steps you think is ok?

> I agree

- Chốt bảng "Lịch sử" giữ 100 bước, làm ở bước 8. Claude đo độ dài các nhánh sai trên đề 3, 4, 5 để chọn con số (xem quyết định 12.20 trong `plan.md`).
- Điện thoại (rộng ≤ 600 px), theo khung 10: lưới full chiều ngang, câu thông báo ngay dưới lưới, thẻ bộ đếm, "Mã giả" và "Lời giải S" thu gọn được, thanh nút cố định dưới đáy, nút "Tùy chọn" mở bảng chọn đề / dán đề / kiểm tra đề / đặt lại / tốc độ.
- Máy tính bảng (820 px): panel tự xuống dưới lưới, giống hệt ảnh thiết kế.
- Kiểm tra ở 390 px và 820 px: không trang nào bị tràn ngang; đóng bảng "Tùy chọn" thì con trỏ quay về nút "Tùy chọn".

**Trang chủ và trang Thuật toán (bước 7, phần 1)**
> Totally agree, go ahead please

- Duyệt 2 câu mới: "Đề tự nhập (n ô trống)" và câu báo vô nghiệm chung.
- Trang chủ theo khung 02. Hình lưới ở đầu trang lấy từ lần chạy thật của đề 3 tại lần thử 814, không vẽ tay. Đoạn giới thiệu viết lại cho người đọc ngoài lớp.
- Trang Thuật toán theo khung 12, đổi tiêu đề "Đối chiếu với mô hình 1" thành "Từ mã giả đến Sudoku" (cột "Mã giả" / "Với Sudoku"), thêm 2 câu giải thích quanh công thức độ phức tạp. Bảng số đo đọc từ dữ liệu đề mẫu, dữ liệu này có test so với bản Python, nên trang không thể ghi sai số.
- Lỗi tìm ra và đã sửa: mục lục bên phải tô sai mục khi cuộn (mục cuối không bao giờ được tô; mục ngắn bị bỏ qua).
- Trang Giới thiệu: chờ duyệt nội dung mới (bỏ thông tin môn học).

**Sửa câu chữ trang chủ, thêm đề mẫu, mục "Đề chống quay lui"**
> I feel the 3rd block is weird wording, is there any more suggestion?

> Go with A, and I think we should add more đề mẫu, what's ur suggestion?

> I love 12 but I don't think put it to our website is good. How about put 12 as a separated part to talk about there is a designed puzzle for "Anti-back tracking", and explain why. How is it?

> 1. Wording should be more natural. 2. Agree

- Thẻ "Số đo thật" ở trang chủ viết lại: "Một đề khó có 60 ô trống. Thử mọi cách điền là 9⁶⁰ khả năng, một con số có 58 chữ số. Thuật toán chỉ cần 445.778 lần thử, vì số nào vi phạm thì bị loại ngay."
- Claude đo các đề nổi tiếng bằng đúng cách đếm của bài: AI Escargot 80.491 lần thử (dễ hơn Inkala 5 lần dù được làm ra để khó với người), Easter Monster 2.357.880, đề 17 số cho sẵn 239.312.393, đề chống quay lui 622.577.597.
- Tự tạo 2 đề từ đề 3: một đề nhiều lời giải (thuật toán dừng ở lời giải đầu tiên, 827 lần thử) và một đề trông hợp lệ nhưng vô nghiệm (phải thử 981 lần mới biết).
- Đối chiếu chuỗi đề AI Escargot với SudokuWiki và Easter Monster với Sudoku Snake trước khi gắn tên.
- Mục "Đề chống quay lui" trên trang Thuật toán: 6 lựa chọn sai ở ô (1, 1) tốn 540.052.062 lần thử, 86,7% tổng số. Đo thật trên trình duyệt: Giải ngay chạy khoảng 663.000 lần thử/giây, cả đề mất khoảng 15 phút.

> The label is still weird, and if you can make it more conversational, it would be great

- Thẻ thứ 3 ở trang chủ đổi tiêu đề "Số đo thật" thành "Nhanh cỡ nào?", câu chữ viết lại kiểu nói chuyện. Mục cùng tên trên trang Thuật toán đổi thành "Số lần thử của từng đề".

**Trang Giới thiệu, trang Giải Sudoku co giãn theo màn hình**
> 1. Yes can be 2. Let me think and get back later 3. Yes
> Screenshot: The solver screen, the components are very tight while we still have a lot of blank space below, can we make it fit the screen (responsive height)?

> These blocks are too small

- Trang Giới thiệu viết lại cho người đọc ngoài lớp, có tên người làm, không MSSV. Thẻ "Mã nguồn" và "Video demo" ẩn cho tới khi có link.
- Trang Giải Sudoku: cỡ ô lưới theo chiều cao màn hình (44 px ở 1366 × 680, tới 96 px); chữ mã giả, ô S, chữ số trong ô S lớn theo; panel bên phải cao bằng lưới. Trên màn hình lớn, khung trang rộng 1600 px thay vì 1200 px.
- Đo ở 8 cỡ màn hình (1366 × 680 tới 2560 × 1440): không cỡ nào phải cuộn, panel luôn nằm cạnh lưới, mã giả không bị tràn ngang; 1366 × 680 vẫn y hệt bản thiết kế.
- Lần đầu thử, cột phải kéo dài tới đáy màn hình trong khi lưới dừng ở cỡ 72 px, và các ô S vẫn nhỏ như cũ (đúng ảnh bạn chụp). Đã sửa: tăng giới hạn ô lên 96 px, cột phải cao bằng lưới, ô S lớn theo lưới.

> The layout is shift between solver screen with the others. Can you make the other pages responsive like the solver page?

- Lỗi: trên màn hình lớn, trang Giải Sudoku rộng 1600 px còn các trang khác 1200 px, nên header nhảy khi chuyển trang. Sửa: mọi trang dùng chung một độ rộng, 1200 px tới màn hình 1440 px (giữ đúng thiết kế), rồi rộng dần tới 1600 px. Lưới ở trang chủ cũng lớn theo.
- Kiểm tra 5 trang ở 7 cỡ màn hình (390 tới 2560 px): logo và menu nằm đúng một vị trí ở mọi trang.
- Chưa kiểm được trên Windows (thanh cuộn thật); đã ghi vào danh sách kiểm tra sau khi deploy.

**Bảng lịch sử (bước 8) và sắp xếp lại thư mục**
> Go ahead

> After history component, can we restructure the folder? test should be in test folder, custom hook inside custom hook folder, can considering do we need e2e test?

- Panel S có 2 tab "S = (S₁, …, Sₙ)" / "Lịch sử". Lịch sử giữ 100 bước gần nhất, mới nhất ở trên, cuộn được. Bấm một dòng để xem lại đúng trạng thái lúc đó (lưới, mã giả, bảng S, bộ đếm, câu thông báo); có nút Trước / Sau / Về mới nhất; bấm Từng bước thì đi tiếp từ chỗ đang xem.
- Cách làm: không lưu bản sao lưới mỗi bước, chỉ lưu sự kiện và vài tham chiếu, khi xem lại thì "hoàn tác" ngược từ trạng thái hiện tại. Test chứng minh: lùi 1 tới 300 sự kiện đều ra đúng y trạng thái thật lúc đó. Giải ngay đề Inkala vẫn khoảng 0,6 giây.
- Lỗi tìm ra khi kiểm tra và đã sửa: mở tab Lịch sử làm trang cao 2.998 px (danh sách đẩy cột phải dài ra); dòng đang xem bị cuộn khuất khi bấm Trước / Sau.
- Sắp xếp lại thư mục: test chuyển sang `website/tests/unit/`, mọi hook vào `src/hooks/`, các phần của trang Giải Sudoku vào `src/components/solver/`. Đường dẫn import được tính lại tự động; `yarn build` kiểm tra kiểu cả file test.

> Every single column in table should have label to explain what they are

- Bảng lịch sử thành bảng thật có tiêu đề cột luôn hiện khi cuộn: "Lần thử", "Ô", "Số", "Kết quả", "Lý do" (ví dụ: 814 · (4, 7) · 2 · Bị loại · đã có ở hàng 4). Mỗi dòng có nút "Xem lại lần thử …" cho người dùng bàn phím và trình đọc màn hình.

> In history table, we should notice user that we show only last 100 records

- Thêm thông báo "Chỉ giữ 100 bước gần nhất" ở đầu panel khi mở tab Lịch sử (và trên dòng tóm tắt ở điện thoại), cùng dòng cuối bảng "Chỉ giữ 100 bước gần nhất, các bước cũ hơn không xem lại được." khi bảng đã đầy. Trên điện thoại, cột "Lý do" được xuống dòng thay vì bị cắt.
- Trên điện thoại, cột "Kết quả" chỉ hiện biểu tượng (chữ vẫn có cho trình đọc màn hình) để cột "Lý do" đủ chỗ xuống dòng.
- Lỗi tìm ra khi đo: dòng thông báo cuối bảng không xuống dòng, kéo cả bảng rộng hơn khung 57 px (cả trên máy tính). Đã sửa; bảng vừa khít ở 390, 1366 và 1712 px.

**Test end-to-end, CSS tách riêng, chữ giao diện vào JSON**
> Yes, you should, and also restructure the folder

> I don't like put css in the same folder with tsx file. Any suggestion for folder structure?

> And for the label, we should store them in a json file to preparing for localization/i18n in the future

- CSS chuyển hết vào `src/styles/`, theo cây giống component (`styles/components/...`, `styles/pages/...`); mỗi component vẫn tự import stylesheet của mình nên CSS của trang nào chỉ tải khi mở trang đó.
- Mọi chữ trên giao diện (khoảng 300 dòng) chuyển vào `src/locales/vi.json`, đọc qua `src/i18n/`. Câu có giá trị thay đổi viết dạng `{placeholder}`, phần in đậm viết `<strong>…</strong>`, để người dịch giữ được nguyên câu và đổi thứ tự từ. Thiếu giá trị cho một placeholder thì báo lỗi ngay. Kiểm tra: không còn chữ tiếng Việt nào trong code ngoài file JSON; 62 test đơn vị cũ (so từng ký tự câu thông báo) vẫn đạt nguyên vẹn.
- Thêm Playwright: 31 test end-to-end chạy trên Chrome thật, khoảng 15 giây. Tự build website và mở máy chủ xem thử. Kiểm tra lại chính bộ test: cố tình đưa lại lỗi header 57 px của ngày đầu thì 3 test báo "Expected 680, Received 681".
- Tổng: 69 test đơn vị + 31 test end-to-end, tất cả đạt.
- Trang Giới thiệu: đổi nhãn "Người làm" thành "Tác giả".

**Sửa theo góp ý của người dùng thử**
> A feedback from an end-user (dán nguyên văn góp ý: điểm tốt, lỗi giao diện, lỗi chức năng, góp ý nhỏ)

> We can skip the video demo/source code for now. You can address the feedback from the end-user

- Kiểm chứng trước khi sửa: đo thật thì bảng S bị cắt nửa hàng (đề 3 ở 1366 × 768: 8 ô 33-40; lưới trống: ở mọi cỡ), chú thích màu 12 px - đúng như góp ý.
- Đã làm:
  - Bảng S chỉ hiện trọn hàng, có thanh cuộn luôn thấy được.
  - Rê chuột lên ô nào thì hiện nghĩa màu ô đó ("Bị loại", "Đề cho · ô gây mâu thuẫn"); chú thích màu lớn theo lưới trên màn hình lớn.
  - Nút ◀ "Lùi một bước" cạnh Từng bước (cả điện thoại); nút "Tới lần quay lui kế".
  - Tự động dừng ở lần quay lui đầu tiên, hỏi "Bạn đoán bước tiếp theo là gì?".
  - Trang chủ: lưới chạy lại thật các bước 783-814 của đề 3 (có chuỗi quay lui); đứng yên nếu máy bật giảm chuyển động. Đoạn mở đầu có ví dụ thử chìa khóa.
  - Điện thoại: tên đề hiện ngay trên lưới, bấm vào để đổi đề.
  - Trang Thuật toán: mã giả trong bảng cùng cỡ chữ với cột bên cạnh; chú thích dưới bảng cỡ chữ thường.
  - Chân trang có link "Thuật toán hoạt động thế nào?"; trang Giới thiệu có câu mở đầu nói trang dành cho ai.
- Góp ý về tốc độ: tốc độ tối đa đã là 1.000 lần thử/giây (đề Wikipedia 38 giây, không phải nửa tiếng); thêm nút tới lần quay lui kế để đến khoảnh khắc đáng xem nhanh hơn.
- Lỗi tìm ra trong lúc làm: một máy chủ xem thử cũ còn chạy nên vài lần đo đầu tiên đo nhầm bản cũ; đã sửa cấu hình Playwright để luôn build và chạy máy chủ mới. Nút ◀ bị co lại để vừa hàng; đã giữ đủ 36 px và giảm lề nút.
- Kết quả: 72 test đơn vị + 46 test end-to-end đạt; 1366 × 680 vẫn vừa khít.

---

## 6/10/2026 (thứ Ba) - Cô ra yêu cầu chính thức

**Công cụ:** Claude Code trong VS Code.

**Prompt**
> Cô đã cập nhật yêu cầu cho final-project rồi, review qua xem chúng ta còn cần gì. Yêu cầu này sẽ overwrite yêu cầu ở buổi 8

> 1. Đồng ý với gợi ý của bạn 2. Report bằng LaTeX 3. Sẽ quyết định sau khi chúng ta hoàn tất mọi thứ

**Việc đã làm**
- Lưu nguyên văn yêu cầu mới vào `requirements.md`.
- Claude đối chiếu yêu cầu mới với `plan.md`, `work-log.md` và code. Demo đã đủ phần "nhập dữ liệu, xem từng bước, xem kết quả". Còn thiếu:
  - bộ testcase để nộp;
  - report mở rộng thành khoảng 10 mục, trong đó mục tường thuật quá trình làm là quan trọng nhất;
  - video phải giới thiệu đủ mọi chức năng và mọi thành phần trên giao diện;
  - phần sáng tạo: plan cũ ghi "không dùng thuật toán khác", trong khi tiêu chí mới chấm điểm việc giải nhiều cách rồi so sánh;
  - thư mục `final-project/` chưa có commit nào, website chưa deploy.
- Claude tìm ra một lỗi trong `plan.md` mục 3.3: "Dừng khi k − i = 0 ⟺ i = k" phải là n − i = 0 ⟺ i = n. Đã sửa.
- Đọc lại khuôn trình bày phần thiết kế trong `On-thi/Huong-dan-lam-bai.md` để chương thiết kế của report đi đúng thứ tự cô dạy.
- Cập nhật `plan.md`: mục 1 (yêu cầu mới), 4.1 (phần mở rộng), 5.3 (thư mục nộp), 7.2 (bộ testcase), 8 (video), 9 (report), 10 (lịch), 11, 12.

**Quyết định của mình**
- Phần mở rộng làm theo thứ tự: A (so sánh 3 cách tổ chức dữ liệu: quét lưới, 3 mảng đánh dấu, bitmask), B (Tìm mọi lời giải, đúng nguyên văn mô hình 1 trên slide), rồi D (4×4, 16×16). MRV để quyết sau.
- Report viết bằng LaTeX.
- Cách nộp và tên file chốt sau khi làm xong mọi thứ.

**Đổi góc nhìn: website dạy học**
> Không nhất thiết cứ phải mention Lab 01 hay Wecode, hãy mở rộng phạm vi ra. Treat mọi thứ như chúng ta đang dựng 1 website để dạy học và chia sẻ kiến thức vậy

- Claude hỏi lại "mở rộng" theo hướng nào: chỉ đổi góc nhìn, thêm trang bài học quay lui, hay thêm bài toán khác. Mình chọn **đổi góc nhìn, vẫn Sudoku**, và **làm thêm MRV** (chọn ô ít khả năng nhất trước) sau A, B.
- `plan.md` viết lại theo góc nhìn website dạy học: định dạng đề, đề mẫu, bộ testcase, report, video không còn dựa vào Lab01/Wecode. Lab01 chỉ còn trong phần lý do chọn đề của report, vì cô yêu cầu nêu lý do thật.
- Đổi tên `checks/lab01_counts.py` thành `checks/reference_solver.py` (bản Python tham chiếu).

**Commit đầu tiên và bộ testcase**
> Okay

- Commit đầu tiên của `final-project/` (177 file).
- Claude viết `testcases/tools/generate_testcases.py` sinh 294 đề, 6 nhóm (Nhỏ 40, Thông thường 150, Lớn / khó 45, Biên 13, Đặc biệt 21, Không hợp lệ 25), seed cố định.
  - Đáp án lấy từ 2 chương trình Python độc lập với website: bản tham chiếu mô hình 1 (lời giải đầu, bộ đếm) và một bộ đếm lời giải dùng MRV + bitmask. Hai bên lệch nhau thì script dừng.
  - Đề 17 số lấy lại chuỗi từ transcript buổi 4/10 (đề đầu trong danh sách của Gordon Royle). Bản Python đo ra 239.312.393 / 26.590.293 / 26.590.229, khớp lần đo bằng JavaScript hôm 4/10.
- `testcases/tools/testcaseRunner.ts` + `runTestcases.ts` chạy từng đề bằng đúng `website/src/solver`, so kết quả, bộ đếm và độ phủ 20 nhánh xử lý. Lệnh `yarn testcases`; `yarn test` cũng chạy cả bộ.

**Sự cố khi làm**
- Lần chạy đầu treo hơn 10 phút. Claude đo từng nhóm: vòng sinh đề "đúng 2 lời giải" lặp mãi. Lý do: mọi lưới "ngẫu nhiên" đều sinh từ một lưới mẫu rồi hoán vị hàng / cột / đổi tên số. Cả họ lưới đó không bao giờ có hình chữ nhật 4 ô đổi chỗ được, và cũng có nghĩa bộ đề kém đa dạng hơn tưởng. Đổi sang sinh lưới đầy bằng quay lui với thứ tự số xáo trộn.
- Mọi đề đạt ngay lần đầu, nên Claude kiểm lại chính bộ test bằng cách cố tình làm sai bộ giải (4 lỗi). Lần đầu chỉ 2/4 lỗi bị bắt:
  - "kiểm tra cột trước hàng" lọt qua, vì đáp án không ghi lý do bị loại → thêm 3 cột số lần bị loại theo hàng / cột / khối;
  - "bỏ qua khối" làm bộ giải chạy mãi trên đề trùng khối → mỗi đề có giới hạn số lần thử bằng đáp án.
  - Sau khi vá: cả 4 lỗi đều bị bắt (229, 5, 1, 262 đề sai).
- Trong lúc thử, một lệnh chạy nền tiếp tục sửa code sai sau khi đã bị dừng; Claude dừng hẳn shell đó và khôi phục code từ git trước khi làm tiếp.

> Wow, there are too much files .in and .out

- 294 đề × 2 file = 588 file. Mình chọn gom **mỗi nhóm một file `.txt`**: mỗi đề là một khối `=== mã · mô tả` / `--- input` / `--- expected`, phần input giữ nguyên từng ký tự (kể cả CRLF, tab). Thêm `.gitattributes` để git không đổi ký tự xuống dòng của các file này.
- Kết quả: 292 đề nhanh đạt hết (khoảng 9 giây), đủ 20 nhánh; `yarn test` 365 test đạt; lint và build sạch.

> Why it takes so long?

- Chạy cả 2 đề chậm bằng bộ giải của website: cả 294 đề đạt, mất 18 phút 45 giây. Đề chống quay lui 13 phút 54 giây (622.577.597 lần thử, khoảng 747 nghìn lần/giây), đề 17 số 4 phút 42 giây (239.312.393 lần thử, khoảng 848 nghìn lần/giây).
- Chậm vì bộ giải của website là generator phát sự kiện ở từng bước để minh họa; mỗi sự kiện đi ngược qua tới 64 tầng `yield*`. Bản Python đệ quy thường còn nhanh hơn (khoảng 1,5 triệu lần/giây), bản JavaScript đệ quy thường giải đề chống quay lui trong khoảng 3 giây (đo 4/10).
- Giữ nguyên: bộ test phải chạy đúng bộ giải người xem thấy trên web. 2 đề này đánh dấu chậm, không chạy mặc định. Đây là số liệu cho mục Đánh giá (cái giá của việc minh họa từng bước).

**Trang "So sánh" (phần mở rộng A, và phần so sánh của C)**
> Ok, let's continue

> Bạn có thể thêm tab mới hoặc trang mới để đáp ứng các yêu cầu của cô nhé

- Claude viết phần thuật toán trước, đo rồi mới làm giao diện:
  - `src/comparison/usageTrackers.ts`: 3 cách kiểm tra "chấp nhận được" (quét lưới, 3 mảng đánh dấu, bitmask), mỗi cách đếm số lần đọc bộ nhớ.
  - `src/comparison/comparisonSolver.ts`: khung mô hình 1 viết một lần, đổi được cách kiểm tra và thứ tự chọn ô (tuần tự / ít khả năng nhất trước). Đệ quy thường, không generator, để thời gian đo không bị cái giá của generator che mất.
- Số đo đầu tiên (Node): 3 cách kiểm tra cho đúng cùng số lần thử trên cả 12 đề (khớp bảng đo). Quét lưới chậm khoảng 2 lần, bitmask nhanh hơn 3 mảng đánh dấu 10-15%. MRV giảm số lần thử rất mạnh (đề chống quay lui: 622.577.597 → 407.156, 6,7 giây → 0,09 giây), nhưng trên đề Inkala lại chậm hơn bản thường (21,5 ms so với 5,2 ms) vì mỗi bước phải đếm lại khả năng của mọi ô. Đây là một điểm đáng đưa vào report: ít lần thử hơn chưa chắc nhanh hơn.
- `checks/reference_fewest_candidates.py`: bản Python MRV độc lập (cùng luật hòa: lấy ô đầu tiên theo hàng rồi cột). Khớp bản TypeScript cả 12 đề.
- Trang `/compare` ("So sánh" trên menu): giải thích 2 chỗ khác nhau, chọn đề rồi bấm Đo, 2 biểu đồ thanh ngang (số lần thử, thời gian; tách 2 biểu đồ vì khác thang đo), bảng đầy đủ, mục "Điều rút ra". Đo trong Web Worker nên trang không treo; bấm Dừng được. Các con số trong phần chữ đọc từ dữ liệu đề mẫu đã có test, không gõ tay.
- Lỗi tìm ra khi xem ảnh chụp: thanh biểu đồ quá ngắn vì 2 biểu đồ đặt cạnh nhau → xếp dọc; cột "Cách giải" trên điện thoại bị ép xuống dòng từng từ → đặt độ rộng tối thiểu, bảng cuộn ngang. Lúc đầu thanh dài nhất bị giới hạn độ rộng nên các thanh sai tỉ lệ → đổi sang chừa chỗ bằng padding.
- Chuyển kiểu `.select-field` và `.data-table` ra chỗ dùng chung để trang mới dùng lại.
- Kết quả: 440 test đơn vị + 49 test end-to-end đạt; menu 5 mục vẫn vừa thanh trên cùng từ 820 px trở lên, dưới đó vào menu thu gọn.

**Làm lại trang So sánh cho người bình thường đọc hiểu**
> Do we have any visualize for Comparing page? As a normal user, I don't understand any word of this page?

- Mình chụp màn hình gửi kèm: trang chỉ có 2 biểu đồ trống ("-") cho tới khi bấm Đo, chữ toàn thuật ngữ (bitmask, MRV, "đọc bộ nhớ").
- Claude đề xuất 3 phần minh họa (cuộc đua 2 lưới; một lần kiểm tra theo 3 cách; kết quả nói bằng câu). Mình chọn **cuộc đua 2 lưới**.
- Đã làm:
  - Bộ giải từng bước nhận thêm thứ tự "ô dễ nhất trước", có test khớp bản Python MRV cả 12 đề.
  - Lưới hiện số khả năng còn lại ở góc mỗi ô trống; ô chỉ còn một số tô xanh nhạt. Chỉ lưới trong cuộc đua mới hiện, lưới của trình giải không đổi.
  - `src/playback/raceEngine.ts`: một vòng lặp chạy cả hai lưới, cùng số lần thử mỗi giây, nên cuộc đua công bằng. Có Chạy / Tạm dừng / Từng bước / Đặt lại / tốc độ; xong thì hiện câu tóm tắt ("… ít hơn khoảng 8 lần").
  - Viết lại toàn bộ chữ của trang bằng lời thường: "Nhìn lại lưới", "Sổ ghi chép", "Dãy công tắc" thay cho quét lưới / 3 mảng đánh dấu / bitmask (tên kỹ thuật để trong ngoặc); "Điền lần lượt" / "Điền ô dễ nhất trước". Biểu đồ chỉ hiện khi đã đo; bảng số liệu thu vào mục "Xem bảng số liệu đầy đủ".
- Kết quả: 452 test đơn vị + 52 test end-to-end đạt.

**Trang "Mọi lời giải" (phần mở rộng B)**
> Ok rồi

- Commit trang So sánh. Claude hỏi đặt chế độ "Tìm mọi lời giải" trong trang Giải Sudoku hay trang riêng; mình chọn **trang riêng**.
- Bộ giải từng bước có thêm tùy chọn tìm hết, phát 2 sự kiện mới ("đã liệt kê một lời giải", "đã thử hết"). Trang Giải Sudoku không phát 2 sự kiện này nên không đổi; các chỗ xử lý sự kiện (lịch sử, câu thông báo, mã giả, lưới) được bổ sung cho đủ.
- `checks/reference_all_solutions.py`: bản Python tìm hết, kế thừa bản tham chiếu, chỉ đổi phần "Xuất lời giải" để đếm rồi đi tiếp.
- **Phát hiện khi chạy:** đề mẫu "Vừa" (đề mặc định của trình giải) có **4 lời giải**, không phải 1; "Nhiều lời giải" có 18. Bộ đếm độc lập (MRV + bitmask) trong bộ testcase cũng ra 4 và 18. Đã sửa README testcase và `plan.md` chỗ ghi nhóm Thông thường "đều có một lời giải".
- Kiểm chéo: chế độ tìm hết đếm lại số lời giải của 251 đề trong bộ testcase; 239 đề tìm hết được trong 300 nghìn lần thử, cả 239 khớp bộ đếm độc lập.
- Trang `/all-solutions`: chọn đề, Chạy (dừng ở mỗi lời giải, câu thông báo nói rõ "thuật toán chưa dừng: nó trả lại ô vừa điền rồi thử tiếp"), Từng bước, Tìm hết / Dừng, tốc độ; bộ đếm lời giải / lần thử / lần quay lui; mã giả sáng từng dòng; bộ sưu tập lời giải (lưới thu nhỏ, tô ô khác lời giải 1); mục "Biết chắc chỉ có một lời giải thì tốn bao nhiêu?" (Inkala: 445.778 lần thử để tìm lời giải đầu, 18.619.020 lần để đi hết, gấp 42 lần); lưới trống có 6.670.903.752.021.072.936.960 lời giải nên không đếm hết được.
- Lỗi tìm ra khi chụp màn hình: menu 6 mục bị ép xuống 2 dòng ở 820 px. Đo thì 6 mục vừa một dòng từ 880 px; chuyển sang menu thu gọn dưới 900 px, chữ menu không xuống dòng. Thêm test cho cả hai.
- Tách thanh tốc độ thành component dùng chung (`SpeedSlider`) cho cuộc đua và trang mới.
- Kết quả: 714 test đơn vị + 59 test end-to-end đạt.

**Bộ quy tắc văn phong (skill `vietnamese-writing`) và viết lại chữ trên website**
> Nguyên tắc dành cho bạn khi làm việc với câu chữ, hãy lưu vào system (…)

> (dán thêm 2 bộ quy tắc: nhịp câu, bộ lọc từ, mạch lạc, tông giọng)

> Review thêm skill này cho writing skill nhé (… cấu trúc 3S, giọng anh khóa trên …)

> Yeah, về mã giả thì bất khả xâm phạm, tôi đồng ý

> Sao bạn không lưu vào như 1 SKILL?

> Một vài mẫu cho bạn tham khảo nè (bài "Bí mật đằng sau cỗ máy giải Sudoku")

> Ok, hãy điều chỉnh lại văn phong của toàn bộ website cho phù hợp với bộ writing skill chúng ta mới thống nhất, sau đó commit

- Gộp 3 bộ quy tắc thành skill dự án `.claude/skills/vietnamese-writing/` (ngoài repo `final-project`). Claude chỉ ra chỗ xung đột (3S với kim tự tháp ngược; "không đưa code" với mã giả cô chấm; giọng content creator với report) và đề xuất chia theo nơi dùng: website dùng đủ bộ, report chỉ dùng luật câu và bộ lọc từ, câu trả lời theo kim tự tháp ngược. Mình đồng ý, thêm: **mã giả bất khả xâm phạm**.
- Bài mẫu mình đưa được lưu kèm chú thích. Claude chỉ ra 2 lỗi thuật toán trong bài ("điền bừa", "thử hết tất cả trường hợp") và các số bịa ("hàng triệu phép tính mỗi giây"), rồi viết lại bằng số đo thật.
- Viết lại khoảng 50 câu trên website theo skill: bỏ "Tóm lại", "Nói cách khác", "rất", thể bị động; câu ngắn dài xen nhau; mỗi nhận xét về độ khó có con số. Ví dụ:
  - Tiêu đề trang chủ: "Máy giải Sudoku cũng đoán sai. Xem nó lùi lại và sửa."; đoạn dẫn dùng hình ảnh dãy cửa và chùm chìa khóa.
  - Câu bị loại: "Ô (4, 7) - thử số 2: hàng 4 đã có số 2, bỏ." (trước: "… bị loại vì 2 đã có ở hàng 4").
  - Trang Thuật toán: kết luận độ phức tạp có số Inkala thật; đoạn đề chống quay lui trỏ sang cuộc đua ở trang So sánh (407.156 lần thử nếu điền ô dễ nhất trước). Ba câu này lấy số từ dữ liệu đề mẫu, không gõ tay.
  - Lưới trống: "Cứ cho máy tìm 1 triệu lời giải mỗi giây thì cũng mất khoảng 211 triệu năm."
  - Đề "Rất dễ" đổi tên thành "Dễ nhất" (đổi đồng bộ ở bản Python, file đáp án, bộ testcase).
- Giữ nguyên: 12 dòng mã giả, cột "Mã giả" của bảng đối chiếu, nhãn trạng thái ngắn ("Bị loại", "Chấp nhận được", "Ghi nhận", "Trả lại"), nhãn "Input" / "Output".
- Chụp màn hình phát hiện tiêu đề trang chủ xuống 3 dòng, chữ "một." đứng lẻ, và đoạn dẫn đổi hình ảnh giữa chừng (ổ khóa → cánh cửa); đã sửa cả hai.
- Cập nhật đáp án trong 9 test đơn vị và 6 test end-to-end so từng ký tự câu thông báo. Kết quả: 714 test đơn vị, 59 test end-to-end, 292 testcase đều đạt.
- **Lỗi lọt vào commit `bb871f3`, Claude tự phát hiện ngay sau khi commit:** 3 câu mới có chỗ chờ điền số (`{inkalaTryCount}`, `{fewestCandidatesTryCount}`) nhưng code chưa truyền số vào, nên trang Thuật toán và So sánh hiện nguyên dấu ngoặc nhọn. Không test nào bắt được. Đã sửa, và thêm test end-to-end mở từng trang, khẳng định không còn `{…}` hay thẻ `<strong>` thô nào hiện ra. Kiểm lại chính test này: lần đầu test vẫn đạt trên bản lỗi, vì nó kiểm chữ lúc trang còn đang tải; đổi sang chờ trang tải xong thì test bắt đúng lỗi ở `/algorithm`. Kết quả: 714 test đơn vị, 60 test end-to-end đạt.

---

## 8/10 - 9/10/2026 - Đề minh họa cho report

> Where are we now?

> totally agree

- Claude tóm tắt tiến độ: website và bộ testcase gần xong, report và video chưa bắt đầu, đề minh họa cho Ch.5 đang trễ lịch. Mình đồng ý thứ tự: làm đề minh họa ngay, bắt đầu report từ 9/10 (sớm hơn lịch 5 ngày, viết Ch.6 trước), deploy 11/10, phần D chỉ làm nếu còn thời gian.
- Claude viết `checks/find_illustration_puzzle.py`: xóa ngẫu nhiên 10-16 ô từ một lưới đầy, giữ đề có đúng một lời giải, 50-90 lần thử, 1-3 lần quay lui, có đủ 3 kiểu bị loại (hàng, cột, khối). Ra 12 đề; chọn đề 79 lần thử, 3 lần quay lui. Lý do: cả 3 lần quay lui nằm trong 35 lần thử đầu, ngay trên hàng 1, trong đó có một lần lùi dây chuyền qua 2 ô (ô (1, 9) hết số → lùi về (1, 8), ô (1, 8) cũng hết số → lùi về (1, 6)).
- Thêm vào website thành đề 13 "Ngắn, có quay lui". Chạy lại cả 3 bản Python tham chiếu; số của 12 đề cũ không đổi.
- `report/tools/exportIllustrationTrace.ts` xuất 83 bước (lần thử, i, ô, số, thao tác, lý do kèm ô gây trùng, vectơ S) và 5 ảnh lưới ra `report/data/`, dùng đúng bộ giải của website nên khớp demo từng bước.
- **Sự cố máy:** `yarn test` từ 9 giây thành 16-17 phút, mỗi lần hỏng một test khác nhau vì quá thời gian. Claude đo: một vòng lặp cần 1,9 giây CPU mà mất 27 giây, tức máy chỉ cấp khoảng 5-7% sức chạy (không phải chế độ tiết kiệm pin, không có cảnh báo nhiệt). Nới giới hạn thời gian mỗi test lên 30 giây. Lượt cuối: 722/723 đạt, test còn lại vẫn quá thời gian do máy; mọi test liên quan tới đề 13 đều đạt.

## 10/10/2026 - Chạy lại toàn bộ test

> Re-run all test?

- Máy chạy bình thường lại (vòng lặp đo thử: 2,3 giây, 87% CPU; hôm trước 27 giây).
- Test đơn vị 723/723 đạt (10 giây), bộ testcase 292/292 đạt và đủ 20 nhánh, test end-to-end 60/60 đạt (22 giây).

> Set up git author for this repo (Hong La, hongla.html@gmail.com)

> Of course (đồng ý sửa tác giả cho các commit cũ)

- Cài tác giả git riêng cho repo `final-project`: Hong La <hongla.html@gmail.com>. Cấu hình git chung của máy không đổi.
- Viết lại tác giả và người commit cho cả 9 commit cũ (trước đó ký bằng email công ty). Repo chưa có remote nên an toàn. Kiểm lại: nội dung code giống hệt trước khi viết lại, chỉ mã commit đổi. Đã sửa mã commit nhắc trong nhật ký (`dc0b193` → `bb871f3`).
