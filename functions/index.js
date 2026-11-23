const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {defineSecret} = require('firebase-functions/params');
const {setGlobalOptions} = require('firebase-functions/v2');

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const ALLOWED_FIREBASE_APP_ID = '1:356040745965:web:ccfba6f10d7beef4aa3de4';
const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.7-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

setGlobalOptions({region: 'asia-south1', maxInstances: 4});

function buildGenerationConfig(config = {}) {
  const temperature = Number(config.temperature);
  const topP = Number(config.topP);
  const maxOutputTokens = Number(config.maxOutputTokens);
  const result = {
    maxOutputTokens: Number.isFinite(maxOutputTokens) ? Math.max(256, Math.min(4096, Math.floor(maxOutputTokens))) : 2048
  };
  if (Number.isFinite(temperature)) result.temperature = Math.max(0, Math.min(1, temperature));
  if (Number.isFinite(topP)) result.topP = Math.max(0.1, Math.min(1, topP));
  if (config.responseMimeType === 'application/json') {
    result.responseMimeType = 'application/json';
    if (config.responseSchema && typeof config.responseSchema === 'object') {
      result.responseSchema = config.responseSchema;
    }
  }
  return result;
}

async function discoverModels(apiKey) {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: {'x-goog-api-key': apiKey},
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) return FALLBACK_MODELS;
    const data = await response.json();
    const available = (data.models || [])
      .filter(model => model.supportedGenerationMethods?.includes('generateContent') &&
        /^models\/gemini-/i.test(model.name || '') && !/embedding/i.test(model.name || ''))
      .map(model => String(model.name).replace(/^models\//, ''));
    const ordered = [];
    FALLBACK_MODELS.forEach(model => {
      if (available.includes(model) && !ordered.includes(model)) ordered.push(model);
    });
    available.sort((a, b) => Number(/flash/i.test(b)) - Number(/flash/i.test(a)) || b.localeCompare(a))
      .forEach(model => { if (!ordered.includes(model)) ordered.push(model); });
    return ordered.length ? ordered.slice(0, 8) : FALLBACK_MODELS;
  } catch (error) {
    return FALLBACK_MODELS;
  }
}

exports.generateGeminiContent = onCall({
  enforceAppCheck: true,
  secrets: [GEMINI_API_KEY],
  timeoutSeconds: 120,
  memory: '512MiB'
}, async request => {
  if (!request.app || request.app.appId !== ALLOWED_FIREBASE_APP_ID) {
    throw new HttpsError('permission-denied', 'This app is not authorized to use the Gemini service.');
  }

  const contents = request.data?.contents;
  if (!Array.isArray(contents) || contents.length < 1 || contents.length > 8) {
    throw new HttpsError('invalid-argument', 'The AI request content is missing or too large.');
  }
  const safeConfig = buildGenerationConfig(request.data?.generationConfig || {});
  const requestBody = {contents, generationConfig: safeConfig};
  if (Buffer.byteLength(JSON.stringify(requestBody), 'utf8') > 8 * 1024 * 1024) {
    throw new HttpsError('invalid-argument', 'The photo or request is too large. Choose a smaller image and try again.');
  }

  const apiKey = GEMINI_API_KEY.value();
  if (!apiKey) throw new HttpsError('failed-precondition', 'The Firebase Gemini secret has not been configured.');

  const models = await discoverModels(apiKey);
  let lastError = null;
  for (let index = 0; index < models.length; index++) {
    const model = models[index];
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'x-goog-api-key': apiKey},
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(100000)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || `Gemini returned HTTP ${response.status}.`;
        const modelUnavailable = response.status === 404 || /model.{0,30}(not found|unavailable|unsupported|deprecated)|not supported for generatecontent/i.test(message);
        if (modelUnavailable && index < models.length - 1) {
          lastError = new Error(message);
          continue;
        }
        if (response.status === 429) throw new HttpsError('resource-exhausted', 'Gemini usage limit reached. Try again later.');
        if (response.status === 401 || response.status === 403) throw new HttpsError('failed-precondition', 'Gemini rejected the configured API key or its permissions.');
        throw new HttpsError('internal', message);
      }
      const data = await response.json();
      const text = (data?.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('').trim();
      if (!text) throw new HttpsError('internal', data?.promptFeedback?.blockReason ? 'Gemini blocked this request.' : 'Gemini returned an empty response.');
      return {text, model};
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      lastError = error;
      if (index === models.length - 1 || !/model.{0,30}(not found|unavailable|unsupported|deprecated)|not supported for generatecontent/i.test(error.message || '')) {
        throw new HttpsError('unavailable', 'Could not reach Gemini. Check the network and try again.');
      }
    }
  }
  throw new HttpsError('unavailable', lastError?.message || 'No Gemini model is available for this API key.');
});
