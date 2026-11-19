"use client";

import { useState } from "react";
import { CircleQuestionMark } from "lucide-react";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const availableIcons = new Set<string>(iconNames);
const suggestedIcons: IconName[] = [
  "circle-question-mark",
  "ticket",
  "credit-card",
  "wallet",
  "qr-code",
  "user-round",
  "calendar-days",
  "map-pin",
  "shopping-bag",
  "mail",
  "shield-check",
  "info",
];

function isIconName(name: string): name is IconName {
  return availableIcons.has(name);
}

export function FaqIcon({ name }: { name: string }) {
  return (
    <DynamicIcon
      name={isIconName(name) ? name : "circle-question-mark"}
      size={20}
      aria-hidden="true"
      fallback={() => <CircleQuestionMark size={20} aria-hidden="true" />}
    />
  );
}

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [search, setSearch] = useState("");
  const icons = search.trim()
    ? iconNames
        .filter((name) => name.includes(search.trim().toLowerCase()))
        .slice(0, 24)
    : suggestedIcons;

  return (
    <div className="space-y-3">
      <Label htmlFor="faq-icon-search">ไอคอนหมวด</Label>
      <Input
        id="faq-icon-search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="ค้นหาไอคอน เช่น ticket, wallet"
        className="h-11"
      />
      <div
        className="grid grid-cols-4 gap-2 sm:grid-cols-6"
        aria-label="เลือกไอคอน"
      >
        {icons.map((name) => (
          <Button
            key={name}
            type="button"
            variant={value === name ? "brand" : "outline"}
            aria-pressed={value === name}
            aria-label={`เลือกไอคอน ${name}`}
            title={name}
            onClick={() => onChange(name)}
            className="h-11 w-full px-0"
          >
            <FaqIcon name={name} />
          </Button>
        ))}
      </div>
      {!icons.length && (
        <p role="status" className="text-sm text-muted-foreground">
          ไม่พบไอคอน ลองค้นหาด้วยคำภาษาอังกฤษอื่น
        </p>
      )}
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <FaqIcon name={value} /> เลือกไว้: {value}
      </p>
    </div>
  );
}
