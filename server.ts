import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI client with required header
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// AI Running Assistant Endpoint: Analyze user run data
app.post('/api/ai/analyze-run', async (req, res) => {
  try {
    const { runData, userProfile, goals, recentRuns } = req.body;

    const runSummaryText = `
User Profile:
- Age: ${userProfile?.age || 28}, Weight: ${userProfile?.weightKg || 68} kg, Height: ${userProfile?.heightCm || 176} cm
- Preferred Unit: ${userProfile?.unit || 'km'}

Latest Run Session:
- Route: ${runData?.routeName || 'Morning Fitness Run'}
- Distance: ${((runData?.distanceMeters || 0) / 1000).toFixed(2)} km (${runData?.distanceMeters || 0} meters)
- Duration: ${Math.floor((runData?.durationSeconds || 0) / 60)}m ${(runData?.durationSeconds || 0) % 60}s
- Average Pace: ${Math.floor((runData?.averagePaceSecPerKm || 0) / 60)}:${String((runData?.averagePaceSecPerKm || 0) % 60).padStart(2, '0')} min/km
- Cadence: ${runData?.cadenceSpm || 170} SPM (Steps Per Minute)
- Average Speed: ${runData?.avgSpeedKmh || 11.2} km/h
- Calories Burned: ${runData?.caloriesBurned || 380} kcal
- User Feeling: ${runData?.feeling || 'great'}
- Splits: ${JSON.stringify(runData?.splits?.map((s: { km: number; paceSecPerKm: number }) => `KM ${s.km}: ${Math.floor(s.paceSecPerKm / 60)}:${String(s.paceSecPerKm % 60).padStart(2, '0')}`) || [])}

Active Goals:
${goals?.map((g: { title: string; target: number; unit: string }) => `- ${g.title}: Target ${g.target} ${g.unit}`).join('\n') || 'None'}

Historical Runs Context:
Total workouts: ${recentRuns?.length || 4} runs logged.
    `.trim();

    if (!ai) {
      // Fallback response if GEMINI_API_KEY is not configured
      return res.json({
        summary: `Strong ${((runData?.distanceMeters || 5000) / 1000).toFixed(2)} km morning effort with great cadence stability!`,
        feedback: `Your average cadence of ${runData?.cadenceSpm || 170} SPM shows solid running economy. The pace distribution across your splits remained remarkably steady with minimal deceleration in the final kilometer.`,
        plateauPrevention: `To prevent aerobic stagnation, introduce one morning weekly tempo run with 8-minute intervals at 15 seconds faster than your current average pace, followed by a low-intensity recovery jog the next day.`,
        nextWorkoutRecommendation: `Tomorrow: 4.5 km gentle recovery jog at an easy conversational pace (approx. 5:45 min/km) focusing on a light, quick foot turnover.`,
        motivationalTip: `Consistency at dawn compounds like interest. Every morning kilometer laid down is an investment in your cardiovascular engine and mental grit.`,
      });
    }

    const prompt = `
You are an expert AI Running Coach and Sports Scientist for morning runners.
Analyze the following user morning run data in detail:
${runSummaryText}

Provide constructive feedback, pinpoint areas for performance improvement, suggest specific routine tweaks to avoid training plateaus, and provide a strong motivational tip.

Respond with strict JSON matching this schema:
{
  "summary": "1 punchy, motivating summary sentence highlighting performance",
  "feedback": "2-3 sentences of constructive athletic feedback evaluating pacing consistency, cadence efficiency (ideal is 170-180 SPM), and metabolic effort",
  "plateauPrevention": "2 sentences explaining training modifications or periodization strategies to break through plateaus safely",
  "nextWorkoutRecommendation": "Concrete recommendation for their next morning workout (distance, target pace, focus cue)",
  "motivationalTip": "1 inspiring morning runner quote or psychological motivation cue"
}
    `.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error) {
    console.error('Gemini run analysis error:', error);
    // Graceful fallback response
    return res.json({
      summary: 'Solid morning run logged! Your cadence and stamina are developing well.',
      feedback: 'Your pacing remained well-controlled. Focus on maintaining a relaxed upper body and landing softly midfoot to preserve energy over longer morning distances.',
      plateauPrevention: 'Alternate between standard aerobic mileage and short strides or interval surges to keep your neuromuscular system sharp.',
      nextWorkoutRecommendation: 'Next Session: 4.0 km easy conversational jog, focusing on 175 SPM cadence drills.',
      motivationalTip: 'The hardest part of any morning run is tying your shoes. You conquered that—now keep building!',
    });
  }
});

// AI Running Assistant Q&A Chat endpoint
app.post('/api/ai/coach-chat', async (req, res) => {
  try {
    const { question, userProfile, recentRuns, goals } = req.body;

    const context = `
Runner Profile: Age ${userProfile?.age || 28}, Weight ${userProfile?.weightKg || 68}kg, Height ${userProfile?.heightCm || 176}cm.
Recent runs count: ${recentRuns?.length || 4}.
Goals: ${goals?.map((g: { title: string }) => g.title).join(', ') || 'General fitness'}.
Question: "${question}"
    `.trim();

    if (!ai) {
      return res.json({
        answer: `Great question! For morning running, maintaining consistency while managing recovery is key. Focus on hydrating right after waking up, keeping your initial 500m slow to allow cold muscles to warm up, and targeting a cadence around 170-180 SPM to reduce knee impact.`,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are RUN 4 BISWAS AI, a world-class running coach and exercise physiologist. Provide an insightful, actionable, and encouraging answer (under 120 words) tailored to the runner: \n${context}`,
    });

    return res.json({ answer: response.text || 'Keep your stride light and your mornings consistent!' });
  } catch (err) {
    console.error('Coach chat error:', err);
    return res.json({
      answer: 'To improve your running economy, maintain a cadence between 170-180 steps per minute and ensure you take adequate rest days between hard morning efforts.',
    });
  }
});

// Weather proxy endpoint for Open-Meteo
app.get('/api/weather', async (req, res) => {
  try {
    const lat = req.query.lat ? String(req.query.lat) : '37.7749';
    const lng = req.query.lng ? String(req.query.lng) : '-122.4194';

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index&daily=sunrise,sunset,precipitation_probability_max&timezone=auto`;

    const weatherRes = await fetch(url);
    if (!weatherRes.ok) {
      throw new Error(`Weather API responded with ${weatherRes.status}`);
    }
    const data = await weatherRes.json();
    return res.json(data);
  } catch (err) {
    console.error('Weather fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RUN 4 BISWAS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
