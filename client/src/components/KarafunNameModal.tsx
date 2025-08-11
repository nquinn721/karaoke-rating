import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

interface KarafunNameModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (karafunName: string) => void;
  availableNames: string[];
  currentSelection?: string;
}

const KarafunNameModal: React.FC<KarafunNameModalProps> = ({
  open,
  onClose,
  onSelect,
  availableNames,
  currentSelection,
}) => {
  const [selectedName, setSelectedName] = useState(currentSelection || "");

  const handleSave = () => {
    if (selectedName) {
      onSelect(selectedName);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedName(currentSelection || "");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Match Your Karafun Name
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Select your name from the Karafun queue to match your songs
        </Typography>
      </DialogTitle>
      <DialogContent>
        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={selectedName}
            onChange={(e) => setSelectedName(e.target.value)}
            sx={{ mt: 1 }}
          >
            {availableNames.map((name) => (
              <FormControlLabel
                key={name}
                value={name}
                control={<Radio />}
                label={
                  <Typography
                    variant="body1"
                    sx={{
                      wordBreak: "break-word",
                      maxWidth: "400px",
                    }}
                  >
                    {name}
                  </Typography>
                }
                sx={{ mb: 1 }}
              />
            ))}
            <FormControlLabel
              value=""
              control={<Radio />}
              label={
                <Typography variant="body1" color="text.secondary">
                  None of these (I'm not in the queue yet)
                </Typography>
              }
            />
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={selectedName === currentSelection}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KarafunNameModal;
