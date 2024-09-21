import { useMutation, useQuery } from "@tanstack/react-query";
import { SaveService } from "../services/save.service";
import type { Save } from "../models/save";
import { queryClient } from "../utils/query.client";

// Create a single instance of SaveService
const saveService = new SaveService();

export const useGetUserSaves = (userId: string) => {
  return useQuery({
    queryKey: ["userSaves", userId],
    queryFn: () => saveService.getUserSaves(userId),
  });
};

export const useCreateUserSave = () => {
  return useMutation({
    mutationFn: ({ userId, save }: { userId: string; save: Save }) =>
      saveService.createSave(userId, save),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSaves"] });
      queryClient.invalidateQueries({ queryKey: ["establishments"] });
    },
  });
};

export const useDeleteUserSave = () => {
  return useMutation({
    mutationFn: ({
      userId,
      establishmentId,
    }: {
      userId: string;
      establishmentId: string;
    }) => saveService.removeSave(userId, establishmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSaves"] });
      queryClient.invalidateQueries({ queryKey: ["establishments"] });
    },
  });
};
