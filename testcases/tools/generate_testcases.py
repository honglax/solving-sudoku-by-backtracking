import csv
import json
import random
import re
import sys
import time
from pathlib import Path

TOOLS_DIRECTORY = Path(__file__).resolve().parent
TESTCASES_DIRECTORY = TOOLS_DIRECTORY.parent
PROJECT_DIRECTORY = TESTCASES_DIRECTORY.parent
sys.path.insert(0, str(PROJECT_DIRECTORY / 'checks'))

from reference_solver import BOX_SIZE, CELL_COUNT, EMPTY, SAMPLE_PUZZLES, SIZE, ReferenceSolver

EXPECTED_COUNTS_PATH = PROJECT_DIRECTORY / 'checks' / 'expected_counts.json'
MANIFEST_PATH = TESTCASES_DIRECTORY / 'manifest.csv'

RANDOM_SEED = 20261006
RANDOM_CASE_TRY_LIMIT = 1_000_000
SLOW_TRY_THRESHOLD = 10_000_000
SOLUTION_COUNT_CAP = 1000
UNIQUE_CHECK_LIMIT = 2

SMALL_CASE_COUNT = 40
SMALL_BLANK_COUNTS = [1, 2, 3, 4, 5]
NORMAL_CASE_COUNT = 150
NORMAL_FIRST_BLANK_COUNT = 20
NORMAL_LAST_BLANK_COUNT = 50
LARGE_UNIQUE_CASE_COUNT = 25
LARGE_UNIQUE_BLANK_COUNTS = [51, 52, 53, 54, 55, 56]
LARGE_MANY_SOLUTION_CASE_COUNT = 14
LARGE_MANY_SOLUTION_BLANK_COUNTS = [58, 60, 62, 64, 66, 68, 70]
TWO_SOLUTION_CASE_COUNT = 4
UNSOLVABLE_CASE_COUNT = 6
UNSOLVABLE_SOURCE_BLANK_COUNT = 45

FIRST_DIGIT = 1
LAST_DIGIT = SIZE
DIGITS = list(range(FIRST_DIGIT, LAST_DIGIT + 1))
NINE_LINE_BLANK_MARK = 'X'
STRING_BLANK_MARK = '.'
NO_SOLUTION_LINE = 'NO SOLUTION'
INVALID_LINE = 'INVALID'
WHITESPACE_PATTERN = re.compile(r'\s')
WHITESPACE_RUN_PATTERN = re.compile(r'\s+')
LINE_BREAK_PATTERN = re.compile(r'\r?\n')
SINGLE_DIGIT_PATTERN = re.compile(r'^[1-9]$')

ROYLE_FIRST_SEVENTEEN_GIVENS = '000000010400000000020000000000050407008000300001090000300400200050100000000806000'

GROUP_FILES = {
    'small': '01-small.txt',
    'normal': '02-normal.txt',
    'large': '03-large.txt',
    'boundary': '04-boundary.txt',
    'special': '05-special.txt',
    'invalid': '06-invalid.txt',
}

GROUP_TITLES = {
    'small': 'Nhóm Nhỏ: 1-5 ô trống',
    'normal': 'Nhóm Thông thường: 20-50 ô trống, lời giải duy nhất',
    'large': 'Nhóm Lớn / khó: 51-70 ô trống và các đề nổi tiếng',
    'boundary': 'Nhóm Biên',
    'special': 'Nhóm Đặc biệt: nhiều lời giải, vô nghiệm, các cách viết đề',
    'invalid': 'Nhóm Không hợp lệ',
}

CASE_HEADER_PREFIX = '=== '
CASE_TITLE_SEPARATOR = ' · '
INPUT_MARKER = '--- input\n'
EXPECTED_MARKER = '--- expected\n'
GROUP_FILE_INTRODUCTION = (
    'Mỗi đề gồm: dòng "=== mã · mô tả", phần "--- input" (nội dung đề, giữ nguyên từng ký tự),\n'
    'phần "--- expected" (kết quả mong đợi). Các bộ đếm của từng đề nằm trong manifest.csv.\n'
)

UNIT_NAMES = ['row', 'column', 'box']

MANIFEST_COLUMNS = [
    'id', 'group', 'file', 'inputFormat', 'blankCount', 'expectedKind', 'solutionCount',
    'tryCount', 'recordCount', 'restoreCount', 'rowRejectCount', 'columnRejectCount', 'boxRejectCount',
    'isSlow', 'description',
]


class TryLimitExceeded(Exception):
    pass


class LimitedReferenceSolver(ReferenceSolver):
    def __init__(self, puzzle_text, try_limit):
        super().__init__(puzzle_text, [])
        self.try_limit = try_limit
        self.reject_counts = {unit: 0 for unit in UNIT_NAMES}

    def is_acceptable(self, i, j):
        if self.try_limit is not None and self.try_count >= self.try_limit:
            raise TryLimitExceeded()
        acceptable = super().is_acceptable(i, j)
        if not acceptable:
            self.reject_counts[self.conflicting_unit(i, j)] += 1
        return acceptable


def box_of(row, column):
    return (row // BOX_SIZE) * BOX_SIZE + column // BOX_SIZE


def shuffled(rng, items):
    items_copy = list(items)
    rng.shuffle(items_copy)
    return items_copy


class MaskedGrid:
    def __init__(self, grid):
        self.cells = list(grid)
        self.row_masks = [0] * SIZE
        self.column_masks = [0] * SIZE
        self.box_masks = [0] * SIZE
        self.has_duplicate = False
        for index, digit in enumerate(self.cells):
            if digit == EMPTY:
                continue
            if not self.is_free(index, digit):
                self.has_duplicate = True
            self.mark(index, digit)

    def used_bits(self, index):
        row, column = divmod(index, SIZE)
        return self.row_masks[row] | self.column_masks[column] | self.box_masks[box_of(row, column)]

    def is_free(self, index, digit):
        return not self.used_bits(index) & (1 << digit)

    def candidates(self, index):
        used_bits = self.used_bits(index)
        return [digit for digit in DIGITS if not used_bits & (1 << digit)]

    def mark(self, index, digit):
        row, column = divmod(index, SIZE)
        digit_bit = 1 << digit
        self.row_masks[row] |= digit_bit
        self.column_masks[column] |= digit_bit
        self.box_masks[box_of(row, column)] |= digit_bit

    def place(self, index, digit):
        self.cells[index] = digit
        self.mark(index, digit)

    def remove(self, index, digit):
        row, column = divmod(index, SIZE)
        digit_bit = 1 << digit
        self.cells[index] = EMPTY
        self.row_masks[row] &= ~digit_bit
        self.column_masks[column] &= ~digit_bit
        self.box_masks[box_of(row, column)] &= ~digit_bit

    def most_constrained_empty_cell(self):
        best_index = None
        best_candidates = None
        for index, digit in enumerate(self.cells):
            if digit != EMPTY:
                continue
            candidates = self.candidates(index)
            if best_candidates is None or len(candidates) < len(best_candidates):
                best_index = index
                best_candidates = candidates
                if len(candidates) == 0:
                    break
        return best_index, best_candidates


def random_solution_grid(rng):
    masked_grid = MaskedGrid([EMPTY] * CELL_COUNT)

    def fill():
        index, candidates = masked_grid.most_constrained_empty_cell()
        if index is None:
            return True
        for digit in shuffled(rng, candidates):
            masked_grid.place(index, digit)
            if fill():
                return True
            masked_grid.remove(index, digit)
        return False

    fill()
    return masked_grid.cells


def count_solutions(grid, limit):
    masked_grid = MaskedGrid(grid)
    if masked_grid.has_duplicate:
        return 0
    found_count = 0

    def search():
        nonlocal found_count
        index, candidates = masked_grid.most_constrained_empty_cell()
        if index is None:
            found_count += 1
            return
        for digit in candidates:
            masked_grid.place(index, digit)
            search()
            masked_grid.remove(index, digit)
            if found_count >= limit:
                return

    search()
    return found_count


def is_valid_solution(puzzle, solution):
    for index, digit in enumerate(puzzle):
        if digit != EMPTY and solution[index] != digit:
            return False
    expected_digits = set(DIGITS)
    for unit_number in range(SIZE):
        row_digits = {solution[unit_number * SIZE + column] for column in range(SIZE)}
        column_digits = {solution[row * SIZE + unit_number] for row in range(SIZE)}
        box_digits = {solution[row * SIZE + column]
                      for row in range(SIZE) for column in range(SIZE)
                      if box_of(row, column) == unit_number}
        if row_digits != expected_digits or column_digits != expected_digits or box_digits != expected_digits:
            return False
    return True


def parse_puzzle_text(text):
    trimmed_text = text.strip()
    if WHITESPACE_PATTERN.search(trimmed_text):
        return parse_nine_line_format(trimmed_text)
    return parse_single_string(trimmed_text)


def parse_nine_line_format(text):
    lines = [line.strip() for line in LINE_BREAK_PATTERN.split(text)]
    lines = [line for line in lines if len(line) > 0]
    if len(lines) != SIZE:
        return None, f'wrong line count: {len(lines)}'
    grid = []
    for line_index, line in enumerate(lines):
        line_number = line_index + 1
        if WHITESPACE_PATTERN.search(line):
            cell_texts = WHITESPACE_RUN_PATTERN.split(line)
        else:
            cell_texts = list(line)
        if len(cell_texts) != SIZE:
            return None, f'line {line_number}: wrong cell count: {len(cell_texts)}'
        for cell_text in cell_texts:
            if cell_text == NINE_LINE_BLANK_MARK:
                grid.append(EMPTY)
            elif SINGLE_DIGIT_PATTERN.match(cell_text):
                grid.append(int(cell_text))
            else:
                return None, f'line {line_number}: invalid character "{cell_text}"'
    return grid, None


def parse_single_string(text):
    characters = list(text)
    if len(characters) != CELL_COUNT:
        return None, f'wrong string length: {len(characters)}'
    grid = []
    for character_index, character in enumerate(characters):
        if character == STRING_BLANK_MARK:
            grid.append(EMPTY)
        elif SINGLE_DIGIT_PATTERN.match(character):
            grid.append(int(character))
        else:
            return None, f'position {character_index + 1}: invalid character "{character}"'
    return grid, None


def find_duplicate_descriptions(grid):
    units = {
        'row': lambda index: index // SIZE,
        'column': lambda index: index % SIZE,
        'box': lambda index: box_of(index // SIZE, index % SIZE),
    }
    descriptions = []
    for unit_name, unit_of_index in units.items():
        for unit_number in range(SIZE):
            digits_in_unit = [grid[index] for index in range(CELL_COUNT)
                              if unit_of_index(index) == unit_number and grid[index] != EMPTY]
            for digit in sorted(set(digits_in_unit)):
                if digits_in_unit.count(digit) > 1:
                    descriptions.append(f'duplicate {digit} in {unit_name} {unit_number + 1}')
    return sorted(descriptions)


def grid_to_nine_lines(grid):
    lines = []
    for row in range(SIZE):
        cells = grid[row * SIZE:(row + 1) * SIZE]
        lines.append(' '.join(NINE_LINE_BLANK_MARK if digit == EMPTY else str(digit) for digit in cells))
    return '\n'.join(lines) + '\n'


def grid_to_compact_lines(grid):
    lines = []
    for row in range(SIZE):
        cells = grid[row * SIZE:(row + 1) * SIZE]
        lines.append(''.join(NINE_LINE_BLANK_MARK if digit == EMPTY else str(digit) for digit in cells))
    return '\n'.join(lines) + '\n'


def grid_to_string(grid):
    return ''.join(STRING_BLANK_MARK if digit == EMPTY else str(digit) for digit in grid)


def string_to_grid(text):
    return [EMPTY if character in '.0' else int(character) for character in text]


def load_sample_counts():
    expected = json.loads(EXPECTED_COUNTS_PATH.read_text(encoding='utf-8'))
    return {puzzle['puzzle']: puzzle for puzzle in expected['puzzles']}


SAMPLE_COUNTS = load_sample_counts()

COUNT_COLUMNS = ['tryCount', 'recordCount', 'restoreCount', 'rowRejectCount', 'columnRejectCount', 'boxRejectCount']
EMPTY_COUNTS = {column: '' for column in COUNT_COLUMNS}
ZERO_COUNTS = {column: 0 for column in COUNT_COLUMNS}


def compute_expected(input_text, try_limit):
    grid, parse_error = parse_puzzle_text(input_text)
    if parse_error is not None:
        return {'kind': 'invalid', 'output': f'{INVALID_LINE}\n{parse_error}\n', 'blankCount': '',
                'solutionCount': '', **EMPTY_COUNTS}
    duplicates = find_duplicate_descriptions(grid)
    if duplicates:
        return {'kind': 'invalid', 'output': INVALID_LINE + '\n' + '\n'.join(duplicates) + '\n',
                'blankCount': grid.count(EMPTY), 'solutionCount': '', **EMPTY_COUNTS}
    blank_count = grid.count(EMPTY)
    if blank_count == 0:
        return {'kind': 'complete', 'output': grid_to_nine_lines(grid), 'blankCount': 0, 'solutionCount': 1,
                **ZERO_COUNTS}

    puzzle_text = grid_to_string(grid)
    measured_sample = SAMPLE_COUNTS.get(puzzle_text)
    if measured_sample is not None and measured_sample['tryCount'] > SLOW_TRY_THRESHOLD:
        solution_text = measured_sample['solution']
        counts = {**EMPTY_COUNTS, 'tryCount': measured_sample['tryCount'],
                  'recordCount': measured_sample['recordCount'], 'restoreCount': measured_sample['restoreCount']}
    else:
        solver = LimitedReferenceSolver(puzzle_text, try_limit)
        solver.solve()
        solution_text = solver.solution_text
        counts = {'tryCount': solver.try_count, 'recordCount': solver.record_count,
                  'restoreCount': solver.restore_count,
                  'rowRejectCount': solver.reject_counts['row'],
                  'columnRejectCount': solver.reject_counts['column'],
                  'boxRejectCount': solver.reject_counts['box']}

    solution_count = count_solutions(grid, SOLUTION_COUNT_CAP)
    solution_count_text = f'{SOLUTION_COUNT_CAP}+' if solution_count >= SOLUTION_COUNT_CAP else solution_count
    if solution_text is None:
        if solution_count != 0:
            raise AssertionError(f'Reference found no solution but the counter found {solution_count}: {puzzle_text}')
        output = NO_SOLUTION_LINE + '\n'
        kind = 'noSolution'
    else:
        solution = string_to_grid(solution_text)
        if solution_count == 0 or not is_valid_solution(grid, solution):
            raise AssertionError(f'Reference solution is not valid: {puzzle_text}')
        output = grid_to_nine_lines(solution)
        kind = 'solved'
    return {'kind': kind, 'output': output, 'blankCount': blank_count, 'solutionCount': solution_count_text,
            **counts}


def remove_random_cells(rng, solution, blank_count):
    puzzle = list(solution)
    for position in rng.sample(range(CELL_COUNT), blank_count):
        puzzle[position] = EMPTY
    return puzzle


def remove_cells_keeping_unique(rng, solution, target_blank_count):
    puzzle = list(solution)
    blank_count = 0
    for position in shuffled(rng, range(CELL_COUNT)):
        if blank_count == target_blank_count:
            break
        removed_digit = puzzle[position]
        puzzle[position] = EMPTY
        if count_solutions(puzzle, UNIQUE_CHECK_LIMIT) == 1:
            blank_count += 1
        else:
            puzzle[position] = removed_digit
    if blank_count == target_blank_count:
        return puzzle
    return None


def find_swappable_rectangle(solution):
    for first_row in range(SIZE):
        for second_row in range(first_row + 1, SIZE):
            if first_row // BOX_SIZE != second_row // BOX_SIZE:
                continue
            for first_column in range(SIZE):
                for second_column in range(first_column + 1, SIZE):
                    if first_column // BOX_SIZE == second_column // BOX_SIZE:
                        continue
                    top_left = solution[first_row * SIZE + first_column]
                    top_right = solution[first_row * SIZE + second_column]
                    bottom_left = solution[second_row * SIZE + first_column]
                    bottom_right = solution[second_row * SIZE + second_column]
                    if top_left == bottom_right and top_right == bottom_left:
                        return [first_row * SIZE + first_column, first_row * SIZE + second_column,
                                second_row * SIZE + first_column, second_row * SIZE + second_column]
    return None


class TestcaseCollector:
    def __init__(self):
        self.cases = []
        self.counter_by_group = {group: 0 for group in GROUP_FILES}

    def add(self, group, input_text, input_format, description, expected=None):
        if expected is None:
            expected = compute_expected(input_text, None)
        self.counter_by_group[group] += 1
        case_id = f'{group}-{self.counter_by_group[group]:03d}'
        is_slow = isinstance(expected['tryCount'], int) and expected['tryCount'] > SLOW_TRY_THRESHOLD
        self.cases.append({
            'id': case_id, 'group': group, 'inputFormat': input_format, 'description': description,
            'input': input_text, 'expected': expected, 'isSlow': is_slow,
        })
        return expected

    def try_add_generated(self, group, puzzle, input_format, description, expected_kind):
        input_text = format_grid(puzzle, input_format)
        try:
            expected = compute_expected(input_text, RANDOM_CASE_TRY_LIMIT)
        except TryLimitExceeded:
            return False
        if expected['kind'] != expected_kind:
            return False
        self.add(group, input_text, input_format, description, expected)
        return True


def format_grid(grid, input_format):
    if input_format == 'nineLines':
        return grid_to_nine_lines(grid)
    if input_format == 'compactLines':
        return grid_to_compact_lines(grid)
    if input_format == 'singleString':
        return grid_to_string(grid) + '\n'
    raise ValueError(input_format)


def sample_grid(sample_name):
    for _, name, puzzle_text in SAMPLE_PUZZLES:
        if name == sample_name:
            return string_to_grid(puzzle_text)
    raise KeyError(sample_name)


def grid_with_givens(givens):
    grid = [EMPTY] * CELL_COUNT
    for (row, column), digit in givens.items():
        grid[(row - 1) * SIZE + (column - 1)] = digit
    return grid


def add_small_cases(collector, rng):
    collector.add('small', format_grid(sample_grid('Dễ nhất'), 'nineLines'), 'nineLines', 'Đề mẫu "Dễ nhất": 1 ô trống')
    collector.add('small', format_grid(sample_grid('Dễ'), 'nineLines'), 'nineLines', 'Đề mẫu "Dễ": 5 ô trống')
    case_index = 0
    while collector.counter_by_group['small'] < SMALL_CASE_COUNT:
        blank_count = SMALL_BLANK_COUNTS[case_index % len(SMALL_BLANK_COUNTS)]
        puzzle = remove_random_cells(rng, random_solution_grid(rng), blank_count)
        if collector.try_add_generated('small', puzzle, 'nineLines', f'Sinh ngẫu nhiên: {blank_count} ô trống', 'solved'):
            case_index += 1


def add_normal_cases(collector, rng):
    collector.add('normal', format_grid(sample_grid('Vừa'), 'nineLines'), 'nineLines', 'Đề mẫu "Vừa": 40 ô trống')
    blank_count_range = NORMAL_LAST_BLANK_COUNT - NORMAL_FIRST_BLANK_COUNT + 1
    case_index = 0
    while collector.counter_by_group['normal'] < NORMAL_CASE_COUNT:
        target_blank_count = NORMAL_FIRST_BLANK_COUNT + case_index % blank_count_range
        puzzle = remove_cells_keeping_unique(rng, random_solution_grid(rng), target_blank_count)
        if puzzle is None:
            continue
        description = f'Sinh ngẫu nhiên, lời giải duy nhất: {target_blank_count} ô trống'
        if collector.try_add_generated('normal', puzzle, 'nineLines', description, 'solved'):
            case_index += 1


def add_large_cases(collector, rng):
    famous_puzzles = [
        ('Wikipedia', 'Đề minh họa trên Wikipedia "Sudoku": 51 ô trống'),
        ('Arto Inkala', 'Đề của Arto Inkala (2012), được báo chí gọi là "khó nhất thế giới"'),
        ('AI Escargot', 'Đề AI Escargot của Arto Inkala (2006)'),
        ('Easter Monster', 'Đề Easter Monster (2007), nổi tiếng khó với người giải'),
        ('Chống quay lui', 'Đề chống quay lui: dòng đầu của lời giải là 9 8 7 6 5 4 3 2 1'),
    ]
    for sample_name, description in famous_puzzles:
        collector.add('large', format_grid(sample_grid(sample_name), 'nineLines'), 'nineLines', description)
    collector.add('large', format_grid(string_to_grid(ROYLE_FIRST_SEVENTEEN_GIVENS), 'nineLines'), 'nineLines',
                  'Đề 17 số cho sẵn, đề đầu tiên trong danh sách của Gordon Royle')

    unique_case_target = collector.counter_by_group['large'] + LARGE_UNIQUE_CASE_COUNT
    case_index = 0
    while collector.counter_by_group['large'] < unique_case_target:
        target_blank_count = LARGE_UNIQUE_BLANK_COUNTS[case_index % len(LARGE_UNIQUE_BLANK_COUNTS)]
        puzzle = remove_cells_keeping_unique(rng, random_solution_grid(rng), target_blank_count)
        if puzzle is None:
            continue
        description = f'Sinh ngẫu nhiên, lời giải duy nhất: {target_blank_count} ô trống'
        if collector.try_add_generated('large', puzzle, 'nineLines', description, 'solved'):
            case_index += 1

    many_solution_case_target = unique_case_target + LARGE_MANY_SOLUTION_CASE_COUNT
    case_index = 0
    while collector.counter_by_group['large'] < many_solution_case_target:
        blank_count = LARGE_MANY_SOLUTION_BLANK_COUNTS[case_index % len(LARGE_MANY_SOLUTION_BLANK_COUNTS)]
        puzzle = remove_random_cells(rng, random_solution_grid(rng), blank_count)
        description = f'Sinh ngẫu nhiên, nhiều lời giải: {blank_count} ô trống'
        if collector.try_add_generated('large', puzzle, 'nineLines', description, 'solved'):
            case_index += 1


def add_boundary_cases(collector, rng):
    full_grid = random_solution_grid(rng)
    collector.add('boundary', format_grid(full_grid, 'nineLines'), 'nineLines', 'Lưới đã điền đủ, hợp lệ: 0 ô trống')
    collector.add('boundary', format_grid(string_to_grid(SAMPLE_COUNTS[grid_to_string(sample_grid('Dễ nhất'))]['solution']), 'nineLines'),
                  'nineLines', 'Lời giải của đề "Dễ nhất" nhập lại làm đề: 0 ô trống')
    collector.add('boundary', format_grid(sample_grid('Lưới trống'), 'nineLines'), 'nineLines', 'Lưới trống: 81 ô trống')
    collector.add('boundary', format_grid(grid_with_givens({(5, 5): 5}), 'nineLines'), 'nineLines',
                  'Chỉ một số cho sẵn ở ô giữa: 80 ô trống')

    def blanked(cells_to_blank, solution):
        puzzle = list(solution)
        for index in cells_to_blank:
            puzzle[index] = EMPTY
        return puzzle

    first_cell = [0]
    last_cell = [CELL_COUNT - 1]
    first_row = [column for column in range(SIZE)]
    last_column = [row * SIZE + SIZE - 1 for row in range(SIZE)]
    center_box = [index for index in range(CELL_COUNT) if box_of(index // SIZE, index % SIZE) == SIZE // 2]
    main_diagonal = [position * SIZE + position for position in range(SIZE)]
    top_band = [index for index in range(CELL_COUNT) if index // SIZE < BOX_SIZE]
    boundary_shapes = [
        (first_cell, '1 ô trống ở ô đầu tiên (1, 1)'),
        (last_cell, '1 ô trống ở ô cuối cùng (9, 9)'),
        (first_row, 'Trống trọn hàng 1'),
        (last_column, 'Trống trọn cột 9'),
        (center_box, 'Trống trọn khối giữa'),
        (main_diagonal, 'Trống đường chéo chính'),
        (top_band, 'Trống trọn 3 hàng đầu (27 ô)'),
    ]
    for cells_to_blank, description in boundary_shapes:
        collector.add('boundary', format_grid(blanked(cells_to_blank, random_solution_grid(rng)), 'nineLines'),
                      'nineLines', description)

    solution = random_solution_grid(rng)
    cell_holding_nine = solution.index(LAST_DIGIT)
    collector.add('boundary', format_grid(blanked([cell_holding_nine], solution), 'nineLines'), 'nineLines',
                  'Ô trống duy nhất có đáp án là 9: phải thử đủ 9 số')
    solution = random_solution_grid(rng)
    cell_holding_one = solution.index(FIRST_DIGIT)
    collector.add('boundary', format_grid(blanked([cell_holding_one], solution), 'nineLines'), 'nineLines',
                  'Ô trống duy nhất có đáp án là 1: thử 1 lần là xong')


def add_special_cases(collector, rng):
    collector.add('special', format_grid(sample_grid('Nhiều lời giải'), 'nineLines'), 'nineLines',
                  'Đề mẫu "Nhiều lời giải"')
    collector.add('special', format_grid(sample_grid('Vô nghiệm ngay ô đầu'), 'nineLines'), 'nineLines',
                  'Đề mẫu "Vô nghiệm ngay ô đầu": ô (1, 1) không còn số nào hợp lệ')
    collector.add('special', format_grid(sample_grid('Vô nghiệm, phải tìm mới biết'), 'nineLines'), 'nineLines',
                  'Đề mẫu "Vô nghiệm, phải tìm mới biết"')

    added_rectangles = 0
    while added_rectangles < TWO_SOLUTION_CASE_COUNT:
        solution = random_solution_grid(rng)
        rectangle = find_swappable_rectangle(solution)
        if rectangle is None:
            continue
        puzzle = list(solution)
        for index in rectangle:
            puzzle[index] = EMPTY
        if collector.try_add_generated('special', puzzle, 'nineLines',
                                       'Đúng 2 lời giải: 4 ô trống tạo thành hình chữ nhật đổi chỗ được', 'solved'):
            added_rectangles += 1

    added_unsolvable = 0
    while added_unsolvable < UNSOLVABLE_CASE_COUNT:
        solution = random_solution_grid(rng)
        puzzle = remove_cells_keeping_unique(rng, solution, UNSOLVABLE_SOURCE_BLANK_COUNT)
        if puzzle is None:
            continue
        given_indexes = [index for index, digit in enumerate(puzzle) if digit != EMPTY]
        changed_index = rng.choice(given_indexes)
        original_digit = puzzle[changed_index]
        for replacement_digit in shuffled(rng, DIGITS):
            if replacement_digit == original_digit:
                continue
            puzzle[changed_index] = replacement_digit
            if find_duplicate_descriptions(puzzle):
                continue
            description = 'Vô nghiệm dù không có số trùng: đổi một số cho sẵn của đề có lời giải duy nhất'
            if collector.try_add_generated('special', puzzle, 'nineLines', description, 'noSolution'):
                added_unsolvable += 1
            break

    string_samples = [
        ('Vừa', 'Định dạng chuỗi 81 ký tự, dấu chấm là ô trống: đề "Vừa"'),
        ('Nhiều lời giải', 'Định dạng chuỗi 81 ký tự: đề "Nhiều lời giải"'),
        ('Vô nghiệm, phải tìm mới biết', 'Định dạng chuỗi 81 ký tự: đề vô nghiệm'),
    ]
    for sample_name, description in string_samples:
        collector.add('special', format_grid(sample_grid(sample_name), 'singleString'), 'singleString', description)

    collector.add('special', format_grid(sample_grid('Wikipedia'), 'compactLines'), 'compactLines',
                  '9 dòng viết liền, không dấu cách: đề Wikipedia')
    collector.add('special', format_grid(sample_grid('Dễ'), 'compactLines'), 'compactLines',
                  '9 dòng viết liền, không dấu cách: đề "Dễ"')

    vua_lines = grid_to_nine_lines(sample_grid('Vừa')).splitlines()
    collector.add('special', '\n\n' + '\n\n'.join(vua_lines) + '\n\n\n', 'nineLines',
                  'Có dòng trống xen giữa và ở đầu, cuối file')
    collector.add('special', '\r\n'.join(vua_lines) + '\r\n', 'nineLines', 'Xuống dòng kiểu Windows (CRLF)')
    collector.add('special', '\n'.join('   ' + line.replace(' ', ' \t  ') + '  ' for line in vua_lines) + '\n',
                  'nineLines', 'Nhiều dấu cách và tab giữa các số, thụt đầu dòng')


def add_invalid_cases(collector):
    minimal_duplicates = [
        ({(4, 1): 7, (4, 9): 7}, 'Trùng số 7 ở hàng 4 (khác cột, khác khối)'),
        ({(1, 3): 5, (9, 3): 5}, 'Trùng số 5 ở cột 3 (khác hàng, khác khối)'),
        ({(1, 1): 2, (3, 3): 2}, 'Trùng số 2 ở khối 1 (khác hàng, khác cột)'),
        ({(2, 1): 4, (2, 2): 4}, 'Trùng số 4 cùng lúc ở hàng 2 và khối 1'),
        ({(1, 1): 9, (1, 5): 9, (1, 9): 9}, 'Số 9 xuất hiện 3 lần ở hàng 1'),
        ({(1, 1): 1, (1, 2): 1, (5, 5): 3, (9, 5): 3}, 'Hai chỗ trùng: số 1 ở hàng 1 và số 3 ở cột 5'),
    ]
    for givens, description in minimal_duplicates:
        collector.add('invalid', format_grid(grid_with_givens(givens), 'nineLines'), 'nineLines', description)

    vua_grid = sample_grid('Vừa')
    vua_with_row_duplicate = list(vua_grid)
    vua_with_row_duplicate[4] = vua_grid[0]
    collector.add('invalid', format_grid(vua_with_row_duplicate, 'nineLines'), 'nineLines',
                  'Đề "Vừa" điền thêm một số trùng với ô (1, 1)')
    collector.add('invalid', format_grid(vua_with_row_duplicate, 'singleString'), 'singleString',
                  'Như trên, định dạng chuỗi 81 ký tự')

    vua_lines = grid_to_nine_lines(vua_grid).splitlines()

    def with_line(line_index, new_line):
        lines = list(vua_lines)
        lines[line_index] = new_line
        return '\n'.join(lines) + '\n'

    def replace_token(line_index, token_index, new_token):
        tokens = vua_lines[line_index].split(' ')
        tokens[token_index] = new_token
        return with_line(line_index, ' '.join(tokens))

    collector.add('invalid', replace_token(1, 0, '0'), 'nineLines', 'Số 0 thay cho ô trống ở dòng 2')
    collector.add('invalid', replace_token(2, 3, 'a'), 'nineLines', 'Chữ cái "a" ở dòng 3')
    collector.add('invalid', replace_token(3, 0, 'x'), 'nineLines', 'Chữ "x" thường thay cho "X" ở dòng 4')
    collector.add('invalid', replace_token(4, 4, '10'), 'nineLines', 'Số 10 ở dòng 5')
    collector.add('invalid', replace_token(5, 0, '.'), 'nineLines', 'Dấu chấm (ký hiệu của định dạng chuỗi) trong định dạng 9 dòng')
    collector.add('invalid', replace_token(6, 2, '-'), 'nineLines', 'Dấu "-" ở dòng 7')
    collector.add('invalid', '\n'.join(vua_lines[:8]) + '\n', 'nineLines', 'Thiếu một dòng: chỉ có 8 dòng')
    collector.add('invalid', '\n'.join(vua_lines + [vua_lines[0]]) + '\n', 'nineLines', 'Thừa một dòng: 10 dòng')
    collector.add('invalid', with_line(2, ' '.join(vua_lines[2].split(' ')[:8])), 'nineLines', 'Dòng 3 chỉ có 8 ô')
    collector.add('invalid', with_line(7, vua_lines[7] + ' 1'), 'nineLines', 'Dòng 8 có 10 ô')
    collector.add('invalid', ' '.join(vua_lines) + '\n', 'nineLines', 'Cả 81 ô viết trên một dòng có dấu cách')

    vua_string = grid_to_string(vua_grid)
    collector.add('invalid', vua_string[:80] + '\n', 'singleString', 'Chuỗi chỉ có 80 ký tự')
    collector.add('invalid', vua_string + '5\n', 'singleString', 'Chuỗi có 82 ký tự')
    collector.add('invalid', vua_string.replace('.', '0') + '\n', 'singleString',
                  'Chuỗi dùng số 0 cho ô trống (quy ước ở một số trang khác)')
    collector.add('invalid', vua_string[:9] + 'x' + vua_string[10:] + '\n', 'singleString', 'Chữ "x" trong chuỗi 81 ký tự')
    collector.add('invalid', '', 'empty', 'File rỗng')
    collector.add('invalid', '\n   \n\n', 'empty', 'File chỉ có dấu cách và dòng trống')


def format_case_block(case):
    input_text = case['input']
    if input_text and not input_text.endswith('\n'):
        raise AssertionError(f"Input of {case['id']} must end with a line break to keep its block readable")
    header = f"{CASE_HEADER_PREFIX}{case['id']}{CASE_TITLE_SEPARATOR}{case['description']}\n"
    return header + INPUT_MARKER + input_text + EXPECTED_MARKER + case['expected']['output']


def write_group_files(cases):
    for group, file_name in GROUP_FILES.items():
        group_cases = [case for case in cases if case['group'] == group]
        introduction = f'{GROUP_TITLES[group]} ({len(group_cases)} đề)\n{GROUP_FILE_INTRODUCTION}\n'
        blocks = '\n'.join(format_case_block(case) for case in group_cases)
        (TESTCASES_DIRECTORY / file_name).write_bytes((introduction + blocks).encode('utf-8'))


def write_manifest(cases):
    rows = []
    for case in cases:
        expected = case['expected']
        rows.append({
            'id': case['id'], 'group': case['group'], 'file': GROUP_FILES[case['group']],
            'inputFormat': case['inputFormat'], 'blankCount': expected['blankCount'],
            'expectedKind': expected['kind'], 'solutionCount': expected['solutionCount'],
            **{column: expected[column] for column in COUNT_COLUMNS}, 'isSlow': 'yes' if case['isSlow'] else 'no',
            'description': case['description'],
        })
    with MANIFEST_PATH.open('w', encoding='utf-8', newline='') as manifest_file:
        writer = csv.DictWriter(manifest_file, fieldnames=MANIFEST_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


def main():
    start_time = time.perf_counter()
    rng = random.Random(RANDOM_SEED)
    collector = TestcaseCollector()
    add_small_cases(collector, rng)
    add_normal_cases(collector, rng)
    add_large_cases(collector, rng)
    add_boundary_cases(collector, rng)
    add_special_cases(collector, rng)
    add_invalid_cases(collector)
    write_group_files(collector.cases)
    write_manifest(collector.cases)
    print(f"{'Group':<12}{'Cases':>8}")
    for group, count in collector.counter_by_group.items():
        print(f'{group:<12}{count:>8}')
    print(f"{'total':<12}{len(collector.cases):>8}")
    print(f'Generated in {time.perf_counter() - start_time:.1f}s -> {MANIFEST_PATH.relative_to(PROJECT_DIRECTORY)}')


if __name__ == '__main__':
    main()
