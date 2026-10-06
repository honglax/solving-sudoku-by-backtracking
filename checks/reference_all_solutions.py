import json
import time
from pathlib import Path

from reference_solver import SAMPLE_PUZZLES, ReferenceSolver

OUTPUT_PATH = Path(__file__).with_name('expected_all_solutions.json')
FULL_SEARCH_TRY_LIMIT = 50_000_000
KEPT_SOLUTION_COUNT = 3


class TryLimitReached(Exception):
    pass


class AllSolutionsSolver(ReferenceSolver):
    def __init__(self, puzzle_text):
        super().__init__(puzzle_text, [])
        self.solution_count = 0
        self.first_solutions = []

    def is_acceptable(self, i, j):
        if self.try_count >= FULL_SEARCH_TRY_LIMIT:
            raise TryLimitReached()
        return super().is_acceptable(i, j)

    def write_solution(self):
        self.solution_count += 1
        if len(self.first_solutions) < KEPT_SOLUTION_COUNT:
            self.first_solutions.append(self.grid_text())


def main():
    results = []
    print(f"{'Puzzle':<34}{'Solutions':>10}{'Tries':>12}{'Records':>12}{'Restores':>12}{'Time':>9}")
    for puzzle_id, name, puzzle_text in SAMPLE_PUZZLES:
        solver = AllSolutionsSolver(puzzle_text)
        start_time = time.perf_counter()
        try:
            solver.solve()
        except TryLimitReached:
            print(f"{str(puzzle_id) + '. ' + name:<34} skipped: more than {FULL_SEARCH_TRY_LIMIT} tries")
            continue
        elapsed_seconds = time.perf_counter() - start_time
        results.append({
            'id': puzzle_id,
            'solutionCount': solver.solution_count,
            'tryCount': solver.try_count,
            'recordCount': solver.record_count,
            'restoreCount': solver.restore_count,
            'firstSolutions': solver.first_solutions,
        })
        print(f"{str(puzzle_id) + '. ' + name:<34}{solver.solution_count:>10}{solver.try_count:>12}"
              f"{solver.record_count:>12}{solver.restore_count:>12}{elapsed_seconds:>8.2f}s")
    OUTPUT_PATH.write_text(json.dumps({'puzzles': results}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'\n{len(results)} puzzles -> {OUTPUT_PATH.name}')


if __name__ == '__main__':
    main()
