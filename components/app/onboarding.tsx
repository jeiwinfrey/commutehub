"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { IconCompassRound } from "central-icons";
import { Squircle } from "./squircle";
import { SelectField, TimeField } from "./sheet-picker";

export function Onboarding({ name }: { name: string }) {
  const places = useQuery(api.places.list);
  const update = useMutation(api.users.update);
  const [home, setHome] = useState("bacarra");
  const [school, setSchool] = useState("mmsu");
  const [time, setTime] = useState("08:00");
  const opts = (places ?? []).map((p) => ({ value: p.slug, label: p.name }));
  return (
    <div className="flex h-full flex-col gap-4 p-6 pt-12">
      <Squircle radius={30} className="grid size-20 place-items-center bg-primary text-white"><IconCompassRound size={44} /></Squircle>
      <h1 className="text-[30px]">Hi {name.split(" ")[0]}, where do you commute?</h1>
      <p className="text-[15px]">We use this to plan your leave-by time and rush-hour alerts.</p>
      <SelectField variant="field" label="Home stop" value={home} options={opts} onChange={setHome} />
      <SelectField variant="field" label="School or work" value={school} options={opts} onChange={setSchool} />
      <TimeField variant="field" label="First class at" value={time} onChange={setTime} />
      <button onClick={() => update({ homePlace: home, schoolPlace: school, classTime: time, onboarded: true })} className="mt-auto rounded-full bg-foreground py-4 text-[16px] text-background">Start commuting</button>
    </div>
  );
}
