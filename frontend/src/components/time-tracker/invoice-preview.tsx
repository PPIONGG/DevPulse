"use client";

import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getInvoicePdfUrl } from "@/lib/services/time-tracker";
import { useTranslation } from "@/providers/language-provider";
import type { Client, Invoice } from "@/lib/types/database";

interface InvoicePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  clients: Client[];
}

export function InvoicePreview({
  open,
  onOpenChange,
  invoice,
  clients,
}: InvoicePreviewProps) {
  const { t } = useTranslation();

  if (!invoice) return null;

  const client = invoice.client_id
    ? clients.find((c) => c.id === invoice.client_id)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("timeTracker.tabInvoices")} {invoice.invoice_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground">{t("timeTracker.invoiceNumber")}</p>
              <p>{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">{t("timeTracker.status")}</p>
              <p className="capitalize">{invoice.status}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">{t("timeTracker.issueDate")}</p>
              <p>{invoice.issue_date}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">{t("timeTracker.dueDate")}</p>
              <p>{invoice.due_date}</p>
            </div>
            {client && (
              <div className="col-span-2">
                <p className="font-medium text-muted-foreground">{t("timeTracker.client")}</p>
                <p>{client.name}</p>
                {client.company && (
                  <p className="text-muted-foreground">{client.company}</p>
                )}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">{t("timeTracker.lineDescription")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("timeTracker.lineHours")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("timeTracker.lineRate")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("timeTracker.lineAmount")}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.line_items.map((item, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2 text-right">{item.hours.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{item.rate.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{t("timeTracker.subtotal")}</span>
              <span>
                {invoice.subtotal.toFixed(2)} {invoice.currency}
              </span>
            </div>
            {invoice.tax_rate > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>{t("timeTracker.tax")} ({invoice.tax_rate}%)</span>
                <span>
                  {invoice.tax_amount.toFixed(2)} {invoice.currency}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1 text-base font-semibold">
              <span>{t("timeTracker.totalLabel")}</span>
              <span>
                {invoice.total.toFixed(2)} {invoice.currency}
              </span>
            </div>
          </div>

          {invoice.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("timeTracker.notes")}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{invoice.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("timeTracker.close")}
          </Button>
          <Button asChild>
            <a href={getInvoicePdfUrl(invoice.id)} download>
              <Download className="mr-2 size-4" />
              {t("timeTracker.downloadPdf")}
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
