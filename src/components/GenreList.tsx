import {
  Button,
  HStack,
  Heading,
  Image,
  List,
  ListItem,
  Spinner,
} from "@chakra-ui/react";
import noImage from "../assets/no-image-placeholder.webp";
import useGameQuery from "../hooks/useGameQuery";
import useGenres from "../hooks/useGenres";

const GenreList = () => {
  const { data, isPending, error } = useGenres();
  const { query, setQuery } = useGameQuery();

  if (error) return null;

  if (isPending) return <Spinner />;

  return (
    <>
      <Heading fontSize="2xl" marginBottom={3}>
        Genres
      </Heading>
      <List>
        {data.map((genre) => {
          const selected = genre.slug === query.genre;
          return (
            <ListItem key={genre.slug} paddingY="5px">
              <HStack>
                <Image
                  boxSize="32px"
                  borderRadius={8}
                  objectFit="cover"
                  src={genre.image ?? noImage}
                  alt=""
                />
                <Button
                  whiteSpace="normal"
                  textAlign="left"
                  fontWeight={selected ? "bold" : "normal"}
                  aria-pressed={selected}
                  onClick={() => setQuery({ genre: selected ? undefined : genre.slug })}
                  fontSize="lg"
                  variant="link"
                >
                  {genre.name}
                </Button>
              </HStack>
            </ListItem>
          );
        })}
      </List>
    </>
  );
};

export default GenreList;
