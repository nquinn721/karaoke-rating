import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { useKeyboardAvoidance } from "../hooks/useKeyboardAvoidance";
import { FeedbackType } from "../stores/FeedbackStore";
import { rootStore } from "../stores/RootStore";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = observer(
  ({ open, onClose }) => {
    const { feedbackStore, userStore } = rootStore;
    const [type, setType] = useState<FeedbackType>(FeedbackType.GENERAL);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const { dialogStyles } = useKeyboardAvoidance();

    const handleSubmit = async () => {
      if (!subject.trim() || !message.trim()) {
        setError("Please fill in all required fields");
        return;
      }

      try {
        await feedbackStore.submitFeedback({
          username: userStore.username,
          type,
          subject: subject.trim(),
          message: message.trim(),
        });

        setSuccess(true);
        setError("");

        // Reset form after a delay
        setTimeout(() => {
          handleClose();
        }, 2000);
      } catch (err) {
        setError("Failed to submit feedback. Please try again.");
        console.error("Feedback submission error:", err);
      }
    };

    const handleClose = () => {
      setType(FeedbackType.GENERAL);
      setSubject("");
      setMessage("");
      setError("");
      setSuccess(false);
      onClose();
    };

    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth sx={dialogStyles}>
        <DialogTitle>
          <Typography variant="h6" component="div" color="primary">
            Send Feedback
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Help us improve the karaoke experience!
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ mt: 1 }}>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Thank you for your feedback! We'll review it soon.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mt: "5px", mb: 2 }}>
            <InputLabel>Feedback Type</InputLabel>
            <Select
              value={type}
              label="Feedback Type"
              onChange={(e) => setType(e.target.value as FeedbackType)}
            >
              <MenuItem value={FeedbackType.BUG}>🐛 Bug Report</MenuItem>
              <MenuItem value={FeedbackType.FEATURE}>
                ✨ Feature Request
              </MenuItem>
              <MenuItem value={FeedbackType.IMPROVEMENT}>
                🔧 Improvement
              </MenuItem>
              <MenuItem value={FeedbackType.GENERAL}>
                💬 General Feedback
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your feedback"
            sx={{ mb: 2 }}
            required
          />

          <TextField
            fullWidth
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please provide details about your feedback..."
            multiline
            rows={4}
            required
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Submitted as: {userStore.username}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={feedbackStore.isLoading || success}
            startIcon={
              feedbackStore.isLoading ? <CircularProgress size={16} /> : null
            }
          >
            {feedbackStore.isLoading ? "Sending..." : "Send Feedback"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

export default FeedbackModal;
