import type { Game } from "@shared/types";
import { Card, CardBody, HStack, Heading, Image } from "@chakra-ui/react";
import noImage from "../assets/no-image-placeholder.webp";
import PlatformIconList from "./PlatformIconList";
import CriticScore from "./CriticScore";
import Emoji from "./Emoji";

interface Props {
  game: Game;
}

const GameCard = ({ game }: Props) => {
  return (
    <Card>
      <Image src={game.image ?? noImage} alt={game.name} loading="lazy" />
      <CardBody>
        <HStack justifyContent={"space-between"} marginBottom={3}>
          <PlatformIconList platforms={game.platforms} />
          {game.metascore && <CriticScore score={game.metascore} />}
        </HStack>
        <Heading fontSize="2xl">
          {game.name}
          <Emoji rating={game.ratingTop} />
        </Heading>
      </CardBody>
    </Card>
  );
};

export default GameCard;
