#!/usr/bin/env python3
"""Small project-local evidence cache. No services, hooks or automatic prompts."""
import argparse
from contextlib import contextmanager
import datetime
import fcntl
import hashlib
import json
from pathlib import Path
import re
import sys
import tempfile


def source_path(root, relative):
    path = Path(relative)
    if path.is_absolute() or '..' in path.parts or not path.parts:
        raise ValueError('Sources must be repository-relative files')
    if any(part in {'.git', 'node_modules', 'output', '.clerk', 'playwright'}
           or part.startswith('.env') or part.endswith(('.pem', '.key'))
           for part in path.parts):
        raise ValueError('Private/generated files cannot be evidence sources')
    if path.parts[0] == '.codex' and path.as_posix() != '.codex/config.toml' \
            and path.parts[:2] != ('.codex', 'agents'):
        raise ValueError('Local Codex state cannot be an evidence source')
    resolved = (root / path).resolve()
    if not resolved.is_relative_to(root.resolve()):
        raise ValueError('Evidence source escapes the repository')
    return resolved


def fingerprint(root, relative):
    return hashlib.sha256(source_path(root, relative).read_bytes()).hexdigest()


class Knowledge:
    def __init__(self, root):
        self.root = root.resolve()
        self.path = self.root / 'output/ai-harness/knowledge/entries.json'

    def load(self):
        if not self.path.exists():
            return {}
        data = json.loads(self.path.read_text())
        if not isinstance(data, dict) or data.get('version') != 1 \
                or data.get('project') != str(self.root) \
                or not isinstance(data.get('entries'), dict):
            raise ValueError('Unsupported cache format or different project; inspect before reuse')
        for key, entry in data['entries'].items():
            if not isinstance(entry, dict) or entry.get('kind') not in {
                    'decision', 'preference', 'pitfall'} \
                    or not isinstance(entry.get('claim'), str) \
                    or not isinstance(entry.get('verified_at'), str) \
                    or not isinstance(entry.get('sources'), dict) or not entry['sources'] \
                    or any(not isinstance(digest, str) for digest in entry['sources'].values()):
                raise ValueError('Invalid cache entry: ' + key)
        return data['entries']

    @contextmanager
    def locked(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.with_suffix('.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            yield

    def save(self, entries):
        data = {'version': 1, 'project': str(self.root), 'entries': entries}
        with tempfile.NamedTemporaryFile(mode='w', dir=self.path.parent,
                                         delete=False) as file:
            temporary = Path(file.name)
            try:
                json.dump(data, file, ensure_ascii=False, indent=2)
                file.write('\n')
            except BaseException:
                temporary.unlink(missing_ok=True)
                raise
        try:
            temporary.replace(self.path)
        finally:
            temporary.unlink(missing_ok=True)

    def put(self, key, kind, claim, sources):
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', key):
            raise ValueError('Use a stable lowercase-hyphen ID')
        if kind not in {'decision', 'preference', 'pitfall'} or not claim.strip() \
                or len(claim) > 1200 or not sources:
            raise ValueError('Expected kind, short nonempty claim (max 1200 chars) and sources')
        evidence = {s: fingerprint(self.root, s) for s in dict.fromkeys(sources)}
        with self.locked():
            entries = self.load()
            entries[key] = {'kind': kind, 'claim': claim.strip(), 'sources': evidence,
                            'verified_at': datetime.datetime.now(datetime.timezone.utc).isoformat()}
            self.save(entries)

    def find(self, query='', limit=8):
        matches = []
        terms = query.casefold().split()
        for key, entry in sorted(self.load().items()):
            text = ' '.join([key, entry['kind'], entry['claim'], *entry['sources']]).casefold()
            if terms and not all(term in text for term in terms):
                continue
            changed = []
            for source, expected in entry['sources'].items():
                try:
                    if fingerprint(self.root, source) == expected:
                        continue
                except (OSError, ValueError):
                    pass
                changed.append(source)
            matches.append({'id': key, **entry, 'status': 'stale' if changed else 'current',
                            'changed_sources': changed})
        return matches[:limit]

    def forget(self, key):
        with self.locked():
            entries = self.load()
            if key not in entries:
                raise ValueError('Unknown cache ID')
            del entries[key]
            self.save(entries)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    find = sub.add_parser('find', help='Search claims and check source fingerprints')
    find.add_argument('query', nargs='*')
    put = sub.add_parser('put', help='Replace a verified note by stable ID')
    put.add_argument('id')
    put.add_argument('--kind', choices=['decision', 'preference', 'pitfall'], required=True)
    put.add_argument('--claim', required=True)
    put.add_argument('--source', action='append', required=True)
    forget = sub.add_parser('forget', help='Remove a wrong or no longer useful note')
    forget.add_argument('id')
    args = parser.parse_args()
    cache = Knowledge(Path(__file__).resolve().parents[2])
    try:
        if args.command == 'find':
            print(json.dumps(cache.find(' '.join(args.query)), ensure_ascii=False, indent=2))
        elif args.command == 'put':
            cache.put(args.id, args.kind, args.claim, args.source)
            print('Saved: ' + args.id)
        else:
            cache.forget(args.id)
            print('Removed: ' + args.id)
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.exit(1, 'Knowledge cache: ' + str(error) + '\n')


if __name__ == '__main__':
    sys.exit(main())
