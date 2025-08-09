import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { rootStore } from "../stores/RootStore";

const UsernameModal: React.FC = observer(() => {
  const { userStore } = rootStore;
  const [username, setUsername] = useState("");

  const handleSubmit = () => {
    if (username.trim()) {
      userStore.setUsername(username.trim());
    }
  };

  return (
    <Dialog open={true} maxWidth="sm" fullWidth>
      <DialogTitle>Welcome to Karaoke Ratings!</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Please enter your username to continue:
        </Typography>
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
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!username.trim()}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default UsernameModal;
