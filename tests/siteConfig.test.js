import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetch = vi.fn();

vi.mock('@utils/sanity-client', () => ({
    client: { fetch: (...args) => fetch(...args) }
}));

import { fetchData } from '@data/siteConfig';
import { IMAGE } from '@data/blocks';

describe('siteConfig data query', () => {
    beforeEach(() => {
        fetch.mockReset();
    });

    it('queries the first document of type "siteConfig"', async () => {
        fetch.mockResolvedValue({ _id: 'config' });
        await fetchData();
        expect(fetch).toHaveBeenCalledTimes(1);
        const query = fetch.mock.calls[0][0];
        expect(query).toContain('*[_type == "siteConfig"][0]');
    });

    it('selects the expected config fields', async () => {
        fetch.mockResolvedValue(null);
        await fetchData();
        const query = fetch.mock.calls[0][0];
        expect(query).toContain('_id');
        expect(query).toContain('"favicon"');
        expect(query).toContain('header {');
        expect(query).toContain(`logo ${IMAGE}`);
        expect(query).toContain('footer');
        expect(query).toContain('titleSuffix');
    });

    it('returns whatever the client resolves', async () => {
        const config = { _id: 'config', titleSuffix: ' | Network Kings' };
        fetch.mockResolvedValue(config);
        await expect(fetchData()).resolves.toBe(config);
    });

    it('propagates client errors', async () => {
        fetch.mockRejectedValue(new Error('unauthorized'));
        await expect(fetchData()).rejects.toThrow('unauthorized');
    });
});
