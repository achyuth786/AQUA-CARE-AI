import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  initialFarm,
  initialPonds,
  initialWaterRecords,
  initialFeedRecords,
  initialSamplingRecords,
  initialMarketPrices,
  initialAlerts,
} from './src/data/seedData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';
const publicImagesDir = path.join(__dirname, 'public', 'images');

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/images', express.static(publicImagesDir));

// In-Memory Database store
let farm = { ...initialFarm };
let ponds = [...initialPonds];
let waterRecords = [...initialWaterRecords];
let feedRecords = [...initialFeedRecords];
let samplingRecords = [...initialSamplingRecords];
let marketPrices = [...initialMarketPrices];
let alerts = [...initialAlerts];

// Initialize Google GenAI client
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 15) {
  ai = new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ==================== REST API ENDPOINTS ====================

// Lightweight endpoint for hosting platforms and uptime monitors.
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'aquacare-ai' });
});

app.get('/api/weather-risk', async (req, res) => {
  const fallbackLocation = { latitude: 13.0827, longitude: 80.2707 };
  const latitude = Number(req.query.lat ?? fallbackLocation.latitude);
  const longitude = Number(req.query.lon ?? fallbackLocation.longitude);
  const pond = ponds.find((item) => item.id === req.query.pond_id) || ponds[0];

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ error: 'Valid latitude and longitude are required.' });
  }

  try {
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.search = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      timezone: 'auto',
      forecast_days: '2',
      current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
      hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m',
    }).toString();
    const weatherResponse = await fetch(weatherUrl, { signal: AbortSignal.timeout(8000) });
    if (!weatherResponse.ok) throw new Error(`Weather provider returned ${weatherResponse.status}`);
    const weather = await weatherResponse.json();
    const hourly = weather.hourly;
    const next24 = Array.from({ length: Math.min(24, hourly.time?.length || 0) }, (_, index) => ({
      temperature: Number(hourly.temperature_2m[index]),
      humidity: Number(hourly.relative_humidity_2m[index]),
      rainChance: Number(hourly.precipitation_probability[index]),
      rain: Number(hourly.precipitation[index]),
      wind: Number(hourly.wind_speed_10m[index]),
      gust: Number(hourly.wind_gusts_10m[index]),
    }));
    const maximum = (key: string) => Math.max(...next24.map((entry: any) => entry[key] || 0));
    const minimum = (key: string) => Math.min(...next24.map((entry: any) => entry[key] || 0));
    const forecast = {
      temperature_now_c: Number(weather.current?.temperature_2m),
      humidity_now_pct: Number(weather.current?.relative_humidity_2m),
      wind_now_kmh: Number(weather.current?.wind_speed_10m),
      temperature_max_c: maximum('temperature'),
      temperature_min_c: minimum('temperature'),
      rain_probability_max_pct: maximum('rainChance'),
      rain_total_mm: Number(next24.reduce((sum: number, entry: any) => sum + entry.rain, 0).toFixed(1)),
      wind_gust_max_kmh: maximum('gust'),
    };
    const risks: string[] = [];
    if (forecast.rain_total_mm >= 15 || forecast.rain_probability_max_pct >= 75) risks.push('Heavy-rain dilution and overflow risk');
    if (forecast.wind_gust_max_kmh >= 40) risks.push('High wind may reduce surface feeding accuracy and damage nets');
    if (forecast.temperature_max_c >= 34) risks.push('High afternoon temperature can increase oxygen demand');
    if (forecast.temperature_min_c <= 22) risks.push('Cool night conditions can reduce feeding response');
    const riskLevel = risks.length >= 2 ? 'high' : risks.length === 1 ? 'moderate' : 'low';
    const fallbackActions = [
      'Check pond water level, sluice screens, power supply and aerators before rain or strong wind.',
      'Measure dissolved oxygen before sunrise and reduce feed only if tray response or water quality indicates stress.',
      'After significant rain, recheck salinity, pH, alkalinity and ammonia before making treatment decisions.',
    ];
    let advisory = { summary: risks.length ? risks.join('. ') : 'No major pond-weather trigger is forecast in the next 24 hours.', actions: fallbackActions };

    if (ai) {
      const prompt = `Act as a cautious vannamei shrimp farm weather advisor. Use only this 24-hour forecast and do not invent weather values. Pond: ${pond.name}, DOC ${pond.doc}, ABW ${pond.current_abw_g}g. Forecast: ${JSON.stringify(forecast)}. Return strict JSON: {"summary":"one short sentence","actions":["three concise practical actions"]}. No medicine, antibiotic, chemical dose, or disease diagnosis.`;
      const geminiResponse = await ai.models.generateContent({
        model: geminiModel,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(geminiResponse.text || '{}');
      if (parsed.summary && Array.isArray(parsed.actions)) advisory = parsed;
    }
    res.json({ location: { latitude, longitude, timezone: weather.timezone }, pond_id: pond.id, forecast, risk_level: riskLevel, risks, ...advisory, ai_enabled: Boolean(ai) });
  } catch (error) {
    console.error('Weather-risk API error:', error);
    res.status(502).json({ error: 'Unable to load weather risk right now. Please try again shortly.' });
  }
});

// Get Farm & Ponds
app.get('/api/farm', (_req, res) => {
  res.json({ farm, ponds });
});

app.get('/api/ponds', (_req, res) => {
  res.json(ponds);
});

app.get('/api/ponds/:id', (req, res) => {
  const pond = ponds.find((p) => p.id === req.params.id);
  if (!pond) return res.status(404).json({ error: 'Pond not found' });
  res.json(pond);
});

// Create New Pond
app.post('/api/ponds', (req, res) => {
  const {
    name,
    name_te,
    area_ha,
    depth_m,
    water_source,
    aerator_count,
    aerator_hp,
    seed_quantity,
    doc,
    stocking_date,
    current_abw_g,
    estimated_count,
    species,
  } = req.body;

  const abw = Number(current_abw_g) || 12.0;
  const count = Number(estimated_count) || Math.round(1000 / abw);
  const seeds = Number(seed_quantity) || 80000;
  const survival = 85.0;
  const biomass = Math.round((seeds * (survival / 100) * abw) / 1000);

  const newPond = {
    id: `pond-${Date.now()}`,
    farm_id: farm.id,
    name: name || `Pond ${ponds.length + 1}`,
    name_te: name_te || `చెరువు ${ponds.length + 1}`,
    area_ha: Number(area_ha) || 1.0,
    depth_m: Number(depth_m) || 1.5,
    water_source: water_source || 'Brackish Creek Canal',
    aerator_count: Number(aerator_count) || 4,
    aerator_hp: Number(aerator_hp) || 8,
    status: 'active' as const,
    active_cycle_id: `cycle-${Date.now()}`,
    doc: Number(doc) || 30,
    stocking_date: stocking_date || new Date().toISOString().split('T')[0],
    species: species || 'Litopenaeus vannamei (SPF)',
    seed_quantity: seeds,
    stocking_density_per_sqm: Math.round(seeds / ((Number(area_ha) || 1.0) * 10000)),
    initial_abw_g: 0.01,
    current_abw_g: abw,
    estimated_count: count,
    estimated_survival_pct: survival,
    estimated_biomass_kg: biomass,
    cumulative_feed_kg: Math.round(biomass * 1.2),
    fcr: 1.25,
    health_score: 90,
  };

  ponds.push(newPond);
  farm.total_ponds = ponds.length;
  res.status(201).json(newPond);
});

// Update Existing Pond Details
app.put('/api/ponds/:id', (req, res) => {
  const index = ponds.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Pond not found' });

  const existing = ponds[index];
  const updatedAbw = req.body.current_abw_g !== undefined ? Number(req.body.current_abw_g) : existing.current_abw_g;
  const updatedCount = req.body.estimated_count !== undefined ? Number(req.body.estimated_count) : Math.round(1000 / updatedAbw);
  const updatedSeeds = req.body.seed_quantity !== undefined ? Number(req.body.seed_quantity) : existing.seed_quantity;
  const updatedSurvival = req.body.estimated_survival_pct !== undefined ? Number(req.body.estimated_survival_pct) : existing.estimated_survival_pct;
  const updatedBiomass = Math.round((updatedSeeds * (updatedSurvival / 100) * updatedAbw) / 1000);

  ponds[index] = {
    ...existing,
    ...req.body,
    current_abw_g: updatedAbw,
    estimated_count: updatedCount,
    seed_quantity: updatedSeeds,
    estimated_survival_pct: updatedSurvival,
    estimated_biomass_kg: updatedBiomass,
  };

  res.json(ponds[index]);
});

// Delete Pond
app.delete('/api/ponds/:id', (req, res) => {
  const index = ponds.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Pond not found' });
  const deleted = ponds.splice(index, 1);
  farm.total_ponds = ponds.length;
  res.json(deleted[0]);
});

// Water Quality Endpoints
app.get('/api/water-quality', (req, res) => {
  const pondId = req.query.pond_id as string | undefined;
  if (pondId) {
    return res.json(waterRecords.filter((w) => w.pond_id === pondId));
  }
  res.json(waterRecords);
});

app.post('/api/water-quality', (req, res) => {
  const {
    pond_id,
    time_of_day,
    do_ppm,
    ph,
    salinity_ppt,
    temperature_c,
    alkalinity_ppm,
    ammonia_ppm,
    nitrite_ppm,
    transparency_cm,
    notes,
    recorded_by,
  } = req.body;

  if (!pond_id || do_ppm === undefined || ph === undefined) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const newRecord = {
    id: `wq-${Date.now()}`,
    pond_id,
    timestamp: new Date().toISOString(),
    time_of_day: time_of_day || 'AM',
    do_ppm: Number(do_ppm),
    ph: Number(ph),
    salinity_ppt: Number(salinity_ppt || 12),
    temperature_c: Number(temperature_c || 28),
    alkalinity_ppm: Number(alkalinity_ppm || 140),
    ammonia_ppm: Number(ammonia_ppm || 0.2),
    nitrite_ppm: Number(nitrite_ppm || 0.05),
    transparency_cm: Number(transparency_cm || 32),
    notes: notes || '',
    recorded_by: recorded_by || 'Farmer',
  };

  waterRecords.unshift(newRecord);

  // Auto-generate alerts if values breach critical thresholds
  if (newRecord.do_ppm < 4.0) {
    const pond = ponds.find((p) => p.id === pond_id);
    alerts.unshift({
      id: `alt-${Date.now()}`,
      pond_id,
      pond_name: pond ? pond.name : pond_id,
      pond_name_te: pond ? pond.name_te : pond_id,
      severity: 'critical',
      title: `Low Dissolved Oxygen Alert (${newRecord.do_ppm} ppm)`,
      title_te: `తక్కువ కరిగిన ఆక్సిజన్ హెచ్చరిక (${newRecord.do_ppm} ppm)`,
      description: `Critical DO level of ${newRecord.do_ppm} ppm recorded during ${newRecord.time_of_day} inspection.`,
      description_te: `${newRecord.time_of_day} సమయంలో ఆక్సిజన్ స్థాయి ${newRecord.do_ppm} ppm కు పడిపోయింది.`,
      parameter: 'DO',
      value: `${newRecord.do_ppm} ppm`,
      recommendation: 'Operate all paddlewheel aerators immediately and withhold feeding until recovery.',
      recommendation_te: 'వెంటనే ఏరియేటర్లు వేయండి, ఆక్సిజన్ పెరిగే వరకు దాణా వేయకండి.',
      timestamp: new Date().toISOString(),
      acknowledged: false,
    });
  }

  res.status(201).json(newRecord);
});

// Feed Records Endpoints
app.get('/api/feed-records', (req, res) => {
  const pondId = req.query.pond_id as string | undefined;
  if (pondId) {
    return res.json(feedRecords.filter((f) => f.pond_id === pondId));
  }
  res.json(feedRecords);
});

app.post('/api/feed-records', (req, res) => {
  const {
    pond_id,
    meal_number,
    meal_time,
    feed_brand,
    pellet_size_mm,
    protein_pct,
    feed_quantity_kg,
    tray_observations,
    feed_adjustment_notes,
  } = req.body;

  const normalizedTray = tray_observations || {
    tray_1: 'clean',
    tray_2: 'clean',
    tray_3: 'clean',
    tray_4: 'clean',
  };

  const trayStateScore = Object.values(normalizedTray).reduce((score, value) => {
    if (value === 'untouched') return score + 3;
    if (value === 'half_left') return score + 2;
    if (value === 'slight_left') return score + 1;
    return score;
  }, 0);

  const generatedNote =
    feed_adjustment_notes ||
    (trayStateScore >= 5
      ? 'Poor feed response detected; reduce next ration and investigate DO, ammonia, and gill health.'
      : trayStateScore >= 2
      ? 'Moderate tray leftovers observed; keep ration stable and monitor appetite for the next 24 hours.'
      : 'Good feed response; maintain current ration and monitor tray clearance.');

  const newRecord = {
    id: `feed-${Date.now()}`,
    pond_id: pond_id || 'pond-01',
    date: new Date().toISOString().split('T')[0],
    meal_number: meal_number || 1,
    meal_time: meal_time || '06:00 AM',
    feed_brand: feed_brand || 'CP Prima 38%',
    pellet_size_mm: Number(pellet_size_mm || 1.6),
    protein_pct: Number(protein_pct || 38),
    feed_quantity_kg: Number(feed_quantity_kg || 10),
    tray_observations: normalizedTray,
    feed_adjustment_notes: generatedNote,
  };

  feedRecords.unshift(newRecord);

  // Update pond cumulative feed
  const pond = ponds.find((p) => p.id === pond_id);
  if (pond) {
    pond.cumulative_feed_kg += newRecord.feed_quantity_kg;
  }

  res.status(201).json(newRecord);
});

// Shrimp Sampling Endpoints
app.get('/api/growth-sampling', (req, res) => {
  const pondId = req.query.pond_id as string | undefined;
  if (pondId) {
    return res.json(samplingRecords.filter((s) => s.pond_id === pondId));
  }
  res.json(samplingRecords);
});

app.post('/api/growth-sampling', (req, res) => {
  const {
    pond_id,
    doc,
    sample_size_count,
    total_sample_weight_g,
    gut_condition,
    shell_condition,
  } = req.body;

  const sampleSize = Number(sample_size_count) || 100;
  const totalWeight = Number(total_sample_weight_g) || 1500;
  const abw = Number((totalWeight / sampleSize).toFixed(2));
  const countPerKg = Math.round(1000 / abw);

  // Calculate weekly gain from previous sample
  const prevSamples = samplingRecords
    .filter((s) => s.pond_id === pond_id)
    .sort((a, b) => b.doc - a.doc);
  const prevAbw = prevSamples.length > 0 ? prevSamples[0].abw_g : abw;
  const weeklyGain = Number(Math.max(0, abw - prevAbw).toFixed(2));
  const growthRateDay = Number((weeklyGain / 7).toFixed(2));

  const newRecord = {
    id: `samp-${Date.now()}`,
    pond_id: pond_id || 'pond-01',
    date: new Date().toISOString().split('T')[0],
    doc: Number(doc) || 48,
    sample_size_count: sampleSize,
    total_sample_weight_g: totalWeight,
    abw_g: abw,
    count_per_kg: countPerKg,
    weekly_gain_g: weeklyGain,
    growth_rate_g_day: growthRateDay,
    gut_condition: gut_condition || 'full',
    shell_condition: shell_condition || 'hard',
  };

  samplingRecords.unshift(newRecord);

  // Update pond state
  const pond = ponds.find((p) => p.id === pond_id);
  if (pond) {
    pond.current_abw_g = abw;
    pond.estimated_count = countPerKg;
    pond.doc = newRecord.doc;
    pond.estimated_biomass_kg = Math.round(
      (pond.seed_quantity * (pond.estimated_survival_pct / 100) * abw) / 1000
    );
    pond.fcr = Number((pond.cumulative_feed_kg / Math.max(1, pond.estimated_biomass_kg)).toFixed(2));
  }

  res.status(201).json(newRecord);
});

// Market Prices Endpoints
app.get('/api/market-prices', (_req, res) => {
  res.json(marketPrices);
});

app.post('/api/market-prices', (req, res) => {
  const { count_per_kg, price_inr, region } = req.body;
  if (!count_per_kg || !price_inr) {
    return res.status(400).json({ error: 'Count and price are required' });
  }

  const existingIndex = marketPrices.findIndex(
    (m) => m.count_per_kg === Number(count_per_kg)
  );

  const updatedItem = {
    id: `mp-${count_per_kg}`,
    date: new Date().toISOString().split('T')[0],
    count_per_kg: Number(count_per_kg),
    price_inr: Number(price_inr),
    region: region || 'Bhimavaram Gate',
  };

  if (existingIndex >= 0) {
    marketPrices[existingIndex] = updatedItem;
  } else {
    marketPrices.push(updatedItem);
  }

  marketPrices.sort((a, b) => a.count_per_kg - b.count_per_kg);
  res.status(201).json(updatedItem);
});

// Alerts
app.get('/api/alerts', (_req, res) => {
  res.json(alerts);
});

app.patch('/api/alerts/:id/ack', (req, res) => {
  const alert = alerts.find((a) => a.id === req.params.id);
  if (alert) {
    alert.acknowledged = true;
    return res.json(alert);
  }
  res.status(404).json({ error: 'Alert not found' });
});

// What-If Harvest Simulator Engine
app.post('/api/what-if-simulate', (req, res) => {
  const { pond_id, target_count, expected_price_inr } = req.body;
  const pond = ponds.find((p) => p.id === pond_id) || ponds[0];

  const targetCount = Number(target_count) || 60;
  const targetAbw = 1000 / targetCount; // e.g. 60 count = 16.67g
  const currentAbw = pond.current_abw_g; // e.g. 14.8g

  const weightNeeded = Math.max(0, targetAbw - currentAbw);
  const avgGrowthRatePerDay = 0.45; // 0.45g per day typical for Vannamei in Godavari
  const additionalDays = Math.ceil(weightNeeded / avgGrowthRatePerDay);

  // Survival reduces slightly with additional days (0.15% per day)
  const projectedSurvivalPct = Math.max(50, pond.estimated_survival_pct - additionalDays * 0.15);
  const projectedShrimpCount = Math.round(pond.seed_quantity * (projectedSurvivalPct / 100));
  const projectedBiomassKg = Math.round((projectedShrimpCount * targetAbw) / 1000);

  // Additional feed needed = biomass gain * incremental FCR (1.6)
  const biomassGain = Math.max(0, projectedBiomassKg - pond.estimated_biomass_kg);
  const additionalFeedKg = Math.round(biomassGain * 1.6);
  const feedCostPerKg = 92; // Average ₹92/kg for 36-38% protein feed
  const electricityPerDay = 450; // Electricity / diesel per day for aerators
  const laborPerDay = 250;

  const additionalExpenses =
    additionalFeedKg * feedCostPerKg + additionalDays * (electricityPerDay + laborPerDay);

  const pricePerKg = Number(expected_price_inr) || (targetCount <= 40 ? 375 : targetCount <= 60 ? 280 : 225);
  const projectedGrossRevenue = Math.round(projectedBiomassKg * pricePerKg);

  // Seed cost (₹0.40 per post-larvae PL seed)
  const seedCost = pond.seed_quantity * 0.4;
  const totalCumulativeExpenses =
    pond.cumulative_feed_kg * feedCostPerKg +
    seedCost +
    pond.doc * (electricityPerDay + laborPerDay) +
    additionalExpenses;

  const projectedNetProfit = projectedGrossRevenue - totalCumulativeExpenses;
  const costPerKg = Number((totalCumulativeExpenses / Math.max(1, projectedBiomassKg)).toFixed(1));
  const breakEvenPrice = costPerKg;

  res.json({
    pond_id: pond.id,
    current_abw: currentAbw,
    current_doc: pond.doc,
    target_count: targetCount,
    target_abw: Number(targetAbw.toFixed(1)),
    additional_days: additionalDays,
    projected_harvest_doc: pond.doc + additionalDays,
    projected_biomass_kg: projectedBiomassKg,
    projected_survival_pct: Number(projectedSurvivalPct.toFixed(1)),
    additional_feed_kg: additionalFeedKg,
    additional_expenses_inr: additionalExpenses,
    expected_price_inr: pricePerKg,
    projected_gross_revenue_inr: projectedGrossRevenue,
    projected_net_profit_inr: projectedNetProfit,
    estimated_cost_per_kg_inr: costPerKg,
    break_even_price_inr: breakEvenPrice,
  });
});

// ==================== GEMINI AI INTEGRATION ====================

// Gemini Multimodal Shrimp Health Scanner
app.post('/api/gemini/screen-shrimp', async (req, res) => {
  const { image, focal_area, pond_id } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Image is required for health screening' });
  }

  const pond = ponds.find((p) => p.id === pond_id) || ponds[0];

  try {
    if (ai && process.env.GEMINI_API_KEY) {
      // Clean base64 string
      const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
      const mimeType = image.includes('data:image/png')
        ? 'image/png'
        : image.includes('data:image/svg+xml')
        ? 'image/svg+xml'
        : 'image/jpeg';

      const prompt = `You are a world-class veterinary aquaculture specialist in Litopenaeus vannamei shrimp farming in coastal Andhra Pradesh, India.
Analyze this shrimp image for visible lesions, discolorations, and symptoms in focal area: "${focal_area || 'whole_body'}".

Context:
- Pond: ${pond.name} (DOC: ${pond.doc} days, ABW: ${pond.current_abw_g}g, Salinity: 12 ppt).

MANDATORY SCIENTIFIC SAFETY RULES:
1. Never present a photograph as a definitive or confirmed diagnosis of any pathogen (e.g. WSSV, EHP, AHPND, Vibrio). A photograph alone CANNOT confirm pathogens.
2. Formulate observations purely as visible anatomical signs and differential possibilities.
3. Explicitly state the level of diagnostic uncertainty.
4. Recommend proper laboratory testing (e.g. 2-step nested PCR, wet mount microscopy, TCBS agar bacteriology).
5. Never prescribe antibiotics or unverified chemicals.
6. Provide responses in both English and Telugu (తెలుగు) so local farmers can understand immediately.

Output strictly valid JSON with this structure:
{
  "visible_observations_en": ["string", "string"],
  "visible_observations_te": ["తెలుగు పరిశీలన 1", "తెలుగు పరిశీలన 2"],
  "conditions": [
    {
      "name_en": "Condition name",
      "name_te": "తెలుగు పేరు",
      "risk_level": "low" | "moderate" | "high" | "critical",
      "confidence_note_en": "string",
      "confidence_note_te": "string"
    }
  ],
  "scientific_safety_note_en": "string",
  "scientific_safety_note_te": "string",
  "suggested_actions_en": ["action 1", "action 2"],
  "suggested_actions_te": ["తెలుగు చర్య 1", "తెలుగు చర్య 2"],
  "lab_test_recommended_en": "string",
  "lab_test_recommended_te": "string"
}`;

      const visionPromise = ai.models.generateContent({
        model: geminiModel,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Vision screening API timed out')), 6000)
      );

      const response = await Promise.race([visionPromise, timeoutPromise]);
      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Gemini vision API error:', error.message);
  }

  const defaultWater = waterRecords.filter((w) => w.pond_id === pond.id).slice(0, 5);
  const recentDo = defaultWater.length
    ? defaultWater.reduce((sum, item) => sum + (item.do_ppm || 0), 0) / defaultWater.length
    : 5.0;
  const recentTemp = defaultWater.length
    ? defaultWater.reduce((sum, item) => sum + (item.temperature_c || 28), 0) / defaultWater.length
    : 28;
  const recentAmmonia = defaultWater.length
    ? defaultWater.reduce((sum, item) => sum + (item.ammonia_ppm || 0), 0) / defaultWater.length
    : 0.12;

  const scores = {
    wssv: focal_area === 'whole_body' ? 44 : 0,
    ehp: focal_area === 'hepatopancreas' ? 42 : 0,
    wfs: focal_area === 'gut' ? 45 : 0,
    black_gills: focal_area === 'gills' ? 40 : 0,
    soft_shell: focal_area === 'muscle' ? 38 : 0,
  };

  if (recentDo < 4.2) {
    scores.black_gills += 18;
    scores.soft_shell += 12;
    scores.wssv += 8;
    scores.wfs += 12;
  }
  if (recentTemp > 31) {
    scores.wssv += 10;
    scores.soft_shell += 9;
    scores.wfs += 8;
  }
  if (recentAmmonia > 0.2) {
    scores.black_gills += 16;
    scores.wfs += 10;
  }
  if (pond.doc >= 35 && pond.doc <= 80 && pond.current_abw_g >= 12) {
    scores.ehp += 12;
  }
  if (pond.doc <= 25 && pond.current_abw_g < 3) {
    scores.soft_shell += 10;
  }

  const ranked = Object.entries(scores).sort((a, b) => Number(b[1]) - Number(a[1]));
  const [bestKey, bestScore] = ranked[0];
  const diseaseMap: Record<string, any> = {
    wssv: {
      name_en: 'White Spot Syndrome Virus (WSSV Alert)',
      name_te: 'వైట్ స్పాట్ వైరస్ వ్యాధి (WSSV)',
      risk_level: 'critical',
      health_score: 18,
      visible_observations_en: ['Distinct white cuticular inclusions are likely in the carapace region.', 'Shrimp are showing stress behavior and color changes consistent with a viral response.', 'Low dissolved oxygen and warm water can intensify early mortality risk.'],
      visible_observations_te: ['తల పెంకు ప్రాంతంలో తెల్లటి మచ్చలు కనిపించే అవకాశం ఉంది.', 'రొయ్యలు నిస్సత్తువతో ఉండి రంగు మారడాన్ని చూపిస్తున్నారు.', 'తక్కువ ఆక్సిజన్ మరియు వేడి నీరు వినాశక రేటును పెంచుతాయి.'],
      scientific_note_en: 'Photographic screening is a triage tool only. Confirm with PCR and confirmatory histopathology before final diagnosis.',
      scientific_note_te: 'ఫోటో స్కానింగ్ ప్రాథమిక సూచన మాత్రమే. ఖచ్చితమైన నిర్ధారణ కోసం PCR మరియు హిస్టోపాథాలజీ తప్పనిసరిగా చేయాలి.',
      actions_en: ['Isolate the pond from adjacent water movement and stop drainage overflow immediately.', 'Run aeration at full capacity and reduce feeding to prevent organic deterioration.', 'Collect a confirmatory PCR sample from moribund shrimp for a laboratory diagnosis.'],
      actions_te: ['చెరువు యొక్క నీరు పక్క చెరువులకు పాకకుండా గేట్లను మూసివేయండి.', 'అన్ని ఏరియేటర్లు నడుపుతూ దాణాను తగ్గించండి.', 'చనిపోయిన రొయ్యల నమూనాలను సేకరించి PCR పరీక్షకు పంపండి.'],
      lab_en: 'Emergency 2-step nested PCR for WSSV and OIE confirmatory screening.',
      lab_te: 'అత్యవసర WSSV 2-స్టెప్ నెస్టెడ్ PCR పరీక్ష చేయాలి.',
    },
    ehp: {
      name_en: 'Enterocytozoon hepatopenaei (EHP Infection)',
      name_te: 'ఈహెచ్‌పీ మైక్రోస్పోరిడియన్ (EHP)',
      risk_level: 'high',
      health_score: 42,
      visible_observations_en: ['Pale, shrunken hepatopancreas and poor growth consistency are likely at this DOC range.', 'The digestive tract may be empty despite normal feeding activity.', 'Size variation within the same pond is suggestive of EHP stunting.'],
      visible_observations_te: ['కాలేయం చిన్నదై, పాలిపోయి, వృద్ధి తక్కువగా కనిపించే అవకాశం ఉంది.', 'దాణా తినడం ఉన్నా పేగు ఖాళీగా ఉండవచ్చు.', 'ఒకే చెరువులో మారిన సైజు సీహ్ EHP లక్షణం.'],
      scientific_note_en: 'This is a screening-grade assessment based on pond age and presentation. Histology or PCR is required for definitive confirmation.',
      scientific_note_te: 'ఇది ప్రాథమిక స్క్రీనింగ్ మాత్రమే; ఖచ్చితమైన నిర్ధారణ కోసం PCR మరియు హిస్టాలజీ అవసరం.',
      actions_en: ['Source higher-quality SPF seed for the next crop and keep biosecurity strict.', 'Apply organic-acid feed top-dressing and maintain strong aeration around the pond bottom.', 'Grade shrimp by size and isolate slow growers for monitoring.'],
      actions_te: ['తదుపరి క్రాప్‌కి SPF సీడ్ మాత్రమే ఉపయోగించండి.', 'ఆర్గానిక్ యాసిడ్ మరియు బాసిల్లస్ ప్రోబయోటిక్స్ దాణాలో ఇవ్వండి.', 'చిన్న రొయ్యలను వేరుగా segregate చేసి పర్యవేక్షించండి.'],
      lab_en: 'EHP SWP-PCR and hepatopancreas wet-mount examination for microsporidian spores.',
      lab_te: 'EHP SWP-PCR మరియు కాలేయ స్క్వాష్ పరీక్ష చేయాలి.',
    },
    wfs: {
      name_en: 'White Faeces Syndrome (WFS / White Gut)',
      name_te: 'తెల్ల పేగు వ్యాధి (WFS / వైట్ గట్)',
      risk_level: 'high',
      health_score: 54,
      visible_observations_en: ['White or pale faecal strands are often associated with a compromised digestive tract.', 'Limited gut fullness and a weak feeding response are common in this syndrome.'],
      visible_observations_te: ['పేగులో తెల్లటి లేదా పాలిపోయిన మలపు తీగలు కనిపించే అవకాశం ఉంది.', 'దాణా తినడంలో లోపం మరియు పేగు నిండకపోవడం సంభవిస్తుంది.'],
      scientific_note_en: 'This assessment identifies a likely digestive stress pattern. Laboratory culture and microscopy remain necessary for a final diagnosis.',
      scientific_note_te: 'ఇది అంచనా మాత్రమే; ఖచ్చితమైన నిర్ధారణ కోసం మైక్రోస్కోప్ మరియు TCBS పరీక్షలు అవసరం.',
      actions_en: ['Reduce feed by 25 to 40 percent for several days and observe tray clearance carefully.', 'Dose gut probiotics and garlic-based binder with balanced water quality management.', 'Check water clarity and ammonia before making further treatment changes.'],
      actions_te: ['దాణాను 25-40% తగ్గించి ట్రే క్లియారెన్స్ చూశుకోండి.', 'గట్ ప్రోబయోటిక్స్ మరియు వెల్లుల్లి బైండర్ ఇవ్వండి.', 'అమ్మోనియా మరియు నీటి స్పష్టతను పర్యవేక్షించండి.'],
      lab_en: 'Midgut squash and TCBS agar culture to assess Vibrio or ATM-type digestive stress.',
      lab_te: 'పేగు స్క్వాష్ మరియు TCBS అగార్లో Vibrio/ATM పరీక్ష చేయాలి.',
    },
    black_gills: {
      name_en: 'Black Gill / Gill Fouling',
      name_te: 'నల్ల మొప్పలు / గిల్ ఫౌలింగ్',
      risk_level: 'moderate',
      health_score: 62,
      visible_observations_en: ['Dark melanin and debris on gill filaments suggest respiratory stress and sludge irritation.', 'This pattern is typically linked to low oxygen and elevated organics in the pond bottom.'],
      visible_observations_te: ['మొప్పలపై మెలనిన్ మరియు మడ్డి కారణంగా శ్వాస సమస్య వస్తుంది.', 'చెరువు అడుగున మట్టి మరియు ఆర్గానిక్ లోడ్ ఎక్కువగా ఉంటే ఇది కనిపిస్తుంది.'],
      scientific_note_en: 'The gill view is strongly suggestive of environmental stress rather than a confirmed pathogen.',
      scientific_note_te: 'ఈ లక్షణాలు వ్యాధి కంటే పర్యావరణ ఒత్తిడి/మడ్డి ఫౌలింగ్‌ను సూచిస్తాయి.',
      actions_en: ['Siphon pond bottom sludge in the feeding zones and improve aeration duration at dawn.', 'Check H2S, pH, and ammonia to reduce gill irritation and oxidative stress.'],
      actions_te: ['చెరువు అడుగున మట్టిని సైఫన్ చేసి, తెల్లవారుజామున ఏరియేటర్లను ఎక్కువ నడపండి.', 'H2S, pH మరియు అమ్మోనియా స్థాయిని తనిఖీ చేయండి.'],
      lab_en: 'Wet-mount gill microscopy for ciliates, fungal hyphae, and melanization grading.',
      lab_te: 'గిల్ వెట్ మౌంట్ మైక్రోస్కోప్ పరీక్ష చేయాలి.',
    },
    soft_shell: {
      name_en: 'Soft Shell / Mineral Stress',
      name_te: 'మెత్తటి పెంకు / మినరల్ స్ట్రెస్',
      risk_level: 'moderate',
      health_score: 68,
      visible_observations_en: ['Soft or paper-like shell after molting is consistent with calcium, magnesium, or alkalinity imbalance.', 'Poor shell hardening can leave shrimp vulnerable to injury and cannibalism.'],
      visible_observations_te: ['కుబుసం విడిచిన తర్వాత పెంకు మెత్తగా ఉండటం కాల్షియం/మెగ్నీషియం లోపాన్ని సూచిస్తుంది.', 'పెంకు గట్టిపడకపోవడం రొయ్యలకు దెబ్బతినే ప్రమాదం పెంచుతుంది.'],
      scientific_note_en: 'This triage points to shell mineral stress rather than a definitive infectious disease.',
      scientific_note_te: 'ఇది మినరల్ స్ట్రెస్/శరీర కండరాల సమస్యను సూచిస్తుంది; వ్యాధి నిర్ధారణకు ల్యాబ్ పరీక్ష అవసరం.',
      actions_en: ['Provide lime or calcium-magnesium supplementation, and check alkalinity and salinity stability.', 'Avoid excessive handling during peak heat and improve post-molt recovery conditions.'],
      actions_te: ['సున్నం మరియు మినరల్ సప్లిమెంట్లు ఇవ్వండి. ఆల్కలైనిటీ మరియు సాలినిటీ స్థాయిని పర్యవేక్షించండి.', 'ఎండ ఎక్కువగా ఉన్నప్పుడు రొయ్యలను ఎక్కువగా నెట్ చేయకండి.'],
      lab_en: 'Water ionic profile for Ca, Mg, K and alkalinity checks after a soft-shell episode.',
      lab_te: 'నీటి Ca, Mg, K మరియు ఆల్కలైనిటీ పరీక్ష చేయాలి.',
    },
  };

  const primary = diseaseMap[bestKey] || diseaseMap.wfs;
  const fallbackResult = {
    health_index_score: primary.health_score,
    risk_grade: primary.risk_level.toUpperCase(),
    focal_part: focal_area,
    visible_observations_en: primary.visible_observations_en,
    visible_observations_te: primary.visible_observations_te,
    conditions: [{
      name_en: primary.name_en,
      name_te: primary.name_te,
      risk_level: primary.risk_level,
      confidence_note_en: `This triage result was generated from the selected focal area, pond age, and recent water-quality trend (DO ${recentDo.toFixed(1)} ppm, temp ${recentTemp.toFixed(1)}°C, ammonia ${recentAmmonia.toFixed(2)} ppm).`,
      confidence_note_te: `ఇది ఎంపిక చేసిన భాగం, చెరువు DOC మరియు తాజా నీటి గుణాల ఆధారంగా అంచనా (DO ${recentDo.toFixed(1)} ppm, ఉష్ణోగ్రత ${recentTemp.toFixed(1)}°C, అమ్మోనియా ${recentAmmonia.toFixed(2)} ppm).`,
    }],
    scientific_safety_note_en: primary.scientific_note_en,
    scientific_safety_note_te: primary.scientific_note_te,
    suggested_actions_en: primary.actions_en,
    suggested_actions_te: primary.actions_te,
    lab_test_recommended_en: primary.lab_en,
    lab_test_recommended_te: primary.lab_te,
  };

  res.json(fallbackResult);
});

// Gemini Conversational Farm Advisor (Bilingual English / Telugu)
app.post('/api/gemini/chat', async (req, res) => {
  const { message, language } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Compile real pond context
  const pond1 = ponds[0];
  const pond2 = ponds[1];
  const latestWq1 = waterRecords.find((w) => w.pond_id === 'pond-01') || waterRecords[0];
  const latestWq2 = waterRecords.find((w) => w.pond_id === 'pond-02') || waterRecords[1];

  const farmContext = `
Farmer Farm Context:
- Farm Name: ${farm.name} (${farm.name_te}), Location: ${farm.district}, ${farm.state}.
- Pond 1: ${pond1.name} | DOC: ${pond1.doc} days | Area: ${pond1.area_ha} ha | Stocked: ${pond1.seed_quantity} | Current ABW: ${pond1.current_abw_g}g (${pond1.estimated_count} count) | Est. Biomass: ${pond1.estimated_biomass_kg} kg | Latest DO: ${latestWq1.do_ppm} ppm, pH: ${latestWq1.ph}, Salinity: ${latestWq1.salinity_ppt} ppt | FCR: ${pond1.fcr}
- Pond 2: ${pond2.name} | DOC: ${pond2.doc} days | Area: ${pond2.area_ha} ha | Stocked: ${pond2.seed_quantity} | Current ABW: ${pond2.current_abw_g}g (${pond2.estimated_count} count) | Est. Biomass: ${pond2.estimated_biomass_kg} kg | Latest DO: ${latestWq2.do_ppm} ppm, pH: ${latestWq2.ph}, Salinity: ${latestWq2.salinity_ppt} ppt | FCR: ${pond2.fcr}
- Active Alerts: Pond 1 early morning DO was ${latestWq1.do_ppm} ppm (<4.0 ppm requires aerator caution).
- Recent Market Prices: 30 count ₹440/kg, 40 count ₹375/kg, 50 count ₹315/kg, 60 count ₹280/kg.
`;

  try {
    if (ai && process.env.GEMINI_API_KEY) {
      const systemInstruction = `You are AquaCare AI, the ultimate Master Aquaculture Expert, Agronomist, and Scientific Farm Advisor for Pacific White Shrimp (Litopenaeus vannamei) aquaculture in coastal Andhra Pradesh (West Godavari, Krishna, Bapatla, Nellore) and tropical shrimp farming regions.

You have comprehensive, authoritative knowledge to answer ANY and ALL questions, doubts, calculations, and troubleshooting regarding Vannamei shrimp ponds and cultures from A to Z, including:
1. Seed (PL) Quality & Hatchery Selection:
   - Selecting healthy PL10-PL12 (8.5mm to 11mm) from CAA-certified hatcheries.
   - Microscopic tests: Gut fullness >90%, clear body without muscle necrosis/opacity, rostral spines 4-6, dense lipid droplets in hepatopancreas, clean gills and appendages.
   - Stress testing protocols: 100 ppm Formalin stress test for 30 minutes (>95% survival required); sudden 10-15 ppt salinity drop test for 2 hours (>95% survival).
   - Mandatory 2-step nested PCR negative certificates for WSSV, EHP (Enterocytozoon hepatopenaei), IHHNV, IMNV, and AHPND/EMS (PirA/PirB).
   - Packing, transit conditions (22-24°C, oxygenated bags) and farm stocking.
2. Pond Preparation & Soil Chemistry:
   - Bottom sludge removal, tilling/ploughing to 15-20 cm, sun-drying until cracking (7-14 days).
   - Bleaching powder dosing: 30-35 ppm (100-150 kg/acre) active chlorine for disinfecting wild crab vectors and pathogens; 4-5 days dechlorination.
   - Liming calculations: Agricultural limestone (CaCO3) for neutral soils, Dolomite (CaMg(CO3)2) for magnesium supplementation, Quick lime (CaO) for acidic bottoms.
   - Biosecurity: 50 cm crab-proof plastic dyke fencing, bird netting, 60-100 mesh filtration on water intake.
3. Water Preparation & Plankton Blooms:
   - Establishing stable golden-brown diatom bloom (Chaetoceros, Skeletonema, Navicula) or light green bloom.
   - Fermented Carbon Juice (FCJ) recipe: Rice bran (20 kg) + Jaggery (5 kg) + Baker's yeast (500g) + Water (100L) + Water probiotic (100g), fermented anaerobically for 24-36 hours and broadcast in morning.
   - Secchi disk transparency: Optimal 30-40 cm.
4. Stocking & Acclimatization:
   - Stocking density: 30-60 seeds/m² depending on aeration capacity.
   - Acclimatization: Float bags for 25-30 min to match temperature (delta <1°C), slowly mix pond water (<1 ppt/hour salinity shift), release at cool dawn (05:00 - 07:00 AM).
5. Feeding Management & Check Trays:
   - Pellet sizing (#1 starter crumble to #4 finisher, 35-38% crude protein).
   - 4-tray check matrix (2 to 2.5 hours inspection; adjust rations: clean = +5%, leftover >15% = cut next feed by 15-25%).
6. Water Quality & Diurnal Chemical Balance:
   - Critical DO >4.5 ppm, especially 04:00-06:00 AM. Emergency action: run all aerators, apply sodium percarbonate tablets.
   - pH: 7.5 - 8.3 with diurnal variation <0.5.
   - Total Alkalinity: >120-160 ppm (apply sodium bicarbonate NaHCO3 or dolomite).
   - TAN <0.5 ppm, toxic NH3 <0.05 ppm, Nitrite NO2 <0.2 ppm, H2S 0.00 ppm.
   - Mineral ratios (Ca:Mg:K = 1:3:1 relative to seawater standard: Mg ~ 34.5*Salinity, Ca ~ 11.6*Salinity, K ~ 10.7*Salinity).
7. Molting & Lunar Cycles:
   - Synchronized molting at Full Moon and New Moon. Dosing magnesium chloride and dolomite 48 hours prior. Avoid handling during soft shell phase.
8. Disease Pathology & Biosecurity:
   - White Spot (WSSV), EHP, White Feces / White Gut (cut feed 30%, apply gut probiotics + garlic extract), Black Gill (bottom oxidation and probiotics), Loose Shell / Cramping.
   - Strictly prohibit illegal antibiotics (Chloramphenicol, Nitrofurans) to preserve export standards.
9. Aeration Engineering:
   - 1 HP aerator capacity per 300-350 kg biomass; create central sludge cone.
10. Harvesting & Market Economics:
    - Verify >95% hard shell, fast shrimp 4-6 hours, night harvest with chilled slurry ice <2°C, Andhra count prices (30, 40, 50, 60 count).

You communicate fluently in both Telugu (తెలుగు) and English.
If the farmer asks in Telugu or asks for Telugu, reply in clear, natural, respectful Telugu suitable for farmers. If asked in English, reply in English.
Always ground your answers in the farmer's real pond context provided below whenever applicable, and provide structured, actionable advice with exact dosages, numbers, and practical steps.

${farmContext}`;

      const generatePromise = ai.models.generateContent({
        model: geminiModel,
        contents: message,
        config: {
          systemInstruction,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API call timed out')), 6000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      if (response && response.text) {
        return res.json({ reply: response.text });
      }
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Gemini chat error:', error.message);
  }

  // Comprehensive Knowledge-Based Fallback Engine for all Vannamei Shrimp Doubts
  const msgLower = message.toLowerCase();
  let fallbackReply = '';

  const isTeluguQuery =
    language === 'te' ||
    message.includes('ఫీడ్') ||
    message.includes('సీడ్') ||
    message.includes('పిల్ల') ||
    message.includes('చెరువు') ||
    message.includes('రొయ్య') ||
    message.includes('వ్యాధి') ||
    message.includes('ఎంత') ||
    message.includes('సున్నం') ||
    message.includes('నీరు') ||
    message.includes('ఆక్సిజన్');

  if (isTeluguQuery) {
    if (
      msgLower.includes('seed') ||
      msgLower.includes('సీడ్') ||
      msgLower.includes('పిల్ల') ||
      msgLower.includes('hatchery') ||
      msgLower.includes('హేచరీ') ||
      msgLower.includes('pl') ||
      msgLower.includes('stress test') ||
      msgLower.includes('pcr') ||
      msgLower.includes('ఎంపిక') ||
      msgLower.includes('క్వాలిటీ') ||
      msgLower.includes('నాణ్యత')
    ) {
      fallbackReply = `వనామి నాణ్యమైన సీడ్ (పిల్ల) ఎంపిక & హేచరీ పరీక్షల మార్గదర్శకాలు:\n\n1. సీడ్ వయస్సు & పరిమాణం:\n• PL 10 నుండి PL 12 దశలో ఉన్న సీడ్ మాత్రమే ఎంచుకోవాలి (పొడవు 8.5 నుండి 11 మి.మీ ఉండాలి).\n• తోక కండరం మరియు ఆహార నాళం (Gut) నిష్పత్తి 4:1 ఉండాలి. ఆహార నాళం 90% పైగా ఫుల్లుగా ఉండాలి.\n\n2. సూక్ష్మదర్శిని (Microscope) పరీక్ష:\n• హెపటోపాంక్రియాస్ (కాలేయం) లో నూనె బిందువులు (Lipid droplets) దట్టంగా ఉండాలి.\n• రోస్ట్రల్ ముళ్ళు (Rostral spines) 4 నుండి 6 వరకు వచ్చి ఉండాలి.\n• మొప్పలు, కాళ్ళు మరియు తోక భాగంలో ఎటువంటి నల్ల మచ్చలు, తెగులు లేదా మురికి ఉండకూడదు.\n\n3. స్ట్రెస్ టెస్ట్ (ఒత్తిడి తట్టుకునే శక్తి):\n• ఫార్మాలిన్ టెస్ట్: 100 ppm ఫార్మాలిన్ నీటిలో 100 రొయ్య పిల్లలను 30 నిమిషాలు ఉంచినప్పుడు కనీసం 95% పిల్లలు సజీవంగా ఉండాలి.\n• సెలైనిటీ టెస్ట్: ఉప్పు సాంద్రతను అకస్మాత్తుగా 10-15 ppt తగ్గించి 2 గంటలు ఉంచినప్పుడు 95% పిల్లలు ఈదగలగాలి.\n\n4. ల్యాబ్ PCR పరీక్షలు:\n• CAA ఆమోదిత హేచరీల నుండి మాత్రమే 2-స్టెప్ నెస్టెడ్ PCR సర్టిఫికేట్ తీసుకోవాలి.\n• వైట్ స్పాట్ (WSSV), ఈహెచ్‌పీ (EHP), ఐహెచ్‌హెచ్‌ఎన్‌వి (IHHNV), మరియు ఐఎమ్‌ఎన్‌వి (IMNV) లు నెగటివ్ అయి ఉండాలి.\n\n5. సీడ్ రవాణా & నిల్వ:\n• రవాణా సమయంలో నీటి ఉష్ణోగ్రత 22-24°C ఉండేలా ప్యాకింగ్‌లో ఐస్ వాడాలి.\n• చెరువులో వదిలేటప్పుడు ఉదయం 05:00 నుండి 07:00 గంటలలోపు బ్యాగులను నీటిపై 25 నిమిషాలు తేలియాడించి, నెమ్మదిగా నీటిని కలిపి వదలాలి.`;
    } else if (
      msgLower.includes('pond prep') ||
      msgLower.includes('prep') ||
      msgLower.includes('చెరువు తయారీ') ||
      msgLower.includes('తయారీ') ||
      msgLower.includes('soil') ||
      msgLower.includes('మట్టి') ||
      msgLower.includes('బ్లీచింగ్') ||
      msgLower.includes('bleaching') ||
      msgLower.includes('సున్నం') ||
      msgLower.includes('lime') ||
      msgLower.includes('dolomite') ||
      msgLower.includes('ploughing') ||
      msgLower.includes('తుప్పు') ||
      msgLower.includes('ఎండబెట్టడం')
    ) {
      fallbackReply = `వనామి చెరువు తయారీ & నేల శుద్ధి విధానం:\n\n1. ఎండబెట్టడం & పూడిక తొలగింపు:\n• మునుపటి కల్చర్ తర్వాత అడుగున పేరుకున్న నల్లటి వ్యర్థ మట్టిని (Black sludge) పూర్తిగా తొలగించాలి.\n• చెరువు అడుగు మట్టి పగుళ్లు వచ్చే వరకు కనీసం 10-14 రోజులు ఎండబెట్టాలి.\n• ట్రాక్టర్‌తో 15-20 సెం.మీ లోతు వరకు దుక్కి దున్నాలి (Ploughing).\n\n2. సున్నం వేసే పద్ధతి (మట్టి pH ని బట్టి):\n• వ్యవసాయ సున్నం (CaCO3): ఎకరానికి 150-200 కిలోలు.\n• డోలమైట్ (CaMg(CO3)2): ఎకరానికి 100-150 కిలోలు (మెగ్నీషియం కోసం).\n• ఆసిడ్ నేలలు లేదా క్రిమిసంహారానికి: క్విక్ లైమ్ (CaO) ఎకరానికి 50-75 కిలోలు.\n\n3. బ్లీచింగ్ పౌడర్ మోతాదు (నీరు నింపిన తర్వాత):\n• చెరువులో 3 అడుగుల నీరు నింపి, 30-35 ppm యాక్టివ్ క్లోరిన్ వచ్చేలా బ్లీచింగ్ పౌడర్ (ఎకరానికి 100-120 కిలోలు) వేయాలి.\n• బ్లీచింగ్ వేసిన తర్వాత కనీసం 4-5 రోజులు ఏరియేటర్లు నడిపి క్లోరిన్ పూర్తిగా ఆవిరైపోయేలా చూడాలి.\n\n4. బయోసెక్యూరిటీ:\n• గట్లపై 50 సెం.మీ ఎత్తులో పీతలు రాకుండా క్రాబ్ ఫెన్సింగ్ మరియు పక్షులు రాకుండా బర్డ్ నెట్ ఏర్పాటు చేయాలి.`;
    } else if (
      msgLower.includes('bloom') ||
      msgLower.includes('బ్లూమ్') ||
      msgLower.includes('రంగు') ||
      msgLower.includes('water color') ||
      msgLower.includes('fermentation') ||
      msgLower.includes('పాచి') ||
      msgLower.includes('probiotic') ||
      msgLower.includes('ప్లాంక్టన్') ||
      msgLower.includes('secchi')
    ) {
      fallbackReply = `వనామి చెరువులో సహజ నీటి రంగు (బ్లూమ్) & ఫెర్మెంటేషన్ జ్యూస్ విధానం:\n\n1. ఆదర్శవంతమైన నీటి రంగు:\n• బంగారు గోధుమ రంగు (Golden Brown - డయాటమ్స్) లేదా లేత ఆకుపచ్చ రంగు ఉత్తమం.\n• సెక్కీ డిస్క్ (Secchi Disk) పారదర్శకత 30 నుండి 40 సెం.మీ మధ్య ఉండాలి.\n\n2. ఫెర్మెంటెడ్ కార్బన్ జ్యూస్ (FCJ) ఫార్ములా (ఎకరానికి):\n• తవుడు (Rice Bran): 15-20 కిలోలు\n• బెల్లం (Jaggery): 4-5 కిలోలు\n• ఈస్ట్ (Yeast): 250 గ్రాములు\n• వాటర్ ప్రోబయోటిక్: 100 గ్రాములు\n• నీరు: 80-100 లీటర్లు\n• డ్రమ్ములో వేసి 24 నుండి 36 గంటలు పులియబెట్టి (Ferment), ఉదయం 9:00 గంటలకు ఏరియేటర్లు వేసి చెరువు అంతటా చల్లాలి.\n\n3. బ్లూమ్ జాగ్రత్తలు:\n• పారదర్శకత 25 సెం.మీ కంటే తగ్గితే (ఓవర్ బ్లూమ్), తాజా నీరు చేర్చాలి లేదా జిప్సం వేయాలి.\n• నీలి ఆకుపచ్చ నాచు (Blue-Green Algae) ఏర్పడకుండా నిరంతరం కార్బన్-నైట్రోజన్ నిష్పత్తిని సమతుల్యంగా ఉంచాలి.`;
    } else if (
      msgLower.includes('stocking') ||
      msgLower.includes('acclimatization') ||
      msgLower.includes('నిల్వ') ||
      msgLower.includes('సాంద్రత') ||
      msgLower.includes('density') ||
      msgLower.includes('వదలడం') ||
      msgLower.includes('hapa')
    ) {
      fallbackReply = `సీడ్ నిల్వ సాంద్రత (Stocking) & ఎక్లిమటైజేషన్ సూచనలు:\n\n1. సరైన సమయం:\n• ఉదయం 05:00 నుండి 07:00 గంటల మధ్య లేదా సాయంత్రం చల్లబడిన తర్వాత మాత్రమే పిల్లలను వదలాలి.\n• ఎండలో లేదా వర్షం పడుతున్నప్పుడు ఎట్టిపరిస్థితుల్లోనూ వదలకూడదు.\n\n2. ఎక్లిమటైజేషన్ (నీటి అలవాటు):\n• హేచరీ నుండి వచ్చిన ఆక్సిజన్ బ్యాగులను 20-30 నిమిషాలు చెరువు నీటిపై తేలియాడించాలి (ఉష్ణోగ్రత సమానం కావడానికి).\n• బ్యాగ్ మూత విప్పి చెరువు నీటిని కొద్దికొద్దిగా బ్యాగ్‌లోకి పోస్తూ సెలైనిటీని గంటకు 1 ppt కంటే ఎక్కువ మార్పు లేకుండా సమానం చేయాలి.\n\n3. సాంద్రత (Density):\n• సాధారణ సెమీ-ఇంటెన్సివ్ కల్చర్‌కు: చదరపు మీటరుకు 35 నుండి 50 పిల్లలు.\n• ఎకరానికి 4 నుండి 6 హెచ్‌పీ ఏరియేటర్లు ఉంటేనే 40+ సాంద్రతకు వెళ్ళాలి.\n• వీలైతే మొదటి 20-25 రోజులు నర్సరీ హాపా (Nursery Hapa) లో పెంచడం ద్వారా 90%+ సర్వైవల్ సాధించవచ్చు.`;
    } else if (
      msgLower.includes('mineral') ||
      msgLower.includes('మినరల్') ||
      msgLower.includes('కుబుసం') ||
      msgLower.includes('molt') ||
      msgLower.includes('magnesium') ||
      msgLower.includes('మెగ్నీషియం') ||
      msgLower.includes('potassium') ||
      msgLower.includes('పొటాషియం') ||
      msgLower.includes('కాల్షియం') ||
      msgLower.includes('calcium') ||
      msgLower.includes('soft shell') ||
      msgLower.includes('లూజ్ షెల్')
    ) {
      fallbackReply = `కుబుసం (Molting) & మినరల్స్ సమతుల్యత నిర్వహణ:\n\n1. ప్రధాన మినరల్స్ నిష్పత్తి:\n• మెగ్నీషియం : కాల్షియం : పొటాషియం నిష్పత్తి 3:1:1 గా ఉండాలి.\n• లెక్క: మెగ్నీషియం (Mg) = సెలైనిటీ × 34.5 ppm | కాల్షియం (Ca) = సెలైనిటీ × 11.6 ppm | పొటాషియం (K) = సెలైనిటీ × 10.7 ppm.\n\n2. కుబుసం విడిచే సమయాలు:\n• పౌర్ణమి (Full Moon) మరియు అమావాస్య (New Moon) కు 2 రోజుల ముందు రొయ్యలు భారీగా కుబుసం విడుస్తాయి.\n• ఈ సమయంలో నీటిలోని మినరల్స్ అకస్మాత్తుగా తగ్గుతాయి.\n\n3. మోతాదు & యాక్షన్ ప్లాన్:\n• పౌర్ణమి/అమావాస్యకు 48 గంటల ముందు ఎకరానికి మెగ్నీషియం క్లోరైడ్ 25 కిలోలు, పొటాషియం క్లోరైడ్ 10 కిలోలు, డోలమైట్ 50 కిలోలు సాయంత్రం వేళల్లో వేయాలి.\n• రొయ్యలకు లూజ్ షెల్ (మృదువైన పెంకు) సమస్య వస్తే దాణాలో డై-కాల్షియం ఫాస్ఫేట్ మరియు విటమిన్-సి బైండర్ కలిపి ఇవ్వండి.`;
    } else if (
      msgLower.includes('aerator') ||
      msgLower.includes('ఏరియేటర్') ||
      msgLower.includes('hp') ||
      msgLower.includes('కరెంట్') ||
      msgLower.includes('ఫ్యాన్') ||
      msgLower.includes('మోటార్') ||
      msgLower.includes('aeration')
    ) {
      fallbackReply = `వనామి చెరువులో ఏరియేటర్ల లెక్కలు & నిర్వహణ:\n\n1. ఏరియేషన్ సామర్థ్యం ప్రామాణికం:\n• ప్రతి 350-400 కిలోల రొయ్యల బయోమాస్‌కు కనీసం 1 HP ఏరియేషన్ అవసరం.\n• ఉదాహరణకు మీ చెరువు 1 లో 1,024 కిలోల బయోమాస్ ఉంది, కాబట్టి కనీసం 3 నుండి 4 HP ఏరియేటర్లు తప్పనిసరి.\n\n2. ఏరియేటర్ల అమరిక (Placement):\n• ప్యాడిల్ వీల్ ఏరియేటర్లను చెరువు మూలల్లో కాకుండా, గట్టు నుండి 6-8 మీటర్ల దూరంలో వృత్తాకార ప్రవాహం (Circular Flow) వచ్చేలా అమర్చాలి.\n• దీనివల్ల మధ్య భాగంలో వ్యర్థాలు (Sludge Cone) కేంద్రీకృతమై రొయ్యలు తిరిగే మేత ప్రాంతం శుభ్రంగా ఉంటుంది.\n\n3. టైమింగ్:\n• రాత్రి 10:00 నుండి ఉదయం 07:00 వరకు అన్ని ఏరియేటర్లు తప్పనిసరిగా తిరగాలి.\n• మధ్యాహ్నం 12:00 నుండి 02:00 వరకు నీటి ఉష్ణోగ్రత మరియు ఆక్సిజన్ పొరలను కలపడానికి 1-2 ఏరియేటర్లు నడపాలి.`;
    } else if (
      msgLower.includes('ఫీడ్') ||
      msgLower.includes('feed') ||
      msgLower.includes('దాణా') ||
      msgLower.includes('ట్రే') ||
      msgLower.includes('tray') ||
      msgLower.includes('చెక్ ట్రే')
    ) {
      fallbackReply = `నమస్కారం! మీ చెరువు దాణా & చెక్ ట్రేల మార్గదర్శకం:\n\n• చెరువు 1 (DOC 48 రోజులు): బయోమాస్ 1,024 కిలోలు (ABW 14.8g, 67 కౌంట్). రోజువారీ దాణా: 34 నుండి 36 కిలోలు (4 డోసులు: 06:00, 11:00, 15:00, 19:00).\n• చెక్ ట్రే నియమాలు:\n  1. చెరువులో 4 దిక్కులా 4 చెక్ ట్రేలు ఉంచాలి.\n  2. వేసిన 2.5 గంటల తర్వాత పరిశీలించండి.\n  3. ట్రే ఖాళీగా ఉంటే: తదుపరి డోసులో 5% పెంచవచ్చు.\n  4. 10% మిగిలితే: దాణా సరిపోయింది, మార్చవద్దు.\n  5. 20% కంటే ఎక్కువ మిగిలితే: తదుపరి డోసులో 20% తగ్గించి ఆక్సిజన్, గ్యాస్ తనిఖీ చేయండి.`;
    } else if (
      msgLower.includes('do') ||
      msgLower.includes('ఆక్సిజన్') ||
      msgLower.includes('oxygen') ||
      msgLower.includes('ph') ||
      msgLower.includes('salinity') ||
      msgLower.includes('అమ్మోనియా') ||
      msgLower.includes('నైట్రైట్')
    ) {
      fallbackReply = `నీటి నాణ్యత & అత్యవసర ఆక్సిజన్ నిర్వహణ:\n\n• కరిగిన ఆక్సిజన్ (DO): కనీసం 4.5 ppm ఉండాలి. తెల్లవారుజామున 3.8 ppm కి పడిపోతే వెంటనే అన్ని ఏరియేటర్లు ఆన్ చేయండి. సోడియం పర్కార్బోనేట్ (ఆక్సిజన్ టాబ్లెట్లు) ఎకరానికి 5-8 కిలోలు చల్లండి.\n• pH స్థాయి: 7.5 నుండి 8.2 మధ్య ఉండాలి. ఉదయానికి, మధ్యాహ్నానికి తేడా 0.5 లోపు ఉండాలి.\n• అమ్మోనియా (TAN): 0.5 ppm లోపు ఉండాలి. అమ్మోనియా పెరిగితే యుక్కా ఎక్స్‌ట్రాక్ట్ మరియు మొలాసిస్ వాడండి.\n• నైట్రైట్ (NO2): 0.2 ppm లోపు ఉండాలి. నైట్రైట్ విషప్రభావం తగ్గించడానికి రాతి ఉప్పు (NaCl) వాడాలి.`;
    } else if (
      msgLower.includes('కౌంట్') ||
      msgLower.includes('count') ||
      msgLower.includes('growth') ||
      msgLower.includes('harvest') ||
      msgLower.includes('పట్టుబడి') ||
      msgLower.includes('మార్కెట్') ||
      msgLower.includes('రేటు')
    ) {
      fallbackReply = `రొయ్యల ఎదుగుదల, పట్టుబడి & మార్కెట్ ధరల సమాచారం:\n\n• చెరువు 1: 14.8g (67 కౌంట్). రోజుకు 0.45g చొప్పున ఇంకా 12-14 రోజుల్లో 50 కౌంట్ (20g) కి చేరుకుంటుంది.\n• చెరువు 2: 22.4g (45 కౌంట్). ఇంకా 8-10 రోజుల్లో 40 కౌంట్ (25g) ప్రీమియం సైజుకు చేరుకుంటుంది.\n• పట్టుబడి నియమాలు:\n  1. 95% పైగా రొయ్యలు గట్టి పెంకు (Hard Shell) తో ఉన్నప్పుడే పట్టుబడి చేయాలి.\n  2. పట్టుబడికి 6 గంటల ముందు దాణా ఆపాలి (పేగు ఖాళీగా ఉంటే ప్రాసెసింగ్ ప్లాంట్‌లో క్వాలిటీ రిజెక్షన్ ఉండదు).\n  3. ప్రస్తుత ఆంధ్ర మార్కెట్ ధరలు: 30 కౌంట్ ₹440/kg, 40 కౌంట్ ₹375/kg, 50 కౌంట్ ₹315/kg, 60 కౌంట్ ₹280/kg.`;
    } else if (
      msgLower.includes('వ్యాధి') ||
      msgLower.includes('disease') ||
      msgLower.includes('white spot') ||
      msgLower.includes('ehp') ||
      msgLower.includes('తెల్ల') ||
      msgLower.includes('white gut') ||
      msgLower.includes('black gill')
    ) {
      fallbackReply = `వనామి రొయ్యల ప్రధాన వ్యాధులు & సమగ్ర నివారణ చర్యలు:\n\n1. తెల్ల మచ్చల వ్యాధి (WSSV):\n• లక్షణాలు: పెంకు లోపల తెల్లటి గుండ్రని మచ్చలు, రొయ్యలు ఎర్రబడటం, చెరువు గట్లపై తిరగడం.\n• నివారణ: బయోసెక్యూరిటీ పాటించండి. పక్షులు, పీతలను నిరోధించండి. చికిత్స లేదు, నివారణే మార్గం.\n\n2. ఈహెచ్‌పీ (EHP - గ్రోత్ సమస్య):\n• లక్షణాలు: దాణా తింటున్నా బరువు పెరగకపోవడం, సైజుల్లో తీవ్ర వ్యత్యాసం.\n• చర్య: బేసిలస్ ప్రోబయోటిక్స్ మరియు ఆర్గానిక్ యాసిడ్స్ దాణాలో ఇవ్వండి.\n\n3. వైట్ గట్ / వైట్ ఫీసెస్ (White Gut):\n• లక్షణాలు: నీటి ఉపరితలంపై తెల్లటి మలపు దారాలు తేలడం.\n• చర్య: వెంటనే దాణా 30% తగ్గించండి. వెల్లుల్లి రసం (15 గ్రా/కిలో దాణా) మరియు గట్ ప్రోబయోటిక్ బైండర్‌తో 5 రోజులు ఇవ్వండి.\n\n4. నల్ల మొప్పలు (Black Gills):\n• లక్షణాలు: మొప్పలు నల్లగా మారడం, ఆక్సిజన్ అందక శ్వాస తీసుకోవడంలో ఇబ్బంది.\n• చర్య: అడుగున స్లడ్జ్ పేరుకుపోవడం వల్ల వస్తుంది. అడుగు ప్రోబయోటిక్స్ వేసి ఏరియేటర్లను పెంచండి.\n• గమనిక: నిషేధిత యాంటీబయాటిక్స్ ఎట్టి పరిస్థితుల్లోనూ వాడకండి.`;
    } else {
      fallbackReply = `నమస్కారం! నేను మీ ఆక్వాకేర్ AI వనామి రొయ్యల సాగు నిపుణుడిని. **వనామి రొయ్యల చెరువులు మరియు సాగుకు సంబంధించిన ఏ సందేహమైనా** నన్ను అడగవచ్చు:\n\n1. నాణ్యమైన సీడ్ (PL) ఎంపిక, హేచరీ పరీక్షలు & PCR సర్టిఫికేట్లు\n2. చెరువు తయారీ, దుక్కి దున్నడం, బ్లీచింగ్ & సున్నం (డోలమైట్) మోతాదులు\n3. నీటి రంగు (డయాటమ్ బ్రౌన్/గ్రీన్ బ్లూమ్) & ఫెర్మెంటెడ్ జ్యూస్ (FCJ)\n4. సీడ్ స్టాకింగ్, ఉష్ణోగ్రత & సెలైనిటీ ఎక్లిమటైజేషన్\n5. రోజువారీ దాణా లెక్కింపు & 4 చెక్ ట్రేల నిర్వహణ\n6. తెల్లవారుజామున ఆక్సిజన్ (DO) పడిపోవడం & ఏరియేటర్ల లెక్కలు\n7. కుబుసం (మోల్టింగ్) సమయంలో మినరల్స్ (మెగ్నీషియం, కాల్షియం, పొటాషియం)\n8. వ్యాధుల నివారణ (వైట్ స్పాట్, ఈహెచ్‌పీ, వైట్ గట్, నల్ల మొప్పలు)\n9. పట్టుబడి సమయం, హార్డ్ షెల్ చెక్ & మార్కెట్ కౌంట్ ధరలు\n\nమీ ప్రశ్నను అడగండి, ఖచ్చితమైన కొలతలతో సహాయం చేస్తాను!`;
    }
  } else {
    // English Queries
    if (
      msgLower.includes('seed') ||
      msgLower.includes('pl') ||
      msgLower.includes('hatchery') ||
      msgLower.includes('stress test') ||
      msgLower.includes('pcr') ||
      msgLower.includes('selection') ||
      msgLower.includes('quality')
    ) {
      fallbackReply = `Comprehensive Vannamei Seed (PL) Selection & Hatchery Inspection Protocol:\n\n1. Age & Physical Morphology:\n• Optimal stage: PL10 to PL12 (length 8.5mm - 11mm).\n• Muscle-to-gut ratio in the 6th abdominal segment must be at least 4:1.\n• Gut fullness: >90% continuous dark digestive tract with active peristalsis.\n\n2. Microscopic Health Examination:\n• Hepatopancreas: Packed densely with glistening lipid/fat globules.\n• Rostral spines: 4 to 6 fully formed spines.\n• Clean appendages: Free of epibiont fouling, necrosis, black spots, or broken setae.\n\n3. Hatchery Stress Testing:\n• Formalin Stress Test: Expose 100 PL to 100 ppm formalin for 30 minutes. Survival rate must exceed 95%.\n• Salinity Shock Test: Drop water salinity by 10-15 ppt for 2 hours. Minimum 95% active swimming recovery required.\n\n4. Laboratory Molecular Diagnostics:\n• Procure seed exclusively from CAA-licensed SPF broodstock hatcheries.\n• Require verified 2-step nested PCR negative certificates for WSSV, EHP (Enterocytozoon hepatopenaei), IHHNV, IMNV, and AHPND/EMS.\n\n5. Packing & Stocking Transport:\n• Keep transit water chilled at 22-24°C with pure oxygen packing.\n• At pond site, float bags for 25-30 minutes for temperature equalization, slowly blend pond water (<1 ppt/hour salinity shift), and release during cool dawn hours (05:00 - 07:00 AM).`;
    } else if (
      msgLower.includes('pond prep') ||
      msgLower.includes('prep') ||
      msgLower.includes('soil') ||
      msgLower.includes('bleaching') ||
      msgLower.includes('lime') ||
      msgLower.includes('dolomite') ||
      msgLower.includes('tilling') ||
      msgLower.includes('ploughing') ||
      msgLower.includes('drying')
    ) {
      fallbackReply = `Scientific Vannamei Pond Preparation & Soil Conditioning Guide:\n\n1. Sludge Removal & Sun Drying:\n• Mechanically scrape or flush out black anaerobic bottom sediment from previous crops.\n• Sun-bake the pond bottom for 10-14 days until surface fissures crack to a depth of 2-4 cm.\n• Till/plough the soil to 15-20 cm depth to oxygenate reduced iron and sulfide compounds.\n\n2. Soil Liming (Based on soil pH):\n• Agricultural Limestone (CaCO3): 150-250 kg/acre for soil pH 6.5 - 7.5.\n• Dolomite [CaMg(CO3)2]: 100-150 kg/acre to replenish essential magnesium reserves.\n• Quicklime (CaO): 50-80 kg/acre for acidic soil disinfection (apply only to dry soil).\n\n3. Water Disinfection & Bleaching:\n• Fill reservoir/pond with 3 feet of water filtered through a 60-80 mesh nylon bag.\n• Apply Calcium Hypochlorite (Bleaching Powder) at 30-35 ppm active chlorine (~100-120 kg/acre) to eradicate wild vector crabs, shrimp, and microbial pathogens.\n• Aerate continuously for 4-5 days to completely dechlorinate the water before fertilizing.\n\n4. Biosecurity Fencing:\n• Install 50cm polythene crab-barrier fences along outer dykes and crisscross overhead bird scaring ropes.`;
    } else if (
      msgLower.includes('bloom') ||
      msgLower.includes('water color') ||
      msgLower.includes('fermentation') ||
      msgLower.includes('plankton') ||
      msgLower.includes('secchi') ||
      msgLower.includes('diatom')
    ) {
      fallbackReply = `Plankton Bloom Culture & Fermented Carbon Juice (FCJ) Protocol:\n\n1. Target Water Color & Transparency:\n• Golden-brown (beneficial diatoms: Chaetoceros, Skeletonema) or pale tea-green.\n• Optimal Secchi disk transparency: 30 to 40 cm.\n\n2. Anaerobic Fermented Carbon Juice (FCJ) Recipe (Per 1 Acre):\n• Rice Bran (De-oiled): 15 - 20 kg\n• Jaggery / Molasses: 4 - 5 kg\n• Baker's Dry Yeast: 250 g\n• Certified Water Probiotic (Bacillus spp.): 100 g\n• Clean Fresh/Pond Water: 80 - 100 Liters\n• Ferment tightly sealed in a 200L drum for 24-36 hours. Broadcast evenly in the morning (09:00 AM) with aerators running.\n\n3. Bloom Crash Prevention:\n• If transparency drops below 25 cm (dense bloom risk), apply agricultural gypsum (50 kg/acre) and exchange bottom water if permissible.\n• Avoid inorganic urea/phosphates if cyanobacteria (blue-green algae) or dinoflagellates appear.`;
    } else if (
      msgLower.includes('stocking') ||
      msgLower.includes('acclimatization') ||
      msgLower.includes('density') ||
      msgLower.includes('hapa') ||
      msgLower.includes('release')
    ) {
      fallbackReply = `Stocking Density & Pond Acclimatization Guidelines:\n\n1. Stocking Window:\n• Early dawn (05:00 - 07:00 AM) when water temperature is cool and stable.\n• Never stock during intense midday heat or during heavy rainfall events.\n\n2. Acclimatization Procedure:\n• Float sealed seed transport bags on the pond surface for 25-30 minutes until water temperature inside matches the pond (delta <1°C).\n• Open bags and gently siphon pond water into bags over 45 minutes to equalize salinity (<1 ppt per hour change).\n\n3. Density Recommendations:\n• Semi-Intensive: 30 to 45 seeds/m² (requires 4-6 HP aeration/acre).\n• Intensive: 50 to 60+ seeds/m² (requires 8-10 HP aeration/acre and central drain pit).\n• Nursery phase: Holding PL in a dedicated hapa or nursery pond for DOC 1-25 boosts final survival past 90%.`;
    } else if (
      msgLower.includes('mineral') ||
      msgLower.includes('molt') ||
      msgLower.includes('magnesium') ||
      msgLower.includes('potassium') ||
      msgLower.includes('calcium') ||
      msgLower.includes('soft shell') ||
      msgLower.includes('alkalinity')
    ) {
      fallbackReply = `Mineral Ionic Balance & Lunar Molt Management:\n\n1. Critical Ionic Ratios (Seawater Norm):\n• Magnesium (Mg) ~ 34.5 × Salinity ppt (ppm)\n• Calcium (Ca) ~ 11.6 × Salinity ppt (ppm)\n• Potassium (K) ~ 10.7 × Salinity ppt (ppm)\n• The Mg : Ca : K ratio should remain roughly 3 : 1 : 1.\n\n2. Lunar Molting Schedule:\n• Synchronized mass ecdysis (molting) occurs 1-2 days before and after the Full Moon and New Moon.\n• Shrimp absorb immense amounts of minerals from the water within 4-6 hours post-molt to harden their carapace.\n\n3. Practical Mineral Dosing (Per Acre):\n• 48 hours prior to full/new moon: Broadcast Magnesium Chloride (25 kg) + Potassium Chloride (10 kg) + Dolomite (50 kg) in late evening.\n• For soft-shell / loose-shell: Top-dress feed with chelated minerals, Dicalcium Phosphate (10g/kg), and coated Vitamin C.`;
    } else if (
      msgLower.includes('aerator') ||
      msgLower.includes('aeration') ||
      msgLower.includes('hp') ||
      msgLower.includes('sludge') ||
      msgLower.includes('paddlewheel')
    ) {
      fallbackReply = `Vannamei Aeration Dynamics & Placement Engineering:\n\n1. Sizing Benchmark:\n• Provide 1 HP of aeration per 300 - 350 kg standing shrimp biomass, or 1 HP per 30 kg daily feed offered.\n• For Pond 1 (~1,024 kg biomass), maintain at least 3.5 - 4 HP active paddlewheels.\n\n2. Placement Strategy:\n• Position 4-paddlewheel aerators 6-8 meters from the pond bank aligned at 45-degree angles to generate a circular hydraulic vortex.\n• This sweeps faeces, molts, and uneaten feed into a compact central sludge cone (toilet), leaving the outer feeding periphery oxygenated and clean.\n\n3. Daily Aeration Schedule:\n• Night: 10:00 PM to 06:30 AM (100% aerators active).\n• Midday: 12:00 PM to 02:00 PM (run 2 aerators to de-stratify thermal and oxygen gradients).\n• Feeding: Switch off feeding zone aerators 15 minutes before broadcasting and restart 1 hour later.`;
    } else if (
      msgLower.includes('feed') ||
      msgLower.includes('ration') ||
      msgLower.includes('how much') ||
      msgLower.includes('tray') ||
      msgLower.includes('check tray') ||
      msgLower.includes('fcr')
    ) {
      fallbackReply = `Vannamei Feeding Management & Check Tray Protocols:\n\n• Pond 1 Status: DOC 48 days, ABW 14.8g, 67 count, Est. Biomass: 1,024 kg.\n• Daily Feed Allotment: ~34.8 kg/day (~3.4% of biomass) partitioned into 4 meals (06:00, 11:00, 15:00, 19:00 at ~8.7 kg/meal).\n• Check Tray Rules:\n  1. Place 4 check trays (80cm x 80cm) along 4 pond sides, 8m off dykes.\n  2. Put 0.6% of the meal ration (approx. 50g) in each tray.\n  3. Inspect trays 2.5 hours post-feeding.\n  4. Completely Clean: Shrimp hungry; bump next feed by 5%.\n  5. 10% Feed Left: Optimal balance; maintain current feed.\n  6. >20% Feed Left: Reduce subsequent meal by 20% and immediately test bottom DO and TAN.`;
    } else if (
      msgLower.includes('do') ||
      msgLower.includes('oxygen') ||
      msgLower.includes('drop') ||
      msgLower.includes('tan') ||
      msgLower.includes('ammonia') ||
      msgLower.includes('nitrite') ||
      msgLower.includes('ph')
    ) {
      fallbackReply = `Water Quality Diagnostics & Emergency Oxygen Recovery:\n\n• Dissolved Oxygen (DO): Critical baseline is >4.5 ppm. Early morning recorded 3.8 ppm in Pond 1.\n  Immediate Action: Power all paddlewheels immediately. If DO lingers below 3.5 ppm, broadcast oxygen tablets (Sodium Percarbonate) at 5-8 kg/acre across feeding lanes.\n• Diurnal pH: Maintain 7.5 - 8.2 with <0.5 shift between morning and afternoon.\n• Total Ammonia (TAN): Keep <0.5 ppm. If spiking, dose Yucca extract (500 ml/acre) and broadcast carbon (jaggery/molasses 10 kg/acre) to spur biofloc uptake.\n• Nitrite (NO2): Keep <0.2 ppm. Maintain Chloride:Nitrite ratio >3:1 by broadcasting coarse solar salt (NaCl) to prevent toxic methaemoglobinemia.`;
    } else if (
      msgLower.includes('count') ||
      msgLower.includes('growth') ||
      msgLower.includes('abw') ||
      msgLower.includes('harvest') ||
      msgLower.includes('price') ||
      msgLower.includes('market')
    ) {
      fallbackReply = `Shrimp Count Trajectory, Harvest Timing & Economics:\n\n• Pond 1: Current ABW 14.8g (67 count). Gaining 0.45g/day. Projected 50 count (20g) in 12 days.\n• Pond 2: Current ABW 22.4g (45 count). Projected to reach premium 40 count (25g) in 7-9 days.\n• Harvest Best Practices:\n  1. Verify shell hardness: >95% of shrimp must be hard-shell (post-molting stage C/D).\n  2. Fast shrimp 4-6 hours before dragging to ensure clean, empty digestive tracts.\n  3. Submerge harvested shrimp immediately into an ice-water slurry at 0-2°C (1:1 shrimp to ice ratio) to preserve texture and stop melanosis.\n• Andhra Farm Gate Rates: 30 count ₹440/kg | 40 count ₹375/kg | 50 count ₹315/kg | 60 count ₹280/kg.`;
    } else if (
      msgLower.includes('disease') ||
      msgLower.includes('ehp') ||
      msgLower.includes('wssv') ||
      msgLower.includes('white gut') ||
      msgLower.includes('black gill') ||
      msgLower.includes('feces')
    ) {
      fallbackReply = `Vannamei Pathology, Symptom Triaging & Biosecurity Defense:\n\n1. White Spot Syndrome Virus (WSSV):\n• Signs: White circular spots on inside of carapace, pink/reddish lethargic shrimp at surface.\n• Biosecurity: Strict crab fencing and bird netting. No cure exists; immediately contain pond effluent.\n\n2. EHP (Enterocytozoon hepatopenaei):\n• Signs: Severe growth retardation, size disparity (some 10g, others 2g at DOC 60), white gut threads.\n• Protocol: Disinfect bottoms with caustic lime, purchase SPF certified seed, top-dress feed with organic acids and gut probiotics.\n\n3. White Feces Syndrome (WFS):\n• Signs: Floating white faecal strands along leeward banks, pale hepatopancreas.\n• Protocol: Slash daily feed by 30%, apply gut probiotic containing Bacillus subtilis and incorporate garlic paste (15g/kg feed) with binder for 5-7 days.\n\n4. Black Gill Syndrome:\n• Signs: Dark brown/black gill filaments caused by bottom sludge or bacterial foulers.\n• Protocol: Apply bottom oxidative probiotics and increase water circulation.\n• Compliance Notice: Never use banned antibiotics (Chloramphenicol/Nitrofurans); adhere strictly to MPEDA/CAA guidelines.`;
    } else {
      fallbackReply = `Hello! I am your AquaCare AI Master Aquaculture Advisor. You can ask me **ANY question or doubt regarding Vannamei shrimp ponds and cultures**:\n\n• Seed (PL) Quality Selection, Hatchery Testing & 2-Step PCR\n• Pond Preparation, Soil Tilling, Bleaching & Liming Rates\n• Plankton Bloom Development & Fermented Carbon Juice (FCJ)\n• Stocking Acclimatization & Nursery Management\n• Daily Feed Rationing, Pellet Sizing & 4-Tray Monitoring\n• Morning Dissolved Oxygen (DO) Dips & Aeration Sizing\n• Lunar Molting Cycles & Mineral Balancing (Mg, Ca, K)\n• Disease Prevention & Treatment (WSSV, EHP, White Gut, Black Gill)\n• Partial Thinning, Hard Shell Harvest Checks & Market Economics\n\nAsk any question to receive practical, scientific guidance tailored to your farm!`;
    }
  }

  res.json({ reply: fallbackReply });
});

// ==================== VITE MIDDLEWARE OR STATIC SERVING ====================

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // The bundled server is written into dist, so its directory is also the
    // directory containing the built client assets.
    app.use(express.static(__dirname));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AquaCare AI server running on port ${PORT} (mode: ${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
});
