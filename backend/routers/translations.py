from fastapi import APIRouter

router = APIRouter()

TRANSLATIONS = {
    "en": {
        "language": "English",
        "appName": "Soil Health",
        "tagline": "AI Nutrient Diagnosis",
        "analyze": "Analyse Soil",
        "healthScore": "Health Score",
        "nutrients": "Nutrients",
        "amendments": "Fertiliser Amendments",
        "crops": "Crop Recommendations",
        "nitrogen": "Nitrogen",
        "phosphorus": "Phosphorus",
        "potassium": "Potassium",
        "ph": "Soil pH",
        "organicMatter": "Organic Matter",
        "moisture": "Moisture",
        "excellent": "Excellent",
        "good": "Good",
        "fair": "Fair",
        "poor": "Poor",
        "low": "Low",
        "high": "High",
        "adequate": "Adequate",
        "acidic": "Acidic",
        "alkaline": "Alkaline",
        "optimal": "Optimal",
    },
    "hi": {
        "language": "हिन्दी",
        "appName": "मृदा स्वास्थ्य",
        "tagline": "AI पोषक तत्व निदान",
        "analyze": "मृदा विश्लेषण करें",
        "healthScore": "स्वास्थ्य स्कोर",
        "nutrients": "पोषक तत्व",
        "amendments": "उर्वरक संशोधन",
        "crops": "फसल सुझाव",
        "nitrogen": "नाइट्रोजन",
        "phosphorus": "फास्फोरस",
        "potassium": "पोटेशियम",
        "ph": "मृदा pH",
        "organicMatter": "जैव पदार्थ",
        "moisture": "नमी",
        "excellent": "उत्कृष्ट",
        "good": "अच्छा",
        "fair": "ठीक",
        "poor": "खराब",
        "low": "कम",
        "high": "अधिक",
        "adequate": "पर्याप्त",
        "acidic": "अम्लीय",
        "alkaline": "क्षारीय",
        "optimal": "सर्वोत्तम",
    },
    "kn": {
        "language": "ಕನ್ನಡ",
        "appName": "ಮಣ್ಣಿನ ಆರೋಗ್ಯ",
        "tagline": "AI ಪೋಷಕಾಂಶ ನಿರ್ಣಯ",
        "analyze": "ಮಣ್ಣು ವಿಶ್ಲೇಷಿಸಿ",
        "healthScore": "ಆರೋಗ್ಯ ಸ್ಕೋರ್",
        "nutrients": "ಪೋಷಕಾಂಶಗಳು",
        "amendments": "ರಸಗೊಬ್ಬರ ತಿದ್ದುಪಡಿ",
        "crops": "ಬೆಳೆ ಶಿಫಾರಸುಗಳು",
        "nitrogen": "ಸಾರಜನಕ",
        "phosphorus": "ರಂಜಕ",
        "potassium": "ಪೊಟ್ಯಾಶಿಯಮ್",
        "ph": "ಮಣ್ಣಿನ pH",
        "organicMatter": "ಸಾವಯವ ಪದಾರ್ಥ",
        "moisture": "ತೇವಾಂಶ",
        "excellent": "ಅತ್ಯುತ್ತಮ",
        "good": "ಉತ್ತಮ",
        "fair": "ಸಾಧಾರಣ",
        "poor": "ಕಳಪೆ",
        "low": "ಕಡಿಮೆ",
        "high": "ಹೆಚ್ಚು",
        "adequate": "ಸಾಕಷ್ಟು",
        "acidic": "ಆಮ್ಲೀಯ",
        "alkaline": "ಕ್ಷಾರೀಯ",
        "optimal": "ಸೂಕ್ತ",
    },
}


@router.get("/api/translations", summary="Get Language Translations", tags=["default"])
def get_translations(lang: str = "en"):
    """
    Returns UI label translations for the given language code.

    - **lang**: Language code — `en` (English), `hi` (Hindi), `kn` (Kannada)
    """
    data = TRANSLATIONS.get(lang, TRANSLATIONS["en"])
    return {
        "lang": lang,
        "availableLanguages": list(TRANSLATIONS.keys()),
        "translations": data,
    }
