import { describe, it, expect, vi, beforeEach } from 'vitest';

const utimes = vi.fn().mockResolvedValue(undefined);
const createClient = vi.fn();
const loadEnv = vi.fn();

let subscribedHandler;
const listen = vi.fn(() => ({
    subscribe: (handler) => {
        subscribedHandler = handler;
        return { unsubscribe: vi.fn() };
    }
}));

vi.mock('fs', () => ({
    default: { promises: { utimes: (...args) => utimes(...args) } }
}));

vi.mock('vite', () => ({
    loadEnv: (...args) => loadEnv(...args)
}));

vi.mock('@sanity/client', () => ({
    createClient: (...args) => {
        createClient(...args);
        return { listen };
    }
}));

async function loadModule(env = {}) {
    vi.resetModules();
    subscribedHandler = undefined;
    loadEnv.mockReturnValue(env);
    return import('@utils/sanity-client');
}

describe('sanity-client configuration', () => {
    beforeEach(() => {
        utimes.mockClear();
        createClient.mockClear();
        listen.mockClear();
        loadEnv.mockClear();
    });

    it('builds the base client config from env values', async () => {
        const { sanityConfig } = await loadModule({
            SANITY_PROJECT_ID: 'proj123',
            SANITY_DATASET: 'staging',
            SANITY_TOKEN: 'tok'
        });
        expect(sanityConfig.projectId).toBe('proj123');
        expect(sanityConfig.dataset).toBe('staging');
        expect(sanityConfig.token).toBe('tok');
        expect(sanityConfig.useCdn).toBe(false);
        expect(sanityConfig.apiVersion).toBe('2024-01-31');
    });

    it('defaults the dataset to "production" when unset', async () => {
        const { sanityConfig } = await loadModule({ SANITY_PROJECT_ID: 'p' });
        expect(sanityConfig.dataset).toBe('production');
    });

    it('uses previewDrafts perspective when SANITY_PREVIEW_DRAFTS is true', async () => {
        const { sanityConfig } = await loadModule({ SANITY_PREVIEW_DRAFTS: 'TRUE' });
        expect(sanityConfig.perspective).toBe('previewDrafts');
    });

    it('creates a client and registers a page listener', async () => {
        await loadModule({});
        expect(createClient).toHaveBeenCalledTimes(1);
        expect(listen).toHaveBeenCalledTimes(1);
        const query = listen.mock.calls[0][0];
        expect(query).toContain('_type in ["page"]');
    });

    it('touches the layout file when a page appears', async () => {
        await loadModule({});
        await subscribedHandler({ transition: 'appear' });
        expect(utimes).toHaveBeenCalledTimes(1);
        const [filePath] = utimes.mock.calls[0];
        expect(filePath).toContain('Layout.astro');
    });

    it('touches the layout file when a page disappears', async () => {
        await loadModule({});
        await subscribedHandler({ transition: 'disappear' });
        expect(utimes).toHaveBeenCalledTimes(1);
    });

    it('ignores unrelated transitions', async () => {
        await loadModule({});
        await subscribedHandler({ transition: 'update' });
        expect(utimes).not.toHaveBeenCalled();
    });
});
