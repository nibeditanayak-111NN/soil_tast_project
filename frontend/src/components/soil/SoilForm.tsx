import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SoilTestInput } from "@/lib/soil/types";

type Props = {
  value: SoilTestInput;
  onChange: (v: SoilTestInput) => void;
  t: (k: string) => string;
};

const NUM_FIELDS: { key: keyof SoilTestInput; icon: string; step: number }[] = [
  { key: "nitrogen", icon: "🌿", step: 1 },
  { key: "phosphorus", icon: "🪨", step: 1 },
  { key: "potassium", icon: "🍂", step: 1 },
  { key: "ph", icon: "⚗️", step: 0.1 },
  { key: "organicMatter", icon: "🪱", step: 0.01 },
  { key: "moisture", icon: "💧", step: 0.5 },
];

export function SoilForm({ value, onChange, t }: Props) {
  const set = (k: keyof SoilTestInput, v: string) =>
    onChange({ ...value, [k]: k === "fieldName" || k === "village" ? v : Number(v) });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-1 space-y-1.5">
          <Label htmlFor="fieldName">{t("fieldName")}</Label>
          <Input
            id="fieldName"
            value={value.fieldName}
            onChange={(e) => set("fieldName", e.target.value)}
          />
        </div>
        <div className="col-span-1 space-y-1.5">
          <Label htmlFor="village">{t("village")}</Label>
          <Input id="village" value={value.village} onChange={(e) => set("village", e.target.value)} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="areaHa">{t("area")}</Label>
          <Input
            id="areaHa"
            type="number"
            inputMode="decimal"
            step={0.1}
            min={0.1}
            value={value.areaHa}
            onChange={(e) => set("areaHa", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {NUM_FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={f.key} className="flex items-center gap-1.5">
              <span aria-hidden className="text-base leading-none">
                {f.icon}
              </span>
              {t(f.key)}
            </Label>
            <Input
              id={f.key}
              type="number"
              inputMode="decimal"
              step={f.step}
              min={0}
              value={value[f.key] as number}
              onChange={(e) => set(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}