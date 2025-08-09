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

interface ChangeUsernameModalProps {
  open: boolean;
  onClose: () => void;
  currentUsername: string;
  authStore: any; // Will be properly typed later
}

export const ChangeUsernameModal = observer(
  ({ open, onClose, currentUsername, authStore }: ChangeUsernameModalProps) => {
    const [newUsername, setNewUsername] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccess("");

      if (!newUsername.trim()) {
        setError("Please enter a new username");
        return;
      }

      if (newUsername.trim() === currentUsername) {
        setError("New username must be different from current username");
        return;
      }

      const result = await authStore.changeUsername(
        currentUsername,
        newUsername
      );

      if (result.success) {
        setSuccess(result.message || "Username changed successfully!");
        setTimeout(() => {
          onClose();
          setNewUsername("");
          setError("");
          setSuccess("");
        }, 2000);
      } else {
        setError(result.message || "Username change failed");
      }
    };

    const handleClose = () => {
      if (!authStore.isLoading) {
        onClose();
        setNewUsername("");
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
            Change Username
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current username: <strong>{currentUsername}</strong>
          </Typography>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}

              <TextField
                label="New Username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                fullWidth
                required
                disabled={authStore.isLoading}
                placeholder="Enter your new username"
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
              disabled={
                authStore.isLoading ||
                !newUsername.trim() ||
                newUsername.trim() === currentUsername
              }
              startIcon={
                authStore.isLoading ? <CircularProgress size={20} /> : null
              }
            >
              {authStore.isLoading ? "Changing..." : "Change Username"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }
);
