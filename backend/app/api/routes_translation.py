"""FujiNova Dedicated Japanese Travel Translation Service (Zero-Cost Free Tier)."""
import json
import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.core.config import settings
from backend.app.services.llm.router import router as model_router
from backend.app.services.llm.gemini_adapter import clean_json_markdown

logger = logging.getLogger("fujinova.translation.api")

router = APIRouter(prefix="/api/v1/translate", tags=["Translation"])


class TranslationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Source text to translate")
    source_language: str = Field(default="auto", description="Source language code: 'en', 'ja', 'hi', 'ta', 'kn', 'te', or 'auto'")
    target_language: str = Field(default="ja", description="Target language code: 'ja', 'en', 'hi', 'ta', 'kn', 'te'")
    travel_mode: str = Field(
        default="general",
        description="Travel scenario: 'hotel', 'dining', 'transit', 'directions', 'shopping', 'emergency', 'attractions', 'general'"
    )
    formality: str = Field(default="polite_keigo", description="'polite_keigo', 'casual', 'formal_humble'")


class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str
    phonetic_reading: Optional[str] = Field(None, description="Romaji for Japanese or Latin pronunciation guide")
    english_meaning: Optional[str] = Field(None, description="Literal or English meaning")
    travel_mode: str
    formality: str
    cultural_tip: Optional[str] = Field(None, description="Contextual travel advice (e.g. etiquette, when to say)")
    detected_source: Optional[str] = None


class TranslationModelPayload(BaseModel):
    translated_text: str
    phonetic_reading: Optional[str] = None
    english_meaning: Optional[str] = None
    cultural_tip: Optional[str] = None
    detected_source: Optional[str] = None


TRANSLATION_SYSTEM_INSTRUCTION = """You are the specialized Japanese & Multilingual Travel Translation Engine for FujiNova (Mount Fuji & Yamanashi tourism).
Your purpose is to provide authentic, accurate, culturally appropriate translations for travelers in Japan.

CORE RULES:
1. SCRIPT ACCURACY: When translating to Japanese, always use natural, correct Japanese orthography:
   - Appropriate combination of Kanji (漢字), Hiragana (ひらがな), and Katakana (カタカナ for loanwords/names).
   - Never use broken machine-like literal phrasing.
2. FORMALITY & KEIGO:
   - For travellers speaking to station staff, bus drivers, hotel/ryokan clerks, restaurant waiters, or locals, use natural polite Japanese (丁寧語 - Teineigo, e.g. 〜をお願いします, 〜はどこですか, 〜はありますか).
   - If emergency mode, use clear, urgent, unambiguous language (助けてください, 救急車を呼んでください).
3. PHONETICS: Always provide natural Romaji (Hepburn Romanization) with appropriate spacing so English-speaking tourists can easily read it aloud.
4. CULTURAL TIPS: Provide a concise (1-2 sentence) practical tip for using the phrase effectively (e.g., "Present your IC card when saying this to the bus driver", "Use this when checking in at a traditional ryokan").
5. Return strictly valid JSON matching the requested schema.
"""


@router.post("", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest) -> TranslationResponse:
    """Translate travel phrases bidirectionally across Japanese, English, Hindi, Tamil, Kannada, and Telugu."""
    # Ensure Free-Tier compliance
    if not settings.is_gemini_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google Gemini API key is missing. Please configure GEMINI_API_KEY in FujiNova/.env."
        )

    prompt = f"""Translate the following text for a traveller in the Mount Fuji / Yamanashi region:

SOURCE TEXT: "{request.text}"
SOURCE LANGUAGE: {request.source_language}
TARGET LANGUAGE: {request.target_language}
TRAVEL SCENARIO CONTEXT: {request.travel_mode}
REQUESTED FORMALITY: {request.formality}

Output JSON with keys:
- "translated_text": string (the exact translation in target language script)
- "phonetic_reading": string (Hepburn Romaji if target is Japanese; phonetic transcription if target is another non-Latin language; or English pronunciation)
- "english_meaning": string (clear English meaning if source or target is not English)
- "cultural_tip": string (practical tip on etiquette or how to use this phrase in Japan)
- "detected_source": string (the detected source language code, e.g. 'en', 'ja', 'hi', 'ta', 'kn', 'te')
"""

    messages = [
        {"role": "user", "content": prompt}
    ]

    try:
        # Use model_router to extract structured response via Gemini Free Tier
        result: TranslationModelPayload = await model_router.extract_structured(
            messages=messages,
            response_model=TranslationModelPayload,
            system_instruction=TRANSLATION_SYSTEM_INSTRUCTION,
            temperature=0.2
        )

        return TranslationResponse(
            original_text=request.text,
            translated_text=result.translated_text,
            source_language=result.detected_source or request.source_language,
            target_language=request.target_language,
            phonetic_reading=result.phonetic_reading,
            english_meaning=result.english_meaning,
            travel_mode=request.travel_mode,
            formality=request.formality,
            cultural_tip=result.cultural_tip,
            detected_source=result.detected_source
        )

    except Exception as e:
        logger.error(f"Translation generation failure: {e}", exc_info=True)
        # Deterministic offline fallback dictionary for common travel scenarios if API has a transient hiccup
        fallback = _get_deterministic_fallback(request.text, request.target_language, request.travel_mode)
        if fallback:
            return fallback

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Translation failed: {str(e)}"
        )


def _get_deterministic_fallback(text: str, target_lang: str, mode: str) -> Optional[TranslationResponse]:
    """Provide verified travel fallbacks for critical safety and transit phrases."""
    text_lower = text.lower().strip()
    
    fallbacks: Dict[str, Dict[str, Any]] = {
        "where is the bus stop?": {
            "ja": ("バス停はどこですか？", "Basutei wa doko desu ka?", "Where is the bus stop?", "Look for the colored bus line poles (Red Line, Green Line) outside Kawaguchiko Station."),
            "en": ("Where is the bus stop?", "Where is the bus stop?", "Where is the bus stop?", "Bus stops at Kawaguchiko Station are numbered 1 through 7.")
        },
        "does this bus go to kawaguchiko station?": {
            "ja": ("このバスは河口湖駅に行きますか？", "Kono basu wa Kawaguchiko-eki ni ikimasu ka?", "Does this bus go to Kawaguchiko Station?", "Show your phone screen or pass to the driver before boarding."),
            "en": ("Does this bus go to Kawaguchiko Station?", "Does this bus go to Kawaguchiko Station?", "Does this bus go to Kawaguchiko Station?", "Fujikyu buses display the destination in Japanese and English on the front electronic sign.")
        },
        "can i use an ic card (suica / pasmo)?": {
            "ja": ("SuicaやPASMOなどの交通系ICカードは使えますか？", "Suika ya Pasumo nado no kōtsūkei Aishī-kādo wa tsukaemasu ka?", "Can I use transit IC cards like Suica or Pasmo?", "Tap once upon boarding at the rear door and once upon exiting at the front door on Fujikyu buses."),
            "en": ("Can I use an IC card here?", "Can I use an IC card here?", "Can I use an IC card here?", "Standard IC cards are accepted on all Fujikyu Railway trains and Sightseeing Omnibuses.")
        },
        "help, please!": {
            "ja": ("助けてください！", "Tasukete kudasai!", "Help please!", "For police dial 110; for medical/ambulance dial 119 in Japan."),
            "en": ("Please help me!", "Please help me!", "Please help me!", "Japan emergency services have multilingual operators available.")
        },
        "where is the nearest hospital or clinic?": {
            "ja": ("一番近い病院または診療所はどこですか？", "Ichiban chikai byōin matawa shinryōjo wa doko desu ka?", "Where is the nearest hospital or clinic?", "The Yamanashi Prefectural Medical Information Service provides 24-hour English emergency routing."),
            "en": ("Where is the nearest hospital or clinic?", "Where is the nearest hospital or clinic?", "Where is the nearest hospital or clinic?", "Kawaguchiko has local clinics and Yamanashi Red Cross Hospital in Funatsu.")
        },
        "thank you very much": {
            "ja": ("どうもありがとうございます。", "Dōmo arigatō gozaimasu.", "Thank you very much.", "Bowing slightly (~15 degrees) while saying this shows deep and respectful appreciation."),
            "en": ("Thank you very much.", "Thank you very much.", "Thank you very much.", "A polite and warm way to thank service staff.")
        }
    }

    for key, trans in fallbacks.items():
        if key in text_lower or text_lower in key:
            if target_lang in trans:
                t_text, romaji, eng, tip = trans[target_lang]
                return TranslationResponse(
                    original_text=text,
                    translated_text=t_text,
                    source_language="en" if target_lang != "en" else "ja",
                    target_language=target_lang,
                    phonetic_reading=romaji,
                    english_meaning=eng,
                    travel_mode=mode,
                    formality="polite_keigo",
                    cultural_tip=tip,
                    detected_source="en" if target_lang != "en" else "ja"
                )
    return None
