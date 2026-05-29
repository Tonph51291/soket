import { useQuery } from "@tanstack/react-query";
import { listUser } from "../services";

export const useListQuery = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: listUser,
    select: (response) => (Array.isArray(response?.data) ? response.data : []),
  });
};
