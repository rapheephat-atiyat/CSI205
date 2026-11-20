"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import type { TokenRate } from "@/lib/api-types";

export default function TokenRateForm({ rate }: { rate: TokenRate }) {
  const [value, setValue] = useState(rate.bahtPerToken);
  const [savedRate, setSavedRate] = useState(rate.bahtPerToken);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const response = await api.admin.updateTokenRate({ bahtPerToken: value });
    setSaving(false);
    if (!response.success) {
      toast.error(response.error.message);
      return;
    }
    const updated = response.data.bahtPerToken;
    setSavedRate(updated);
    setValue(updated);
    toast.success("บันทึกอัตรา Token แล้ว");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>อัตราเติม Token</CardTitle>
        <CardDescription>เจ้าหน้าที่จะใช้อัตรานี้คำนวณยอดเงินบาทสำหรับการเติม Token รายการใหม่</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <Field className="max-w-xs">
            <FieldLabel htmlFor="baht-per-token">บาทต่อ 1 Token</FieldLabel>
            <Input
              id="baht-per-token"
              type="number"
              inputMode="decimal"
              min="0.01"
              max="99999999.99"
              step="0.01"
              required
              disabled={saving}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </Field>
          <Button type="submit" variant="brand" disabled={saving || Number(value) === Number(savedRate)}>
            {saving ? "กำลังบันทึก…" : "บันทึกอัตรา"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
