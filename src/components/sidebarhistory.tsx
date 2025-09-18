'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import type { User } from '@/lib/auth-client';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { fetcher } from '@/lib/utils';
import { GenerationBatchItem } from '@/components/GenerationBatchItem';
import useSWRInfinite from 'swr/infinite';
import { LoaderIcon } from '@/components/icons';

interface ImageGeneration {
  id: string;
  model: string;
  imageUrl: string | null;
  status: 'pending' | 'completed' | 'failed';
  errorMsg?: string;
}

interface GenerationBatch {
  id: string;
  chatId: string;
  prompt: string;
  createdAt: string;
  generations: ImageGeneration[];
}

type GroupedBatches = {
  today: GenerationBatch[];
  yesterday: GenerationBatch[];
  lastWeek: GenerationBatch[];
  lastMonth: GenerationBatch[];
  older: GenerationBatch[];
};

export interface GenerationHistory {
  batches: Array<GenerationBatch>;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

const groupBatchesByDate = (batches: GenerationBatch[]): GroupedBatches => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return batches.reduce(
    (groups, batch) => {
      const batchDate = new Date(batch.createdAt);

      if (isToday(batchDate)) {
        groups.today.push(batch);
      } else if (isYesterday(batchDate)) {
        groups.yesterday.push(batch);
      } else if (batchDate > oneWeekAgo) {
        groups.lastWeek.push(batch);
      } else if (batchDate > oneMonthAgo) {
        groups.lastMonth.push(batch);
      } else {
        groups.older.push(batch);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedBatches,
  );
};

export function getGenerationHistoryPaginationKey(
  pageIndex: number,
  previousPageData: GenerationHistory,
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0) return `/api/generation-history?limit=${PAGE_SIZE}`;

  const firstBatchFromPage = previousPageData.batches.at(-1);

  if (!firstBatchFromPage) return null;

  return `/api/generation-history?ending_before=${firstBatchFromPage.id}&limit=${PAGE_SIZE}`;
}

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();

  const {
    data: paginatedGenerationHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<GenerationHistory>(getGenerationHistoryPaginationKey, fetcher, {
    fallbackData: [],
  });

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const hasReachedEnd = paginatedGenerationHistories
    ? paginatedGenerationHistories.some((page) => page.hasMore === false)
    : false;

  const hasEmptyGenerationHistory = paginatedGenerationHistories
    ? paginatedGenerationHistories.every((page) => page.batches.length === 0)
    : false;

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/generation-batch?id=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting generation...',
      success: () => {
        mutate((generationHistories) => {
          if (generationHistories) {
            return generationHistories.map((generationHistory) => ({
              ...generationHistory,
              batches: generationHistory.batches.filter((batch) => batch.id !== deleteId),
            }));
          }
        });

        return 'Generation deleted successfully';
      },
      error: 'Failed to delete generation',
    });

    setShowDeleteDialog(false);

    if (deleteId === id) {
      router.push('/');
    }
  };

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
            Login to save and revisit previous generations!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
          Today
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col gap-4">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="flex flex-col gap-2 rounded-md px-2"
              >
                <div
                  className="h-4 max-w-(--skeleton-width) flex-1 rounded-md bg-sidebar-accent-foreground/10"
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-20 h-20 rounded-md bg-sidebar-accent-foreground/10" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (hasEmptyGenerationHistory) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
            Your image generations will appear here once you start creating!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {paginatedGenerationHistories &&
              (() => {
                const batchesFromHistory = paginatedGenerationHistories.flatMap(
                  (paginatedGenerationHistory) => paginatedGenerationHistory.batches,
                );

                const groupedBatches = groupBatchesByDate(batchesFromHistory);

                return (
                  <div className="flex flex-col gap-6">
                    {groupedBatches.today.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                          Today
                        </div>
                        {groupedBatches.today.map((batch) => (
                          <GenerationBatchItem
                            key={batch.id}
                            batch={batch}
                            isActive={batch.id === id}
                            onDelete={(batchId: string) => {
                              setDeleteId(batchId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedBatches.yesterday.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                          Yesterday
                        </div>
                        {groupedBatches.yesterday.map((batch) => (
                          <GenerationBatchItem
                            key={batch.id}
                            batch={batch}
                            isActive={batch.id === id}
                            onDelete={(batchId: string) => {
                              setDeleteId(batchId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedBatches.lastWeek.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                          Last 7 days
                        </div>
                        {groupedBatches.lastWeek.map((batch) => (
                          <GenerationBatchItem
                            key={batch.id}
                            batch={batch}
                            isActive={batch.id === id}
                            onDelete={(batchId: string) => {
                              setDeleteId(batchId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedBatches.lastMonth.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                          Last 30 days
                        </div>
                        {groupedBatches.lastMonth.map((batch) => (
                          <GenerationBatchItem
                            key={batch.id}
                            batch={batch}
                            isActive={batch.id === id}
                            onDelete={(batchId: string) => {
                              setDeleteId(batchId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedBatches.older.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                          Older than last month
                        </div>
                        {groupedBatches.older.map((batch) => (
                          <GenerationBatchItem
                            key={batch.id}
                            batch={batch}
                            isActive={batch.id === id}
                            onDelete={(batchId: string) => {
                              setDeleteId(batchId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
          </SidebarMenu>

          <motion.div
            onViewportEnter={() => {
              if (!isValidating && !hasReachedEnd) {
                setSize((size) => size + 1);
              }
            }}
          />

          {hasReachedEnd ? (
            <div className="mt-8 flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
              You have reached the end of your generation history.
            </div>
          ) : (
            <div className="mt-8 flex flex-row items-center gap-2 p-2 text-zinc-500 dark:text-zinc-400">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <div>Loading Generations...</div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              image generation batch and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
