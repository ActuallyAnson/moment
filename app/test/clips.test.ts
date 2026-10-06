import {CLIPS} from '../src/clips';
import manifest from '../../clips/manifest.json';

describe('bundled clips', () => {
  test('match the clip manifest and carry attribution', () => {
    const ids = Object.keys(manifest as Record<string, unknown>).sort();
    expect(CLIPS.map((c) => c.id).sort()).toEqual(ids);
    for (const c of CLIPS) {
      expect(c.file).toBe(`/pkg/assets/raw/${c.id}.mp4`);
      expect(c.attribution.length).toBeGreaterThan(5);
      expect(c.license.length).toBeGreaterThan(2);
    }
  });
});
