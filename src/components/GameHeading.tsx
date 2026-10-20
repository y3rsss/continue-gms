import { Heading } from "@chakra-ui/react";
import useGameQuery from "../hooks/useGameQuery";
import useGenres from "../hooks/useGenres";
import usePlatforms from "../hooks/usePlatforms";

const GameHeading = () => {
  const { query } = useGameQuery();
  const genre = useGenres().data?.find((g) => g.slug === query.genre);
  const platform = usePlatforms().data?.find((p) => p.slug === query.platform);

  const heading = query.search
    ? `Results for “${query.search}”`
    : `${platform?.name ?? ""} ${genre?.name ?? ""} Games`;

  return (
    <Heading as="h1" marginY={5} fontSize="5xl">
      {heading}
    </Heading>
  );
};

export default GameHeading;
