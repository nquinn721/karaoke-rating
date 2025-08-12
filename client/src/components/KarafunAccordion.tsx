import {
  Add as AddIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Group as GroupIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";

import { rootStore } from "../stores/RootStore";
import KarafunNameModal from "./KarafunNameModal";
import QRScanner from "./QRScanner";

interface KarafunAccordionProps {
  showId: string;
  expanded: boolean;
  onAccordionChange: (event: React.SyntheticEvent, isExpanded: boolean) => void;
}

const KarafunAccordion: React.FC<KarafunAccordionProps> = observer(
  ({ showId, expanded, onAccordionChange }) => {
    const { karafunStore, userStore } = rootStore;
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [isSubmittingUrl, setIsSubmittingUrl] = useState(false);
    const [showNameModal, setShowNameModal] = useState(false);

    // Fetch user's karafun name on component mount
    useEffect(() => {
      userStore.fetchKarafunName();
    }, [userStore]);

    // Start polling if there's an active Karafun session
    useEffect(() => {
      if (
        karafunStore.currentUrl &&
        karafunStore.currentShowId &&
        !karafunStore.isAutoPolling
      ) {
        karafunStore.startPolling();
      }

      // Cleanup: stop polling when component unmounts
      return () => {
        karafunStore.stopPolling();
      };
    }, [karafunStore.currentUrl, karafunStore.currentShowId]);

    // Show name modal if user hasn't set their karafun name and there are singers available
    useEffect(() => {
      if (
        karafunStore.songEntries.length > 0 &&
        !userStore.hasKarafunName &&
        karafunStore.uniqueSingerNames.length > 0
      ) {
        setShowNameModal(true);
      }
    }, [
      karafunStore.songEntries.length,
      userStore.hasKarafunName,
      karafunStore.uniqueSingerNames.length,
    ]);

    const getAvatarColor = (name: string) => {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const colors = [
        "#ff6b6b", // Vibrant coral
        "#4ecdc4", // Electric turquoise  
        "#00aaff", // Electric blue
        "#ffdd00", // Bright yellow
        "#00ff88", // Electric green
        "#ff44aa", // Hot pink
        "#aa44ff", // Purple
        "#ff8800", // Orange
        "#44ffaa", // Mint green
        "#ff4488", // Pink red
      ];
      return colors[Math.abs(hash) % colors.length];
    };

    const handleKarafunNameSelect = async (karafunName: string) => {
      try {
        await userStore.updateKarafunName(karafunName);
        setShowNameModal(false);
      } catch (error) {
        console.error("Failed to update karafun name:", error);
      }
    };

    const handleEditKarafunName = () => {
      setShowNameModal(true);
    };

    const handleParseQueue = async () => {
      // Use predefined URL for testing/demo purposes
      const predefinedUrl = "https://www.karafun.com/080601/";

      setIsSubmittingUrl(true);
      try {
        await karafunStore.parseQueue(predefinedUrl, showId);
      } finally {
        setIsSubmittingUrl(false);
      }
    };
    const handleClear = () => {
      karafunStore.clearQueue();
    };

    const handleRefresh = async () => {
      await karafunStore.refreshQueue();
    };

    const handleQRScan = async (url: string) => {
      setShowQRScanner(false);
      setIsSubmittingUrl(true);
      try {
        await karafunStore.parseQueue(url, showId);
      } finally {
        setIsSubmittingUrl(false);
      }
    };

    return (
      <>
        <Accordion
          expanded={expanded}
          onChange={onAccordionChange}
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
              backgroundColor: "rgba(78, 205, 196, 0.15)", // Brighter with theme color
              "&:hover": {
                backgroundColor: "rgba(78, 205, 196, 0.25)",
              },
            }}
          >
            <GroupIcon sx={{ color: "#4ecdc4", mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#4ecdc4", fontWeight: 600 }}>
              Karafun Queue Integration
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 3 }}>
            {karafunStore.loading && (
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <CircularProgress size={24} sx={{ color: "#4ecdc4" }} />
              </Box>
            )}

            {karafunStore.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {karafunStore.error}
              </Alert>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, color: "#4ecdc4" }}>
                Connect to Karafun Queue
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => setShowQRScanner(true)}
                  startIcon={<QrCodeScannerIcon />}
                  sx={{
                    borderColor: "#4ecdc4",
                    color: "#4ecdc4",
                    px: 4,
                    py: 1.5,
                    "&:hover": {
                      borderColor: "#45b7aa",
                      backgroundColor: "rgba(78, 205, 196, 0.1)",
                    },
                  }}
                >
                  Scan QR Code
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleParseQueue}
                  disabled={isSubmittingUrl}
                  startIcon={
                    isSubmittingUrl ? (
                      <CircularProgress size={16} />
                    ) : (
                      <AddIcon />
                    )
                  }
                  sx={{
                    backgroundColor: "#4ecdc4",
                    color: "black",
                    fontWeight: "bold",
                    px: 4,
                    py: 1.5,
                    "&:hover": {
                      backgroundColor: "#45b7aa",
                    },
                    "&:disabled": {
                      backgroundColor: "#666",
                      color: "#999",
                    },
                  }}
                >
                  {isSubmittingUrl ? "Parsing..." : "Demo Parse"}
                </Button>
              </Box>
            </Box>

            {karafunStore.songEntries.length > 0 && (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="subtitle1" sx={{ color: "#4ecdc4" }}>
                      Queue ({karafunStore.totalSongs} songs)
                    </Typography>
                    {userStore.hasKarafunName && (
                      <Chip
                        label={`You: ${userStore.karafunName}`}
                        size="small"
                        onClick={handleEditKarafunName}
                        clickable
                        icon={<EditIcon />}
                        sx={{
                          backgroundColor: "rgba(78, 205, 196, 0.2)",
                          color: "#4ecdc4",
                          border: "1px solid rgba(78, 205, 196, 0.3)",
                          "&:hover": {
                            backgroundColor: "rgba(78, 205, 196, 0.3)",
                          },
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Refresh queue">
                      <IconButton
                        size="small"
                        onClick={handleRefresh}
                        sx={{ color: "text.secondary" }}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                    <Button
                      size="small"
                      onClick={handleClear}
                      sx={{ color: "text.secondary" }}
                    >
                      Clear
                    </Button>
                  </Box>
                </Box>

                <Divider
                  sx={{ mb: 2, borderColor: "rgba(78, 205, 196, 0.3)" }}
                />

                <List sx={{ maxHeight: 300, overflow: "auto" }}>
                  {karafunStore.songEntries.map((entry, index) => {
                    const isUserSong = userStore.karafunName === entry.singer;
                    return (
                      <ListItem
                        key={`${entry.singer}-${entry.song}-${index}`}
                        sx={{
                          px: 2,
                          py: 1,
                          mb: 1,
                          borderRadius: 1,
                          background: isUserSong
                            ? "rgba(78, 205, 196, 0.1)"
                            : "rgba(255, 255, 255, 0.03)",
                          border: isUserSong
                            ? "1px solid rgba(78, 205, 196, 0.3)"
                            : "1px solid rgba(255, 255, 255, 0.1)",
                          "&:hover": {
                            background: isUserSong
                              ? "rgba(78, 205, 196, 0.15)"
                              : "rgba(255, 255, 255, 0.05)",
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              backgroundColor: getAvatarColor(entry.singer),
                              fontSize: "0.875rem",
                              fontWeight: 600,
                            }}
                          >
                            {entry.singer.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 500 }}
                            >
                              {entry.song}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#4ecdc4",
                                  fontWeight: 500,
                                  mb: 0.5,
                                }}
                              >
                                👤 {entry.singer}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                Position #{entry.position}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box
                          sx={{
                            minWidth: 24,
                            height: 24,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(45deg, #6c5ce7, #a29bfe)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: "white",
                              fontWeight: "bold",
                              fontSize: "0.7rem",
                            }}
                          >
                            {index + 1}
                          </Typography>
                        </Box>
                      </ListItem>
                    );
                  })}
                </List>

                {karafunStore.totalSongs === 0 && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      textAlign: "center",
                      py: 3,
                      fontStyle: "italic",
                    }}
                  >
                    No songs in queue
                  </Typography>
                )}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        <Dialog
          open={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Position the QR code in the camera view
              </Typography>
              <QRScanner onScan={handleQRScan} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowQRScanner(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        <KarafunNameModal
          open={showNameModal}
          onClose={() => setShowNameModal(false)}
          onSelect={handleKarafunNameSelect}
          availableNames={karafunStore.uniqueSingerNames}
        />
      </>
    );
  }
);

export default KarafunAccordion;
