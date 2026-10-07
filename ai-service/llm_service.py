import os
import json
import logging
from typing import Optional
import google.generativeai as genai
from schemas import GenerateRequest, ItineraryResponse, DaySchema, ActivitySchema, ChatRequest, ChatResponse, ChatMessage

logger = logging.getLogger(__name__)

# Known destination coordinates and presets for realistic fallbacks
DESTINATION_PRESETS = {
    "jaipur": {
        "title": "Royal {days}-Day Jaipur & Amer Heritage Experience",
        "lat": 26.9124,
        "lng": 75.7873,
        "spots": [
            ("Amer Fort & Sheesh Mahal", "Ascend the Rajput hilltop citadel and marvel at the mirror palace reflecting morning light.", "Devisinghpura, Amer, Jaipur, Rajasthan 302028", 26.9855, 75.8513, "heritage"),
            ("Hawa Mahal & Old City Walk", "Photograph the iconic honeycomb 953-window facade and taste hot pyaaz kachoris.", "Hawa Mahal Rd, Badi Choupad, J.D.A. Market, Jaipur", 26.9239, 75.8267, "sightseeing"),
            ("City Palace & Chandra Mahal", "Tour the royal courtyards, Peacock Gate, and museum of royal ceremonial costumes.", "Tulsi Marg, Gangori Bazaar, J.D.A. Market, Jaipur", 26.9258, 75.8236, "culture"),
            ("Jantar Mantar UNESCO Observatory", "Discover 18th-century stone architectural astronomical instruments and giant sundial.", "Gangori Bazaar, J.D.A. Market, Jaipur", 26.9248, 75.8246, "sightseeing"),
            ("Nahargarh Fort Sunset Viewpoint", "Savor sunset tea overlooking panoramic views of the illuminated Pink City skyline.", "Krishna Nagar, Brahampuri, Jaipur", 26.9372, 75.8155, "sightseeing"),
            ("Johari Bazaar & LMB Sweets", "Shop block-printed quilts, gemstone jewelry, and taste authentic Rajasthani Ghevar.", "Johari Bazar, Bapu Bazar, Biseswarji, Jaipur", 26.9200, 75.8250, "shopping"),
        ]
    },
    "varanasi": {
        "title": "Spiritual {days}-Day Varanasi Ganges Journey",
        "lat": 25.3176,
        "lng": 82.9739,
        "spots": [
            ("Dawn Boat Row on the Holy Ganges", "Watch sacred rituals and sunrise reflections over ancient stone ghats.", "Dashashwamedh Ghat Rd, Ghats of Varanasi", 25.3076, 83.0104, "spiritual"),
            ("Kashi Vishwanath Golden Temple", "Take darshan at the revered Jyotirlinga shrine along the grand Kashi corridor.", "Lahori Tola, Varanasi, Uttar Pradesh 221001", 25.3109, 83.0107, "spiritual"),
            ("Dashashwamedh Ghat Evening Aarti", "Witness the world-famous synchronized brass lamp Vedic Ganga Aarti.", "Dashashwamedh Ghat, Varanasi", 25.3072, 83.0101, "culture"),
            ("Sarnath Dhamek Stupa & Deer Park", "Visit the peaceful park where Gautama Buddha delivered his first sermon.", "Dharmapala Rd, Sarnath, Varanasi", 25.3809, 83.0245, "culture"),
            ("Assi Ghat Yoga & Morning Music", "Enjoy subah-e-banaras classical sitar recitals and hot kulhad chai.", "Assi Ghat, Shivala, Varanasi", 25.2890, 83.0062, "spiritual"),
            ("Godowlia Market & Banarasi Paan", "Savor spicy kachori-jalebi, tamatar chaat, and world-famous Meetha Paan.", "Godowlia, Dashashwamedh, Varanasi", 25.3095, 83.0065, "food"),
        ]
    },
    "goa": {
        "title": "Sun-Kissed {days}-Day Goa Beach & Heritage Escape",
        "lat": 15.2993,
        "lng": 74.1240,
        "spots": [
            ("Palolem Crescent Beach", "Relax on powder sands, kayak through calm waters, and spot coastal dolphins.", "Palolem, Canacona, South Goa", 15.0100, 74.0232, "beach"),
            ("Basilica of Bom Jesus", "Tour the 17th-century UNESCO Baroque church holding relics of St. Francis Xavier.", "Old Goa Rd, Bainguinim, Goa", 15.5009, 73.9116, "heritage"),
            ("Fontainhas Latin Quarter Walking Tour", "Stroll pastel Portuguese colonial villas, terracotta roofs, and artisan bakeries.", "Fontainhas, Altinho, Panaji, Goa", 15.4960, 73.8320, "culture"),
            ("Aguada Fort & Lighthouse Vista", "Climb the Portuguese sea fortress overlooking Sinquerim beach and the Arabian Sea.", "Candolim, Sinquerim, Goa 403515", 15.4926, 73.7737, "sightseeing"),
            ("Anjuna / Vagator Cliff Sunset Shack", "Savor fresh grilled seafood, Goan fish curry, and chilled feni overlooking the surf.", "Vagator Beach Rd, Anjuna, Goa", 15.5985, 73.7380, "food"),
            ("Dudhsagar Waterfall Jungle Excursion", "Marvel at the four-tiered milky cascade tumbling 310m through lush Western Ghats.", "Sonaulim, Goa 403410", 15.3144, 74.3143, "nature"),
        ]
    },
    "kerala": {
        "title": "God's Own Country: {days}-Day Kerala Backwaters & Tea Hills",
        "lat": 9.9312,
        "lng": 76.2673,
        "spots": [
            ("Overnight Alleppey Houseboat Cruise", "Glide along emerald canals and tranquil paddy fields on a traditional Kettuvallam.", "Finishing Point Rd, Alappuzha, Kerala", 9.4981, 76.3388, "nature"),
            ("Kolukkumalai Sunrise Tea Plantation", "Witness sunrise above the clouds at the world's highest organic tea garden.", "Kottagudi, Bodinayakanur, Munnar border", 10.0892, 77.2559, "nature"),
            ("Fort Kochi Chinese Fishing Nets & Jew Town", "Watch cantilevered fishing nets and explore spice warehouses and Jewish synagogue.", "River Rd, Fort Kochi, Kochi, Kerala", 9.9674, 76.2427, "heritage"),
            ("Eravikulam National Park Safari", "Spot endangered Nilgiri Tahr mountain goats amidst rolling mist-shrouded shola forests.", "Munnar, Kerala 685612", 10.2008, 77.0863, "wildlife"),
            ("Traditional Kerala Sadya on Banana Leaf", "Feast on 24 authentic vegetarian dishes, crispy pappadams, avial, and payasam.", "Chittoor Rd, Ernakulam, Kochi", 9.9700, 76.2800, "food"),
            ("Kathakali & Kalaripayattu Cultural Show", "Experience vibrant facial mudras, elaborate costumes, and ancient martial arts.", "KB Jacob Rd, Fort Kochi, Kochi", 9.9640, 76.2440, "culture"),
        ]
    },
    "manali": {
        "title": "Himalayan {days}-Day Manali & Solang Snow Adventure",
        "lat": 32.2432,
        "lng": 77.1892,
        "spots": [
            ("Solang Valley Adventure Sports", "Experience tandem paragliding, zorbing, and alpine vistas of Pir Panjal peaks.", "Solang Valley, Vashisht, Manali", 32.3166, 77.1578, "nature"),
            ("Hadimba Devi Ancient Cedar Temple", "Visit the 1553 pagoda-style wooden forest shrine dedicated to Goddess Hadimba.", "Hadimba Temple Rd, Siyal, Manali", 32.2483, 77.1812, "heritage"),
            ("Atal Tunnel & Sissu Waterfall Day Trip", "Drive through the 9km highway tunnel to the breathtaking snow valley of Lahaul.", "Atal Tunnel North Portal, Sissu", 32.4833, 77.1167, "sightseeing"),
            ("Jogini Waterfall Pine Trail", "Trek through deodar forests to natural swimming pools and thunderous cascades.", "Vashisht, Manali, Himachal Pradesh", 32.2660, 77.1950, "nature"),
            ("Old Manali Cozy Cafes & Siddu Tasting", "Sample Himachali Siddu with pure ghee and wood-fired trout fish in bohemian cafes.", "Old Manali, Manali, Himachal Pradesh", 32.2530, 77.1780, "food"),
        ]
    },
    "delhi": {
        "title": "Capital Splendor: {days}-Day Delhi Heritage & Flavors",
        "lat": 28.6139,
        "lng": 77.2090,
        "spots": [
            ("Red Fort & Jama Masjid Tour", "Explore Mughal imperial power and India's largest historic mosque courtyard.", "Netaji Subhash Marg, Lal Qila, Chandni Chowk, New Delhi", 28.6562, 77.2410, "heritage"),
            ("Chandni Chowk Street Food Crawl", "Sample legendary Sita Ram chole bhature, parathas, and jalebis in old alleyways.", "Chandni Chowk, Old Delhi", 28.6506, 77.2303, "food"),
            ("Humayun's Tomb Charbagh Walk", "Admire the red sandstone garden mausoleum that inspired the Taj Mahal.", "Mathura Rd, Nizamuddin East, New Delhi", 28.5933, 77.2507, "heritage"),
            ("Qutub Minar & Iron Pillar", "Gaze up at the 73m victory tower and ancient rust-resistant metallurgical pillar.", "Seth Sarai, Mehrauli, New Delhi", 28.5245, 77.1855, "heritage"),
            ("India Gate & Kartavya Path Stroll", "Pay respect at the National War Memorial and enjoy ice cream along illuminated lawns.", "Kartavya Path, India Gate, New Delhi", 28.6129, 77.2295, "sightseeing"),
        ]
    },
    "paris": {
        "title": "Enchanting {days}-Day Paris Getaway",
        "lat": 48.8566,
        "lng": 2.3522,
        "spots": [
            ("Café de Flore & Saint-Germain", "Savor fresh croissants and café au lait at historic Saint-Germain-des-Prés.", "172 Bd Saint-Germain, 75006 Paris", 48.8541, 2.3327, "food"),
            ("Louvre Museum & Tuileries Garden", "Explore masterpieces including the Mona Lisa and stroll through the royal gardens.", "Rue de Rivoli, 75001 Paris", 48.8606, 2.3376, "sightseeing"),
            ("Montmartre & Sacré-Cœur Basilica", "Wander cobblestone lanes, view local artists at Place du Tertre, and view panoramic vistas.", "35 Rue du Chevalier de la Barre, 75018 Paris", 48.8867, 2.3431, "culture"),
            ("Eiffel Tower & Seine Sunset Cruise", "Ascend the iconic Iron Lady followed by a twilight boat cruise past lit monuments.", "Champ de Mars, 5 Av. Anatole France, 75007 Paris", 48.8584, 2.2945, "sightseeing"),
        ]
    }
}


def build_prompt(request: GenerateRequest) -> str:
    budget_descriptions = {
        "budget": "budget-friendly (hostels, guesthouses, Indian Railways/3AC, auto-rickshaws, famous street food & local thalis under ₹2,000/day)",
        "moderate": "mid-range (3-4 star hotels & heritage boutique stays, AC chair car / Vande Bharat, verified app cabs, charming cafes & thali restaurants ₹2,500-₹5,000/day)",
        "luxury": "luxury (5-star heritage havelis & luxury resorts, private chauffeur AC sedan, upscale dining, VIP monument passes ₹5,000+/day)",
    }
    budget_desc = budget_descriptions.get(request.budget_level, budget_descriptions["moderate"])

    interests_section = ""
    if request.interests:
        interests_section = f"\nThe traveler's specific interests and preferences: {request.interests}."

    return f"""You are a world-class travel planner and Indian travel discovery specialist.
Create an inspiring, practical, and culturally authentic {request.duration_days}-day travel itinerary for {request.destination}.

Budget tier: {request.budget_level} ({budget_desc}).{interests_section}

Requirements:
1. Provide exactly {request.duration_days} days.
2. For each day, provide 4-5 well-paced activities across morning, afternoon, and evening. Group geographically proximate sights to avoid backtracking.
3. Include realistic times (e.g. "09:00 AM", "01:00 PM", "07:30 PM"), real landmark names, accurate addresses in India, and real GPS coordinates (latitude and longitude).
4. Include authentic local dishes (vegetarian, street food, regional thalis, or local specialties) for meal stops.
5. Assign each activity a category from: food, sightseeing, culture, nature, shopping, nightlife, transport.
6. Provide a catchy, memorable title for the trip.

Return ONLY a valid JSON object matching this exact schema without markdown formatting:
{{
  "title": "{request.duration_days} Days in {request.destination}",
  "cover_image_url": null,
  "days": [
    {{
      "day_number": 1,
      "summary": "Brief 3-6 word theme for the day",
      "activities": [
        {{
          "sort_order": 1,
          "time": "09:00 AM",
          "title": "Activity name",
          "description": "Engaging 2-sentence description of the activity and what makes it special.",
          "location": "Actual address or landmark name",
          "latitude": 0.0,
          "longitude": 0.0,
          "category": "sightseeing"
        }}
      ]
    }}
  ]
}}"""


def generate_fallback_itinerary(request: GenerateRequest) -> ItineraryResponse:
    """Generate a realistic, curated itinerary fallback when LLM is unavailable or unconfigured."""
    dest_lower = request.destination.lower()
    days_count = max(1, min(request.duration_days, 30))

    # Check for preset
    preset = None
    for key, data in DESTINATION_PRESETS.items():
        if key in dest_lower:
            preset = data
            break

    trip_title = f"{days_count} Days Exploring {request.destination}"
    if preset:
        trip_title = preset["title"].format(days=days_count)

    days_list: list[DaySchema] = []

    time_slots = [
        ("08:30 AM", "Morning Awakening", "Breakfast and iconic morning walk to kick off the day."),
        ("10:30 AM", "Core Exploration", "Main cultural or architectural landmark visit."),
        ("01:00 PM", "Local Culinary Gem", "Traditional lunch sampling regional specialties."),
        ("03:30 PM", "Afternoon Discovery", "Scenic viewpoint, charming neighborhood stroll, or museum."),
        ("07:30 PM", "Evening Atmosphere", "Dinner, sunset vista, or lively evening entertainment.")
    ]

    for day_num in range(1, days_count + 1):
        day_theme = f"Day {day_num}: {request.destination} Highlights & Flavor"
        if day_num == 1:
            day_theme = f"Arrival & Iconic Landmarks of {request.destination}"
        elif day_num == 2:
            day_theme = f"Culture, Hidden Alleys & Local Gastronomy"
        elif day_num == 3:
            day_theme = f"Parks, Scenic Panoramas & Arts"
        elif day_num == days_count:
            day_theme = f"Memorable Farewell & Sunset Views"

        activities: list[ActivitySchema] = []

        if preset:
            spots = preset["spots"]
            for idx, (slot_time, _, _) in enumerate(time_slots):
                spot = spots[(day_num * 2 + idx) % len(spots)]
                activities.append(
                    ActivitySchema(
                        sort_order=idx + 1,
                        time=slot_time,
                        title=spot[0],
                        description=spot[1],
                        location=spot[2],
                        latitude=spot[3],
                        longitude=spot[4],
                        category=spot[5],
                    )
                )
        else:
            categories = ["food", "sightseeing", "food", "culture", "nightlife"]
            for idx, (slot_time, slot_title, slot_desc) in enumerate(time_slots):
                cat = categories[idx % len(categories)]
                activities.append(
                    ActivitySchema(
                        sort_order=idx + 1,
                        time=slot_time,
                        title=f"{slot_title} in {request.destination}",
                        description=f"{slot_desc} Immersing in the local {request.budget_level} vibe.",
                        location=f"Central {request.destination}",
                        latitude=None,
                        longitude=None,
                        category=cat,
                    )
                )

        days_list.append(
            DaySchema(
                day_number=day_num,
                summary=day_theme,
                activities=activities,
            )
        )

    return ItineraryResponse(
        title=trip_title,
        cover_image_url=None,
        days=days_list,
    )


async def generate_itinerary(request: GenerateRequest) -> ItineraryResponse:
    api_key = os.getenv("GEMINI_API_KEY")

    # If no key or placeholder key, use high-quality fallback generator
    if not api_key or "your-gemini" in api_key.lower():
        logger.info("No active GEMINI_API_KEY provided; utilizing curated fallback generator.")
        return generate_fallback_itinerary(request)

    try:
        genai.configure(api_key=api_key)
        # Try gemini-2.0-flash, or gemini-1.5-flash
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = build_prompt(request)

        response = model.generate_content(prompt)
        raw_text = response.text.strip()

        # Clean code fences
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            raw_text = "\n".join(lines).strip()

        data = json.loads(raw_text)
        return ItineraryResponse(**data)
    except Exception as e:
        logger.warning(f"Gemini API request failed ({e}); switching to curated itinerary generator.")
        return generate_fallback_itinerary(request)


def generate_fallback_chat(request: ChatRequest) -> ChatResponse:
    q = request.message.lower()
    dest = request.destination

    if "cheap" in q or "budget" in q or "reduce" in q or "save" in q or "₹" in q or "rupee" in q:
        reply = (
            f"Here are practical ways to save budget on your trip to {dest}: "
            f"1. Choose verified boutique heritage homestays instead of international chain hotels (saves 30–50%). "
            f"2. Use Vande Bharat or AC Chair Car trains for intercity hops, and Metro / Uber Auto locally. "
            f"3. Feast on legendary local Bhojanalaya thalis and famous street food institutions for under ₹250–₹350 per meal. "
            f"4. Buy composite ASI monument tickets online at asi.payumoney.com to skip surcharges."
        )
        suggestions = ["Where can I eat authentic vegetarian?", "What is the cheapest way to reach my next stop?", "Safety tips for night travel?"]
    elif "veg" in q or "vegetarian" in q or "jain" in q or "food" in q or "eat" in q or "restaurant" in q:
        reply = (
            f"Dining in {dest} offers extraordinary regional variety! "
            f"For pure vegetarian and Jain-friendly dining, look for 'Shuddha Shakahari' restaurants or traditional Bhojanalayas. "
            f"Always ask for seasonal regional thalis, seek out eateries packed with local families, and try famous sweet shops (Mithai) for dessert."
        )
        suggestions = ["What are the famous street foods here?", "Can you reduce my dining budget?", "How do I get around?"]
    elif "transit" in q or "metro" in q or "train" in q or "bus" in q or "auto" in q or "cab" in q or "transport" in q:
        reply = (
            f"Getting around {dest}: For intercity journeys, Indian Railways (Vande Bharat / Shatabdi) is reliable, scenic, and budget-friendly. "
            f"Within cities, use the Metro system where available or app-based booking (Uber / Ola / Rapido Auto) to guarantee fixed upfront fares and avoid bargaining."
        )
        suggestions = ["What is the best time to visit sights?", "How safe is travel after 9 PM?", "Where should I eat?"]
    elif "safe" in q or "emergency" in q or "police" in q or "scam" in q:
        reply = (
            f"Safety advisory for {dest}: In case of any emergency, dial 112 (National Unified Emergency Response) or 100 for Police. "
            f"Women travelers can dial 1091. Keep your live GPS location shared on verified cab apps when traveling at night, "
            f"and avoid unofficial guides at monument entrances."
        )
        suggestions = ["Emergency contact numbers?", "Local cultural etiquette?", "Top photo spots?"]
    elif "wear" in q or "pack" in q or "weather" in q or "clothes" in q:
        reply = (
            f"For your {request.duration_days}-day trip to {dest}, pack lightweight, breathable cotton or linen clothing. "
            f"Comfortable slip-on walking shoes are essential as you will remove footwear at temples and monuments. "
            f"Carry a scarf or dupatta to cover your head/shoulders when entering sacred shrines."
        )
        suggestions = ["What are the best food spots?", "How do I get around?", "Any local etiquette tips?"]
    elif "etiquette" in q or "custom" in q or "culture" in q or "temple" in q:
        reply = (
            f"Cultural etiquette for {dest}: Greet locals with 'Namaste' or local regional greetings. "
            f"Always remove footwear before entering homes and temples. Dress respectfully (cover shoulders and knees). "
            f"At Buddhist gompas and Hindu temples, walk clockwise around the inner sanctum."
        )
        suggestions = ["What are the must-see landmarks?", "Best street food to try?", "What should I pack?"]
    else:
        reply = (
            f"Here is expert travel guidance for {dest}: Your {request.duration_days}-day itinerary offers a wonderful balance for a {request.budget_level} stay. "
            f"Start your mornings early around 8:00–9:00 AM to beat midday heat and crowds at major monuments, "
            f"carry bottled or filtered water, and use digital UPI payments for hassle-free transactions everywhere!"
        )
        suggestions = ["Where should I eat authentic food?", "How can I make this trip cheaper?", "Local transit tips"]

    return ChatResponse(reply=reply, suggestions=suggestions)


async def chat_with_concierge(request: ChatRequest) -> ChatResponse:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or "your-gemini" in api_key.lower():
        return generate_fallback_chat(request)

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        system_context = (
            f"You are a friendly, expert local travel concierge assisting a traveler in {request.destination}. "
            f"The trip is {request.duration_days} days long on a {request.budget_level} budget. "
            f"Traveler interests: {request.interests or 'General sightseeing'}. "
            f"Activities summary: {request.activities_summary or 'Multi-day itinerary'}.\n"
            f"Provide a helpful, concise, well-formatted response with practical travel tips, specific recommendations, and warm encouragement. "
            f"At the end, suggest 3 quick follow-up questions the traveler might ask next in this format: [SUGGESTIONS: question 1 | question 2 | question 3]"
        )

        history_prompt = ""
        for msg in request.history[-4:]:
            history_prompt += f"{msg.role.upper()}: {msg.content}\n"

        prompt = f"{system_context}\n\n{history_prompt}USER: {request.message}\nASSISTANT:"

        response = model.generate_content(prompt)
        text = response.text.strip()

        suggestions = []
        if "[SUGGESTIONS:" in text:
            parts = text.split("[SUGGESTIONS:")
            clean_reply = parts[0].strip()
            raw_sugg = parts[1].replace("]", "").strip()
            suggestions = [s.strip() for s in raw_sugg.split("|") if s.strip()]
        else:
            clean_reply = text
            suggestions = ["What should I wear?", "Recommend top food spots", "Local transit tips"]

        return ChatResponse(reply=clean_reply, suggestions=suggestions[:3])
    except Exception as e:
        logger.warning(f"Concierge LLM error: {e}, using fallback.")
        return generate_fallback_chat(request)

