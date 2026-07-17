import { describe, it, expect } from 'vitest';
import { IMAGE, SECTIONS } from '@data/blocks';

describe('IMAGE projection', () => {
    it('is a non-empty string', () => {
        expect(typeof IMAGE).toBe('string');
        expect(IMAGE.trim().length).toBeGreaterThan(0);
    });

    it('projects the expected image asset fields', () => {
        expect(IMAGE).toContain('"_id": image.asset->_id');
        expect(IMAGE).toContain('"src": image.asset->url');
        expect(IMAGE).toContain('"dimensions": image.asset->metadata.dimensions');
        expect(IMAGE).toContain('"alt": alt');
    });

    it('is wrapped in a projection object', () => {
        expect(IMAGE.trim().startsWith('{')).toBe(true);
        expect(IMAGE.trim().endsWith('}')).toBe(true);
    });
});

describe('SECTIONS projection', () => {
    it('is a non-empty string wrapped in a projection object', () => {
        expect(typeof SECTIONS).toBe('string');
        expect(SECTIONS.trim().startsWith('{')).toBe(true);
        expect(SECTIONS.trim().endsWith('}')).toBe(true);
    });

    it('spreads all fields with the "..." operator', () => {
        expect(SECTIONS).toContain('...,');
    });

    it('resolves the background image asset', () => {
        expect(SECTIONS).toContain('backgroundImage {');
        expect(SECTIONS).toContain('"_id": image.asset->_id');
        expect(SECTIONS).toContain('"src": image.asset->url');
    });

    it('handles each conditional section type', () => {
        expect(SECTIONS).toContain('_type == "cardsSection"');
        expect(SECTIONS).toContain('_type == "logosSection"');
        expect(SECTIONS).toContain('_type == "testimonialsSection"');
    });

    it('embeds the IMAGE projection for card items', () => {
        expect(SECTIONS).toContain(`image ${IMAGE}`);
    });

    it('embeds the IMAGE projection directly for logo items', () => {
        expect(SECTIONS).toContain(`items[] ${IMAGE}`);
    });

    it('dereferences testimonial authors and their company', () => {
        expect(SECTIONS).toContain('author->');
        expect(SECTIONS).toContain('company->');
        expect(SECTIONS).toContain('name');
        expect(SECTIONS).toContain('title');
        expect(SECTIONS).toContain(`logo ${IMAGE}`);
    });
});
