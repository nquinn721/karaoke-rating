import { QueueMusic as QueueMusicIcon } from "@mui/icons-material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
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
import React, { useMemo, useState } from "react";
import { useAutocomplete } from "../hooks/useAutocomplete";
import { rootStore } from "../stores/RootStore";
import QueueOrderModal from "./QueueOrderModal";

interface CurrentPerformanceProps {
  showId: string;
  hasUserRated?: boolean;
}

const CurrentPerformance: React.FC<CurrentPerformanceProps> = observer(
  ({ showId, hasUserRated = false }) => {
    const { showsStore, chatStore, userStore } = rootStore;

    const [queueSinger, setQueueSinger] = useState(userStore.username || "");
    const [queueSong, setQueueSong] = useState("");
    const [queueOrderModalOpen, setQueueOrderModalOpen] = useState(false);

    // Autocomplete only for queue song
    const { suggestions: queueSuggestions, loading: queueLoading } =
      useAutocomplete(queueSong, 500);

    const show = showsStore.currentShow;
    const wsParticipants = chatStore.participantsByShow.get(showId) || [];
    const participants = (
      wsParticipants.length ? wsParticipants : show?.participants || []
    ).filter(Boolean);

    // Get current performer info to determine if user has an active rating session
    const currentPerformer = useMemo(() => {
      const live = showId
        ? chatStore.currentPerformerByShow.get(showId)
        : undefined;
      return {
        singer: live?.singer ?? show?.currentSinger,
        song: live?.song ?? show?.currentSong,
      } as { singer?: string; song?: string };
    }, [
      showId,
      // Use the specific entry for this showId instead of the entire map
      showId ? chatStore.currentPerformerByShow.get(showId) : undefined,
      show?.currentSinger,
      show?.currentSong,
    ]);

    // Auto-manage accordion state based on rating session
    const hasActiveRatingSession =
      currentPerformer.singer &&
      currentPerformer.singer !== userStore.username &&
      !hasUserRated; // Only consider it an active session if user hasn't rated yet
    const [manuallyExpanded, setManuallyExpanded] = useState<boolean | null>(
      null
    );

    // Determine accordion state: closed if user has rating session, otherwise use manual state or default open
    const addSingerExpanded = hasActiveRatingSession
      ? false
      : (manuallyExpanded ?? true);

    const queue = useMemo(() => {
      const wsQueue = chatStore.queueByShow.get(showId);
      return wsQueue || show?.queue || [];
    }, [chatStore.queueByShow, showId, show?.queue]);

    const [confirmOpen, setConfirmOpen] = useState<{
      open: boolean;
      index: number | null;
    }>({
      open: false,
      index: null,
    });

    // Manual accordion control (overrides auto behavior when user clicks)
    const handleAccordionChange = (
      _: React.SyntheticEvent,
      isExpanded: boolean
    ) => {
      setManuallyExpanded(isExpanded);
    };

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

    // Generate consistent colors for usernames (same as HistoryPage)
    const getUserColor = (username: string) => {
      const colors = [
        "#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#6c5ce7",
        "#a29bfe", "#fd79a8", "#00b894", "#e17055", "#74b9ff",
        "#55a3ff", "#26de81", "#fc5c65", "#fed330"
      ];

      let hash = 0;
      for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    return (
      <>
        <Accordion
          expanded={addSingerExpanded}
          onChange={handleAccordionChange}
          sx={{
            mb: 3,
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 2,
            "&:before": {
              display: "none",
            },
            "& .MuiAccordionSummary-root": {
              borderRadius: 2,
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: "rgba(255,255,255,0.05)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.08)",
              },
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Queue Management
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* Step 1: Add Singer */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, opacity: 0.8 }}
              >
                1. Add Singer
              </Typography>
              {queue && queue.length > 1 && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setQueueOrderModalOpen(true)}
                  sx={{
                    fontSize: "0.75rem",
                    py: 0.5,
                    px: 1.5,
                    borderRadius: 1.5,
                  }}
                >
                  Order Singers
                </Button>
              )}
            </Box>

            {/* Singer Selection Row */}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                mb: 2,
                flexDirection: { xs: "row", sm: "row" },
                alignItems: { xs: "center", sm: "flex-start" },
              }}
            >
              {participants.length > 0 ? (
                <FormControl
                  size="small"
                  sx={{
                    flex: 1,
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
                  sx={{ flex: 1 }}
                />
              )}

              <Button
                variant="outlined"
                size="small"
                onClick={() => setQueueSinger(userStore.username)}
                disabled={!userStore.username}
                sx={{
                  flexShrink: 0,
                  minWidth: "60px",
                }}
              >
                Me
              </Button>
            </Box>

            {/* Song Selection Row */}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                mb: 3,
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "stretch", sm: "flex-end" },
              }}
            >
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
                  minWidth: { xs: "100%", sm: "120px" },
                  height: "40px", // Match input height
                }}
              >
                Add to Queue
              </Button>
            </Box>

            {/* Step 2: Queue */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <QueueMusicIcon fontSize="small" />
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, opacity: 0.8 }}
                >
                  2. Queue
                </Typography>
              </Box>

              {!queue || queue.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 2 }}
                >
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
                        gap: { xs: 1, sm: 0 },
                      }}
                    >
                      <ListItemText
                        sx={{
                          flex: 1,
                          mb: { xs: 1, sm: 0 },
                          mr: { xs: 0, sm: 2 },
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
                              maxWidth: { xs: "none", sm: "200px" },
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
                          justifyContent: {
                            xs: "space-between",
                            sm: "flex-end",
                          },
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            handleSetCurrent(item.singer, item.song)
                          }
                          sx={{
                            flex: { xs: 1, sm: "0 0 auto" },
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
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
                              minWidth: { xs: "36px", sm: "auto" },
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

            {/* Step 3: Next */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 2, opacity: 0.8 }}
              >
                3. Next
              </Typography>

              {/* Current Singer Display */}
              {currentPerformer.singer && (
                <Box
                  sx={{
                    p: 2,
                    mb: 2,
                    backgroundColor: "rgba(255, 215, 0, 0.1)",
                    border: "1px solid rgba(255, 215, 0, 0.3)",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "#ffd700", fontWeight: 600, display: "block" }}
                  >
                    CURRENTLY SINGING
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "text.primary" }}
                  >
                    {currentPerformer.singer}
                  </Typography>
                  {currentPerformer.song && (
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      "{currentPerformer.song}"
                    </Typography>
                  )}
                </Box>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={handleNext}
                disabled={!queue || queue.length === 0}
                size="large"
              >
                Next
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>

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

        {/* Queue Order Modal */}
        <QueueOrderModal
          open={queueOrderModalOpen}
          onClose={() => setQueueOrderModalOpen(false)}
          showId={showId}
          getUserColor={getUserColor}
        />
      </>
    );
  }
);

export default CurrentPerformance;
