"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiSidebar } from "@/components/api-sidebar";
import { ApiRequestEditor } from "@/components/api-request-editor";
import { ApiResponseViewer } from "@/components/api-response-viewer";
import { ApiCollectionForm } from "@/components/api-collection-form";
import { ApiRequestForm } from "@/components/api-request-form";
import { ApiPlaygroundSkeleton } from "@/components/skeletons";
import { useApiPlayground } from "@/hooks/use-api-playground";
import { useEnvVaults } from "@/hooks/use-env-vaults";
import { useTranslation } from "@/providers/language-provider";
import { toast } from "sonner";
import type { ApiCollection, ApiRequest, ApiCollectionInput } from "@/lib/types/database";

export default function ApiPlaygroundPage() {
  const { t } = useTranslation();
  const {
    collections,
    uncollected,
    loading,
    error,
    refetch,
    createCollection,
    updateCollection,
    deleteCollection,
    activeRequest,
    setActiveRequest,
    createRequest,
    updateActiveRequest,
    deleteRequest,
    response,
    sending,
    send,
    history,
    historyLoading,
    fetchHistory,
    deleteHistoryItem,
    clearAllHistory,
  } = useApiPlayground();

  const { vaults } = useEnvVaults();

  const [collectionFormOpen, setCollectionFormOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<ApiCollection | null>(null);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState<ApiCollection | null>(null);
  const [deletingRequest, setDeletingRequest] = useState<ApiRequest | null>(null);

  const handleNewCollection = () => {
    setEditingCollection(null);
    setCollectionFormOpen(true);
  };

  const handleEditCollection = (col: ApiCollection) => {
    setEditingCollection(col);
    setCollectionFormOpen(true);
  };

  const handleCollectionFormOpenChange = (open: boolean) => {
    setCollectionFormOpen(open);
    if (!open) setEditingCollection(null);
  };

  const handleCollectionSubmit = async (input: ApiCollectionInput) => {
    if (editingCollection) {
      await updateCollection(editingCollection.id, input);
    } else {
      await createCollection(input);
    }
  };

  const handleDeleteCollection = async () => {
    if (!deletingCollection) return;
    try {
      await deleteCollection(deletingCollection.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("apiPlayground.deleteCollectionFailed"));
    } finally {
      setDeletingCollection(null);
    }
  };

  const handleDeleteRequest = async () => {
    if (!deletingRequest) return;
    try {
      await deleteRequest(deletingRequest.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("apiPlayground.deleteRequestFailed"));
    } finally {
      setDeletingRequest(null);
    }
  };

  if (loading) return <ApiPlaygroundSkeleton />;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      {/* Sidebar */}
      <Card className="w-full shrink-0 gap-0 overflow-hidden py-0 lg:w-64">
        <ApiSidebar
          collections={collections}
          uncollected={uncollected}
          activeRequestId={activeRequest?.id ?? null}
          onSelectRequest={setActiveRequest}
          onNewRequest={() => setRequestFormOpen(true)}
          onNewCollection={handleNewCollection}
          onEditCollection={handleEditCollection}
          onDeleteCollection={setDeletingCollection}
          onDeleteRequest={setDeletingRequest}
        />
      </Card>

      {/* Main content */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p>{error}</p>
            <button onClick={refetch} className="mt-2 text-sm font-medium underline underline-offset-4">
              {t("common.tryAgain")}
            </button>
          </div>
        )}

        {activeRequest ? (
          <>
            {/* Request Editor */}
            <Card className="gap-0 py-0">
              <CardContent className="p-4">
                <ApiRequestEditor
                  request={activeRequest}
                  envVaults={vaults}
                  sending={sending}
                  onUpdate={updateActiveRequest}
                  onSend={send}
                />
              </CardContent>
            </Card>

            {/* Response Viewer */}
            <Card className="flex flex-1 flex-col gap-0 overflow-hidden py-0">
              <CardContent className="flex flex-1 flex-col overflow-auto p-4">
                <ApiResponseViewer
                  response={response}
                  sending={sending}
                  history={history}
                  historyLoading={historyLoading}
                  onFetchHistory={fetchHistory}
                  onDeleteHistory={deleteHistoryItem}
                  onClearHistory={clearAllHistory}
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <Globe className="size-12 text-muted-foreground/50" />
              <div>
                <h3 className="text-lg font-medium">{t("apiPlayground.title")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("apiPlayground.subtitle")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ApiCollectionForm
        open={collectionFormOpen}
        onOpenChange={handleCollectionFormOpenChange}
        collection={editingCollection}
        onSubmit={handleCollectionSubmit}
      />

      <ApiRequestForm
        open={requestFormOpen}
        onOpenChange={setRequestFormOpen}
        collections={collections}
        onSubmit={createRequest}
      />

      <AlertDialog
        open={!!deletingCollection}
        onOpenChange={(open) => !open && setDeletingCollection(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("apiPlayground.deleteCollectionTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("apiPlayground.deleteCollectionDesc").replace("{name}", deletingCollection?.title ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCollection}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingRequest}
        onOpenChange={(open) => !open && setDeletingRequest(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("apiPlayground.deleteRequestTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("apiPlayground.deleteRequestDesc").replace("{name}", deletingRequest?.title ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRequest}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
