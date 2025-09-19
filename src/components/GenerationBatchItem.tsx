'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from './ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontalIcon,
  TrashIcon,
} from '@/components/icons';

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

interface GenerationBatchItemProps {
  batch: GenerationBatch;
  isActive?: boolean;
  onDelete: (batchId: string) => void;
  setOpenMobile: (open: boolean) => void;
}

const PureGenerationBatchItem = ({
  batch,
  isActive = false,
  onDelete,
  setOpenMobile,
}: GenerationBatchItemProps) => {
  
  const displayGenerations = batch.generations.slice(0, 3);
  
   
  const truncatedPrompt = batch.prompt.length > 40 
    ? `${batch.prompt.slice(0, 40)}...` 
    : batch.prompt;

  return (
    <SidebarMenuItem className="generation-batch-item">
      <div className="flex flex-col gap-2">
        
        <SidebarMenuButton asChild isActive={isActive} className="h-auto p-2">
          <Link 
            href={`/batch/${batch.id}`} 
            onClick={() => setOpenMobile(false)}
            className="flex flex-col items-start gap-2"
          >
            <span className="text-sm font-medium text-left leading-tight">
              {truncatedPrompt}
            </span>
          </Link>
        </SidebarMenuButton>

      
        <div className="px-2 pb-2">
          <div className="grid grid-cols-3 gap-2">
            {displayGenerations.map((generation, index) => (
              <div
                key={generation.id}
                className="relative w-20 h-20 rounded-md overflow-hidden bg-muted border border-border"
              >
                {generation.status === 'completed' && generation.imageUrl ? (
                  <Image
                    src={generation.imageUrl}
                    alt={`${generation.model} result`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : generation.status === 'failed' ? (
                  <div className="w-full h-full flex items-center justify-center bg-destructive/10">
                    <span className="text-xs text-destructive font-medium">
                      Error
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted animate-pulse">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                
                 
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                  {generation.model}
                </div>
              </div>
            ))}
          </div>
  
          {batch.generations.length > 3 && (
            <div className="mt-2 text-xs text-muted-foreground">
              +{batch.generations.length - 3} more
            </div>
          )}
        </div>
      </div>
       
      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="mr-0.5 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground absolute top-2 right-2"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(batch.id)}
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const GenerationBatchItem = memo(PureGenerationBatchItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.batch.id !== nextProps.batch.id) return false;
  return true;
});
