import { Input, InputGroup, InputLeftElement } from "@chakra-ui/react";
import { BsSearch } from "react-icons/bs";
import useGameQuery from "../hooks/useGameQuery";

const SearchInput = () => {
  const { query, setQuery } = useGameQuery();

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const search = new FormData(event.currentTarget).get("search");
        setQuery({ search: String(search ?? "").trim() });
      }}
    >
      <InputGroup>
        <InputLeftElement children={<BsSearch />} />
        <Input
          // remount on URL change (e.g. back button) to sync the value
          key={query.search}
          name="search"
          defaultValue={query.search}
          borderRadius={20}
          placeholder="Search games..."
          variant="filled"
        />
      </InputGroup>
    </form>
  );
};

export default SearchInput;
