"""Check orchestration boundaries without running product services or a test DB."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('quality_gate', Path(__file__).with_name('check.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class CheckTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        (self.root / 'node_modules').mkdir()
        (self.root / 'package.json').write_text(json.dumps({'scripts': {
            'typecheck': 'tsc --noEmit', 'lint': 'eslint .', 'test': 'vitest'}}))
        (self.root / 'scripts').mkdir()
        (self.root / 'scripts/check-financial-dates.mjs').touch()

    def execute(self, results, **kwargs):
        with patch.object(gate.shutil, 'which', return_value='/pnpm'), \
                patch.object(gate.subprocess, 'run', side_effect=results) as run:
            report = gate.run(self.root, **kwargs)
        return report, run

    def result(self, code=0, output=''):
        return subprocess.CompletedProcess([], code, output, '')

    def test_default_checks_do_not_start_unit_suite(self):
        report, run = self.execute([self.result()] * 3)
        self.assertEqual(report['status'], 'passed')
        self.assertEqual([s['name'] for s in report['steps']], ['typecheck', 'lint'])
        commands = [c.args[0] for c in run.call_args_list]
        self.assertEqual(commands[-1], ['pnpm', 'run', 'lint'])
        self.assertFalse(any('vitest' in command for command in commands))

    def test_full_runs_unit_tests_once_and_preserves_runner_failures(self):
        report, run = self.execute([self.result()] * 4 + [self.result(1, 'Assertion failed')], full=True)
        self.assertEqual(report['status'], 'not-passed')
        self.assertEqual(report['steps'][-1]['status'], 'failed-test')
        commands = [c.args[0] for c in run.call_args_list]
        self.assertEqual(commands.count(['pnpm', 'exec', 'vitest', 'run']), 1)
        self.assertIn(['node', 'scripts/check-financial-dates.mjs'], commands)
        self.assertEqual(report['steps'][-1]['exit_code'], 1)

    def test_bootstrap_failure_does_not_start_verification(self):
        report, run = self.execute([self.result(1, 'Registry unavailable')], full=True)
        self.assertEqual(run.call_count, 1)
        self.assertEqual({s['status'] for s in report['steps']}, {'blocked-environment'})

    def test_missing_package_manager_does_not_start_verification(self):
        with patch.object(gate.shutil, 'which', return_value=None), \
                patch.object(gate.subprocess, 'run') as run:
            report = gate.run(self.root)
        run.assert_not_called()
        self.assertEqual(report['status'], 'not-passed')
        self.assertEqual({s['status'] for s in report['steps']}, {'blocked-environment'})

    def test_failed_static_check_does_not_hide_other_results(self):
        report, _ = self.execute([self.result(), self.result(1, 'Type error'), self.result()])
        self.assertEqual([s['status'] for s in report['steps']], ['failed-test', 'passed'])

    def test_timeout_is_incomplete_verification(self):
        report, _ = self.execute([self.result(), subprocess.TimeoutExpired('pnpm', 1), self.result()])
        self.assertEqual(report['status'], 'not-passed')
        self.assertEqual(report['steps'][0]['status'], 'blocked-environment')

    def test_missing_declared_command_is_not_a_pass(self):
        (self.root / 'package.json').write_text('{"scripts": {}}')
        report, run = self.execute([self.result(), self.result()], full=True)
        self.assertEqual(report['status'], 'not-passed')
        self.assertEqual(run.call_count, 2)  # preflight and financial-date check only
        self.assertEqual([s['status'] for s in report['steps']],
                         ['not-supported', 'not-supported', 'passed', 'not-supported'])


if __name__ == '__main__':
    unittest.main()
