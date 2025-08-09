import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  authStore: any; // Will be properly typed later
}

export const LoginModal = observer(
  ({ open, onClose, authStore }: LoginModalProps) => {
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccess("");

      if (!username.trim()) {
        setError("Please enter a username");
        return;
      }

      const result = await authStore.login(username);

      if (result.success) {
        setSuccess(result.message || "Login successful!");
        setTimeout(() => {
          onClose();
          setUsername("");
          setError("");
          setSuccess("");
        }, 1500);
      } else {
        setError(result.message || "Login failed");
      }
    };

    const handleClose = () => {
      if (!authStore.isLoading) {
        onClose();
        setUsername("");
        setError("");
        setSuccess("");
      }
    };

    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={authStore.isLoading}
      >
        <DialogTitle>
          <Typography variant="h5" component="div">
            Login / Register
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your username to continue. New accounts will be created
            automatically.
          </Typography>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}

              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                required
                disabled={authStore.isLoading}
                placeholder="Enter your username"
                variant="outlined"
                autoFocus
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose} disabled={authStore.isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={authStore.isLoading || !username.trim()}
              startIcon={
                authStore.isLoading ? <CircularProgress size={20} /> : null
              }
            >
              {authStore.isLoading ? "Please wait..." : "Login"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }
);
