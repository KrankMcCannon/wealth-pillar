#!/usr/bin/env python3
"""Validate the shared harness without personal files, credentials or services."""
import json
from pathlib import Path
import tomllib


def inspect(root):
    checks = []

    def check(name, passed):
        checks.append({'check': name, 'passed': bool(passed)})

    base = root / '.codex'
    try:
        config = tomllib.loads((base / 'config.toml').read_text())
        check('project config TOML', True)
        for name, role in config.get('agents', {}).items():
            path = (base / role['config_file']).resolve()
            if not path.is_relative_to(base.resolve()):
                check('portable role: ' + name, False)
                continue
            agent = tomllib.loads(path.read_text())
            check('role: ' + name, agent.get('name') == name
                  and all(isinstance(agent.get(k), str) and agent[k]
                          for k in ['description', 'developer_instructions']))
    except (OSError, ValueError, KeyError, TypeError):
        check('project config and role files', False)
    for relative in ['AGENTS.md', '.agents/skills/wealth-pillar-flow/SKILL.md',
                     'scripts/ai-harness/check.py', 'scripts/ai-harness/test_check.py']:
        check(relative, (root / relative).is_file())
    instructions = (root / 'AGENTS.md').read_text() if (root / 'AGENTS.md').is_file() else ''
    return {'status': 'passed' if all(c['passed'] for c in checks) else 'not-passed',
            'checks': checks, 'repo_instructions': {'bytes': len(instructions.encode()),
                                                 'words': len(instructions.split())}}


def main():
    report = inspect(Path(__file__).resolve().parents[2])
    print(json.dumps(report, indent=2))
    return 0 if report['status'] == 'passed' else 1


if __name__ == '__main__':
    raise SystemExit(main())
