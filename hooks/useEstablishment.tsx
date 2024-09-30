import { useMutation, useQuery } from "@tanstack/react-query";
import { EstablishmentService } from "../services/establishment.service";
import type { Establishment } from "../models/establishment";
import { queryClient } from "../utils/query.client";

const establishmentService = new EstablishmentService();

export const useGetEstablishmentById = (establishmentId: string) => {
  return useQuery({
    queryKey: ["establishment", establishmentId],
    queryFn: () => establishmentService.getEstablishmentById(establishmentId),
    enabled: !!establishmentId,
  });
};

export const useGetEstablishments = (establishmentIds: string[]) => {
  return useQuery({
    queryKey: ["establishments", establishmentIds],
    queryFn: () => establishmentService.getEstablishments(establishmentIds),
    enabled: !!establishmentIds,
  });
};

export const useCreateEstablishment = () => {
  return useMutation({
    mutationFn: (establishment: Omit<Establishment, "id">) =>
      establishmentService.createEstablishment(establishment as Establishment),
    onSuccess: (newId, newEstablishment) => {
      queryClient.setQueryData(["establishment", newId], {
        ...(newEstablishment as Omit<Establishment, "id">),
        id: newId,
      });
      queryClient.invalidateQueries({
        queryKey: ["establishments"],
      });
    },
  });
};

export const useGetEstablishmentByAddressAndName = (
  name: string,
  address: string
) => {
  return useQuery({
    queryKey: ["establishment", { name, address }],
    queryFn: () =>
      establishmentService.getEstablishmentByNameAndAddress(name, address),
  });
};

export const useGetEstablishmentByMapboxId = (mapboxId: string) => {
  return useQuery({
    queryKey: ["establishment", { mapboxId }],
    queryFn: () => establishmentService.getEstablishmentByMapboxId(mapboxId),
    enabled: !!mapboxId,
  });
};

export const useEstablishmentProfileData = (establishmentId: string) => {
  return useQuery({
    queryKey: ["establishmentProfile", establishmentId],
    queryFn: () =>
      establishmentService.getEstablishmentCardData(establishmentId),
    enabled: !!establishmentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useGetFeaturedEstablishments = (
  location: string,
  selectedTag: string
) => {
  return useQuery({
    queryKey: ["featuredEstablishments", location, selectedTag],
    queryFn: () =>
      establishmentService.getFeaturedEstablishments(location, selectedTag),
    enabled: !!location,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
