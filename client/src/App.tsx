import { Box, Container } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "./components/HomePage";
import ShowPage from "./components/ShowPage";
import UsernameModal from "./components/UsernameModal";
import { rootStore } from "./stores/RootStore";

const App: React.FC = observer(() => {
  const { userStore } = rootStore;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/show/:id" element={<ShowPage />} />
        </Routes>

        {!userStore.hasUsername && <UsernameModal />}
      </Container>
    </Box>
  );
});

export default App;
