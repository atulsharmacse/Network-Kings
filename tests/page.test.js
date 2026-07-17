import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetch = vi.fn();

vi.mock('@utils/sanity-client', () => ({
    client: { fetch: (...args) => fetch(...args) }
}));

import { fetchData, getPageById } from '@data/page';
import { SECTIONS } from '@data/blocks';

describe('page data queries', () => {
    beforeEach(() => {
        fetch.mockReset();
    });

    describe('fetchData', () => {
        it('queries all documents of type "page"', async () => {
            fetch.mockResolvedValue([{ _id: 'a' }]);
            await fetchData();
            expect(fetch).toHaveBeenCalledTimes(1);
            const query = fetch.mock.calls[0][0];
            expect(query).toContain('*[_type == "page"]');
        });

        it('selects the expected page fields', async () => {
            fetch.mockResolvedValue([]);
            await fetchData();
            const query = fetch.mock.calls[0][0];
            expect(query).toContain('_id');
            expect(query).toContain('slug');
            expect(query).toContain('title');
            expect(query).toContain('metaTitle');
            expect(query).toContain('metaDescription');
            expect(query).toContain('"socialImage"');
            expect(query).toContain(`sections[] ${SECTIONS}`);
        });

        it('returns whatever the client resolves', async () => {
            const docs = [{ _id: 'x' }, { _id: 'y' }];
            fetch.mockResolvedValue(docs);
            await expect(fetchData()).resolves.toBe(docs);
        });

        it('propagates client errors', async () => {
            fetch.mockRejectedValue(new Error('network down'));
            await expect(fetchData()).rejects.toThrow('network down');
        });
    });

    describe('getPageById', () => {
        it('filters by the provided id', async () => {
            fetch.mockResolvedValue([{ _id: 'page-123' }]);
            await getPageById('page-123');
            const query = fetch.mock.calls[0][0];
            expect(query).toContain('_type == "page"');
            expect(query).toContain('_id == "page-123"');
        });

        it('interpolates the id argument into the query', async () => {
            fetch.mockResolvedValue([]);
            await getPageById('drafts.abc');
            expect(fetch.mock.calls[0][0]).toContain('_id == "drafts.abc"');
        });

        it('returns the resolved documents', async () => {
            const docs = [{ _id: 'page-123', title: 'Home' }];
            fetch.mockResolvedValue(docs);
            await expect(getPageById('page-123')).resolves.toBe(docs);
        });
    });
});
