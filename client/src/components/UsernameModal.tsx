import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { rootStore } from "../stores/RootStore";

const UsernameModal: React.FC = observer(() => {
  const { authStore } = rootStore;
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (username.trim()) {
      setError("");
      const result = await authStore.login(username.trim());
      if (!result.success) {
        setError(result.message || "Login failed");
      }
    }
  };

  return (
    <Dialog open={true} maxWidth="sm" fullWidth>
      <DialogTitle>Welcome to Karaoke Ratings!</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Please enter your username to continue:
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          autoFocus
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            }
          }}
          disabled={authStore.isLoading}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!username.trim() || authStore.isLoading}
          startIcon={authStore.isLoading ? <CircularProgress size={20} /> : null}
        >
          {authStore.isLoading ? "Signing in..." : "Continue"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default UsernameModal;
