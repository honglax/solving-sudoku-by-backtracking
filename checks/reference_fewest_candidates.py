import json
import time
from pathlib import Path

from reference_solver import EMPTY, EMPTY_MARK, SAMPLE_PUZZLES, SIZE, box_index

OUTPUT_PATH = Path(__file__).with_name('expected_fewest_candidates.json')
NO_CELL = None


class FewestCandidatesSolver:
    def __init__(self, puzzle_text):
        self.grid = [[EMPTY] * (SIZE + 1) for _ in range(SIZE + 1)]
        self.empty_cells = []
        for position, character in enumerate(puzzle_text):
            row = position // SIZE + 1
            column = position % SIZE + 1
            if character == EMPTY_MARK:
                self.empty_cells.append((row, column))
            else:
                self.grid[row][column] = int(character)
        self.n = len(self.empty_cells)

        self.row_used = [[False] * (SIZE + 1) for _ in range(SIZE + 1)]
        self.column_used = [[False] * (SIZE + 1) for _ in range(SIZE + 1)]
        self.box_used = [[False] * (SIZE + 1) for _ in range(SIZE + 1)]
        for row in range(1, SIZE + 1):
            for column in range(1, SIZE + 1):
                digit = self.grid[row][column]
                if digit != EMPTY:
                    self.set_flags(row, column, digit, True)

        self.S = [EMPTY] * (self.n + 1)
        self.chosen_cells = [NO_CELL] * (self.n + 1)
        self.solution_found = False
        self.solution_text = None
        self.try_count = 0
        self.record_count = 0
        self.restore_count = 0

    def set_flags(self, row, column, digit, is_used):
        self.row_used[row][digit] = is_used
        self.column_used[column][digit] = is_used
        self.box_used[box_index(row, column)][digit] = is_used

    def digit_fits(self, row, column, digit):
        return not (self.row_used[row][digit]
                    or self.column_used[column][digit]
                    or self.box_used[box_index(row, column)][digit])

    def is_acceptable(self, row, column, j):
        self.try_count += 1
        return self.digit_fits(row, column, j)

    def choose_cell(self):
        best_cell = NO_CELL
        best_candidate_count = SIZE + 1
        for row, column in self.empty_cells:
            if self.grid[row][column] != EMPTY:
                continue
            candidate_count = sum(1 for digit in range(1, SIZE + 1) if self.digit_fits(row, column, digit))
            if candidate_count < best_candidate_count:
                best_cell = (row, column)
                best_candidate_count = candidate_count
        return best_cell

    def grid_text(self):
        characters = []
        for row in range(1, SIZE + 1):
            for column in range(1, SIZE + 1):
                digit = self.grid[row][column]
                characters.append(EMPTY_MARK if digit == EMPTY else str(digit))
        return ''.join(characters)

    def try_step(self, i):
        row, column = self.choose_cell()
        self.chosen_cells[i] = (row, column)
        for j in range(1, SIZE + 1):
            if self.is_acceptable(row, column, j):
                self.S[i] = j
                self.grid[row][column] = self.S[i]
                self.set_flags(row, column, j, True)
                self.record_count += 1
                if i < self.n:
                    self.try_step(i + 1)
                else:
                    self.solution_found = True
                    self.solution_text = self.grid_text()
                if self.solution_found:
                    return
                self.grid[row][column] = EMPTY
                self.set_flags(row, column, j, False)
                self.S[i] = EMPTY
                self.restore_count += 1

    def solve(self):
        if self.n == 0:
            self.solution_found = True
            self.solution_text = self.grid_text()
        else:
            self.try_step(1)


def main():
    results = []
    print(f"{'Puzzle':<34}{'Tries':>12}{'Records':>10}{'Restores':>10}{'Time':>10}")
    for puzzle_id, name, puzzle_text in SAMPLE_PUZZLES:
        solver = FewestCandidatesSolver(puzzle_text)
        start_time = time.perf_counter()
        solver.solve()
        elapsed_seconds = time.perf_counter() - start_time
        results.append({
            'id': puzzle_id,
            'tryCount': solver.try_count,
            'recordCount': solver.record_count,
            'restoreCount': solver.restore_count,
            'solution': solver.solution_text,
        })
        print(f"{str(puzzle_id) + '. ' + name:<34}{solver.try_count:>12}{solver.record_count:>10}"
              f"{solver.restore_count:>10}{elapsed_seconds:>9.2f}s")
    OUTPUT_PATH.write_text(json.dumps({'puzzles': results}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'\n{len(results)} puzzles -> {OUTPUT_PATH.name}')


if __name__ == '__main__':
    main()
