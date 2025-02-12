import { useMutation, useQuery } from "@tanstack/react-query";
import { EstablishmentService } from "../services/establishment.service";
import type { Establishment } from "../models/establishment";
import { queryClient } from "../utils/query.client";

const establishmentService = new EstablishmentService();

export const useGetEstablishmentById = (establishmentId: string) => {
  return useQuery({
    queryKey: ["establishment", establishmentId],
    queryFn: async () => {
      const establishment = await establishmentService.getEstablishmentById(establishmentId);
      // Check if the establishment has any posts by using postCount
      if (!establishment || establishment.postCount === 0) {
        return null;
      }
      return establishment;
    },
    enabled: !!establishmentId,
  });
};


export const useGetEstablishments = (establishmentIds: string[]) => {
  return useQuery({
    queryKey: ["establishments", establishmentIds],
    queryFn: async () => {
      const establishments = await establishmentService.getEstablishment(establishmentIds);
      // Filter out establishments with postCount of 0
      return establishments.filter(
        (establishment) => establishment.postCount > 0
      );
    },
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
    queryFn: async () => {
      const profileData = await establishmentService.getEstablishmentCardData(establishmentId);
      // Return null if postCount is 0
      if (!profileData || profileData.postCount === 0) {
        return null;
      }
      return profileData;
    },
    enabled: !!establishmentId,
  });
};


export const useGetFeaturedEstablishments = (location: string, p0: { staleTime: number; }) => {
  return useQuery({
    queryKey: ["featuredEstablishments", location],
    queryFn: async () => {
      // Fetch data from the backend
      const featuredEstablishments = await establishmentService.getFeaturedEstablishments(location);

      // Log raw results for debugging
      console.log("Raw Featured Establishments:", featuredEstablishments);

      // Deduplicate establishments by ID
      const uniqueEstablishments = Array.from(
        new Map(featuredEstablishments.map((est) => [est.id, est])).values()
      );

      // Filter establishments with postCount > 0
      const filteredEstablishments = uniqueEstablishments.filter(
        (establishment) => establishment.postCount >= 1
      );

      console.log("Filtered Establishments:", filteredEstablishments);
      return filteredEstablishments;
    },
    enabled: !!location, // Ensure query runs only if location exists
    staleTime: 0, // Always fetch fresh data
  });
};


