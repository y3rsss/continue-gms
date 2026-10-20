import { Box, Heading, Text } from "@chakra-ui/react";
import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import NavBar from "../components/NavBar";

const ErrorPage = () => {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <>
      <NavBar />
      <Box padding={5}>
        <Heading>Oops</Heading>
        <Text marginY={3}>
          {notFound ? "This page doesn't exist." : "Something went wrong."}
        </Text>
        <Link to="/">Back to all games</Link>
      </Box>
    </>
  );
};

export default ErrorPage;
