import { Box, CircularProgress, Container } from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminPage from "./components/AdminPage";
import HistoryPage from "./components/HistoryPage";
import HomePage from "./components/HomePage";
import ShowPage from "./components/ShowPage";
import SnackbarProvider from "./components/SnackbarProvider";
import UsernameModal from "./components/UsernameModal";
import { rootStore } from "./stores/RootStore";

// Small wrapper to require admin access for a route
const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { authStore } = rootStore;
  if (!authStore.isAuthenticated || !authStore.user?.isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = observer(() => {
  const { userStore, showsStore, authStore } = rootStore;

  // Ensure shows load on first visit
  React.useEffect(() => {
    if (!showsStore.shows.length) {
      showsStore.fetchShows();
    }
    // Socket initialization is handled in RootStore
  }, []);

  // Show loading spinner while checking for saved authentication
  if (authStore.isInitializing) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

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
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            }
          />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>

        {!userStore.isAuthenticated && !authStore.isInitializing && (
          <UsernameModal />
        )}
      </Container>

      {/* Global Snackbar Provider */}
      <SnackbarProvider />
    </Box>
  );
});

export default App;
