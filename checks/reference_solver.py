import json
import time
from pathlib import Path

SIZE = 9
BOX_SIZE = 3
EMPTY = 0
EMPTY_MARK = '.'
CELL_COUNT = SIZE * SIZE

OUTPUT_PATH = Path(__file__).with_name('expected_counts.json')

SAMPLE_PUZZLES = [
    (1, 'Rất dễ',
     '5816724397928436513645917824389572.6256184973179326845845219367913768524627435198'),
    (2, 'Dễ',
     '.816724397928436513645917824389572.62561.4973179326845845219367913768.2462743519.'),
    (3, 'Vừa',
     '5346..912....9534.19...2.6....761.2...6..37...1.9248....1....842..41.635.4.2.617.'),
    (4, 'Wikipedia',
     '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79'),
    (5, 'Arto Inkala',
     '8..........36......7..9.2...5...7.......457.....1...3...1....68..85...1..9....4..'),
    (6, 'Lưới trống', EMPTY_MARK * CELL_COUNT),
    (7, 'Vô nghiệm ngay ô đầu', '.23456789' + '1' + EMPTY_MARK * (CELL_COUNT - SIZE - 1)),
    (8, 'Nhiều lời giải',
     '53.6..912....9534.19...2.6....761.2...6..37...1.92.8....1....84...41..35.4.2.617.'),
    (9, 'Vô nghiệm, phải tìm mới biết',
     '5346..912....9534.19..32.6....761.2...6..37...1.9248....1....842..41.635.4.2.617.'),
    (10, 'AI Escargot',
     '1....7.9..3..2...8..96..5....53..9...1..8...26....4...3......1..4......7..7...3..'),
    (11, 'Easter Monster',
     '1.......2.9.4...5...6...7...5.9.3.......7.......85..4.7.....6...3...9.8...2.....1'),
    (12, 'Chống quay lui',
     '..............3.85..1.2.......5.7.....4...1...9.......5......73..2.1........4...9'),
]

SNAPSHOT_TRY_NUMBERS = {
    3: [804, 814],
    5: [200000],
    12: [1000000],
}


def box_index(row, column):
    return ((row - 1) // BOX_SIZE) * BOX_SIZE + (column - 1) // BOX_SIZE + 1


class ReferenceSolver:
    def __init__(self, puzzle_text, snapshot_try_numbers):
        self.grid = [[EMPTY] * (SIZE + 1) for _ in range(SIZE + 1)]
        self.empty_cells = [(0, 0)]
        for position, character in enumerate(puzzle_text):
            row = position // SIZE + 1
            column = position % SIZE + 1
            if character == EMPTY_MARK:
                self.empty_cells.append((row, column))
            else:
                self.grid[row][column] = int(character)
        self.n = len(self.empty_cells) - 1

        self.row_used = [[False] * (SIZE + 1) for _ in range(SIZE + 1)]
        self.column_used = [[False] * (SIZE + 1) for _ in range(SIZE + 1)]
        self.box_used = [[False] * (SIZE + 1) for _ in range(SIZE + 1)]
        for row in range(1, SIZE + 1):
            for column in range(1, SIZE + 1):
                digit = self.grid[row][column]
                if digit != EMPTY:
                    self.row_used[row][digit] = True
                    self.column_used[column][digit] = True
                    self.box_used[box_index(row, column)][digit] = True

        self.S = [EMPTY] * (self.n + 1)
        self.solution_found = False
        self.solution_text = None
        self.try_count = 0
        self.record_count = 0
        self.restore_count = 0
        self.snapshot_try_numbers = set(snapshot_try_numbers)
        self.snapshots = []

    def conflicting_unit(self, i, j):
        row, column = self.empty_cells[i]
        if self.row_used[row][j]:
            return 'row'
        if self.column_used[column][j]:
            return 'column'
        if self.box_used[box_index(row, column)][j]:
            return 'box'
        return None

    def is_acceptable(self, i, j):
        self.try_count += 1
        acceptable = self.conflicting_unit(i, j) is None
        if self.try_count in self.snapshot_try_numbers:
            self.take_snapshot(i, j, acceptable)
        return acceptable

    def grid_text(self):
        characters = []
        for row in range(1, SIZE + 1):
            for column in range(1, SIZE + 1):
                digit = self.grid[row][column]
                characters.append(EMPTY_MARK if digit == EMPTY else str(digit))
        return ''.join(characters)

    def take_snapshot(self, i, j, acceptable):
        row, column = self.empty_cells[i]
        self.snapshots.append({
            'tryNumber': self.try_count,
            'recordCount': self.record_count,
            'restoreCount': self.restore_count,
            'currentIndex': i,
            'currentRow': row,
            'currentColumn': column,
            'digit': j,
            'accepted': acceptable,
            'conflictingUnit': self.conflicting_unit(i, j),
            'solutionVectorBeforeCurrent': self.S[1:i],
            'grid': self.grid_text(),
        })

    def write_solution(self):
        self.solution_found = True
        self.solution_text = self.grid_text()

    def try_step(self, i):
        for j in range(1, SIZE + 1):
            if self.is_acceptable(i, j):
                self.S[i] = j
                row, column = self.empty_cells[i]
                box = box_index(row, column)
                self.grid[row][column] = self.S[i]
                self.row_used[row][j] = True
                self.column_used[column][j] = True
                self.box_used[box][j] = True
                self.record_count += 1
                if i < self.n:
                    self.try_step(i + 1)
                else:
                    self.write_solution()
                if self.solution_found:
                    return
                self.grid[row][column] = EMPTY
                self.row_used[row][j] = False
                self.column_used[column][j] = False
                self.box_used[box][j] = False
                self.S[i] = EMPTY
                self.restore_count += 1

    def solve(self):
        if self.n == 0:
            self.write_solution()
        else:
            self.try_step(1)


def main():
    puzzle_results = []
    snapshot_results = []
    print(f"{'Puzzle':<20}{'Blanks':>8}{'Tries':>10}{'Records':>10}{'Restores':>10}{'Time':>12}")
    for puzzle_id, name, puzzle_text in SAMPLE_PUZZLES:
        solver = ReferenceSolver(puzzle_text, SNAPSHOT_TRY_NUMBERS.get(puzzle_id, []))
        start_time = time.perf_counter()
        solver.solve()
        elapsed_seconds = time.perf_counter() - start_time
        puzzle_results.append({
            'id': puzzle_id,
            'name': name,
            'puzzle': puzzle_text,
            'blankCount': solver.n,
            'tryCount': solver.try_count,
            'recordCount': solver.record_count,
            'restoreCount': solver.restore_count,
            'solution': solver.solution_text,
        })
        for snapshot in solver.snapshots:
            snapshot_results.append({'puzzleId': puzzle_id, **snapshot})
        print(f"{str(puzzle_id) + '. ' + name:<20}{solver.n:>8}{solver.try_count:>10}"
              f"{solver.record_count:>10}{solver.restore_count:>10}{elapsed_seconds:>11.3f}s")

    output = {'puzzles': puzzle_results, 'snapshots': snapshot_results}
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'\n{len(snapshot_results)} snapshots -> {OUTPUT_PATH.name}')


if __name__ == '__main__':
    main()
