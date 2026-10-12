import json
import sys
from pathlib import Path

DIGIT_CHARACTERS = '123456789ABCDEFG'
EMPTY_CHARACTER = '.'
OUTPUT_PATH = Path(__file__).resolve().parent / 'expected_sized.json'
INPUT_PATH = Path(__file__).resolve().parent / 'sized_puzzles.json'
MAXIMUM_COUNTED_SOLUTIONS = 1000
UNLIMITED = float('inf')


class SizedGrid:
    def __init__(self, box_size, puzzle):
        self.box_size = box_size
        self.size = box_size * box_size
        if len(puzzle) != self.size * self.size:
            raise ValueError(f'Puzzle must have {self.size * self.size} characters')
        self.cells = [DIGIT_CHARACTERS.index(character) + 1 if character != EMPTY_CHARACTER else 0 for character in puzzle]
        self.row_used = [[False] * (self.size + 1) for _ in range(self.size)]
        self.column_used = [[False] * (self.size + 1) for _ in range(self.size)]
        self.box_used = [[False] * (self.size + 1) for _ in range(self.size)]
        self.is_valid = True
        for index, digit in enumerate(self.cells):
            if digit == 0:
                continue
            row, column = divmod(index, self.size)
            box = self.box_of(row, column)
            if self.row_used[row][digit] or self.column_used[column][digit] or self.box_used[box][digit]:
                self.is_valid = False
            self.row_used[row][digit] = True
            self.column_used[column][digit] = True
            self.box_used[box][digit] = True
        self.empty_cells = [divmod(index, self.size) for index, digit in enumerate(self.cells) if digit == 0]

    def box_of(self, row, column):
        return (row // self.box_size) * self.box_size + column // self.box_size

    def text(self):
        return ''.join(DIGIT_CHARACTERS[digit - 1] if digit else EMPTY_CHARACTER for digit in self.cells)


def solve(box_size, puzzle, try_limit=UNLIMITED, stop_after=1):
    grid = SizedGrid(box_size, puzzle)
    size = grid.size
    result = {'tryCount': 0, 'recordCount': 0, 'restoreCount': 0, 'solutionCount': 0, 'firstSolution': None, 'isComplete': True}
    if not grid.is_valid:
        result['isValid'] = False
        return result
    result['isValid'] = True
    empty_cells = grid.empty_cells
    blank_count = len(empty_cells)
    cells = grid.cells
    row_used, column_used, box_used = grid.row_used, grid.column_used, grid.box_used
    sys.setrecursionlimit(10000)

    def found_enough():
        return result['solutionCount'] >= stop_after

    def try_step(position):
        row, column = empty_cells[position]
        box = grid.box_of(row, column)
        for digit in range(1, size + 1):
            if found_enough():
                return
            if result['tryCount'] >= try_limit:
                result['isComplete'] = False
                return
            result['tryCount'] += 1
            if row_used[row][digit] or column_used[column][digit] or box_used[box][digit]:
                continue
            cells[row * size + column] = digit
            row_used[row][digit] = column_used[column][digit] = box_used[box][digit] = True
            result['recordCount'] += 1
            if position + 1 < blank_count:
                try_step(position + 1)
            else:
                result['solutionCount'] += 1
                if result['firstSolution'] is None:
                    result['firstSolution'] = grid.text()
            if found_enough() and stop_after == 1:
                return
            cells[row * size + column] = 0
            row_used[row][digit] = column_used[column][digit] = box_used[box][digit] = False
            result['restoreCount'] += 1

    if blank_count == 0:
        result['solutionCount'] = 1
        result['firstSolution'] = grid.text()
        return result
    try_step(0)
    return result


def measure(entry):
    first = solve(entry['boxSize'], entry['puzzle'])
    counted = solve(entry['boxSize'], entry['puzzle'], stop_after=MAXIMUM_COUNTED_SOLUTIONS)
    return {
        'id': entry['id'],
        'name': entry['name'],
        'boxSize': entry['boxSize'],
        'blankCount': entry['puzzle'].count(EMPTY_CHARACTER),
        'isValid': first['isValid'],
        'tryCount': first['tryCount'],
        'recordCount': first['recordCount'],
        'restoreCount': first['restoreCount'],
        'solution': first['firstSolution'],
        'solutionCount': counted['solutionCount'],
        'fullSearchTryCount': counted['tryCount'],
    }


def main():
    entries = json.loads(INPUT_PATH.read_text(encoding='utf-8'))
    measured = []
    for entry in entries:
        result = measure(entry)
        measured.append(result)
        print(f"{result['id']:>3} {result['name']:<28} k={result['boxSize'] ** 2:<3} blanks={result['blankCount']:<4} tries={result['tryCount']:<10} restores={result['restoreCount']:<8} solutions={result['solutionCount']}")
    OUTPUT_PATH.write_text(json.dumps({'puzzles': measured}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'-> {OUTPUT_PATH.name}')


if __name__ == '__main__':
    main()
