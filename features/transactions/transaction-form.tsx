"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categories, type Transaction, type TransactionDraft } from "@/features/finance/types";
import { categoryLabels } from "@/features/finance/format";
import { useLocale } from "@/features/finance/locale-provider";

const schema = z.object({
  title: z.string().trim().min(2, "Enter at least 2 characters.").max(60, "Keep the title under 60 characters."),
  amount: z
    .union([z.string(), z.number()])
    .transform((value) => Number(value))
    .pipe(z.number().positive("Amount must be greater than zero.").max(1_000_000, "Amount is too large.")),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Choose a category."),
  date: z.string().min(1, "Choose a date."),
  note: z.string().trim().max(180, "Keep the note under 180 characters.").optional(),
});

type FormValues = z.input<typeof schema>;

const today = new Date().toISOString().slice(0, 10);

const emptyValues: FormValues = {
  title: "",
  amount: "",
  type: "expense",
  category: "Food",
  date: today,
  note: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  onSubmit: (draft: TransactionDraft) => void;
};

export function TransactionForm({ open, onOpenChange, transaction, onSubmit }: Props) {
  const { language, t } = useLocale();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues });

  useEffect(() => {
    if (!open) return;
    reset(
      transaction
        ? {
            title: transaction.title,
            amount: transaction.amount,
            type: transaction.type,
            category: transaction.category,
            date: transaction.date,
            note: transaction.note ?? "",
          }
        : emptyValues,
    );
  }, [open, transaction, reset]);

  const submit = handleSubmit(async (values) => {
    const result = schema.parse(values);
    await Promise.resolve();
    onSubmit(result);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{transaction ? t("editTransaction") : t("addTransaction")}</DialogTitle>
          <DialogDescription>{t("transactionDialogDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="grid gap-5" id="transaction-form">
          <div className="grid gap-2">
            <Label htmlFor="transaction-title">{t("titleLabel")} *</Label>
            <Input id="transaction-title" placeholder={t("exampleTitle")} aria-invalid={Boolean(errors.title)} {...register("title")} />
            {errors.title && <p className="form-error" role="alert">{errors.title.message}</p>}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="transaction-amount">{t("amountUsd")} *</Label>
              <Input id="transaction-amount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" aria-invalid={Boolean(errors.amount)} {...register("amount")} />
              {errors.amount && <p className="form-error" role="alert">{errors.amount.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label>{t("typeLabel")} *</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-label={t("transactionTypeAria")}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">{t("expenseType")}</SelectItem>
                      <SelectItem value="income">{t("incomeType")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t("categoryLabel")} *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full" aria-label={t("categoryAria")}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{categoryLabels[category]?.[language] ?? category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="form-error" role="alert">{errors.category.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="transaction-date">{t("dateLabel")} *</Label>
              <Input id="transaction-date" type="date" aria-invalid={Boolean(errors.date)} {...register("date")} />
              {errors.date && <p className="form-error" role="alert">{errors.date.message}</p>}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="transaction-note">{t("noteLabel")}</Label>
            <Textarea id="transaction-note" rows={3} placeholder={t("optionalContext")} aria-invalid={Boolean(errors.note)} {...register("note")} />
            {errors.note && <p className="form-error" role="alert">{errors.note.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t("saving") : transaction ? t("saveChanges") : t("addTransaction")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
