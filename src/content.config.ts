import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { BANDS, CATEGORIES, OCCASIONS } from './lib/constants';

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    title: z.string(),
    brand: z.string().optional().default(''),
    link: z.string().url(),
    price_band: z.enum(BANDS),
    category: z.enum(CATEGORIES),
    photo: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().nullable().default([]),
    hidden: z.boolean().optional().default(false),
  }),
});

const looks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/looks' }),
  schema: z.object({
    title: z.string(),
    italic: z.string().optional().nullable(),
    occasion: z.enum(OCCASIONS),
    photos: z.array(z.string()).min(1),
    pieces: z.array(z.string()).optional().nullable().default([]),
    note: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().nullable().default([]),
    date: z.coerce.date(),
    featured: z.boolean().optional().default(false),
    hidden: z.boolean().optional().default(false),
  }),
});

const edits = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/edits' }),
  schema: z.object({
    title: z.string(),
    italic: z.string().optional().nullable(),
    tag: z.string(),
    cover: z.string(),
    order: z.number().optional().default(10),
  }),
});

export const collections = { products, looks, edits };
