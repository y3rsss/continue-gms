import { Button, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import { BsChevronDown } from "react-icons/bs";
import useGameQuery from "../hooks/useGameQuery";
import usePlatforms from "../hooks/usePlatforms";

const PlatformSelector = () => {
  const { data, error } = usePlatforms();
  const { query, setQuery } = useGameQuery();
  const selected = data?.find((p) => p.slug === query.platform);

  if (error) return null;

  return (
    <Menu>
      <MenuButton as={Button} rightIcon={<BsChevronDown />}>
        {selected?.name ?? "Platforms"}
      </MenuButton>
      <MenuList>
        <MenuItem onClick={() => setQuery({ platform: undefined })}>
          All platforms
        </MenuItem>
        {data?.map((platform) => (
          <MenuItem
            onClick={() => setQuery({ platform: platform.slug })}
            key={platform.slug}
          >
            {platform.name}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default PlatformSelector;
