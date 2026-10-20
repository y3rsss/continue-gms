import { useQuery } from "@tanstack/react-query";
import { extractSpot } from "../lib/spot";

const useSpot = (image: string | null | undefined) =>
  useQuery({
    queryKey: ["spot", image],
    queryFn: () => extractSpot(image!),
    enabled: !!image,
    staleTime: Infinity,
    retry: false,
  });

export default useSpot;
