import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';

const router = Router();

// Helper to safely parse JSON strings from DB
function safeParseJson<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

// ── GET /api/destinations/trending ──────────────────────────────────────────

router.get('/trending', async (_req: Request, res: Response) => {
  try {
    const destinations = await prisma.destination.findMany({
      orderBy: [{ popularityScore: 'desc' }, { rating: 'desc' }],
      take: 12,
    });

    const formatted = destinations.map((d) => ({
      ...d,
      popularActivities: safeParseJson(d.popularActivities, []),
      attractions: safeParseJson(d.attractions, []),
      foodSpecialties: safeParseJson(d.foodSpecialties, []),
    }));

    return res.json({ destinations: formatted });
  } catch (err) {
    console.error('Error fetching trending destinations:', err);
    return res.status(500).json({ error: 'Failed to fetch trending destinations' });
  }
});

// ── GET /api/destinations/hidden-gems ───────────────────────────────────────

router.get('/hidden-gems', async (_req: Request, res: Response) => {
  try {
    const gems = await prisma.destination.findMany({
      where: { hiddenGem: true },
      orderBy: { rating: 'desc' },
      take: 16,
    });

    const formatted = gems.map((d) => ({
      ...d,
      popularActivities: safeParseJson(d.popularActivities, []),
      attractions: safeParseJson(d.attractions, []),
      foodSpecialties: safeParseJson(d.foodSpecialties, []),
    }));

    return res.json({ destinations: formatted });
  } catch (err) {
    console.error('Error fetching hidden gems:', err);
    return res.status(500).json({ error: 'Failed to fetch hidden gems' });
  }
});

// ── GET /api/destinations/states ────────────────────────────────────────────

router.get('/states', async (_req: Request, res: Response) => {
  try {
    const destinations = await prisma.destination.findMany({
      select: {
        id: true,
        name: true,
        state: true,
        unionTerritory: true,
        imageUrl: true,
        category: true,
      },
    });

    // Group by state/UT
    const map = new Map<string, {
      name: string;
      isUnionTerritory: boolean;
      count: number;
      sampleImage: string;
      categories: Set<string>;
      sampleDestinations: string[];
    }>();

    for (const d of destinations) {
      const regionName = d.unionTerritory ? d.unionTerritory : d.state;
      const isUT = Boolean(d.unionTerritory);

      if (!map.has(regionName)) {
        map.set(regionName, {
          name: regionName,
          isUnionTerritory: isUT,
          count: 0,
          sampleImage: d.imageUrl,
          categories: new Set<string>(),
          sampleDestinations: [],
        });
      }

      const entry = map.get(regionName)!;
      entry.count += 1;
      entry.categories.add(d.category);
      if (entry.sampleDestinations.length < 3) {
        entry.sampleDestinations.push(d.name);
      }
    }

    const stateSummaries = Array.from(map.values()).map((s) => ({
      name: s.name,
      isUnionTerritory: s.isUnionTerritory,
      count: s.count,
      sampleImage: s.sampleImage,
      categories: Array.from(s.categories),
      sampleDestinations: s.sampleDestinations,
    })).sort((a, b) => a.name.localeCompare(b.name));

    return res.json({ states: stateSummaries });
  } catch (err) {
    console.error('Error fetching states summary:', err);
    return res.status(500).json({ error: 'Failed to fetch states summary' });
  }
});

// ── GET /api/destinations/festivals ─────────────────────────────────────────

router.get('/festivals', async (_req: Request, res: Response) => {
  try {
    const festivals = await prisma.festival.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ festivals });
  } catch (err) {
    console.error('Error fetching festivals:', err);
    return res.status(500).json({ error: 'Failed to fetch festivals' });
  }
});

// ── POST /api/destinations/compare ──────────────────────────────────────────

const compareSchema = z.object({
  destinationIds: z.array(z.string()).optional(),
  destinationNames: z.array(z.string()).optional(),
});

router.post('/compare', async (req: Request, res: Response) => {
  try {
    const parsed = compareSchema.parse(req.body);
    const ids = parsed.destinationIds || [];
    const names = parsed.destinationNames || [];

    if (ids.length === 0 && names.length === 0) {
      return res.status(400).json({ error: 'Please provide destinationIds or destinationNames to compare' });
    }

    const destinations = await prisma.destination.findMany({
      where: {
        OR: [
          ...(ids.length > 0 ? [{ id: { in: ids } }] : []),
          ...(names.length > 0 ? [{ name: { in: names } }] : []),
        ],
      },
      take: 4,
    });

    if (destinations.length < 2) {
      return res.status(400).json({ error: 'At least 2 matching destinations are required for comparison' });
    }

    const formatted = destinations.map((d) => ({
      id: d.id,
      name: d.name,
      state: d.state,
      unionTerritory: d.unionTerritory,
      category: d.category,
      budgetLevel: d.budgetLevel,
      estimatedDailyCost: d.estimatedDailyCost,
      idealDuration: d.idealDuration,
      bestTimeToVisit: d.bestTimeToVisit,
      rating: d.rating,
      reviewsCount: d.reviewsCount,
      safetyInformation: d.safetyInformation,
      transportation: d.transportation,
      imageUrl: d.imageUrl,
      popularActivities: safeParseJson(d.popularActivities, []),
      attractions: safeParseJson(d.attractions, []),
      foodSpecialties: safeParseJson(d.foodSpecialties, []),
      suitability: {
        family: d.familyFriendly,
        honeymoon: d.honeymoonFriendly,
        solo: d.soloFriendly,
        backpacker: d.backpackerFriendly,
        adventure: d.adventureFriendly,
      },
    }));

    return res.json({ comparison: formatted });
  } catch (err) {
    console.error('Error comparing destinations:', err);
    return res.status(500).json({ error: 'Failed to compare destinations' });
  }
});

// ── POST /api/destinations/semantic-search ──────────────────────────────────

router.post('/semantic-search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query text is required' });
    }

    const q = query.toLowerCase().trim();

    // Semantic keyword analysis
    const isMountain = /mountain|snow|hill|peak|altitude|trek|alpine/i.test(q);
    const isBeach = /beach|coastal|sea|sand|ocean|water sports|island|coral/i.test(q);
    const isSpiritual = /spiritual|temple|holy|sacred|pilgrim|peaceful|divine|jyotirlinga|ghat/i.test(q);
    const isHeritage = /heritage|fort|palace|ancient|history|monument|unesco|ruins/i.test(q);
    const isWildlife = /wildlife|tiger|safari|national park|jungle|animals|forest/i.test(q);
    const isFood = /food|eat|culinary|tasting|cuisine|street food|vegetarian/i.test(q);
    const isBudget = /cheap|student|affordable|budget|low cost/i.test(q);
    const isLuxury = /luxury|resort|premium|royal|fine dining/i.test(q);
    const isRomantic = /romantic|couple|honeymoon|sunset/i.test(q);
    const isMonsoon = /monsoon|rain|waterfall|greenery/i.test(q);

    // Fetch candidate destinations
    const all = await prisma.destination.findMany();

    // Score candidates based on match
    const scored = all.map((d) => {
      let score = 0;
      const reasons: string[] = [];

      const text = `${d.name} ${d.state} ${d.description} ${d.category} ${d.subcategories}`.toLowerCase();

      // Direct text inclusion
      if (text.includes(q)) {
        score += 40;
        reasons.push('Direct keyword match');
      }

      if (isMountain && (d.category === 'Mountains' || d.category === 'Hill Stations' || d.nature)) {
        score += 25;
        reasons.push('Features majestic mountain landscapes');
      }
      if (isBeach && (d.category === 'Beaches' || d.beach)) {
        score += 25;
        reasons.push('Famous for coastal beaches & seaside');
      }
      if (isSpiritual && (d.category === 'Spiritual' || d.spiritual)) {
        score += 25;
        reasons.push('Renowned spiritual and sacred destination');
      }
      if (isHeritage && (d.category === 'Heritage' || d.heritage)) {
        score += 25;
        reasons.push('Historic forts, palaces & monuments');
      }
      if (isWildlife && (d.category === 'Wildlife' || d.wildlife)) {
        score += 25;
        reasons.push('Thriving wildlife sanctuaries & safaris');
      }
      if (isFood && (d.category === 'Food' || d.food)) {
        score += 20;
        reasons.push('Legendary regional food & street markets');
      }
      if (isBudget && (d.budgetLevel === 'budget' || d.estimatedDailyCost <= 2000)) {
        score += 20;
        reasons.push('Pocket-friendly daily expenses under ₹2,000');
      }
      if (isLuxury && d.budgetLevel === 'luxury') {
        score += 20;
        reasons.push('Premium luxury heritage stays and cruises');
      }
      if (isRomantic && d.honeymoonFriendly) {
        score += 20;
        reasons.push('Voted top romantic retreat for couples');
      }
      if (isMonsoon && (d.state === 'Meghalaya' || d.state === 'Kerala' || d.category === 'Nature')) {
        score += 20;
        reasons.push('Breathtaking during monsoon rejuvenation');
      }

      return {
        destination: {
          ...d,
          popularActivities: safeParseJson(d.popularActivities, []),
          attractions: safeParseJson(d.attractions, []),
          foodSpecialties: safeParseJson(d.foodSpecialties, []),
        },
        score,
        matchReasons: reasons,
      };
    });

    // Filter and sort
    const results = scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    return res.json({
      query,
      count: results.length,
      results,
    });
  } catch (err) {
    console.error('Error in semantic search:', err);
    return res.status(500).json({ error: 'Failed to process semantic search' });
  }
});

// ── GET /api/destinations (Main listing with search & filters) ───────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search,
      state,
      unionTerritory,
      category,
      budgetLevel,
      hiddenGem,
      sort,
      page = '1',
      limit = '30',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const skip = (pageNum - 1) * take;

    const where: any = {};

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { state: { contains: term, mode: 'insensitive' } },
        { city: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
        { subcategories: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (state && state !== 'All') {
      where.state = { equals: state, mode: 'insensitive' };
    }

    if (unionTerritory) {
      where.unionTerritory = { equals: unionTerritory, mode: 'insensitive' };
    }

    if (category && category !== 'All') {
      where.OR = [
        ...(where.OR || []),
        { category: { equals: category, mode: 'insensitive' } },
        { subcategories: { contains: category, mode: 'insensitive' } },
      ];
    }

    if (budgetLevel && ['budget', 'moderate', 'luxury'].includes(budgetLevel)) {
      where.budgetLevel = budgetLevel;
    }

    if (hiddenGem === 'true') {
      where.hiddenGem = true;
    }

    // Determine sorting
    let orderBy: any = [{ popularityScore: 'desc' }, { rating: 'desc' }];
    if (sort === 'rating') {
      orderBy = [{ rating: 'desc' }, { reviewsCount: 'desc' }];
    } else if (sort === 'cost_asc') {
      orderBy = [{ estimatedDailyCost: 'asc' }];
    } else if (sort === 'cost_desc') {
      orderBy = [{ estimatedDailyCost: 'desc' }];
    } else if (sort === 'name') {
      orderBy = [{ name: 'asc' }];
    }

    const [total, destinations] = await Promise.all([
      prisma.destination.count({ where }),
      prisma.destination.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
    ]);

    const formatted = destinations.map((d) => ({
      ...d,
      popularActivities: safeParseJson(d.popularActivities, []),
      attractions: safeParseJson(d.attractions, []),
      foodSpecialties: safeParseJson(d.foodSpecialties, []),
    }));

    return res.json({
      destinations: formatted,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / take),
      limit: take,
    });
  } catch (err) {
    console.error('Error fetching destinations:', err);
    return res.status(500).json({ error: 'Failed to fetch destinations' });
  }
});

// ── GET /api/destinations/:id (Single profile) ──────────────────────────────

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const destination = await prisma.destination.findUnique({
      where: { id: req.params.id },
    });

    if (!destination) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    const formatted = {
      ...destination,
      popularActivities: safeParseJson(destination.popularActivities, []),
      attractions: safeParseJson(destination.attractions, []),
      foodSpecialties: safeParseJson(destination.foodSpecialties, []),
    };

    return res.json({ destination: formatted });
  } catch (err) {
    console.error('Error fetching destination by ID:', err);
    return res.status(500).json({ error: 'Failed to fetch destination' });
  }
});

export default router;
