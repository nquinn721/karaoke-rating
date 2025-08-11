import { QueueMusic as QueueMusicIcon } from "@mui/icons-material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Tooltip,
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
    const { showsStore, chatStore, userStore } = rootStore;

    const [queueSinger, setQueueSinger] = useState(userStore.username || "");
    const [queueSong, setQueueSong] = useState("");

    // Autocomplete only for queue song
    const { suggestions: queueSuggestions, loading: queueLoading } =
      useAutocomplete(queueSong, 500);

    const show = showsStore.currentShow;
    const wsParticipants = chatStore.participantsByShow.get(showId) || [];
    const participants = (
      wsParticipants.length ? wsParticipants : show?.participants || []
    ).filter(Boolean);

    // Prefer live queue
    const liveQueue = chatStore.queueByShow.get(showId);
    const queue = liveQueue ?? ((show as any)?.queue || []);

    const [confirmOpen, setConfirmOpen] = useState<{
      open: boolean;
      index: number | null;
    }>({
      open: false,
      index: null,
    });

    const requestRemove = (index: number) =>
      setConfirmOpen({ open: true, index });
    const cancelRemove = () => setConfirmOpen({ open: false, index: null });
    const confirmRemove = async () => {
      if (confirmOpen.index == null || !show) return;
      try {
        await showsStore.removeQueueItem(show.id, confirmOpen.index);
      } catch {}
      setConfirmOpen({ open: false, index: null });
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

    const handleSetCurrent = async (singer: string, song: string) => {
      try {
        await showsStore.updateCurrentPerformerAPI(showId, singer, song);
      } catch (e) {
        console.error("Failed to set current performer", e);
      }
    };

    if (!show) return null;

    return (
      <>
        <Card
          sx={{
            mb: 3,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <CardContent>
            {/* Step 1: Add Singer */}
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 2, opacity: 0.8 }}
            >
              1. Add Singer
            </Typography>
            
            {/* Singer Selection Row */}
            <Box sx={{ 
              display: "flex", 
              gap: 1, 
              mb: 2, 
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "flex-start" }
            }}>
              {participants.length > 0 ? (
                <FormControl 
                  size="small" 
                  sx={{ 
                    flex: { xs: "1", sm: "0 0 140px" },
                    mb: { xs: 1, sm: 0 }
                  }}
                >
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
                  sx={{ 
                    flex: { xs: "1", sm: "0 0 140px" },
                    mb: { xs: 1, sm: 0 }
                  }}
                />
              )}

              <Button
                variant="outlined"
                size="small"
                onClick={() => setQueueSinger(userStore.username)}
                disabled={!userStore.username}
                sx={{ 
                  flexShrink: 0,
                  alignSelf: { xs: "center", sm: "flex-start" },
                  width: { xs: "80px", sm: "60px" },
                  mb: { xs: 1, sm: 0 }
                }}
              >
                Me
              </Button>
            </Box>

            {/* Song Selection Row */}
            <Box sx={{ 
              display: "flex", 
              gap: 1, 
              mb: 2,
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "flex-end" }
            }}>
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
                sx={{ flex: 1 }}
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
              />
              
              <Button
                variant="contained"
                onClick={handleAddToQueue}
                disabled={!queueSinger.trim() || !queueSong.trim()}
                sx={{ 
                  flexShrink: 0,
                  minWidth: { xs: "100%", sm: "80px" },
                  height: "40px" // Match input height
                }}
              >
                Add to Queue
              </Button>
            </Box>

            {/* Step 2: Queue */}
            <Box sx={{ mt: 1 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <QueueMusicIcon fontSize="small" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  2. Queue
                </Typography>
              </Box>

              {!queue || queue.length === 0 ? (
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
                    <ListItem
                      key={`${item.singer}-${item.song}-${idx}`}
                      divider={idx < queue.length - 1}
                      sx={{ 
                        pr: { xs: 1, sm: 1 },
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "flex-start", sm: "center" },
                        py: { xs: 2, sm: 1 },
                        gap: { xs: 1, sm: 0 }
                      }}
                    >
                      <ListItemText
                        sx={{ 
                          flex: 1,
                          mb: { xs: 1, sm: 0 },
                          mr: { xs: 0, sm: 2 }
                        }}
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.singer}
                          </Typography>
                        }
                        secondary={
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: { xs: "normal", sm: "nowrap" },
                              maxWidth: { xs: "none", sm: "200px" }
                            }}
                          >
                            {item.song}
                          </Typography>
                        }
                      />
                      
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          flexDirection: { xs: "row", sm: "row" },
                          width: { xs: "100%", sm: "auto" },
                          justifyContent: { xs: "space-between", sm: "flex-end" }
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleSetCurrent(item.singer, item.song)}
                          sx={{ 
                            flex: { xs: 1, sm: "0 0 auto" },
                            fontSize: { xs: "0.75rem", sm: "0.875rem" }
                          }}
                        >
                          Set Current
                        </Button>
                        <Tooltip title="Remove from queue">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => requestRemove(idx)}
                            sx={{ 
                              flexShrink: 0,
                              minWidth: { xs: "36px", sm: "auto" }
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            {/* Step 3: Current Performance */}
            {/* Step 3: Next */}
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 1, opacity: 0.8 }}
              >
                3. Next
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={handleNext}
                disabled={!queue || queue.length === 0}
              >
                Next
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Remove confirmation */}
        <Dialog open={confirmOpen.open} onClose={cancelRemove}>
          <DialogTitle>Remove from queue?</DialogTitle>
          <DialogContent>
            This will remove the selected song from the queue.
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelRemove}>Cancel</Button>
            <Button color="error" variant="contained" onClick={confirmRemove}>
              Remove
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
);

export default CurrentPerformance;
