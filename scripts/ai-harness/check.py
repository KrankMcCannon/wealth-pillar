#!/usr/bin/env python3
"""Explicit local checks; default to static validation, --full adds unit tests."""
import argparse
import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess


def run(root, full=False, timeout=180):
    scripts = json.loads((root / 'package.json').read_text()).get('scripts', {})
    commands = [
        ('typecheck', ['pnpm', 'run', 'typecheck'], 'typecheck' in scripts),
        ('lint', ['pnpm', 'run', 'lint'], 'lint' in scripts),
    ]
    if full:
        commands.extend([
            ('financial-dates', ['node', 'scripts/check-financial-dates.mjs'],
             (root / 'scripts/check-financial-dates.mjs').is_file()),
            ('unit', ['pnpm', 'exec', 'vitest', 'run'], 'test' in scripts),
        ])
    prerequisite_error = None
    if not shutil.which('pnpm') or not (root / 'node_modules').is_dir():
        prerequisite_error = 'pnpm or node_modules is missing'
    else:
        try:
            preflight = subprocess.run(['pnpm', '--version'], cwd=root, capture_output=True,
                                       text=True, timeout=min(timeout, 45))
            if preflight.returncode:
                prerequisite_error = 'pnpm startup failed: ' + (preflight.stdout + preflight.stderr)[-2000:]
        except (OSError, subprocess.TimeoutExpired) as error:
            prerequisite_error = 'pnpm startup unavailable: ' + str(error)[:1000]
    steps = []
    for name, command, supported in commands:
        if not supported:
            steps.append({'name': name, 'status': 'not-supported', 'command': command})
        elif prerequisite_error:
            steps.append({'name': name, 'status': 'blocked-environment',
                          'command': command, 'output': prerequisite_error})
        else:
            try:
                result = subprocess.run(command, cwd=root, capture_output=True,
                                        text=True, timeout=timeout,
                                        env={**os.environ, 'CI': 'true', 'NO_COLOR': '1'})
                steps.append({'name': name, 'command': command, 'exit_code': result.returncode,
                              'status': 'passed' if result.returncode == 0 else 'failed-test',
                              'output': (result.stdout + result.stderr)[-16000:]})
            except (OSError, subprocess.TimeoutExpired) as error:
                steps.append({'name': name, 'command': command, 'status': 'blocked-environment',
                              'output': str(error)[:2000]})
    return {'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'mode': 'full' if full else 'quick', 'steps': steps,
            'status': 'passed' if all(s['status'] == 'passed' for s in steps) else 'not-passed'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--quick', action='store_true', help='Static checks only (default)')
    mode.add_argument('--full', action='store_true', help='Static checks plus unit suite')
    parser.add_argument('--timeout', type=int, default=180, help='Seconds per check')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    report = run(root, args.full, max(1, args.timeout))
    output = root / 'output/ai-harness'
    output.mkdir(parents=True, exist_ok=True)
    (output / 'quality-gate.json').write_text(json.dumps(report, indent=2) + '\n')
    for step in report['steps']:
        print(f"{step['name']}: {step['status']}")
        if step['status'] != 'passed':
            print(step.get('output', '')[-2000:])
    print('Report: output/ai-harness/quality-gate.json')
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
