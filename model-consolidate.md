55 results - 27 files

app\api\blog-writer\ai-assist\route.ts:
  50      // Call Gemini
  51:     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  52      const systemPrompt = "You are an expert blog writing assistant.";

app\api\blog-writer\generate-content\route.ts:
  64        const model = genAI.getGenerativeModel({
  65:         model: "gemini-2.0-flash",
  66          generationConfig: {

app\api\blog-writer\generate-outline\route.ts:
  42        const model = genAI.getGenerativeModel({
  43:         model: "gemini-2.0-flash",
  44          generationConfig: { responseMimeType: "application/json" },

app\api\calendar\ai-generate\route.ts:
  44      const model = genAI.getGenerativeModel({
  45:       model: "gemini-2.0-flash",
  46        generationConfig: { responseMimeType: "application/json" },

app\api\keyword\aggregate-keywords\route.ts:
  95      const model = genAI.getGenerativeModel({
  96:       model: 'gemini-2.0-flash',
  97        generationConfig: { responseMimeType: 'application/json' },

app\api\keyword\discover-sitemaps\route.ts:
  124          const model = genAI.getGenerativeModel({
  125:           model: 'gemini-2.0-flash',
  126            generationConfig: { responseMimeType: 'application/json' },

app\api\keyword\enrich-keywords\route.ts:
  47          const model = genAI.getGenerativeModel({
  48:           model: 'gemini-2.0-flash',
  49            generationConfig: { responseMimeType: 'application/json' },

app\api\keyword\extract-business-context\route.ts:
  105      const model = genAI.getGenerativeModel({
  106:       model: 'gemini-2.0-flash',
  107        generationConfig: { responseMimeType: 'application/json' },

app\api\keyword\extract-keywords\route.ts:
  54          const model = genAI.getGenerativeModel({
  55:           model: 'gemini-2.0-flash',
  56            generationConfig: { responseMimeType: 'application/json' },

app\api\keyword\extract-page-content\route.ts:
  82            const model = genAI.getGenerativeModel({
  83:             model: 'gemini-2.0-flash',
  84              generationConfig: { responseMimeType: 'application/json' },

app\api\keyword\finalize-selection\route.ts:
   35      const model = genAI.getGenerativeModel({
   36:       model: 'gemini-2.0-flash',
   37        generationConfig: { responseMimeType: 'application/json' },

  129          const sentenceModel = genAI.getGenerativeModel({
  130:           model: 'gemini-2.0-flash',
  131            generationConfig: { responseMimeType: 'application/json' },

app\api\keyword\generate-insights\route.ts:
  40      const model = genAI.getGenerativeModel({
  41:       model: 'gemini-2.0-flash',
  42        generationConfig: { responseMimeType: 'application/json' },

app\api\keyword\identify-competitors\route.ts:
  102          const model = genAI.getGenerativeModel({
  103:           model: 'gemini-2.0-flash',
  104            generationConfig: { responseMimeType: 'application/json' },

  152          const model = genAI.getGenerativeModel({
  153:           model: 'gemini-2.0-flash',
  154            generationConfig: { responseMimeType: 'application/json' },

app\api\marketing\ai\generate-email\route.ts:
  80      const model = genAI.getGenerativeModel({
  81:       model: "gemini-2.0-flash",
  82        generationConfig: { responseMimeType: "application/json" },

app\api\marketing\analyze-competitor-content\route.ts:
  59              const model = genAI.getGenerativeModel({
  60:               model: 'gemini-2.0-flash',
  61                generationConfig: { responseMimeType: 'application/json' },

app\api\marketing\analyze-user-business\route.ts:
  53      const model = genAI.getGenerativeModel({
  54:       model: 'gemini-2.0-flash',
  55        generationConfig: { responseMimeType: 'application/json' },

app\api\marketing\discover-competitors\route.ts:
   74          const model = genAI.getGenerativeModel({
   75:           model: 'gemini-2.0-flash',
   76            generationConfig: { responseMimeType: 'application/json' },

  245      const model = genAI.getGenerativeModel({
  246:       model: 'gemini-2.0-flash',
  247        generationConfig: { responseMimeType: 'application/json' },

app\api\marketing\generate-insights\route.ts:
  97      const model = genAI.getGenerativeModel({
  98:       model: 'gemini-2.0-flash',
  99        generationConfig: { responseMimeType: 'application/json' },

lib\ai\config.ts:
   13  // Justification:
   14: // - gemini-pro: Balanced performance/cost. Good default.
   15: // - gemini-1.5-flash: Extremely low cost, fast, decent reasoning. Best for bulk tasks.
   16: // - gemini-2.0-flash: Higher performance for complex tasks.
   17  export type AIModel =
   18:   | 'gemini-pro'
   19:   | 'gemini-1.5-flash'
   20:   | 'gemini-2.0-flash'
   21  

   48      provider: 'gemini',
   49:     model: 'gemini-1.5-flash',
   50      temperature: 0.7,

   58      provider: 'gemini',
   59:     model: 'gemini-1.5-flash', 
   60      temperature: 0.7,

   68      provider: 'gemini',
   69:     model: 'gemini-1.5-flash',
   70      temperature: 0.7,

   78      provider: 'gemini',
   79:     // model: 'gemini-2.0-flash-lite', // Good for simple scoring
   80:     model: 'gemini-2.0-flash', // Better for complex qualification
   81      temperature: 0.2, // Low temp for consistent scoring

   89      provider: 'gemini',
   90:     model: 'gemini-2.0-flash',
   91      temperature: 0.4,

   99      provider: 'gemini',
  100:     model: 'gemini-2.0-flash',
  101      temperature: 0.5, // Balanced for creativity and accuracy

lib\ai\gemini.ts:
  45      this.client = new GoogleGenerativeAI(apiKey);
  46:     this.model = this.client.getGenerativeModel({ model: "gemini-pro" });
  47    }

  49    async generateText(request: AICompletionRequest): Promise<AICompletionResponse> {
  50:     const defaultModel = "gemini-1.5-flash";
  51:     const fallbackModel = "gemini-2.0-flash";
  52      let modelName = request.model || defaultModel;

  94    async generateJSON<T>(request: AICompletionRequest): Promise<T> {
  95:     const defaultModel = "gemini-1.5-flash";
  96:     const fallbackModel = "gemini-2.0-flash";
  97      let modelName = request.model || defaultModel;

lib\analysis\keyword-clustering.ts:
  265      const result = await genAI({
  266:       model: "models/gemini-1.5-flash",
  267        config: {

  322      const result = await genAI({
  323:       model: "models/gemini-1.5-flash",
  324        config: {

services\competitorDiscovery.ts:
    1  /**
    2:  * Gemini-based Competitor Discovery Service
    3   * Uses Google AI with Google Search Grounding for discovering local and global competitors

   46  
   47:     // Use gemini-2.0-flash-exp for grounding capabilities
   48      const model = genAI.getGenerativeModel(
   49:       { model: "gemini-2.0-flash-exp" },
   50        // Enable Google Search grounding for live web data

  214      const model = genAI.getGenerativeModel(
  215:       { model: "gemini-2.0-flash-exp" },
  216        { apiVersion: "v1beta" }

services\agents\analyst-agent.ts:
  217      const result = await geminiGenAI({
  218:       model: "models/gemini-1.5-flash",
  219        config: {

  306      const result = await geminiGenAI({
  307:       model: "models/gemini-1.5-flash",
  308        config: {

services\agents\strategist-agent.ts:
  112      const result = await geminiGenAI({
  113:       model: "models/gemini-1.5-flash",
  114        config: {

  221      const result = await geminiGenAI({
  222:       model: "models/gemini-1.5-flash",
  223        config: {

  282      const model = geminiClient.getGenerativeModel({
  283:       model: "gemini-1.5-flash",
  284        generationConfig: {

services\ai\cost-tracker.ts:
  16  const PRICING = {
  17:   "gemini-2.0-flash": { input: 0.10 / 1000000, output: 0.40 / 1000000 },
  18:   "gemini-1.5-flash": { input: 0.075 / 1000000, output: 0.30 / 1000000 },
  19:   "gemini-1.5-pro": { input: 3.50 / 1000000, output: 10.50 / 1000000 },
  20    "gpt-4o": { input: 5.00 / 1000000, output: 15.00 / 1000000 },

services\ai\gemini-provider.ts:
  10  
  11:   constructor(modelName: string = "gemini-2.0-flash") {
  12      if (!API_KEY) throw new Error("GEMINI_API_KEY is missing");

services\ai\provider-factory.ts:
   9  
  10: import { GeminiProvider } from "./gemini-provider";
  11  
