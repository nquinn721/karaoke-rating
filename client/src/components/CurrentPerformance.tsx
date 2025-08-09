import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { useAutocomplete } from "../hooks/useAutocomplete";
import { rootStore } from "../stores/RootStore";

interface CurrentPerformanceProps {
  showId: string;
}

const CurrentPerformance: React.FC<CurrentPerformanceProps> = observer(({ showId }) => {
  const { showsStore, chatStore } = rootStore;
  const [isEditing, setIsEditing] = useState(false);
  const [editSinger, setEditSinger] = useState("");
  const [editSong, setEditSong] = useState("");

  // Use autocomplete hook for song search
  const { suggestions, loading } = useAutocomplete(editSong, 500);

  const show = showsStore.currentShow;
  const wsParticipants = chatStore.participantsByShow.get(showId) || [];
  const participants = (wsParticipants.length ? wsParticipants : (show?.participants || [])).filter(Boolean);

  const handleStartEdit = () => {
    setEditSinger(show?.currentSinger || "");
    setEditSong(show?.currentSong || "");
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (editSinger.trim() && editSong.trim()) {
      try {
        await showsStore.updateCurrentPerformerAPI(showId, editSinger.trim(), editSong.trim());
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to update current performer:", error);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditSinger("");
    setEditSong("");
  };

  if (!show) return null;

  return (
    <Card sx={{ 
      mb: 3,
      border: "1px solid rgba(255,255,255,0.1)",
    }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">
            Current Performance
          </Typography>
          {!isEditing && (
            <IconButton 
              onClick={handleStartEdit}
              size="small"
              sx={{ color: "primary.main" }}
            >
              <EditIcon />
            </IconButton>
          )}
        </Box>

        {isEditing ? (
          <Box>
            {participants.length > 0 ? (
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="current-singer-label">Singer Name</InputLabel>
                <Select
                  labelId="current-singer-label"
                  label="Singer Name"
                  value={editSinger}
                  onChange={(e) => setEditSinger(e.target.value as string)}
                >
                  {participants.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                label="Singer Name"
                value={editSinger}
                onChange={(e) => setEditSinger(e.target.value)}
                sx={{ mb: 2 }}
                size="small"
              />
            )}

            <Autocomplete
              fullWidth
              freeSolo
              options={suggestions}
              getOptionLabel={(option) => 
                typeof option === 'string' ? option : `${option.title} - ${option.artist}`
              }
              inputValue={editSong}
              onInputChange={(_, newInputValue) => setEditSong(newInputValue)}
              onChange={(_, newValue) => {
                if (newValue && typeof newValue !== 'string') {
                  // Auto-populate singer if not already set and we found a matching artist
                  if (!editSinger || editSinger === show?.currentSinger) {
                    setEditSinger(newValue.artist);
                  }
                  setEditSong(newValue.title);
                } else if (typeof newValue === 'string') {
                  setEditSong(newValue);
                }
              }}
              loading={loading}
              sx={{ mb: 2 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Song Title"
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading && <CircularProgress color="inherit" size={20} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  helperText={
                    editSong.length < 3 
                      ? "Type at least 3 characters to search..." 
                      : suggestions.length > 0 
                        ? "Select from suggestions or type your own" 
                        : loading 
                          ? "Searching..." 
                          : "No matches found - type your own"
                  }
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {option.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      by {option.artist}
                      {option.year && ` (${option.year})`}
                      {option.album && ` • ${option.album}`}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleSaveEdit}
                disabled={!editSinger.trim() || !editSong.trim()}
                startIcon={<SaveIcon />}
                size="small"
              >
                Save
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancelEdit}
                startIcon={<CancelIcon />}
                size="small"
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {show.currentSinger ? (
              <>
                <Typography variant="h5" color="primary" gutterBottom sx={{ fontWeight: "bold" }}>
                  {show.currentSinger}
                </Typography>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  gutterBottom
                  sx={{ fontSize: "1.1rem" }}
                >
                  {show.currentSong}
                </Typography>
              </>
            ) : (
              <Typography color="text.secondary">
                No one is performing right now
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});

export default CurrentPerformance;
