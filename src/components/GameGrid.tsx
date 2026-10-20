import { useEffect, useRef } from "react";
import { Box, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import useGameQuery from "../hooks/useGameQuery";
import useGames from "../hooks/useGames";
import GameCard from "./GameCard";
import GameCardSkeleton from "./GameCardSkeleton";
import GameCardContainer from "./GameCardContainer";

const skeletons = Array.from({ length: 12 }, (_, i) => i);

const GameGrid = () => {
  const { query } = useGameQuery();
  const { data, error, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGames(query);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinel.current;
    if (!element || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "800px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (error) return <Text padding="10px">{error.message}</Text>;

  const games = data?.pages.flatMap((page) => page.results) ?? [];
  if (!isPending && games.length === 0)
    return <Text padding="10px">No games match these filters.</Text>;

  return (
    <Box padding="10px">
      <SimpleGrid columns={{ sm: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
        {isPending &&
          skeletons.map((skeleton) => (
            <GameCardContainer key={skeleton}>
              <GameCardSkeleton />
            </GameCardContainer>
          ))}
        {games.map((game) => (
          <GameCardContainer key={game.id}>
            <GameCard game={game} />
          </GameCardContainer>
        ))}
      </SimpleGrid>
      <Box ref={sentinel} display="flex" justifyContent="center" padding={6}>
        {isFetchingNextPage && <Spinner />}
      </Box>
    </Box>
  );
};

export default GameGrid;
