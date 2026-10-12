# Prompt cho Claude Design: mở đầu và kết video

Dùng khi muốn làm lại hoạt ảnh từ đầu trong Claude Design. Bản đã dựng sẵn nằm trong artifact "Sudoku Quay lui - Mở đầu và kết video" (hai artboard `Main` và `Outro`, 1920 × 1080).

## Prompt mở đầu (15 giây)

```
Design a 15-second animated intro, 1920×1080, 16:9, to open a screen-recorded demo video of a website that teaches backtracking through Sudoku. Animation only needs to play once and must be exportable as a 4K (3840×2160) video at 25 fps.

Look: light, calm, modern. Background a soft gradient from #F8FAFC to #EEF2FF. Text color #0F172A, muted text #475569, accent blue #2563EB with soft blue #DBEAFE, success green #16A34A with soft green #DCFCE7, error red #DC2626 with soft red #FEE2E2. Font: Be Vietnam Pro. No emoji, no stock illustrations, no gradients on text.

Text, centered near the top, fades in during the first second:
- Title (80px, bold): "Thuật toán quay lui giải Sudoku như thế nào?"
- Line 1 (36px, muted): "Lã Xuân Hồng · MSSV 25410056"
- Line 2 (32px, muted): "Video demo bài tập lớn · Phân tích và Thiết kế thuật toán"

Story, told only with drawn objects (no text inside the story except the numbers 1-9): a row of nine padlocks, numbered 1 to 9 under each lock, and one blue key whose ring shows a digit. The key tries the locks from left to right.
- Locks 1 to 4: the key arrives, the lock opens (shackle swings up) and turns green. 
- Lock 5: the key arrives and the ring digit flips quickly through 1 to 9. Every digit fails: the lock shakes sideways and turns red, then ends on digit 9.
- A badge fades in: "Quay lui: trả lại ô trước, đổi chìa". The key goes back to lock 4, lock 4 closes and turns neutral, the key digit becomes 2, lock 4 opens again and turns green. The badge fades out.
- The key returns to lock 5 with digit 1, lock 5 opens. Then locks 6, 7, 8, 9 open one after another.
- All nine locks end green and open, the key fades out, hold the final frame for about 1 second.
Motion: smooth ease-in-out, each move about 0.5 s. Total length about 15 s.
```

## Prompt kết (6 giây)

```
Design a 6-second animated outro, 1920×1080, same look as the intro. Nine green open padlocks (numbered 1 to 9) appear one after another in a row, then the text fades in below them:
- "Cảm ơn đã xem" (88px, bold)
- "Website: solving-sudoku-by-backtracking.vercel.app" (36px, muted)
- "Mã nguồn: github.com/honglax/solving-sudoku-by-backtracking" (36px, muted)
Hold the final frame for about 1.5 seconds. Exportable as a 4K video at 25 fps.
```

## Sau khi xuất video

Lưu hai file vào `video/motion/` với tên `intro.webm` hoặc `intro.mp4`, và `outro` tương tự. Bộ ghép tự dùng chúng nếu có (không có thì dùng thẻ chữ tĩnh):

```
cd website
node scripts/demoVideo/assembleVideo.ts --intro=../video/motion/intro.mp4 --outro=../video/motion/outro.mp4
```
