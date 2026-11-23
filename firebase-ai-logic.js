import {getApp as getModularApp, initializeApp as initializeModularApp} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import {initializeAppCheck, ReCaptchaEnterpriseProvider} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app-check.js';
import {getAI, getGenerativeModel, GoogleAIBackend} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-ai.js';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDgi8scRulYxtwKwp1dxmLuDzUPx0dqmCI',
  authDomain: 'football-event-managing-system.firebaseapp.com',
  projectId: 'football-event-managing-system',
  storageBucket: 'football-event-managing-system.firebasestorage.app',
  messagingSenderId: '356040745965',
  appId: '1:356040745965:web:ccfba6f10d7beef4aa3de4'
};
const RECAPTCHA_ENTERPRISE_SITE_KEY = '6LcPjRYuAAAAAFkXkckUF7ftLo6uojngdCm0OtY7';
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite'
];
let activeModelName = CANDIDATE_MODELS[0];

function convertSchemaTypes(schema){
  if(Array.isArray(schema)) return schema.map(convertSchemaTypes);
  if(!schema || typeof schema !== 'object') return schema;
  const converted = {};
  Object.entries(schema).forEach(([key,value])=>{
    if(key === 'type' && typeof value === 'string') converted[key] = value.toLowerCase();
    else converted[key] = convertSchemaTypes(value);
  });
  return converted;
}

function normalizeContents(contents){
  if(!Array.isArray(contents)) throw new Error('Gemini content must be an array.');
  const parts = [];
  contents.forEach(content=>{
    if(typeof content === 'string'){
      parts.push({text:content});
      return;
    }
    if(!content || typeof content !== 'object') throw new Error('Gemini content contains an invalid item.');
    if(Array.isArray(content.parts)) parts.push(...content.parts);
    else parts.push(content);
  });
  if(!parts.length) throw new Error('Gemini content is empty.');
  return parts;
}

function normalizeGenerationConfig(config = {}){
  const normalized = {
    ...config
  };
  if(config.thinkingConfig){
    normalized.thinkingConfig = config.thinkingConfig;
  }
  if(normalized.responseSchema){
    normalized.responseJsonSchema = convertSchemaTypes(normalized.responseSchema);
    delete normalized.responseSchema;
  }
  return normalized;
}

const firebaseAiLogicInitialization = (async()=>{
  const appName = 'firebase-ai-logic';
  let app;
  try{
    app = getModularApp(appName);
  }catch(_error){
    app = initializeModularApp(FIREBASE_CONFIG,appName);
  }

  initializeAppCheck(app,{
    provider:new ReCaptchaEnterpriseProvider(RECAPTCHA_ENTERPRISE_SITE_KEY),
    isTokenAutoRefreshEnabled:true
  });

  const ai = getAI(app,{backend:new GoogleAIBackend()});
  const createModel=(modelName, generationConfig = {})=>getGenerativeModel(ai,{
    model:modelName || activeModelName,
    generationConfig:normalizeGenerationConfig(generationConfig)
  });

  const generateContent=async(contents,generationConfig = {})=>{
    const normalizedContents = normalizeContents(contents);
    const modelsToTry = [activeModelName, ...CANDIDATE_MODELS.filter(m => m !== activeModelName)];
    let lastError = null;

    for(const modelName of modelsToTry){
      try{
        const model = createModel(modelName, generationConfig);
        const result = await model.generateContent(normalizedContents);
        const text = String(result?.response?.text?.() || '').trim();
        if(!text) throw new Error('Gemini returned an empty response.');
        activeModelName = modelName;
        return text;
      }catch(err){
        lastError = err;
        console.warn(`[Firebase AI] Model ${modelName} failed, trying next candidate:`, err?.message || err);
      }
    }
    throw lastError || new Error('All Gemini AI models failed to generate content.');
  };

  generateContent.stream=async(contents,generationConfig = {},onText)=>{
    const normalizedContents = normalizeContents(contents);
    const modelsToTry = [activeModelName, ...CANDIDATE_MODELS.filter(m => m !== activeModelName)];
    let lastError = null;

    for(const modelName of modelsToTry){
      try{
        const model = createModel(modelName, generationConfig);
        const result = await model.generateContentStream(normalizedContents);
        let text = '';
        for await(const chunk of result.stream){
          const part = String(chunk?.text?.() || '');
          if(!part) continue;
          text += part;
          if(typeof onText === 'function') onText(text);
        }
        text = text.trim();
        if(!text) throw new Error('Gemini returned an empty response.');
        activeModelName = modelName;
        return text;
      }catch(err){
        lastError = err;
        console.warn(`[Firebase AI Stream] Model ${modelName} failed, trying next candidate:`, err?.message || err);
      }
    }
    throw lastError || new Error('All Gemini AI models failed to stream content.');
  };

  return generateContent;
})();

if(typeof window.resolveFirebaseAiLogicModule === 'function'){
  firebaseAiLogicInitialization.then(
    window.resolveFirebaseAiLogicModule,
    window.rejectFirebaseAiLogicModule
  );
}else{
  window.firebaseAiLogicReady=firebaseAiLogicInitialization;
}
