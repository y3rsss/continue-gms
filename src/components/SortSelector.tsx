import { Button, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import { BsChevronDown } from "react-icons/bs";
import { SORT_OPTIONS, type SortOption } from "@shared/types";
import useGameQuery from "../hooks/useGameQuery";

const SortSelector = () => {
  const { query, setQuery } = useGameQuery();

  return (
    <Menu>
      <MenuButton as={Button} rightIcon={<BsChevronDown />}>
        Order by: {SORT_OPTIONS[query.sort ?? "relevance"]}
      </MenuButton>
      <MenuList>
        {Object.entries(SORT_OPTIONS).map(([value, label]) => (
          <MenuItem
            key={value}
            onClick={() =>
              setQuery({ sort: value === "relevance" ? undefined : (value as SortOption) })
            }
          >
            {label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default SortSelector;
