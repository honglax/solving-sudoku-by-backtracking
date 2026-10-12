import random
import sys

from reference_sized_solver import DIGIT_CHARACTERS, EMPTY_CHARACTER, solve

SEED = 20261013
CANDIDATES_PER_TARGET = 40
TRY_LIMIT = 3_000_000


def base_grid(box_size):
    size = box_size * box_size
    return [[(box_size * (row % box_size) + row // box_size + column) % size + 1 for column in range(size)] for row in range(size)]


def shuffled_grid(box_size, rng):
    size = box_size * box_size
    grid = base_grid(box_size)
    digit_map = list(range(1, size + 1))
    rng.shuffle(digit_map)

    def shuffled_axis():
        bands = list(range(box_size))
        rng.shuffle(bands)
        order = []
        for band in bands:
            inside = list(range(box_size))
            rng.shuffle(inside)
            order.extend(band * box_size + offset for offset in inside)
        return order

    row_order = shuffled_axis()
    column_order = shuffled_axis()
    return [[digit_map[grid[row_order[row]][column_order[column]] - 1] for column in range(size)] for row in range(size)]


def to_text(grid, blanks):
    size = len(grid)
    return ''.join(EMPTY_CHARACTER if (row, column) in blanks else DIGIT_CHARACTERS[grid[row][column] - 1] for row in range(size) for column in range(size))


def candidate(box_size, blank_count, rng):
    size = box_size * box_size
    grid = shuffled_grid(box_size, rng)
    cells = [(row, column) for row in range(size) for column in range(size)]
    blanks = set(rng.sample(cells, blank_count))
    return to_text(grid, blanks)


def main():
    box_size = int(sys.argv[1])
    blank_counts = [int(value) for value in sys.argv[2].split(',')]
    rng = random.Random(SEED + box_size)
    for blank_count in blank_counts:
        results = []
        for _ in range(CANDIDATES_PER_TARGET):
            puzzle = candidate(box_size, blank_count, rng)
            result = solve(box_size, puzzle, try_limit=TRY_LIMIT)
            if result['isComplete'] and result['solutionCount'] == 1:
                results.append((result['tryCount'], result['restoreCount'], puzzle))
        results.sort()
        print(f'blanks={blank_count}: {len(results)} solvable candidates')
        for tries, restores, puzzle in results[:: max(1, len(results) // 6)]:
            print(f'  tries={tries:<9} restores={restores:<8} {puzzle}')


if __name__ == '__main__':
    main()
