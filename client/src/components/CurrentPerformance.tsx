import {
  Cancel as CancelIcon,
  Edit as EditIcon,
  QueueMusic as QueueMusicIcon,
  Save as SaveIcon,
  SkipNext as SkipNextIcon,
} from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { useAutocomplete } from "../hooks/useAutocomplete";
import { rootStore } from "../stores/RootStore";

interface CurrentPerformanceProps {
  showId: string;
}

const CurrentPerformance: React.FC<CurrentPerformanceProps> = observer(
  ({ showId }) => {
    const { showsStore, chatStore } = rootStore;
    const [isEditing, setIsEditing] = useState(false);
    const [editSinger, setEditSinger] = useState("");
    const [editSong, setEditSong] = useState("");
    const [queueSinger, setQueueSinger] = useState("");
    const [queueSong, setQueueSong] = useState("");

    // Use autocomplete hook for song search
    const { suggestions, loading } = useAutocomplete(editSong, 500);
    const { suggestions: queueSuggestions, loading: queueLoading } =
      useAutocomplete(queueSong, 500);

    const show = showsStore.currentShow;
    const wsParticipants = chatStore.participantsByShow.get(showId) || [];
    const participants = (
      wsParticipants.length ? wsParticipants : show?.participants || []
    ).filter(Boolean);

    const handleStartEdit = () => {
      setEditSinger(show?.currentSinger || "");
      setEditSong(show?.currentSong || "");
      setIsEditing(true);
    };

    const handleSaveEdit = async () => {
      if (editSinger.trim() && editSong.trim()) {
        try {
          await showsStore.updateCurrentPerformerAPI(
            showId,
            editSinger.trim(),
            editSong.trim()
          );
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

    const handleAddToQueue = async () => {
      if (!queueSinger.trim() || !queueSong.trim()) return;
      try {
        await showsStore.addToQueue(
          showId,
          queueSinger.trim(),
          queueSong.trim()
        );
        setQueueSong("");
      } catch (e) {
        console.error("Failed to add to queue", e);
      }
    };

    const handleNext = async () => {
      try {
        await showsStore.nextPerformance(showId);
      } catch (e) {
        console.error("Failed to advance queue", e);
      }
    };

    if (!show) return null;

    const queue = (show as any).queue || [];

    return (
      <Card
        sx={{
          mb: 3,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6">Current Performance</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<SkipNextIcon />}
                onClick={handleNext}
              >
                Next
              </Button>
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
                  typeof option === "string"
                    ? option
                    : `${option.title} - ${option.artist}`
                }
                inputValue={editSong}
                onInputChange={(_, newInputValue) => setEditSong(newInputValue)}
                onChange={(_, newValue) => {
                  if (newValue && typeof newValue !== "string") {
                    // Auto-populate singer if not already set and we found a matching artist
                    if (!editSinger || editSinger === show?.currentSinger) {
                      setEditSinger(newValue.artist);
                    }
                    setEditSong(newValue.title);
                  } else if (typeof newValue === "string") {
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
                          {loading && (
                            <CircularProgress color="inherit" size={20} />
                          )}
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
                    <Box sx={{ width: "100%" }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
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
                  <Typography
                    variant="h5"
                    color="primary"
                    gutterBottom
                    sx={{ fontWeight: "bold" }}
                  >
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

          {/* Queue section */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <QueueMusicIcon fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Up Next
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
              {participants.length > 0 ? (
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel id="queue-singer-label">Singer</InputLabel>
                  <Select
                    labelId="queue-singer-label"
                    label="Singer"
                    value={queueSinger}
                    onChange={(e) => setQueueSinger(e.target.value as string)}
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
                  size="small"
                  label="Singer"
                  value={queueSinger}
                  onChange={(e) => setQueueSinger(e.target.value)}
                  sx={{ minWidth: 180 }}
                />
              )}
              <Autocomplete
                fullWidth
                freeSolo
                options={queueSuggestions}
                getOptionLabel={(option) =>
                  typeof option === "string"
                    ? option
                    : `${option.title} - ${option.artist}`
                }
                inputValue={queueSong}
                onInputChange={(_, newInputValue) =>
                  setQueueSong(newInputValue)
                }
                onChange={(_, newValue) => {
                  if (newValue && typeof newValue !== "string") {
                    // Auto-populate singer if not already set and we found a matching artist
                    if (!queueSinger) {
                      setQueueSinger(newValue.artist);
                    }
                    setQueueSong(newValue.title);
                  } else if (typeof newValue === "string") {
                    setQueueSong(newValue);
                  }
                }}
                loading={queueLoading}
                size="small"
                sx={{ flex: 1, minWidth: 220 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Song"
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {queueLoading && (
                            <CircularProgress color="inherit" size={16} />
                          )}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box sx={{ width: "100%" }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", fontSize: "0.8rem" }}
                      >
                        {option.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem" }}
                      >
                        by {option.artist}
                        {option.year && ` (${option.year})`}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
              <Button
                variant="contained"
                onClick={handleAddToQueue}
                disabled={!queueSinger.trim() || !queueSong.trim()}
              >
                Add
              </Button>
            </Box>

            {queue.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No one in queue
              </Typography>
            ) : (
              <List
                dense
                sx={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 1,
                }}
              >
                {queue.map((item: any, idx: number) => (
                  <>
                    <ListItem key={`${item.singer}-${item.song}-${idx}`}>
                      <ListItemText
                        primaryTypographyProps={{ component: "span" }}
                        secondaryTypographyProps={{ component: "span" }}
                        primary={
                          <>
                            <Typography
                              component="span"
                              variant="subtitle2"
                              sx={{ fontWeight: 600 }}
                            >
                              {item.singer}
                            </Typography>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                            >
                              {" "}
                              •{" "}
                            </Typography>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                            >
                              {item.song}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {idx < queue.length - 1 && <Divider />}
                  </>
                ))}
              </List>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }
);

export default CurrentPerformance;
