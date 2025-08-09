import {
  Add as AddIcon,
  Mic as MicIcon,
  QrCodeScanner as QrCodeScannerIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { rootStore } from "../stores/RootStore";
import QRScanner from "./QRScanner";
import UserMenu from "./UserMenu";

const HomePage: React.FC = observer(() => {
  const { showsStore, userStore } = rootStore;
  const navigate = useNavigate();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalTab, setAddModalTab] = useState(0);
  const [newShowName, setNewShowName] = useState("");
  const [newShowVenue, setNewShowVenue] = useState<
    "karafun" | "excess" | "dj steve"
  >("karafun");
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  // Debug logging
  React.useEffect(() => {
    console.log("HomePage rendering:", {
      showsStore: !!showsStore,
      shows: showsStore?.shows,
      showsLength: showsStore?.shows?.length,
    });
  }, [showsStore?.shows]);

  useEffect(() => {
    console.log("Fetching shows...");
    showsStore.fetchShows();
  }, []);

  // Always use a safe array to avoid undefined.length errors
  const showsSafe = Array.isArray(showsStore.shows) ? showsStore.shows : [];
  // Prefer live shows from websocket when available
  const showsLive =
    rootStore.chatStore.liveShows?.length > 0
      ? rootStore.chatStore.liveShows
      : showsSafe;

  const handleCreateShow = async () => {
    if (newShowName.trim()) {
      try {
        const newShow = await showsStore.createShow(
          newShowName.trim(),
          newShowVenue
        );
        setAddModalOpen(false);
        setNewShowName("");
        setNewShowVenue("karafun");
        navigate(`/show/${newShow.id}`);
      } catch (error) {
        console.error("Failed to create show:", error);
      }
    }
  };

  const handleJoinShow = async (showId: string) => {
    try {
      // Join via REST (persists/returns updated show)
      await showsStore.joinShow(showId, userStore.username);
      // Join via WebSocket (auto-leaves any previous show)
      rootStore.chatStore.joinShow(showId, userStore.username);
      navigate(`/show/${showId}`);
    } catch (error) {
      console.error("Failed to join show:", error);
    }
  };

  const handleQRScanned = (data: string) => {
    // Assuming QR code contains show ID
    handleJoinShow(data);
    setAddModalOpen(false);
  };

  // Generate consistent colors for usernames
  const getUserColor = (username: string) => {
    const colors = [
      "#ff6b6b", // Coral red
      "#4ecdc4", // Turquoise
      "#45b7d1", // Sky blue
      "#f9ca24", // Yellow
      "#6c5ce7", // Purple
      "#a29bfe", // Light purple
      "#fd79a8", // Pink
      "#00b894", // Green
      "#e17055", // Orange
      "#74b9ff", // Light blue
      "#55a3ff", // Blue
      "#26de81", // Light green
      "#fc5c65", // Red
      "#fed330", // Amber
    ];

    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <Box>
      {/* Polished, mobile-friendly header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: { xs: 2, sm: 3 },
          p: { xs: 1.25, sm: 2 },
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(135deg, rgba(255,107,107,0.12) 0%, rgba(162,155,254,0.10) 50%, rgba(78,205,196,0.10) 100%)",
          backdropFilter: "blur(4px)",
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontWeight: 800,
            letterSpacing: -0.5,
            lineHeight: 1.2,
            fontSize: { xs: "1.6rem", sm: "2.25rem" },
            background: "linear-gradient(90deg, #ff6b6b, #a29bfe, #4ecdc4)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Karaoke Shows
        </Typography>
        <UserMenu
          getUserColor={getUserColor}
          onUsernameChange={() => {
            setUsernameInput(userStore.username);
            setUsernameModalOpen(true);
          }}
        />
      </Box>

      {/* Etched Microphone Background - shows when no shows exist */}
      {showsSafe.length === 0 && (
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: -1,
            opacity: 0.03,
            color: "text.secondary",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <MicIcon
            sx={{
              fontSize: "50rem", // Very large size
              filter: "drop-shadow(0 0 20px rgba(255,255,255,0.1))",
            }}
          />
        </Box>
      )}

      {showsLive.length === 0 ? (
        <Box
          sx={{
            minHeight: "55vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Card
            sx={{
              maxWidth: 700,
              width: "100%",
              textAlign: "center",
              p: { xs: 2, sm: 3 },
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <MicIcon sx={{ fontSize: 64, opacity: 0.5 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                No shows yet
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Create a new karaoke show for your venue or join one instantly
                by scanning a QR code.
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="contained"
                  onClick={() => {
                    setAddModalOpen(true);
                    setAddModalTab(0);
                  }}
                >
                  Create a Show
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<QrCodeScannerIcon />}
                  onClick={() => {
                    setAddModalOpen(true);
                    setAddModalTab(1);
                  }}
                >
                  Join by QR
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {showsLive.map((show) => {
            const isInThisShow = rootStore.chatStore.currentShowId === show.id;
            const liveParticipants = rootStore.chatStore.participantsByShow.get(
              show.id
            );
            const participantCount =
              liveParticipants?.length ?? show.participants?.length ?? 0;

            return (
              <Grid item xs={12} sm={6} md={4} key={show.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {show.name}
                    </Typography>
                    <Chip label={show.venue} color="secondary" sx={{ mb: 2 }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {participantCount} participant(s)
                    </Typography>
                    {show.currentSinger && (
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        Now: {show.currentSinger} - {show.currentSong}
                      </Typography>
                    )}

                    {
                      isInThisShow ? (
                        <Chip
                          label="You're in this show"
                          color="success"
                          variant="outlined"
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleJoinShow(show.id)}
                        >
                          Join Show
                        </Button>
                      )
                      /* <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => handleJoinShow(show.id)}
                      sx={{
                        borderColor: isInThisShow ? "transparent" : "primary.main",
                        color: isInThisShow ? "success.main" : "inherit",
                        position: "relative",
                        overflow: "hidden",
                        "&:after": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          background:
                            "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)",
                          opacity: isInThisShow ? 1 : 0,
                          transition: "opacity 0.3s ease",
                        },
                      }}
                    >
                      {isInThisShow ? "Joined" : "Join Show"}
                    </Button> */
                    }
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "fixed",
          bottom: { xs: 20, sm: 16 },
          right: { xs: 20, sm: 16 },
          zIndex: 1000,
        }}
        onClick={() => setAddModalOpen(true)}
      >
        <AddIcon />
      </Fab>

      <Dialog
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Show</DialogTitle>
        <DialogContent>
          <Tabs
            value={addModalTab}
            onChange={(_, newValue) => setAddModalTab(newValue)}
          >
            <Tab label="Create New" />
            <Tab label="Join by QR" />
          </Tabs>

          {addModalTab === 0 && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Show Name"
                value={newShowName}
                onChange={(e) => setNewShowName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && newShowName.trim()) {
                    e.preventDefault();
                    handleCreateShow();
                  }
                }}
                sx={{ mb: 2 }}
                autoFocus
              />
              <FormControl fullWidth>
                <InputLabel>Venue</InputLabel>
                <Select
                  value={newShowVenue}
                  label="Venue"
                  onChange={(e) => setNewShowVenue(e.target.value as any)}
                >
                  <MenuItem value="karafun">KaraFun</MenuItem>
                  <MenuItem value="excess">Excess</MenuItem>
                  <MenuItem value="dj steve">DJ Steve</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          {addModalTab === 1 && (
            <Box sx={{ mt: 2 }}>
              <QRScanner onScan={handleQRScanned} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddModalOpen(false)}>Cancel</Button>
          {addModalTab === 0 && (
            <Button
              onClick={handleCreateShow}
              variant="contained"
              disabled={!newShowName.trim()}
            >
              Create Show
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Username change dialog */}
      <Dialog
        open={usernameModalOpen}
        onClose={() => setUsernameModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Change Username</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUsernameModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!usernameInput.trim()}
            onClick={() => {
              const name = usernameInput.trim();
              userStore.setUsername(name);
              rootStore.chatStore.updateUsername(name);
              setUsernameModalOpen(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default HomePage;
