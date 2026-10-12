import json
from pathlib import Path

PROJECT_DIRECTORY = Path(__file__).resolve().parent.parent.parent
PUZZLES_PATH = PROJECT_DIRECTORY / 'checks' / 'sized_puzzles.json'
EXPECTED_PATH = PROJECT_DIRECTORY / 'checks' / 'expected_sized.json'
OUTPUT_PATH = PROJECT_DIRECTORY / 'testcases' / 'other-sizes' / 'other-sizes.txt'
EMPTY_CHARACTER = '.'


def grid_lines(text, size):
    return [text[row * size:(row + 1) * size] for row in range(size)]


def block(puzzle, expected):
    size = puzzle['boxSize'] ** 2
    blank_count = puzzle['puzzle'].count(EMPTY_CHARACTER)
    result = 'SOLVED' if expected['solution'] is not None else 'NO SOLUTION'
    lines = [
        f"=== sized-{puzzle['id']:03d} · {size}x{size} · {puzzle['name']}: {blank_count} ô trống",
        '--- input',
        *grid_lines(puzzle['puzzle'], size),
        '--- expected',
        f'result {result}',
        f"tries {expected['tryCount']}",
        f"records {expected['recordCount']}",
        f"restores {expected['restoreCount']}",
        f"solutions {expected['solutionCount']}",
    ]
    if expected['solution'] is not None:
        lines += grid_lines(expected['solution'], size)
    return '\n'.join(lines)


def main():
    puzzles = json.loads(PUZZLES_PATH.read_text(encoding='utf-8'))
    expected = {item['id']: item for item in json.loads(EXPECTED_PATH.read_text(encoding='utf-8'))['puzzles']}
    blocks = [block(puzzle, expected[puzzle['id']]) for puzzle in puzzles]
    OUTPUT_PATH.write_text('\n\n'.join(blocks) + '\n', encoding='utf-8')
    print(f'{len(blocks)} cases -> {OUTPUT_PATH.relative_to(PROJECT_DIRECTORY)}')


if __name__ == '__main__':
    main()
