import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BlocksService } from "../services/blocks.service";

const blocksService = new BlocksService();

export function useBlockedUsers(userId: string) {
  return useQuery({
    queryKey: ["blockedUsers", userId],
    queryFn: () => blocksService.getBlockedUsers(userId),
    enabled: !!userId,
  });
}

export function useIsUserBlocked(blockerId: string, blockedId: string) {
    return useQuery({
      queryKey: ["isBlocked", blockerId, blockedId],
      queryFn: () => blocksService.isUserBlocked(blockerId, blockedId),
      enabled: !!blockerId && !!blockedId,
    });
  }

  export function useBlockActions(blockerId: string, blockedId: string) {
    const queryClient = useQueryClient();
  
    const blockMutation = useMutation({
      mutationFn: () => blocksService.blockUser(blockerId, blockedId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["isBlocked", blockerId, blockedId] });
        queryClient.invalidateQueries({ queryKey: ["blockedUsers", blockerId] });
      },
    });
  
    const unblockMutation = useMutation({
      mutationFn: () => blocksService.unblockUser(blockerId, blockedId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["isBlocked", blockerId, blockedId] });
        queryClient.invalidateQueries({ queryKey: ["blockedUsers", blockerId] });
      },
    });
  
    const toggleBlock = async () => {
      const isBlocked = queryClient.getQueryData(["isBlocked", blockerId, blockedId]);
      if (isBlocked) {
        await unblockMutation.mutateAsync();
      } else {
        await blockMutation.mutateAsync();
      }
    };
  
    return {
      isBlocking: blockMutation.isPending || unblockMutation.isPending,
      toggleBlock,
    };
  }
  
