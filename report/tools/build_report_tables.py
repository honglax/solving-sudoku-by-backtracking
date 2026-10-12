import csv
import json
from pathlib import Path

REPORT_DIRECTORY = Path(__file__).resolve().parent.parent
PROJECT_DIRECTORY = REPORT_DIRECTORY.parent
GENERATED_DIRECTORY = REPORT_DIRECTORY / 'generated'
STEPS_PATH = REPORT_DIRECTORY / 'data' / 'illustration-steps.csv'
COMPARISON_PATH = REPORT_DIRECTORY / 'data' / 'comparison-measurements.csv'
EXPECTED_COUNTS_PATH = PROJECT_DIRECTORY / 'checks' / 'expected_counts.json'
MANIFEST_PATH = PROJECT_DIRECTORY / 'testcases' / 'manifest.csv'
RESULTS_PATH = PROJECT_DIRECTORY / 'testcases' / 'results' / 'results.csv'

SIZE = 9
BOX_SIZE = 3
EMPTY_MARK = '.'
NINE_LINE_BLANK_MARK = 'X'
ILLUSTRATION_PUZZLE_ID = 13
MULTIPLE_SOLUTIONS_PUZZLE_ID = 8
NO_SOLUTION_AT_FIRST_CELL_PUZZLE_ID = 7
ROW_DUPLICATE_GIVENS = {(4, 1): 7, (4, 9): 7}

UNIT_NAMES = {'row': 'hàng', 'column': 'cột', 'box': 'khối'}
ACTION_NAMES = {
    'accept': 'Chấp nhận',
    'reject': 'Bị loại',
    'restore': 'Trả lại',
    'solution': 'Có lời giải',
    'noSolution': 'Vô nghiệm',
}

GROUP_ORDER = ['small', 'normal', 'large', 'boundary', 'special', 'invalid']
GROUP_NAMES = {
    'small': 'Nhỏ',
    'normal': 'Thông thường',
    'large': 'Lớn, khó',
    'boundary': 'Biên',
    'special': 'Đặc biệt',
    'invalid': 'Không hợp lệ',
}
CELL_ORDERS = ['rowMajor', 'fewestCandidates']
CHECK_STRATEGIES = ['gridScan', 'usageFlags', 'bitmask']
THOUSANDS_SEPARATOR = '.'
DECIMAL_SEPARATOR = ','
LARGE_DURATION_MILLISECONDS = 100
MEDIUM_DURATION_MILLISECONDS = 10
SMALL_DURATION_MILLISECONDS = 1

THICK_RULE = r'\noalign{\hrule height 1.2pt}'
GRID_COLUMNS = '!{\\vrule width 1.2pt}' + '!{\\vrule width 1.2pt}'.join(['G|G|G'] * BOX_SIZE) + '!{\\vrule width 1.2pt}'


def load_puzzles():
    puzzles = json.loads(EXPECTED_COUNTS_PATH.read_text(encoding='utf-8'))['puzzles']
    return {puzzle['id']: puzzle for puzzle in puzzles}


def grid_from_givens(givens):
    cells = [EMPTY_MARK] * (SIZE * SIZE)
    for (row, column), digit in givens.items():
        cells[(row - 1) * SIZE + (column - 1)] = str(digit)
    return ''.join(cells)


def grid_tabular(grid_text, puzzle_text):
    lines = [r'\begingroup\setlength{\tabcolsep}{0pt}\renewcommand{\arraystretch}{1.35}',
             r'\begin{tabular}{' + GRID_COLUMNS + '}', THICK_RULE]
    for row in range(SIZE):
        cells = []
        for column in range(SIZE):
            index = row * SIZE + column
            digit = grid_text[index]
            if digit == EMPTY_MARK:
                cells.append('')
            elif puzzle_text[index] != EMPTY_MARK:
                cells.append(r'\textbf{' + digit + '}')
            else:
                cells.append(r'\textcolor{blue!65!black}{' + digit + '}')
        is_box_bottom = (row + 1) % BOX_SIZE == 0
        lines.append(' & '.join(cells) + r' \\ ' + (THICK_RULE if is_box_bottom else r'\hline'))
    lines += [r'\end{tabular}\endgroup']
    return '\n'.join(lines) + '\n'


def nine_line_text(grid_text):
    rows = []
    for row in range(SIZE):
        cells = grid_text[row * SIZE:(row + 1) * SIZE]
        rows.append(' '.join(NINE_LINE_BLANK_MARK if digit == EMPTY_MARK else digit for digit in cells))
    return rows


def verbatim_block(lines):
    return '\\begin{Verbatim}[fontsize=\\small, frame=single]\n' + '\n'.join(lines) + '\n\\end{Verbatim}\n'


def cell_text(row, column):
    return f'({row}, {column})'


def unit_number_of(unit, row, column):
    if unit == 'row':
        return row
    if unit == 'column':
        return column
    return ((row - 1) // BOX_SIZE) * BOX_SIZE + (column - 1) // BOX_SIZE + 1


def step_reason(step):
    action = step['action']
    if action == 'reject':
        unit_name = UNIT_NAMES[step['unit']]
        unit_number = unit_number_of(step['unit'], int(step['row']), int(step['column']))
        conflict = cell_text(step['conflictRow'], step['conflictColumn'])
        return f"trùng {unit_name} {unit_number} ở ô {conflict}"
    if action == 'accept':
        return 'không trùng'
    if action == 'restore':
        return 'ô sau hết số'
    if action == 'solution':
        return 'đủ 16 ô'
    return ''


def steps_longtable(steps):
    header = (r'\textbf{Bấm} & \textbf{Lần thử} & \(\boldsymbol{i}\) & \textbf{Ô} & \(\boldsymbol{j}\) & '
              r'\textbf{Thao tác} & \textbf{Lý do} & \multicolumn{1}{l}{\textbf{\(S\) sau bước}} \\')
    lines = [r'\begingroup\footnotesize\setlength{\tabcolsep}{3pt}',
             r'\begin{longtable}{@{}rrrcc>{\raggedright\arraybackslash}p{2.1cm}>{\raggedright\arraybackslash}p{3.3cm}>{\ttfamily}l@{}}',
             r'\caption{Toàn bộ các bước giải đề số 13}\label{tab:illustration-steps}\\',
             r'\toprule', header, r'\midrule', r'\endfirsthead',
             r'\toprule', header, r'\midrule', r'\endhead',
             r'\bottomrule', r'\endfoot']
    for step in steps:
        has_cell = step['row'] != ''
        cells = [
            step['stepButtonPresses'],
            step['tryNumber'],
            step['index'],
            cell_text(step['row'], step['column']) if has_cell else '',
            step['digit'],
            ACTION_NAMES[step['action']],
            step_reason(step),
            step['solutionVector'],
        ]
        lines.append(' & '.join(cells) + r' \\')
    lines += [r'\end{longtable}', r'\endgroup']
    return '\n'.join(lines) + '\n'


def format_count(value):
    return f'{int(value):,}'.replace(',', THOUSANDS_SEPARATOR)


def format_milliseconds(value):
    if value >= LARGE_DURATION_MILLISECONDS:
        return format_count(round(value))
    if value >= MEDIUM_DURATION_MILLISECONDS:
        decimals = 1
    elif value >= SMALL_DURATION_MILLISECONDS:
        decimals = 2
    else:
        decimals = 3
    return f'{value:.{decimals}f}'.replace('.', DECIMAL_SEPARATOR)


def comparison_tables(puzzles):
    with COMPARISON_PATH.open(encoding='utf-8') as comparison_file:
        rows = list(csv.DictReader(comparison_file))
    by_puzzle = {}
    for row in rows:
        by_puzzle.setdefault(int(row['puzzleId']), {})[row['methodId']] = row
    try_lines = [r'\begin{tabular}{@{}lrrrr@{}}', r'\toprule',
                 r'\textbf{Đề} & \textbf{Ô trống} & \textbf{Điền lần lượt} & \textbf{Ô dễ nhất trước} & \textbf{Giảm} \\',
                 r'\midrule']
    time_lines = [r'\begin{tabular}{@{}lrrrrrr@{}}', r'\toprule',
                  r' & \multicolumn{3}{c}{\textbf{Điền lần lượt}} & \multicolumn{3}{c}{\textbf{Ô dễ nhất trước}} \\',
                  r'\cmidrule(lr){2-4}\cmidrule(l){5-7}',
                  r'\textbf{Đề} & Lưới & Sổ & Công tắc & Lưới & Sổ & Công tắc \\', r'\midrule']
    for puzzle_id, methods in by_puzzle.items():
        name = puzzles[puzzle_id]['name']
        row_major_tries = int(methods['rowMajor:usageFlags']['tryCount'])
        fewest_tries = int(methods['fewestCandidates:usageFlags']['tryCount'])
        ratio = row_major_tries / fewest_tries
        try_lines.append(f"{name} & {puzzles[puzzle_id]['blankCount']} & {format_count(row_major_tries)} & "
                         f"{format_count(fewest_tries)} & {format_count(round(ratio))} lần \\\\")
        times = [format_milliseconds(float(methods[f'{order}:{check}']['millisecondsPerRun']))
                 for order in CELL_ORDERS for check in CHECK_STRATEGIES]
        time_lines.append(name + ' & ' + ' & '.join(times) + r' \\')
    try_lines += [r'\bottomrule', r'\end{tabular}']
    time_lines += [r'\bottomrule', r'\end{tabular}']
    return '\n'.join(try_lines) + '\n', '\n'.join(time_lines) + '\n'


def testcase_group_table():
    with MANIFEST_PATH.open(encoding='utf-8') as manifest_file:
        manifest = list(csv.DictReader(manifest_file))
    with RESULTS_PATH.open(encoding='utf-8') as results_file:
        results = {row['id']: row for row in csv.DictReader(results_file)}
    lines = [r'\begin{tabular}{@{}lrrrrr@{}}', r'\toprule',
             r'\textbf{Nhóm} & \textbf{Số đề} & \textbf{Ô trống} & \textbf{Lần thử} & \textbf{Đạt} & \textbf{Thời gian lớn nhất} \\',
             r'\midrule']
    for group in GROUP_ORDER:
        entries = [entry for entry in manifest if entry['group'] == group]
        blanks = [int(entry['blankCount']) for entry in entries if entry['blankCount']]
        tries = [int(entry['tryCount']) for entry in entries if entry['tryCount']]
        ran = [results[entry['id']] for entry in entries if entry['id'] in results]
        passed = sum(1 for row in ran if row['status'] == 'passed')
        slowest = max(float(row['milliseconds']) for row in ran)
        shows_blank_range = blanks and group != 'invalid'
        blank_range = f'{min(blanks)} - {max(blanks)}' if shows_blank_range else ''
        try_range = f'{format_count(min(tries))} - {format_count(max(tries))}' if tries else ''
        lines.append(f'{GROUP_NAMES[group]} & {len(entries)} & {blank_range} & {try_range} & '
                     f'{passed}/{len(ran)} & {format_milliseconds(slowest)} ms \\\\')
    lines += [r'\bottomrule', r'\end{tabular}']
    return '\n'.join(lines) + '\n'


def write(name, content):
    (GENERATED_DIRECTORY / name).write_text(content, encoding='utf-8')


def main():
    GENERATED_DIRECTORY.mkdir(exist_ok=True)
    puzzles = load_puzzles()
    illustration = puzzles[ILLUSTRATION_PUZZLE_ID]
    multiple = puzzles[MULTIPLE_SOLUTIONS_PUZZLE_ID]
    no_solution = puzzles[NO_SOLUTION_AT_FIRST_CELL_PUZZLE_ID]
    duplicate_grid = grid_from_givens(ROW_DUPLICATE_GIVENS)

    write('grid-illustration-puzzle.tex', grid_tabular(illustration['puzzle'], illustration['puzzle']))
    write('grid-illustration-solution.tex', grid_tabular(illustration['solution'], illustration['puzzle']))
    write('text-illustration-input.tex', verbatim_block(nine_line_text(illustration['puzzle'])))
    write('text-illustration-output.tex', verbatim_block(nine_line_text(illustration['solution'])))
    write('text-multiple-input.tex', verbatim_block(nine_line_text(multiple['puzzle'])))
    write('text-multiple-output.tex', verbatim_block(nine_line_text(multiple['solution'])))
    write('text-duplicate-input.tex', verbatim_block(nine_line_text(duplicate_grid)))
    write('text-no-solution-input.tex', verbatim_block(nine_line_text(no_solution['puzzle'])))

    with STEPS_PATH.open(encoding='utf-8') as steps_file:
        steps = list(csv.DictReader(steps_file))
    write('illustration-steps.tex', steps_longtable(steps))
    try_table, time_table = comparison_tables(puzzles)
    write('comparison-tries.tex', try_table)
    write('comparison-times.tex', time_table)
    write('testcase-groups.tex', testcase_group_table())
    print(f'{len(steps)} steps and 8 grids -> {GENERATED_DIRECTORY.relative_to(PROJECT_DIRECTORY)}')


if __name__ == '__main__':
    main()
