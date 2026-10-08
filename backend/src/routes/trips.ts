import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// ── GET /api/trips/public/:id (Public view without auth) ───────────────

router.get('/public/:id', async (req, res: Response) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true } },
        bookings: { orderBy: { createdAt: 'asc' } },
        collaborators: { orderBy: { createdAt: 'asc' } },
        journalEntries: { orderBy: { createdAt: 'desc' } },
        days: {
          include: { activities: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Shared trip not found' });
    }

    return res.json({ trip });
  } catch (err) {
    console.error('Get public trip error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// All protected trip routes require authentication
router.use(authMiddleware);

// ── Validation Schemas ──────────────────────────────────────────────────

const createTripSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  durationDays: z.number().int().min(1).max(30),
  budgetLevel: z.enum(['budget', 'moderate', 'luxury']),
  interests: z.string().optional(),
  title: z.string().optional(),
  startDate: z.string().optional(),
});

const updateTripSchema = z.object({
  title: z.string().optional(),
  destination: z.string().optional(),
  budgetLevel: z.string().optional(),
  interests: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  coverImageUrl: z.string().optional().nullable(),
});


// ── POST /api/trips ─────────────────────────────────────────────────────

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createTripSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Validation error' });
    }

    const { destination, durationDays, budgetLevel, interests, title, startDate } = parsed.data;

    const trip = await prisma.trip.create({
      data: {
        userId: req.user!.userId,
        title: title || `Trip to ${destination}`,
        destination,
        durationDays,
        budgetLevel,
        interests: interests || null,
        startDate: startDate ? new Date(startDate) : null,
      },
    });

    return res.status(201).json({ trip });
  } catch (err) {
    console.error('Create trip error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/trips/nlp-create (Natural Language Trip Parser) ───────────

router.post('/nlp-create', async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, autoCreate } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const p = prompt.toLowerCase();

    // Known destinations & states across India
    const knownDestinations = [
      'rajasthan', 'jaipur', 'udaipur', 'jaisalmer', 'jodhpur', 'pushkar',
      'kerala', 'munnar', 'alleppey', 'alappuzha', 'kochi', 'wayanad', 'varkala',
      'goa', 'north goa', 'south goa', 'panaji',
      'himachal', 'himachal pradesh', 'manali', 'shimla', 'kasol', 'spiti', 'dharamshala',
      'uttarakhand', 'rishikesh', 'haridwar', 'mussoorie', 'nainital', 'auli', 'kedarnath',
      'uttar pradesh', 'varanasi', 'agra', 'ayodhya', 'lucknow', 'mathura', 'vrindavan',
      'kashmir', 'srinagar', 'gulmarg', 'pahalgam', 'ladakh', 'leh', 'nubra',
      'karnataka', 'bengaluru', 'bangalore', 'hampi', 'coorg', 'mysuru', 'gokarna',
      'maharashtra', 'mumbai', 'pune', 'lonavala', 'ajanta', 'ellora',
      'tamil nadu', 'chennai', 'ooty', 'madurai', 'kodaikanal', 'rameswaram',
      'west bengal', 'kolkata', 'darjeeling',
      'sikkim', 'gangtok', 'pelling',
      'meghalaya', 'shillong', 'cherrapunji', 'dawki',
      'assam', 'guwahati', 'kaziranga',
      'odisha', 'puri', 'konark', 'bhubaneswar',
      'madhya pradesh', 'khajuraho', 'kanha', 'indore', 'bhopal', 'ujjain',
      'gujarat', 'kutch', 'rann of kutch', 'gir', 'ahmedabad', 'dwarka', 'somnath',
      'andaman', 'havelock', 'port blair',
      'puducherry', 'pondicherry', 'auroville',
      'lakshadweep', 'punjab', 'amritsar', 'delhi', 'new delhi', 'chandigarh',
      'bihar', 'bodh gaya', 'nalanda', 'chhattisgarh', 'bastar', 'chitrakote',
      'nagaland', 'kohima', 'manipur', 'imphal', 'loktak', 'mizoram', 'aizawl',
      'tripura', 'agartala', 'telangana', 'hyderabad', 'andhra pradesh', 'tirupati', 'vizag', 'visakhapatnam'
    ];

    let extractedDest = '';
    for (const kd of knownDestinations) {
      if (p.includes(kd)) {
        extractedDest = kd.replace(/\b\w/g, (c) => c.toUpperCase());
        break;
      }
    }

    if (!extractedDest) {
      const toMatch = prompt.match(/(?:to|in|around|explore)\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:under|for|with|in|on|\d)|$)/i);
      if (toMatch && toMatch[1]) {
        extractedDest = toMatch[1].trim();
      } else {
        extractedDest = 'Incredible India';
      }
    }

    // Duration extraction
    let durationDays = 4;
    const dayMatch = p.match(/(\d+)\s*(?:day|days|d\b)/);
    if (dayMatch && dayMatch[1]) {
      durationDays = Math.min(30, Math.max(1, parseInt(dayMatch[1], 10)));
    } else if (p.includes('weekend')) {
      durationDays = 3;
    } else if (p.includes('week')) {
      durationDays = 7;
    }

    // Budget extraction (INR)
    let maxBudgetINR: number | null = null;
    let budgetLevel: 'budget' | 'moderate' | 'luxury' = 'moderate';

    const numInKMatch = p.match(/(?:under|below|within|budget of)?\s*(?:₹|rs\.?|inr)?\s*(\d+)\s*(?:k|thousand)/);
    const numDirectMatch = p.match(/(?:under|below|within|budget of)?\s*(?:₹|rs\.?|inr)?\s*([\d,]{4,})/);

    if (numInKMatch && numInKMatch[1]) {
      maxBudgetINR = parseInt(numInKMatch[1], 10) * 1000;
    } else if (numDirectMatch && numDirectMatch[1]) {
      maxBudgetINR = parseInt(numDirectMatch[1].replace(/,/g, ''), 10);
    }

    if (maxBudgetINR) {
      if (maxBudgetINR <= 20000) budgetLevel = 'budget';
      else if (maxBudgetINR >= 50000) budgetLevel = 'luxury';
      else budgetLevel = 'moderate';
    } else {
      if (p.includes('budget') || p.includes('cheap') || p.includes('backpack')) budgetLevel = 'budget';
      if (p.includes('luxury') || p.includes('5-star') || p.includes('resort')) budgetLevel = 'luxury';
    }

    // Travelers / Style
    let travelers = 2;
    let travelStyle = 'leisure';
    if (p.includes('solo') || p.includes('alone')) {
      travelers = 1;
      travelStyle = 'solo';
    } else if (p.includes('family') || p.includes('parents') || p.includes('kids')) {
      travelers = 4;
      travelStyle = 'family';
    } else if (p.includes('romantic') || p.includes('honeymoon') || p.includes('couple')) {
      travelers = 2;
      travelStyle = 'romantic';
    } else if (p.includes('friends') || p.includes('group')) {
      travelers = 4;
      travelStyle = 'group';
    }

    // Interests
    const interestsList: string[] = [];
    if (/culture|heritage|history|fort|palace|ancient/i.test(p)) interestsList.push('Culture & Heritage');
    if (/food|cuisine|street food|culinary|eat/i.test(p)) interestsList.push('Food & Local Flavors');
    if (/spiritual|temple|pilgrim|holy|ghat/i.test(p)) interestsList.push('Spiritual & Temples');
    if (/beach|sea|coast/i.test(p)) interestsList.push('Beaches & Coastal');
    if (/mountain|hill|trek|snow|alpine/i.test(p)) interestsList.push('Mountains & Hiking');
    if (/wildlife|tiger|safari|nature/i.test(p)) interestsList.push('Wildlife & Nature');
    if (/nightlife|party|club/i.test(p)) interestsList.push('Nightlife & Cafes');
    if (/shop|bazaar|market/i.test(p)) interestsList.push('Shopping & Crafts');

    const interests = interestsList.length > 0 ? interestsList.join(', ') : 'Sightseeing, Culture & Food';
    const title = `${durationDays} Days in ${extractedDest} (${budgetLevel === 'budget' ? 'Budget' : budgetLevel === 'luxury' ? 'Luxury' : 'Curated'} Experience)`;

    const parsedPlan = {
      destination: extractedDest,
      durationDays,
      budgetLevel,
      maxBudgetINR,
      travelers,
      travelStyle,
      interests,
      title,
    };

    if (autoCreate) {
      const trip = await prisma.trip.create({
        data: {
          userId: req.user!.userId,
          title,
          destination: extractedDest,
          durationDays,
          budgetLevel,
          interests,
        },
      });
      return res.status(201).json({ parsedPlan, trip });
    }

    return res.json({ parsedPlan });
  } catch (err) {
    console.error('NLP parse trip error:', err);
    return res.status(500).json({ error: 'Failed to parse natural language trip prompt' });
  }
});

// ── POST /api/trips/:id/budget-reduce ───────────────────────────────────

router.post('/:id/budget-reduce', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: { bookings: true },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const targetReduction = Number(req.body.targetReductionINR) || 5000;
    const dest = trip.destination;

    const suggestions = [
      {
        category: 'Accommodation',
        savingINR: Math.round(targetReduction * 0.45),
        title: 'Switch to Boutique Heritage Homestay or 3-Star Club',
        detail: `Replacing luxury chain hotels with verified boutique homestays or heritage bed & breakfasts in ${dest} saves up to 45% with authentic hospitality and breakfast included.`,
      },
      {
        category: 'Transit & Local Transport',
        savingINR: Math.round(targetReduction * 0.3),
        title: 'Adopt Metro, Vande Bharat & App-Based Auto Rickshaws',
        detail: `Avoid full-day private chauffeurs. Utilize Vande Bharat / AC Chair Car trains for intercity travel and verified Uber Auto / city metro for local sightseeing.`,
      },
      {
        category: 'Dining & Street Gastronomy',
        savingINR: Math.round(targetReduction * 0.25),
        title: 'Enjoy Authentic Regional Thalis & Historic Bazaars',
        detail: `Swap upscale hotel dining rooms for famous local institutions, legendary sweet shops, and iconic thali centers in ${dest}, offering top-rated food for under ₹300 per person.`,
      },
      {
        category: 'Sightseeing & Activities',
        savingINR: Math.round(targetReduction * 0.15),
        title: 'Self-Guided Audio Tours & Composite Monument Passes',
        detail: `Book official ASI composite monument tickets online to save 15% and use the built-in AI Audio Guide instead of hiring commercial tout guides.`,
      },
    ];

    const totalPotentialSavings = suggestions.reduce((acc, s) => acc + s.savingINR, 0);

    return res.json({
      tripId: trip.id,
      targetReductionINR: targetReduction,
      totalPotentialSavingsINR: totalPotentialSavings,
      suggestions,
    });
  } catch (err) {
    console.error('Budget reduction error:', err);
    return res.status(500).json({ error: 'Failed to generate budget reduction suggestions' });
  }
});


// ── GET /api/trips ──────────────────────────────────────────────────────

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        bookings: { orderBy: { createdAt: 'asc' } },
        collaborators: { orderBy: { createdAt: 'asc' } },
        journalEntries: { orderBy: { createdAt: 'desc' } },
        days: {
          include: { activities: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    return res.json({ trips });
  } catch (err) {
    console.error('List trips error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/trips/:id ──────────────────────────────────────────────────

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        bookings: { orderBy: { createdAt: 'asc' } },
        collaborators: { orderBy: { createdAt: 'asc' } },
        journalEntries: { orderBy: { createdAt: 'desc' } },
        days: {
          include: { activities: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    return res.json({ trip });
  } catch (err) {
    console.error('Get trip error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /api/trips/:id ──────────────────────────────────────────────────

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateTripSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Validation error' });
    }

    // Verify ownership
    const existing = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const data: any = { ...parsed.data };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    const trip = await prisma.trip.update({
      where: { id: req.params.id },
      data,
    });

    return res.json({ trip });
  } catch (err) {
    console.error('Update trip error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── DELETE /api/trips/:id ───────────────────────────────────────────────

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    await prisma.trip.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Trip deleted' });
  } catch (err) {
    console.error('Delete trip error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/trips/:id/generate ────────────────────────────────────────

router.post('/:id/generate', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Call AI service
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://aitrip-ai-service.onrender.com';
    const aiResponse = await fetch(`${aiServiceUrl}/generate-itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: trip.destination,
        duration_days: trip.durationDays,
        budget_level: trip.budgetLevel,
        interests: trip.interests || '',
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI service error:', errorText);
      return res.status(502).json({ error: 'AI service failed to generate itinerary' });
    }

    const itinerary = await aiResponse.json();

    // Delete existing days/activities for this trip (regeneration)
    await prisma.day.deleteMany({ where: { tripId: trip.id } });

    // Save generated itinerary to database
    for (const day of itinerary.days) {
      await prisma.day.create({
        data: {
          tripId: trip.id,
          dayNumber: day.day_number,
          summary: day.summary || null,
          activities: {
            create: day.activities.map((act: any, idx: number) => ({
              sortOrder: act.sort_order ?? idx,
              time: act.time,
              title: act.title,
              description: act.description,
              location: act.location,
              latitude: act.latitude ?? null,
              longitude: act.longitude ?? null,
              category: act.category ?? null,
            })),
          },
        },
      });
    }

    // Update trip title and status
    const updatedTrip = await prisma.trip.update({
      where: { id: trip.id },
      data: {
        title: itinerary.title || trip.title,
        coverImageUrl: itinerary.cover_image_url || null,
        status: 'generated',
      },
      include: {
        days: {
          include: { activities: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    return res.json({ trip: updatedTrip });
  } catch (err) {
    console.error('Generate itinerary error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PATCH /api/trips/:tripId/activities/:activityId/complete ────────────

router.patch('/:tripId/activities/:activityId/complete', async (req: AuthRequest, res: Response) => {
  try {
    // Verify trip ownership
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.user!.userId },
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const activity = await prisma.activity.findFirst({
      where: { id: req.params.activityId, day: { tripId: trip.id } },
    });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const updated = await prisma.activity.update({
      where: { id: activity.id },
      data: { isCompleted: !activity.isCompleted },
    });

    return res.json({ activity: updated });
  } catch (err) {
    console.error('Toggle activity error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/trips/:tripId/days/:dayId/activities ──────────────────────

router.post('/:tripId/days/:dayId/activities', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.user!.userId },
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const day = await prisma.day.findFirst({
      where: { id: req.params.dayId, tripId: trip.id },
      include: { activities: true },
    });
    if (!day) {
      return res.status(404).json({ error: 'Day not found' });
    }

    const { time, title, description, location, category, latitude, longitude } = req.body;
    if (!title || !location) {
      return res.status(400).json({ error: 'Title and location are required' });
    }

    const sortOrder = day.activities.length + 1;

    const activity = await prisma.activity.create({
      data: {
        dayId: day.id,
        sortOrder,
        time: time || '12:00 PM',
        title,
        description: description || '',
        location,
        category: category || 'sightseeing',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
    });

    return res.status(201).json({ activity });
  } catch (err) {
    console.error('Create activity error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── DELETE /api/trips/:tripId/activities/:activityId ────────────────────

router.delete('/:tripId/activities/:activityId', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.user!.userId },
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const activity = await prisma.activity.findFirst({
      where: { id: req.params.activityId, day: { tripId: trip.id } },
    });
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    await prisma.activity.delete({ where: { id: activity.id } });
    return res.json({ message: 'Activity removed' });
  } catch (err) {
    console.error('Delete activity error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/trips/:id/fork (Clone trip into user account) ─────────────

router.post('/:id/fork', async (req: AuthRequest, res: Response) => {
  try {
    const original = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        bookings: true,
        days: {
          include: { activities: true },
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    if (!original) {
      return res.status(404).json({ error: 'Original trip not found' });
    }

    const forkedTrip = await prisma.trip.create({
      data: {
        userId: req.user!.userId,
        title: `${original.title} (Clone)`,
        destination: original.destination,
        budgetLevel: original.budgetLevel,
        interests: original.interests,
        durationDays: original.durationDays,
        coverImageUrl: original.coverImageUrl,
        status: original.status,
        bookings: {
          create: (original.bookings || []).map((b) => ({
            type: b.type,
            title: b.title,
            confirmationNo: b.confirmationNo,
            provider: b.provider,
            dateTime: b.dateTime,
            location: b.location,
            cost: b.cost,
            notes: b.notes,
          })),
        },
        days: {
          create: original.days.map((day) => ({
            dayNumber: day.dayNumber,
            summary: day.summary,
            activities: {
              create: day.activities.map((act) => ({
                sortOrder: act.sortOrder,
                time: act.time,
                title: act.title,
                description: act.description,
                location: act.location,
                category: act.category,
                latitude: act.latitude,
                longitude: act.longitude,
                isCompleted: false,
              })),
            },
          })),
        },
      },
      include: {
        bookings: true,
        days: {
          include: { activities: true },
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    return res.status(201).json({ trip: forkedTrip });
  } catch (err) {
    console.error('Fork trip error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/trips/:id/chat (AI Concierge Copilot) ─────────────────────

router.post('/:id/chat', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        days: {
          include: { activities: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const activitiesSummary = trip.days
      .map((d) => `Day ${d.dayNumber}: ` + d.activities.map((a) => a.title).join(', '))
      .join(' | ');

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://aitrip-ai-service.onrender.com';
    const aiResponse = await fetch(`${aiServiceUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: trip.destination,
        duration_days: trip.durationDays,
        budget_level: trip.budgetLevel,
        interests: trip.interests || '',
        activities_summary: activitiesSummary,
        message,
        history: history || [],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI chat error:', errText);
      return res.status(502).json({ error: 'AI Concierge service unavailable' });
    }

    const chatData = await aiResponse.json();
    return res.json(chatData);
  } catch (err) {
    console.error('Trip chat error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── BOOKINGS CRUD ───────────────────────────────────────────────────────

const createBookingSchema = z.object({
  type: z.enum(['flight', 'hotel', 'train', 'car', 'activity', 'other']),
  title: z.string().min(1, 'Title is required'),
  confirmationNo: z.string().optional(),
  provider: z.string().optional(),
  dateTime: z.string().optional(),
  location: z.string().optional(),
  cost: z.number().optional(),
  notes: z.string().optional(),
});

// POST /api/trips/:tripId/bookings
router.post('/:tripId/bookings', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.user!.userId },
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Validation error' });
    }

    const booking = await prisma.booking.create({
      data: {
        tripId: trip.id,
        ...parsed.data,
      },
    });

    return res.status(201).json({ booking });
  } catch (err) {
    console.error('Create booking error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/trips/:tripId/bookings/:bookingId
router.delete('/:tripId/bookings/:bookingId', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.user!.userId },
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: req.params.bookingId, tripId: trip.id },
    });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await prisma.booking.delete({ where: { id: booking.id } });
    return res.json({ message: 'Booking removed' });
  } catch (err) {
    console.error('Delete booking error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── REAL-TIME WEATHER FORECAST ──────────────────────────────────────────

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  paris: { lat: 48.8566, lon: 2.3522 },
  tokyo: { lat: 35.6762, lon: 139.6503 },
  kyoto: { lat: 35.0116, lon: 135.7681 },
  rome: { lat: 41.9028, lon: 12.4964 },
  london: { lat: 51.5074, lon: -0.1278 },
  barcelona: { lat: 41.3879, lon: 2.1699 },
  newyork: { lat: 40.7128, lon: -74.006 },
  bali: { lat: -8.4095, lon: 115.1889 },
  sydney: { lat: -33.8688, lon: 151.2093 },
  dubai: { lat: 25.2048, lon: 55.2708 },
  amsterdam: { lat: 52.3676, lon: 4.9041 },
  berlin: { lat: 52.52, lon: 13.405 },
  seoul: { lat: 37.5665, lon: 126.978 },
  bangkok: { lat: 13.7563, lon: 100.5018 },
  singapore: { lat: 1.3521, lon: 103.8198 },
  sanfrancisco: { lat: 37.7749, lon: -122.4194 },
};

function getWmoDetails(code: number) {
  if (code === 0) return { condition: 'Clear Sky', icon: 'sun', advice: 'Ideal for walking tours and outdoor sightseeing. Don’t forget sunglasses!' };
  if (code <= 3) return { condition: 'Partly Cloudy', icon: 'cloud-sun', advice: 'Pleasant weather for exploration and photography.' };
  if (code === 45 || code === 48) return { condition: 'Foggy', icon: 'cloud-fog', advice: 'Reduced visibility in morning; picturesque at high vantage points.' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { condition: 'Rain Showers', icon: 'cloud-rain', advice: 'Carry a compact umbrella or rain jacket. Great time for indoor museums and cafes!' };
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return { condition: 'Snowfall', icon: 'snowflake', advice: 'Bundle up in warm insulated layers and wear slip-resistant boots.' };
  if (code >= 95) return { condition: 'Thunderstorm', icon: 'cloud-lightning', advice: 'Expect sudden lightning squalls; seek shelter in covered arcades.' };
  return { condition: 'Mild Conditions', icon: 'cloud', advice: 'Good general travel weather. Dress in flexible layers.' };
}

// GET /api/trips/:id/weather
router.get('/:id/weather', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        days: {
          include: { activities: true },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    let lat = 48.8566;
    let lon = 2.3522;
    const actWithCoords = trip.days.flatMap((d) => d.activities).find((a) => a.latitude && a.longitude);
    if (actWithCoords?.latitude && actWithCoords?.longitude) {
      lat = actWithCoords.latitude;
      lon = actWithCoords.longitude;
    } else {
      const normDest = (trip.destination || '').toLowerCase().replace(/[^a-z]/g, '');
      for (const [key, coords] of Object.entries(CITY_COORDS)) {
        if (normDest.includes(key)) {
          lat = coords.lat;
          lon = coords.lon;
          break;
        }
      }
    }

    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (weatherRes.ok) {
        const data = await weatherRes.json();
        const daily = data.daily;
        const forecast = daily.time.slice(0, Math.min(7, trip.durationDays || 7)).map((dateStr: string, idx: number) => {
          const code = daily.weather_code[idx] ?? 0;
          const wmo = getWmoDetails(code);
          const dateObj = new Date(dateStr);
          return {
            date: dateStr,
            dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            tempMax: Math.round(daily.temperature_2m_max[idx]),
            tempMin: Math.round(daily.temperature_2m_min[idx]),
            rainChance: daily.precipitation_probability_max ? daily.precipitation_probability_max[idx] ?? 15 : 15,
            uvIndex: daily.uv_index_max ? Math.round(daily.uv_index_max[idx]) : 4,
            condition: wmo.condition,
            icon: wmo.icon,
            advice: wmo.advice,
          };
        });
        return res.json({ forecast, source: 'live' });
      }
    } catch {
      // Fallback below
    }

    // Realistic seasonal fallback
    const daysCount = Math.min(7, trip.durationDays || 5);
    const mockForecast = Array.from({ length: daysCount }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const isRainy = i % 3 === 2;
      return {
        date: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        tempMax: 22 + (i % 4),
        tempMin: 14 + (i % 3),
        rainChance: isRainy ? 65 : 15,
        uvIndex: isRainy ? 3 : 6,
        condition: isRainy ? 'Scattered Showers' : 'Partly Sunny',
        icon: isRainy ? 'cloud-rain' : 'cloud-sun',
        advice: isRainy ? 'Afternoon showers predicted. Keep an umbrella on hand.' : 'Ideal temperature for exploring the city neighborhoods on foot.',
      };
    });

    return res.json({ forecast: mockForecast, source: 'fallback' });
  } catch (err) {
    console.error('Weather route error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── COLLABORATORS CRUD ─────────────────────────────────────────────────

const addCollaboratorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['editor', 'viewer']).default('editor'),
});

// POST /api/trips/:tripId/collaborators
router.post('/:tripId/collaborators', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.user!.userId },
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const parsed = addCollaboratorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Validation error' });
    }

    const { name, email, role } = parsed.data;

    const existing = await prisma.collaborator.findFirst({
      where: { tripId: trip.id, email: email.toLowerCase() },
    });
    if (existing) {
      return res.status(400).json({ error: 'This traveler has already been invited.' });
    }

    const collaborator = await prisma.collaborator.create({
      data: {
        tripId: trip.id,
        name,
        email: email.toLowerCase(),
        role,
      },
    });

    return res.status(201).json({ collaborator });
  } catch (err) {
    console.error('Add collaborator error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/trips/:tripId/collaborators/:collaboratorId
router.delete('/:tripId/collaborators/:collaboratorId', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.user!.userId },
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const collaborator = await prisma.collaborator.findFirst({
      where: { id: req.params.collaboratorId, tripId: trip.id },
    });
    if (!collaborator) {
      return res.status(404).json({ error: 'Collaborator not found' });
    }

    await prisma.collaborator.delete({ where: { id: collaborator.id } });
    return res.json({ message: 'Collaborator removed' });
  } catch (err) {
    console.error('Delete collaborator error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── REORDER / MOVE ACTIVITIES ──────────────────────────────────────────

const reorderSchema = z.object({
  activityId: z.string(),
  direction: z.enum(['up', 'down']),
});

// PATCH /api/trips/:tripId/activities/reorder
router.patch('/:tripId/activities/reorder', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.user!.userId },
      include: {
        days: {
          include: { activities: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Validation error' });
    }

    const { activityId, direction } = parsed.data;

    let targetDay = null;
    let actIndex = -1;
    for (const day of trip.days) {
      const idx = day.activities.findIndex((a) => a.id === activityId);
      if (idx !== -1) {
        targetDay = day;
        actIndex = idx;
        break;
      }
    }

    if (!targetDay || actIndex === -1) {
      return res.status(404).json({ error: 'Activity not found in trip' });
    }

    const swapIndex = direction === 'up' ? actIndex - 1 : actIndex + 1;
    if (swapIndex < 0 || swapIndex >= targetDay.activities.length) {
      return res.json({ message: 'Already at boundary' });
    }

    const currentAct = targetDay.activities[actIndex];
    const neighborAct = targetDay.activities[swapIndex];

    const currentSort = currentAct.sortOrder;
    const neighborSort = neighborAct.sortOrder;

    await prisma.$transaction([
      prisma.activity.update({
        where: { id: currentAct.id },
        data: { sortOrder: neighborSort },
      }),
      prisma.activity.update({
        where: { id: neighborAct.id },
        data: { sortOrder: currentSort },
      }),
    ]);

    return res.json({ message: 'Activities reordered' });
  } catch (err) {
    console.error('Reorder error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── DESTINATION CULTURAL ETIQUETTE & INSIDER GUIDE ──────────────────────

const DESTINATION_CULTURE: Record<string, {
  customs: string[];
  etiquette: { rule: string; explanation: string }[];
  phrases: { phrase: string; translation: string; pronunciation: string }[];
  scamsToAvoid: string[];
  diningTips: string[];
}> = {
  japan: {
    customs: [
      'Bowing is the customary greeting; a slight nod or 15-degree bow suffices for travelers.',
      'Take off shoes before entering homes, traditional ryokan inns, temples, and tatami-mat dining rooms.',
      'Do not walk while eating or drinking on the street; consume snacks near the vending machine or stall.',
      'Trash cans are rare in public spaces; carry a small bag to pack your garbage with you until you return to your hotel.',
    ],
    etiquette: [
      { rule: 'Chopstick Taboos', explanation: 'Never stick chopsticks vertically into rice (associated with Buddhist funeral rites) or pass food directly chopstick-to-chopstick.' },
      { rule: 'Quiet on Public Transit', explanation: 'Keep conversations low and phones in silent "Manner Mode" on trains and subways. Avoid taking phone calls onboard.' },
      { rule: 'No Tipping Policy', explanation: 'Tipping is not practiced and is considered confusing or insulting. Excellent service is regarded as standard.' },
      { rule: 'Escalator Etiquette', explanation: 'In Tokyo, stand on the left and walk on the right. In Kyoto and Osaka, stand on the right.' },
    ],
    phrases: [
      { phrase: 'Konnichiwa', translation: 'Hello / Good afternoon', pronunciation: 'kohn-nee-chee-wah' },
      { phrase: 'Arigatou gozaimasu', translation: 'Thank you very much (polite)', pronunciation: 'ah-ree-gah-toh goh-zahy-mahs' },
      { phrase: 'Sumimasen', translation: 'Excuse me / Sorry / Pardon', pronunciation: 'soo-mee-mah-sehn' },
      { phrase: 'O-kaikei kudasai', translation: 'The bill, please', pronunciation: 'oh-kye-kay koo-dah-sye' },
      { phrase: 'Eigo ga hanasemasu ka?', translation: 'Do you speak English?', pronunciation: 'ay-goh gah hah-nah-seh-mahs kah' },
    ],
    scamsToAvoid: [
      'Touts in nightlife districts (Roppongi/Kabukicho) promising "free entry" or cheap drinks that lead to exorbitant cover charges.',
      'Monks soliciting donations in tourist hotspots with brass amulets—legitimate temples never accost pedestrians.',
    ],
    diningTips: [
      'Slurping ramen or soba noodles is considered polite and shows you are enjoying the meal (it also cools the broth).',
      'Pour drinks for your travel companions before filling your own glass.',
    ],
  },
  france: {
    customs: [
      'Always greet shopkeepers and waitstaff with "Bonjour Madame / Monsieur" upon entering, and "Au revoir" when leaving.',
      'Dining is an experience to savor; meals often last 2 hours or more, and waitstaff will not rush you with the bill.',
      'Dress stylishly and modestly; casual athletic wear is uncommon outside of gyms.',
    ],
    etiquette: [
      { rule: 'Say Bonjour First', explanation: 'Failing to say "Bonjour" before asking a question is seen as quite rude.' },
      { rule: 'Keep Hands on the Table', explanation: 'During dining, place your hands (wrists) on the table, not in your lap.' },
      { rule: 'Asking for the Bill', explanation: 'Waiters will never bring the bill unprompted. Ask with "L’addition, s’il vous plaît."' },
      { rule: 'Bread on the Tablecloth', explanation: 'Bread is placed directly on the tablecloth to the left of your plate, not on the dinner plate.' },
    ],
    phrases: [
      { phrase: 'Bonjour', translation: 'Hello / Good day', pronunciation: 'bohn-zhoor' },
      { phrase: 'Merci beaucoup', translation: 'Thank you very much', pronunciation: 'mehr-see boh-koo' },
      { phrase: 'S’il vous plaît', translation: 'Please', pronunciation: 'seel voo pleh' },
      { phrase: 'Parlez-vous anglais ?', translation: 'Do you speak English?', pronunciation: 'par-lay voo ahn-gleh' },
      { phrase: 'L’addition, s’il vous plaît', translation: 'The bill, please', pronunciation: 'lah-dee-syohn seel voo pleh' },
    ],
    scamsToAvoid: [
      'Petition scam near Eiffel Tower or Montmartre: clipboard holders asking for signatures as a distraction for pickpockets.',
      'Friendship bracelet trick at Sacré-Cœur: men attempting to tie braided strings to your wrist and demanding money.',
    ],
    diningTips: [
      'Tap water ("une carafe d’eau") is free and universally safe; you do not need to buy bottled water unless desired.',
      'Coffee ordered with breakfast is often café au lait; after lunch or dinner, order un espresso.',
    ],
  },
  italy: {
    customs: [
      'Dress code for churches (Vatican, Duomo): shoulders and knees must be covered for both men and women.',
      'Morning cappuccino: Italians only drink milk-based coffee before 11:00 AM; after meals, order an espresso.',
      'Riposo / Afternoon pause: Many smaller shops and family trattorias close between 1:30 PM and 4:30 PM.',
    ],
    etiquette: [
      { rule: 'No Cappuccino with Lunch', explanation: 'Milk-heavy coffee is considered a breakfast beverage; after lunch or dinner, drink a "caffè normale".' },
      { rule: 'Never Cut Pasta with a Knife', explanation: 'Twirl long pasta (spaghetti) against the fork; using a spoon is considered touristy.' },
      { rule: 'Coperto & Pane', explanation: 'A small cover charge (1–3€ per person) for bread and table setting is customary and printed on the menu.' },
    ],
    phrases: [
      { phrase: 'Ciao / Buongiorno', translation: 'Hello / Good morning', pronunciation: 'chow / bwon-johr-noh' },
      { phrase: 'Grazie mille', translation: 'Thank you very much', pronunciation: 'graht-syeh meel-leh' },
      { phrase: 'Per favore', translation: 'Please', pronunciation: 'pehr fah-voh-reh' },
      { phrase: 'Il conto, per favore', translation: 'The bill, please', pronunciation: 'eel kohn-toh pehr fah-voh-reh' },
      { phrase: 'Parla inglese?', translation: 'Do you speak English?', pronunciation: 'par-lah een-gleh-seh' },
    ],
    scamsToAvoid: [
      'Gladiator photo extortion near Colosseum: actors demanding 20–50€ after posing for a "quick friendly photo".',
      'Unlicensed taxis at Rome Fiumicino or train stations; only take official white metered cabs from taxi ranks.',
    ],
    diningTips: [
      'Aperitivo hour (6–9 PM): Order a Spritz or Negroni, which comes with complimentary savory snacks or buffet bites.',
      'Gelaterias: Look for naturally colored gelato kept in metal tins with lids ("pozzetti") rather than unnaturally piled bright mounds.',
    ],
  },
  default: {
    customs: [
      'Familiarize yourself with local emergency numbers and carry a printed copy of your hotel address in the local language.',
      'Be mindful of photography rules around religious landmarks, military installations, and government buildings.',
      'Keep your valuables secured and use cross-body zipped bags in crowded transit stations.',
    ],
    etiquette: [
      { rule: 'Respect Local Dress Codes', explanation: 'Research whether conservative attire is required for religious sites and cultural monuments.' },
      { rule: 'Greeting Etiquette', explanation: 'A warm, polite greeting in the local language opens doors and shows mutual respect.' },
      { rule: 'Tipping Norms', explanation: 'Check local customs; some destinations include service in the bill while others expect 10–20% gratuity.' },
    ],
    phrases: [
      { phrase: 'Hello', translation: 'Greeting', pronunciation: '—' },
      { phrase: 'Thank you', translation: 'Gratitude', pronunciation: '—' },
      { phrase: 'Please', translation: 'Politeness', pronunciation: '—' },
      { phrase: 'Where is the restroom?', translation: 'Directions', pronunciation: '—' },
      { phrase: 'How much is this?', translation: 'Shopping', pronunciation: '—' },
    ],
    scamsToAvoid: [
      'Unmetered taxis or drivers claiming meters are broken.',
      'Overly friendly strangers offering tea ceremonies or unregulated guided tours.',
    ],
    diningTips: [
      'Seek restaurants where locals eat and avoid menus with faded photos plastered outside tourist centers.',
      'Inquire whether service charges and local taxes are included in menu prices.',
    ],
  },
};

// GET /api/trips/:id/culture
router.get('/:id/culture', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const normDest = (trip.destination || '').toLowerCase();
    let guide = DESTINATION_CULTURE.default;
    for (const [key, val] of Object.entries(DESTINATION_CULTURE)) {
      if (normDest.includes(key)) {
        guide = val;
        break;
      }
    }

    return res.json({ destination: trip.destination, guide });
  } catch (err) {
    console.error('Culture guide error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── TRAVEL JOURNAL & MEMORIES CRUD ─────────────────────────────────────

const createJournalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  dayNumber: z.number().int().optional(),
  photoUrl: z.string().optional(),
  rating: z.number().int().min(1).max(5).default(5),
  location: z.string().optional(),
});

// POST /api/trips/:tripId/journal
router.post('/:tripId/journal', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.user!.userId },
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const parsed = createJournalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Validation error' });
    }

    const entry = await prisma.journalEntry.create({
      data: {
        tripId: trip.id,
        ...parsed.data,
      },
    });

    return res.status(201).json({ entry, journalEntry: entry });
  } catch (err) {
    console.error('Create journal error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/trips/:tripId/journal/:journalId
router.delete('/:tripId/journal/:journalId', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.user!.userId },
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const entry = await prisma.journalEntry.findFirst({
      where: { id: req.params.journalId, tripId: trip.id },
    });
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    await prisma.journalEntry.delete({ where: { id: entry.id } });
    return res.json({ message: 'Journal entry removed' });
  } catch (err) {
    console.error('Delete journal error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── AI SCHEDULE OPTIMIZER ──────────────────────────────────────────────

// POST /api/trips/:tripId/days/:dayId/optimize
router.post('/:tripId/days/:dayId/optimize', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: { id: req.params.tripId, userId: req.user!.userId },
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const day = await prisma.day.findFirst({
      where: { id: req.params.dayId, tripId: trip.id },
      include: { activities: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!day) {
      return res.status(404).json({ error: 'Day not found' });
    }

    if (day.activities.length === 0) {
      return res.json({ message: 'No activities to optimize', day });
    }

    const OPTIMIZED_SLOTS = [
      '09:00 AM',
      '11:30 AM',
      '01:15 PM',
      '03:45 PM',
      '06:30 PM',
      '08:30 PM',
      '10:00 PM',
    ];

    const updates = day.activities.map((act, index) => {
      const time = OPTIMIZED_SLOTS[Math.min(index, OPTIMIZED_SLOTS.length - 1)];
      return prisma.activity.update({
        where: { id: act.id },
        data: {
          sortOrder: index,
          time,
        },
      });
    });

    await prisma.$transaction(updates);

    const updatedDay = await prisma.day.findUnique({
      where: { id: day.id },
      include: { activities: { orderBy: { sortOrder: 'asc' } } },
    });

    return res.json({ message: 'Day schedule optimized', day: updatedDay });
  } catch (err) {
    console.error('Optimize day error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/trips/:id/audio-guide ──────────────────────────────────────
router.get('/:id/audio-guide', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: {
        id: req.params.id,
        OR: [{ userId: req.user!.userId }, { status: 'published' }],
      },
      include: {
        days: {
          include: { activities: true },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const dest = trip.destination || 'Destination';
    const lowerDest = dest.toLowerCase();

    // Generate rich destination chapters
    let chapters = [];

    if (lowerDest.includes('kyoto') || lowerDest.includes('japan')) {
      chapters = [
        {
          id: 'chap-1',
          title: 'Echoes of the Shogun: The Whispering Torii Gates',
          location: 'Fushimi Inari Taisha, Kyoto',
          category: 'mythology',
          durationMin: 3,
          triviaFact: 'Each of the 10,000 vermillion torii gates was donated by a merchant or guild seeking prosperity.',
          narrativeScript: `Welcome to Kyoto. As you approach the foothills of Mount Inari, you are stepping through a sacred boundary that has welcomed pilgrims for over thirteen hundred years. Look closely at the vibrant vermilion pillars of the Senbon Torii. The bright color isn't merely decorative—ancient Shinto belief holds that cinnabar protects against malevolent spirits while preserving the sacred cedar timber. As you walk under this canopy of orange light, listen to the subtle forest breeze whispering through the bamboo canopy. You are tracing the footsteps of feudal merchants, emperors, and wanderers who climbed these same stone steps seeking blessing and good fortune.`,
          photoUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
        },
        {
          id: 'chap-2',
          title: 'The Golden Pavilion & Zen Contemplation',
          location: 'Kinkaku-ji, Northern Kyoto',
          category: 'architecture',
          durationMin: 4,
          triviaFact: 'The top two floors of Kinkaku-ji are coated in pure 24-karat gold leaf, reflecting seamlessly into the Mirror Pond.',
          narrativeScript: `Pause for a moment before the Mirror Pond, known as Kyoko-chi. Rising before you is Kinkaku-ji, the Golden Pavilion, perfectly poised between heaven and earth. Notice how each of its three tiers embodies a distinct architectural philosophy. The ground floor reflects the palace style of the Heian aristocracy, airy and natural. The second floor follows the samurai residence style. And the top floor is purely Zen Buddhist. When the afternoon sun catches the gold leaf, the entire structure ignites in amber fire, mirrored faithfully in the still lotus pond below.`,
          photoUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
        },
        {
          id: 'chap-3',
          title: 'Shadows of Gion: The Art of the Geiko',
          location: 'Gion District & Hanami-koji',
          category: 'history',
          durationMin: 3,
          triviaFact: 'In Kyoto, traditional geishas are called Geiko, meaning "woman of art," and apprentice geishas are known as Maiko.',
          narrativeScript: `As twilight settles across the narrow stone-paved alleys of Gion, the lanterns outside wooden machiya teahouses flicker to life. This preserved neighborhood has been Kyoto's premier entertainment district for four centuries. Take a soft breath and listen for the rhythmic clatter of okobo wooden clogs on the flagstones. Here, centuries-old traditions of tea ceremony, classical koto music, and refined conversation are kept alive with uncompromising dedication. Notice the bamboo lattice screens designed to protect modesty while allowing the sounds of laughter and shamisen strings to drift into the night air.`,
          photoUrl: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=800&q=80',
        },
        {
          id: 'chap-4',
          title: 'The Bamboo Grove: A Soundscape of Tranquility',
          location: 'Arashiyama Bamboo Grove',
          category: 'nature',
          durationMin: 3,
          triviaFact: 'The Ministry of the Environment designated the rustling sound of the Arashiyama bamboo as one of the "100 Soundscapes of Japan".',
          narrativeScript: `Step quietly onto the wooden path of Arashiyama. Towering green stalks of moso bamboo rise thirty feet into the sky, filtering the morning sun into emerald rays. Notice how the temperature drops the deeper you walk into the grove. Close your eyes for thirty seconds and listen. The Japanese have a word for this—shinrin-yoku, or forest bathing. The rhythmic clicking of bamboo culms rubbing against each other in the wind creates an organic symphony that has soothed weary minds for millennia.`,
          photoUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
        },
      ];
    } else if (lowerDest.includes('paris') || lowerDest.includes('france')) {
      chapters = [
        {
          id: 'chap-1',
          title: 'The Iron Lady: Engineering Audacity',
          location: 'Champ de Mars, Paris',
          category: 'architecture',
          durationMin: 4,
          triviaFact: 'Gustave Eiffel included a secret private apartment at the very summit of the tower to entertain guests like Thomas Edison.',
          narrativeScript: `You stand beneath 18,000 pieces of wrought puddle iron held together by two and a half million rivets. When unveiled for the 1889 Universal Exposition, critics and poets lamented it as a monstrous dark skeleton. Today, the Eiffel Tower is the undisputed silhouette of romantic Paris. Look up through the soaring arches: notice how delicate the lattice appears against the open sky, designed to flex safely against the strongest Atlantic gales.`,
          photoUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
        },
        {
          id: 'chap-2',
          title: 'Montmartre: The Bohemian Muse',
          location: 'Place du Tertre & Sacré-Cœur',
          category: 'history',
          durationMin: 3,
          triviaFact: 'The white travertine stone of Sacré-Cœur naturally bleaches itself clean when it rains, keeping the basilica luminous white.',
          narrativeScript: `Wind your way up the labyrinthine staircases of Montmartre. At the turn of the twentieth century, this hillside village was home to impoverished visionaries—Picasso, Van Gogh, Toulouse-Lautrec, and Renoir. Wine flowed freely in cabarets like the Moulin de la Galette, and paintbrushes captured the dawn of modern art. Stand on the crest of the hill and gaze across the slate-gray rooftops of the City of Light sprawling beneath your feet.`,
          photoUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
        },
      ];
    } else {
      // General custom destination chapters
      const activities = trip.days.flatMap((d) => d.activities);
      const topLocations = activities.slice(0, 3).map((a) => a.location || a.title);

      chapters = [
        {
          id: 'chap-1',
          title: `Discovering ${dest}: The Heart & Origins`,
          location: topLocations[0] || dest,
          category: 'history',
          durationMin: 3,
          triviaFact: `Historic records show that travelers have celebrated the distinctive culture and geographic beauty of ${dest} for generations.`,
          narrativeScript: `Welcome to ${dest}. Every cobblestone street, open plaza, and skyline vista tells a vibrant story of trade, culture, and human innovation. As you begin exploring, pay close attention to the architectural motifs around you—how the blend of historical traditions and contemporary energy creates an atmosphere unique in all the world. Breathe in the morning air and prepare for an unforgettable voyage of discovery.`,
          photoUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
        },
        {
          id: 'chap-2',
          title: `Culinary Traditions & Local Flavors of ${dest}`,
          location: topLocations[1] || `${dest} Market District`,
          category: 'culinary',
          durationMin: 3,
          triviaFact: `Local gastronomy here is celebrated for using seasonal harvests and time-honored artisanal preparation techniques.`,
          narrativeScript: `Food in ${dest} is more than sustenance—it is an art form and a daily celebration of community. As you wander through the market stalls and neighborhood eateries, notice the scents of simmering broths, fresh roasted aromatics, and baked pastries. Engaging with local market vendors and sampling small bites is the fastest way to understand the soul and warm hospitality of this extraordinary place.`,
          photoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
        },
        {
          id: 'chap-3',
          title: `Secret Alleys & Hidden Treasures in ${dest}`,
          location: topLocations[2] || `${dest} Historic Quarter`,
          category: 'architecture',
          durationMin: 4,
          triviaFact: `Wandering off the main tourist avenues often reveals secret courtyards and centuries-old artisan workshops.`,
          narrativeScript: `The real magic of ${dest} happens when you step off the main thoroughfares. Turn down the quiet side streets where laundry hangs softly from balconies and local cats sunbathe on stone steps. Here, tucked away from the crowds, you'll encounter quiet workshops where craftspeople continue centuries-old techniques, quiet cafes, and panoramic vantage points loved by locals.`,
          photoUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
        },
      ];
    }

    return res.json({
      destination: dest,
      totalChapters: chapters.length,
      chapters,
    });
  } catch (err) {
    console.error('Audio guide error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

