import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeUpload } from "@/lib/soil/vision";

type Props = {
  value?: string | undefined;
  onChange: (dataUrl: string | undefined) => void;
  t: (k: string) => string;
};

export function CameraCapture({ value, onChange, t }: Props) {
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stop = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setLive(false);
  };

  useEffect(() => () => stop(), []);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setLive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      // fall back to the native camera / file picker
      fileRef.current?.click();
    }
  };

  const shoot = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
    onChange(canvas.toDataURL("image/jpeg", 0.85));
    stop();
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    try {
      onChange(await normalizeUpload(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that image.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted">
        {value ? (
          <img src={value} alt="Captured soil sample" className="h-full w-full object-cover" />
        ) : live ? (
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Camera className="h-9 w-9" aria-hidden />
            <p className="px-6 text-center text-xs">{t("photoOptional")}</p>
          </div>
        )}
        {live && (
          <button
            type="button"
            onClick={stop}
            aria-label="Close camera"
            className="absolute right-2 top-2 rounded-full bg-foreground/60 p-1.5 text-background"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {value ? (
          <>
            <Button type="button" variant="secondary" onClick={() => onChange(undefined)}>
              <RefreshCw className="mr-2 h-4 w-4" /> {t("retake")}
            </Button>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <ImageUp className="mr-2 h-4 w-4" /> {t("upload")}
            </Button>
          </>
        ) : live ? (
          <Button type="button" className="col-span-2" onClick={shoot}>
            <Camera className="mr-2 h-4 w-4" /> {t("capture")}
          </Button>
        ) : (
          <>
            <Button type="button" onClick={start}>
              <Camera className="mr-2 h-4 w-4" /> {t("capture")}
            </Button>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <ImageUp className="mr-2 h-4 w-4" /> {t("upload")}
            </Button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </div>
  );
}