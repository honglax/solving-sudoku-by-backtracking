import random
import sys
from pathlib import Path

CHECKS_DIRECTORY = Path(__file__).resolve().parent
sys.path.insert(0, str(CHECKS_DIRECTORY.parent / 'testcases' / 'tools'))

import generate_testcases as testcase_tools

RANDOM_SEED = 7
ATTEMPT_LIMIT = 40_000
WANTED_CANDIDATE_COUNT = 12
FEWEST_BLANKS = 10
MOST_BLANKS = 16
FEWEST_TRIES = 50
MOST_TRIES = 90
FEWEST_RESTORES = 1
MOST_RESTORES = 3
TRY_LIMIT = 200
UNIQUE_CHECK_LIMIT = 2


def solved_sample_grids():
    return [testcase_tools.string_to_grid(sample['solution'])
            for sample in testcase_tools.SAMPLE_COUNTS.values()
            if sample['solution'] is not None]


def measure(puzzle):
    solver = testcase_tools.LimitedReferenceSolver(testcase_tools.grid_to_string(puzzle), TRY_LIMIT)
    try:
        solver.solve()
    except testcase_tools.TryLimitExceeded:
        return None
    return solver


def is_good_illustration(solver):
    every_unit_rejects = all(count > 0 for count in solver.reject_counts.values())
    return (FEWEST_TRIES <= solver.try_count <= MOST_TRIES
            and FEWEST_RESTORES <= solver.restore_count <= MOST_RESTORES
            and every_unit_rejects)


def main():
    rng = random.Random(RANDOM_SEED)
    sample_solutions = solved_sample_grids()
    candidates = []
    for attempt in range(ATTEMPT_LIMIT):
        uses_sample_solution = attempt % 2 == 1
        solution = rng.choice(sample_solutions) if uses_sample_solution else testcase_tools.random_solution_grid(rng)
        blank_count = rng.randint(FEWEST_BLANKS, MOST_BLANKS)
        puzzle = testcase_tools.remove_random_cells(rng, solution, blank_count)
        if testcase_tools.count_solutions(puzzle, UNIQUE_CHECK_LIMIT) != 1:
            continue
        solver = measure(puzzle)
        if solver is None or not is_good_illustration(solver):
            continue
        candidates.append((solver.try_count, solver.restore_count, blank_count,
                           solver.reject_counts, testcase_tools.grid_to_string(puzzle)))
        if len(candidates) >= WANTED_CANDIDATE_COUNT:
            break

    print(f"{'Tries':>6}{'Restores':>10}{'Blanks':>8}  {'Rejects row/column/box':<24}Puzzle")
    for try_count, restore_count, blank_count, reject_counts, puzzle_text in sorted(candidates, key=lambda row: row[0]):
        rejects = f"{reject_counts['row']}/{reject_counts['column']}/{reject_counts['box']}"
        print(f'{try_count:>6}{restore_count:>10}{blank_count:>8}  {rejects:<24}{puzzle_text}')


if __name__ == '__main__':
    main()
