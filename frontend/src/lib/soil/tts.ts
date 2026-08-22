// ─────────────────────────────────────────────────────────────────────────────
// Sarvam AI Text-to-Speech client
// Sarvam API docs: https://docs.sarvam.ai/api-reference/text-to-speech
// ─────────────────────────────────────────────────────────────────────────────
import type { SoilReport } from "./types";
import type { Lang } from "./i18n";

const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY ?? "";

// Sarvam language codes
const LANG_MAP: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  kn: "kn-IN",
};

// Sarvam speaker voices (one per language)
const VOICE_MAP: Record<Lang, string> = {
  en: "meera",   // Indian English female
  hi: "anushka", // Hindi female
  kn: "diya",    // Kannada female
};

/**
 * Build a concise diagnostic summary in the app's current language.
 * Falls back to English for unsupported keys.
 */
export function buildSummaryText(report: SoilReport, lang: Lang): string {
  const score    = report.healthScore.toFixed(1);
  const band     = report.healthBand;
  const topCrop  = report.crops[0]?.crop ?? "mixed crops";
  const defCount = report.nutrients.filter(
    (n) => n.status === "low" || n.status === "acidic"
  ).length;

  if (lang === "hi") {
    return (
      `मृदा स्वास्थ्य स्कोर ${score} में से 100 है, जो ${band} श्रेणी में आता है। ` +
      `${defCount > 0 ? `${defCount} पोषक तत्वों की कमी पाई गई है। ` : "पोषक तत्व उचित स्तर पर हैं। "}` +
      `आपकी मिट्टी के लिए सबसे उपयुक्त फसल ${topCrop} है।`
    );
  }

  if (lang === "kn") {
    return (
      `ಮಣ್ಣಿನ ಆರೋಗ್ಯ ಅಂಕ 100 ರಲ್ಲಿ ${score} ಆಗಿದ್ದು, ${band} ವಿಭಾಗದಲ್ಲಿದೆ. ` +
      `${defCount > 0 ? `${defCount} ಪೋಷಕಾಂಶಗಳ ಕೊರತೆ ಕಂಡುಬಂದಿದೆ. ` : "ಪೋಷಕಾಂಶಗಳು ಸಮರ್ಪಕ ಮಟ್ಟದಲ್ಲಿವೆ. "}` +
      `ನಿಮ್ಮ ಮಣ್ಣಿಗೆ ಅತ್ಯಂತ ಸೂಕ್ತ ಬೆಳೆ ${topCrop}.`
    );
  }

  // English (default)
  return (
    `Your soil health score is ${score} out of 100, rated ${band}. ` +
    `${defCount > 0 ? `${defCount} nutrient deficiencie${defCount > 1 ? "s" : ""} detected. ` : "All nutrients are at adequate levels. "}` +
    `The best-suited crop for your field is ${topCrop}.`
  );
}

/**
 * Call Sarvam AI TTS API and play the audio in the browser.
 * Returns a cleanup function to stop playback.
 */
export async function speakReport(
  report: SoilReport,
  lang: Lang,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: string) => void
): Promise<() => void> {
  if (!SARVAM_API_KEY) {
    const msg = "VITE_SARVAM_API_KEY is not set. Falling back to native browser speech synthesis.";
    console.warn("[TTS]", msg);
    
    // Native Browser Fallback
    try {
      onStart?.();
      const text = buildSummaryText(report, lang);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG_MAP[lang] || "en-US";
      
      utterance.onend = () => onEnd?.();
      utterance.onerror = (e) => {
        console.error("Native TTS Error", e);
        onError?.("Native TTS failed.");
        onEnd?.();
      };
      
      window.speechSynthesis.speak(utterance);
      
      return () => {
        window.speechSynthesis.cancel();
      };
    } catch (e) {
      onError?.("Text to speech is not supported in your browser.");
      return () => {};
    }
  }

  const text       = buildSummaryText(report, lang);
  const languageCode = LANG_MAP[lang];
  const speaker      = VOICE_MAP[lang];

  let audioCtx: AudioContext | null = null;
  let source: AudioBufferSourceNode | null = null;

  try {
    onStart?.();

    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY,
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: languageCode,
        speaker,
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: "bulbul:v1",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Sarvam API error ${res.status}: ${errText}`);
    }

    const json = await res.json();
    // Sarvam returns base64-encoded audio
    const b64  = json.audios?.[0] as string | undefined;
    if (!b64) throw new Error("No audio returned from Sarvam API");

    // Decode base64 → ArrayBuffer → AudioBuffer → play
    const binary    = atob(b64);
    const bytes     = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    audioCtx = new AudioContext();
    const buffer = await audioCtx.decodeAudioData(bytes.buffer);
    source       = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.onended = () => { onEnd?.(); audioCtx?.close(); };
    source.start();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[TTS]", msg);
    onError?.(msg);
    onEnd?.();
  }

  // Return cleanup (stop playback early)
  return () => {
    try { source?.stop(); audioCtx?.close(); } catch {}
  };
}
