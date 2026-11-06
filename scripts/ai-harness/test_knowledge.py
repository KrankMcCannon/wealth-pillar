"""Verify persistence, invalidation and isolation without reading personal memory."""
import importlib.util
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('knowledge', Path(__file__).with_name('knowledge.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class KnowledgeTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name).resolve()
        self.source = self.root / 'contract.md'
        self.source.write_text('Source contract')
        self.cache = module.Knowledge(self.root)

    def put(self, claim='Verified currency decision'):
        self.cache.put('currency-inputs', 'decision', claim, ['contract.md'])

    def test_empty_read_does_not_create_state(self):
        self.assertEqual(self.cache.find(), [])
        self.assertFalse((self.root / 'output').exists())

    def test_persist_search_and_replace_without_duplicates(self):
        self.put()
        persisted = module.Knowledge(self.root)
        self.assertEqual(persisted.find('currency')[0]['status'], 'current')
        self.assertEqual(persisted.find('absent'), [])
        self.put('Corrected currency decision')
        results = persisted.find()
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['claim'], 'Corrected currency decision')
        self.assertTrue(results[0]['verified_at'])

    def test_changed_or_deleted_evidence_is_stale(self):
        self.put()
        self.source.write_text('Changed source')
        result = self.cache.find()[0]
        self.assertEqual(result['status'], 'stale')
        self.assertEqual(result['changed_sources'], ['contract.md'])
        self.source.unlink()
        self.assertEqual(self.cache.find()[0]['status'], 'stale')

    def test_missing_evidence_rejects_write_without_losing_previous_note(self):
        self.put()
        with self.assertRaises(OSError):
            self.cache.put('another', 'pitfall', 'Claim', ['missing.md'])
        self.assertEqual(len(self.cache.find()), 1)

    def test_private_paths_and_escaping_sources_are_rejected(self):
        for source in ['../outside.md', str(self.source), '.env.local',
                       '.git/config', 'node_modules/a.js', '.codex/knowledge/entries.json']:
            with self.subTest(source=source), self.assertRaises(ValueError):
                self.cache.put('unsafe', 'decision', 'Claim', [source])
        (self.root / 'escape.md').symlink_to(self.root.parent / 'outside.md')
        with self.assertRaises(ValueError):
            self.cache.put('unsafe', 'decision', 'Claim', ['escape.md'])

    def test_copy_to_another_project_is_not_trusted(self):
        self.put()
        data = json.loads(self.cache.path.read_text())
        data['project'] = '/different/project'
        self.cache.path.write_text(json.dumps(data))
        with self.assertRaises(ValueError):
            self.cache.find()

    def test_corrupt_cache_is_not_silently_replaced(self):
        self.put()
        self.cache.path.write_text('broken json')
        with self.assertRaises(ValueError):
            self.put('Replacement')
        self.assertEqual(self.cache.path.read_text(), 'broken json')

    def test_forget_removes_only_requested_id(self):
        self.put()
        self.cache.put('other', 'pitfall', 'Another claim', ['contract.md'])
        self.cache.forget('currency-inputs')
        self.assertEqual([e['id'] for e in self.cache.find()], ['other'])

    def test_concurrent_writes_preserve_independent_entries(self):
        def write(index):
            module.Knowledge(self.root).put('note-' + str(index), 'decision',
                                            'Independent claim', ['contract.md'])
        with ThreadPoolExecutor(max_workers=4) as workers:
            list(workers.map(write, range(12)))
        self.assertEqual(len(self.cache.load()), 12)
        self.assertEqual(len(self.cache.find()), 8)

    def test_invalid_entry_does_not_become_a_trusted_match(self):
        self.put()
        data = json.loads(self.cache.path.read_text())
        data['entries']['currency-inputs']['sources'] = {}
        self.cache.path.write_text(json.dumps(data))
        with self.assertRaises(ValueError):
            self.cache.find()


if __name__ == '__main__':
    unittest.main()
