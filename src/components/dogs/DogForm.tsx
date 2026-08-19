import { useState } from "react";
import { Camera } from "lucide-react";
import type { ActivityLevel, CookingTime, Dog, Sex, WeightUnit } from "@/lib/types";

export type DogFormValues = Omit<Dog, "id" | "userId" | "createdAt">;

const EMPTY: DogFormValues = {
  name: "",
  photoUrl: "",
  sex: "macho",
  ageYears: 1,
  birthDate: "",
  weight: 10,
  weightUnit: "kg",
  breed: "",
  activityLevel: "moderado",
  goal: "Mantener peso saludable",
  favoriteIngredients: [],
  dislikedIngredients: [],
  forbiddenIngredients: [],
  allergies: [],
  cookingTime: "20",
  hasOven: true,
  weeklyBudget: 25,
};

const GOALS = [
  "Mantener peso saludable",
  "Bajar de peso",
  "Ganar peso",
  "Más energía",
  "Digestión sensible",
  "Pelaje y piel",
];

function toList(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const labelCls = "block text-xs font-bold uppercase tracking-wide text-muted-foreground";
const inputCls =
  "w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40";

export function DogForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<DogFormValues>;
  submitLabel: string;
  onSubmit: (values: DogFormValues) => void;
}) {
  const [values, setValues] = useState<DogFormValues>({ ...EMPTY, ...initial });
  const [step, setStep] = useState(0);
  const set = <K extends keyof DogFormValues>(key: K, v: DogFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const steps = ["Perfil", "Cuerpo", "Comida", "Cocina"];

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (step < steps.length - 1) {
          setStep(step + 1);
          return;
        }
        onSubmit(values);
      }}
    >
      <div className="flex gap-1.5">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>
      <p className="font-display text-lg font-bold">
        {step + 1}. {steps[step]}
      </p>

      {step === 0 && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-accent">
              {values.photoUrl ? (
                <img src={values.photoUrl} alt="Foto del perro" className="size-full object-cover" />
              ) : (
                <Camera className="size-8 text-accent-foreground" />
              )}
            </div>
            <label className="cursor-pointer text-xs font-bold text-wood underline">
              Subir foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) set("photoUrl", URL.createObjectURL(file));
                }}
              />
            </label>
          </div>
          <div>
            <label className={labelCls} htmlFor="dog-name">
              Nombre
            </label>
            <input
              id="dog-name"
              required
              className={inputCls}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div>
            <span className={labelCls}>Sexo</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(["macho", "hembra"] as Sex[]).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => set("sex", s)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold capitalize ${
                    values.sex === s ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="dog-breed">
              Raza
            </label>
            <input
              id="dog-breed"
              className={inputCls}
              value={values.breed}
              onChange={(e) => set("breed", e.target.value)}
              placeholder="Golden retriever, mestizo..."
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="dog-age">
                Edad (años)
              </label>
              <input
                id="dog-age"
                type="number"
                min={0}
                step="0.5"
                className={inputCls}
                value={values.ageYears}
                onChange={(e) => set("ageYears", Number(e.target.value))}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="dog-birth">
                Nacimiento
              </label>
              <input
                id="dog-birth"
                type="date"
                className={inputCls}
                value={values.birthDate ?? ""}
                onChange={(e) => set("birthDate", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label className={labelCls} htmlFor="dog-weight">
                Peso
              </label>
              <input
                id="dog-weight"
                type="number"
                min={0}
                step="0.1"
                className={inputCls}
                value={values.weight}
                onChange={(e) => set("weight", Number(e.target.value))}
              />
            </div>
            <div>
              <span className={labelCls}>Unidad</span>
              <div className="mt-1 flex gap-1">
                {(["kg", "lb"] as WeightUnit[]).map((u) => (
                  <button
                    type="button"
                    key={u}
                    onClick={() => set("weightUnit", u)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                      values.weightUnit === u ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <span className={labelCls}>Nivel de actividad</span>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(["bajo", "moderado", "alto"] as ActivityLevel[]).map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => set("activityLevel", a)}
                  className={`rounded-xl px-2 py-2.5 text-sm font-semibold capitalize ${
                    values.activityLevel === a ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="dog-goal">
              Objetivo
            </label>
            <select
              id="dog-goal"
              className={inputCls}
              value={values.goal}
              onChange={(e) => set("goal", e.target.value)}
            >
              {GOALS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {(
            [
              ["favoriteIngredients", "Ingredientes favoritos", "pollo, zanahoria"],
              ["dislikedIngredients", "Ingredientes que no le gustan", "brócoli"],
              ["forbiddenIngredients", "Ingredientes prohibidos", "cerdo"],
              ["allergies", "Alergias", "pollo, lácteos"],
            ] as const
          ).map(([key, label, placeholder]) => (
            <div key={key}>
              <label className={labelCls} htmlFor={`dog-${key}`}>
                {label}
              </label>
              <input
                id={`dog-${key}`}
                className={inputCls}
                placeholder={placeholder}
                defaultValue={values[key].join(", ")}
                onChange={(e) => set(key, toList(e.target.value))}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Separa con comas</p>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <span className={labelCls}>Tiempo disponible para cocinar</span>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {(["5", "10", "20", "30+"] as CookingTime[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => set("cookingTime", t)}
                  className={`rounded-xl px-2 py-2.5 text-sm font-semibold ${
                    values.cookingTime === t ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {t} min
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between rounded-xl bg-muted px-3 py-3 text-sm font-semibold">
            ¿Tiene horno?
            <input
              type="checkbox"
              className="size-5 accent-[oklch(0.82_0.166_84)]"
              checked={values.hasOven}
              onChange={(e) => set("hasOven", e.target.checked)}
            />
          </label>
          <div>
            <label className={labelCls} htmlFor="dog-budget">
              Presupuesto semanal (USD)
            </label>
            <input
              id="dog-budget"
              type="number"
              min={0}
              className={inputCls}
              value={values.weeklyBudget}
              onChange={(e) => set("weeklyBudget", Number(e.target.value))}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="flex-1 rounded-xl bg-muted px-4 py-3 text-sm font-bold"
          >
            Atrás
          </button>
        )}
        <button
          type="submit"
          className="flex-[2] rounded-xl bg-brand px-4 py-3 text-sm font-bold text-primary-foreground shadow-soft"
        >
          {step < steps.length - 1 ? "Continuar" : submitLabel}
        </button>
      </div>
    </form>
  );
}
