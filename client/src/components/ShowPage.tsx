import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Slider,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKeyboardAvoidance } from "../hooks/useKeyboardAvoidance";
import { rootStore } from "../stores/RootStore";
import CurrentPerformance from "./CurrentPerformance";
import KarafunAccordion from "./KarafunAccordion";
import RatingsTab from "./RatingsTab";
import UserMenu from "./UserMenu";

const ShowPage: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showsStore, chatStore, userStore, karafunStore } = rootStore;
  const [activeTab, setActiveTab] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const { dialogStyles } = useKeyboardAvoidance();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [lastReadMessageCount, setLastReadMessageCount] = useState(0);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Confirm leave dialog
  const [leaveOpen, setLeaveOpen] = useState(false);

  // Toast state for join notifications
  const [joinToastOpen, setJoinToastOpen] = useState(false);
  const [joinToastMessage, setJoinToastMessage] = useState("");
  const prevParticipantsRef = React.useRef<Set<string>>(new Set());
  const initializedRef = React.useRef(false);

  // Track if user has already rated the current performance
  const [hasUserRated, setHasUserRated] = useState(false);

  // Rating accordion and snackbar state
  const [ratingAccordionExpanded, setRatingAccordionExpanded] = useState(true);
  const [ratingSnackbarOpen, setRatingSnackbarOpen] = useState(false);
  const [ratingSnackbarMessage, setRatingSnackbarMessage] = useState("");

  // Karafun accordion state
  const [karafunAccordionExpanded, setKarafunAccordionExpanded] =
    useState(true);

  useEffect(() => {
    if (id) {
      showsStore.fetchShow(id);
      // Socket is already initialized in RootStore
      chatStore.joinShow(id, userStore.username);

      // Load cached Karafun data if it exists
      karafunStore.loadCachedData(id);

      // Initialize read message count to current count on component mount
      setLastReadMessageCount(chatStore.messages.length);
    }

    return () => {
      if (id) {
        chatStore.leaveShow(id);
        // Fire-and-forget: ask API to remove this user’s queued songs
        try {
          showsStore.removeQueueBySinger(id, userStore.username);
        } catch {}
      }
    };
  }, [id]);

  // Track unread messages
  useEffect(() => {
    const currentMessageCount = chatStore.messages.length;
    if (currentMessageCount > lastReadMessageCount) {
      setUnreadMessageCount(currentMessageCount - lastReadMessageCount);
    } else {
      setUnreadMessageCount(0);
    }
  }, [chatStore.messages.length, lastReadMessageCount]);

  const handleBackClick = () => {
    setLeaveOpen(true);
  };

  const confirmLeave = async () => {
    if (!id) return;
    // Tell server we left, then remove our queued songs
    chatStore.leaveShow(id);
    try {
      await showsStore.removeQueueBySinger(id, userStore.username);
    } catch {}
    setLeaveOpen(false);
    navigate("/");
  };

  // Detect new participants joining and show toast
  const currentParticipants =
    (id &&
      (chatStore.participantsByShow.get(id) ??
        showsStore.currentShow?.participants)) ||
    [];

  // Helper function to check if current show is a Karafun venue
  const isKarafunShow = () => {
    return showsStore.currentShow?.venue?.toLowerCase() === "karafun";
  };

  // Prefer live current performer from sockets
  const currentPerformer = useMemo(() => {
    const live = id ? chatStore.currentPerformerByShow.get(id) : undefined;

    // For Karafun shows, validate that the performer is a registered user
    if (isKarafunShow()) {
      // Get the first performer from Karafun queue data
      const firstKarafunSong = karafunStore.songEntries.find(
        (entry) => entry.position === 1
      );

      if (firstKarafunSong) {
        // Check if the Karafun nickname matches any of our registered users
        const karafunNickname = firstKarafunSong.singer;

        // Get list of participants (registered users in this show)
        const registeredUsers = Array.isArray(currentParticipants)
          ? currentParticipants
          : [];

        // Only allow rating if the Karafun nickname is one of our registered users
        const isRegisteredUser = registeredUsers.includes(karafunNickname);

        if (isRegisteredUser) {
          return {
            singer: karafunNickname,
            song: firstKarafunSong.song,
          };
        } else {
          // Karafun performer is not a registered user - no rating allowed
          console.log(
            `🚫 Karafun performer "${karafunNickname}" is not a registered user, skipping rating`
          );
          return { singer: undefined, song: undefined };
        }
      }

      // No valid Karafun performer found
      return { singer: undefined, song: undefined };
    }

    // For non-Karafun shows, use the original logic
    return {
      singer: live?.singer ?? showsStore.currentShow?.currentSinger,
      song: live?.song ?? showsStore.currentShow?.currentSong,
    } as { singer?: string; song?: string };
  }, [
    id,
    // Use the specific entry for this id instead of the entire map
    id ? chatStore.currentPerformerByShow.get(id) : undefined,
    showsStore.currentShow?.currentSinger,
    showsStore.currentShow?.currentSong,
    showsStore.currentShow?.venue,
    karafunStore.songEntries,
    currentParticipants,
  ]);

  useEffect(() => {
    const list = Array.isArray(currentParticipants) ? currentParticipants : [];
    const currSet = new Set(list);

    if (!initializedRef.current) {
      // Skip initial diff to avoid toasts on first load
      prevParticipantsRef.current = currSet;
      initializedRef.current = true;
      return;
    }

    // Find added users
    const added: string[] = [];
    for (const p of currSet) {
      if (!prevParticipantsRef.current.has(p)) added.push(p);
    }

    // Update previous set
    prevParticipantsRef.current = currSet;

    const newJoins = added.filter(
      (name) => name && name !== userStore.username
    );
    if (newJoins.length > 0) {
      const msg =
        newJoins.length === 1
          ? `${newJoins[0]} joined the show`
          : `${newJoins[0]} and ${newJoins.length - 1} other${
              newJoins.length - 1 === 1 ? "" : "s"
            } joined the show`;
      setJoinToastMessage(msg);
      setJoinToastOpen(true);
    }
  }, [id, currentParticipants, userStore.username]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatStore.messages]);

  // Handle mobile keyboard appearance
  useEffect(() => {
    const handleResize = () => {
      if (messagesEndRef.current && activeTab === 1) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab]);

  // Check if user has already rated the current performance
  useEffect(() => {
    const checkUserRating = async () => {
      if (!id || !currentPerformer.singer || !userStore.username) {
        setHasUserRated(false);
        return;
      }

      try {
        const result = await showsStore.hasUserRatedCurrentPerformance(
          id,
          userStore.username
        );
        setHasUserRated(result.hasRated);
      } catch (error) {
        console.error("Error checking if user has rated:", error);
        setHasUserRated(false);
      }
    };

    checkUserRating();
  }, [
    id,
    currentPerformer.singer,
    currentPerformer.song,
    userStore.username,
    showsStore,
  ]);

  const handleSubmitRating = async () => {
    if (
      !showsStore.currentShow ||
      !currentPerformer.singer ||
      !currentPerformer.song
    ) {
      return;
    }

    try {
      await showsStore.ratePerformance(
        showsStore.currentShow.id,
        currentPerformer.singer,
        currentPerformer.song,
        rating,
        comment,
        userStore.username
      );

      // Remove auto-advance logic - now handled by backend
      // Backend will automatically advance when all participants have rated

      // Show success notification and collapse accordion
      setRatingSnackbarMessage(
        `✨ Rating submitted! ${currentPerformer.singer} - "${currentPerformer.song}" rated ${rating}/10`
      );
      setRatingSnackbarOpen(true);
      setRatingAccordionExpanded(false);

      // Mark that user has rated this performance
      setHasUserRated(true);

      setRating(5);
      setComment("");
    } catch (error) {
      console.error("Failed to submit rating:", error);
      // Show error notification
      setRatingSnackbarMessage("❌ Failed to submit rating. Please try again.");
      setRatingSnackbarOpen(true);
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim() && id) {
      chatStore.sendMessage(id, userStore.username, chatMessage.trim());
      setChatMessage("");
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const isCurrentUser = (username: string) => username === userStore.username;

  if (!showsStore.currentShow) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h6">Loading show...</Typography>
      </Box>
    );
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // If switching to chat tab, mark messages as read
    if (newValue === 1) {
      setLastReadMessageCount(chatStore.messages.length);
      setUnreadMessageCount(0);
    }
  };

  return (
    <Box>
      {/* Clean mobile-friendly header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          gap: 1,
        }}
      >
        {/* Back button and show name */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            minWidth: 0,
            flex: 1,
            mr: 1,
          }}
        >
          <IconButton onClick={handleBackClick} sx={{ mr: 1, flexShrink: 0 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
                lineHeight: 1.2,
              }}
            >
              {showsStore.currentShow.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontSize: "0.75rem",
                fontWeight: 500,
                display: "block",
                lineHeight: 1,
              }}
            >
              {Array.isArray(currentParticipants)
                ? `${currentParticipants.filter(Boolean).length} singers`
                : "0 singers"}
              {showsStore.currentShow?.totalAttendeeCount && (
                <span style={{ marginLeft: "8px", opacity: 0.8 }}>
                  • {showsStore.currentShow.totalAttendeeCount} total attendees
                </span>
              )}
            </Typography>
          </Box>
        </Box>

        {/* User info - always horizontal */}
        <UserMenu getUserColor={getUserColor} />
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          mb: 3,
          bgcolor: "rgba(255, 255, 255, 0.02)",
          borderRadius: 2,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          overflow: "hidden",
          "& .MuiTabs-flexContainer": {
            height: "56px",
          },
          "& .MuiTab-root": {
            fontWeight: "600",
            fontSize: { xs: "0.85rem", sm: "0.95rem" },
            textTransform: "none",
            minHeight: "56px",
            borderRadius: 0,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            overflow: "hidden",
            "&:not(:last-child)": {
              borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            },
            "&:before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)",
              opacity: 0,
              transition: "opacity 0.3s ease",
            },
            "&:hover": {
              color: "primary.light",
              "&:before": {
                opacity: 1,
              },
            },
            "&.Mui-selected": {
              color: "primary.main",
              fontWeight: "700",
              background:
                "linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 107, 107, 0.05) 100%)",
              "&:before": {
                opacity: 0,
              },
            },
          },
          "& .MuiTabs-indicator": {
            height: "3px",
            borderRadius: "3px 3px 0 0",
            background: "linear-gradient(90deg, #ff6b6b 0%, #ffa726 100%)",
            boxShadow: "0 0 12px rgba(255, 107, 107, 0.4)",
          },
        }}
      >
        <Tab label="Sing" />
        <Tab
          label={
            <Badge
              badgeContent={unreadMessageCount}
              color="error"
              invisible={unreadMessageCount === 0}
            >
              Chat
            </Badge>
          }
        />
        <Tab label="Ratings" />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          {/* Current Performance Section */}
          <CurrentPerformance showId={id || ""} hasUserRated={hasUserRated} />

          {/* Karafun Queue - show for Karafun venues above rating section */}
          {isKarafunShow() && (
            <KarafunAccordion
              showId={id || ""}
              expanded={karafunAccordionExpanded}
              onAccordionChange={(_, isExpanded) =>
                setKarafunAccordionExpanded(isExpanded)
              }
            />
          )}

          {/* Show message for Karafun performers who aren't registered users */}
          {isKarafunShow() &&
            karafunStore.songEntries.length > 0 &&
            karafunStore.songEntries.find((entry) => entry.position === 1) &&
            !currentPerformer.singer && (
              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  backgroundColor: "rgba(255, 193, 7, 0.1)",
                  border: "1px solid rgba(255, 193, 7, 0.3)",
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="h6" sx={{ color: "#ffc107" }}>
                    ⚠️ Current Performer Not Registered
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 1 }}
                >
                  "
                  {
                    karafunStore.songEntries.find(
                      (entry) => entry.position === 1
                    )?.singer
                  }
                  " is currently performing, but they are not a registered user
                  in this show. You can only rate performances by registered
                  users.
                </Typography>
              </Paper>
            )}

          {/* Show message if user has already rated */}
          {currentPerformer.singer &&
            currentPerformer.singer !== userStore.username &&
            hasUserRated && (
              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  backgroundColor: "rgba(76, 175, 80, 0.1)",
                  border: "1px solid rgba(76, 175, 80, 0.3)",
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <StarIcon sx={{ color: "#4caf50" }} />
                  <Typography variant="h6" sx={{ color: "#4caf50" }}>
                    Rating Submitted
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 1 }}
                >
                  You have already rated {currentPerformer.singer} - "
                  {currentPerformer.song}". Ratings cannot be changed once
                  submitted.
                </Typography>
              </Paper>
            )}

          {/* Rating Section - only show if there's a current performance AND user is not the performer AND user hasn't rated yet */}
          {currentPerformer.singer &&
            currentPerformer.singer !== userStore.username &&
            !hasUserRated && (
              <Accordion
                expanded={ratingAccordionExpanded}
                onChange={(_, isExpanded) =>
                  setRatingAccordionExpanded(isExpanded)
                }
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <StarIcon sx={{ color: "#ffd700" }} />
                    <Typography variant="h6">Rate Performance</Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", ml: 1 }}
                    >
                      {currentPerformer.singer} - "{currentPerformer.song}"
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mt: 1 }}>
                    <Typography gutterBottom>Rating: {rating}/10</Typography>
                    <Slider
                      value={rating}
                      onChange={(_, newValue) => setRating(newValue as number)}
                      min={1}
                      max={10}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      sx={{
                        mb: 3,
                        "& .MuiSlider-thumb": {
                          backgroundColor: "primary.main",
                          "&:hover": {
                            boxShadow: "0 0 0 8px rgba(255,107,107,0.16)",
                          },
                        },
                        "& .MuiSlider-track": {
                          backgroundColor: "primary.main",
                        },
                        "& .MuiSlider-rail": {
                          opacity: 0.3,
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Comments (optional)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      sx={{ mb: 2 }}
                    />

                    <Button
                      variant="contained"
                      onClick={handleSubmitRating}
                      fullWidth
                      startIcon={<StarIcon />}
                      sx={{
                        borderRadius: 2,
                        py: 1.5,
                        background:
                          "linear-gradient(135deg, #ffd700 0%, #ffb300 100%)",
                        color: "#000",
                        fontWeight: 600,
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, #ffb300 0%, #ff8f00 100%)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(255, 215, 0, 0.3)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      Submit Rating
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

          {/* Queue Management - only show for non-Karafun venues */}
          {!isKarafunShow() && (
            <Paper
              sx={{
                p: 2,
                mb: 3,
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                Queue Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Queue management features will be available here for non-Karafun
                shows.
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {/* Clean chat container with mobile keyboard handling */}
          <Paper
            sx={{
              height: { xs: "calc(100vh - 280px)", sm: "410px" },
              mb: 2,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              bgcolor: "background.paper",
              border: "1px solid rgba(255,255,255,0.1)",
              // Ensure chat stays above keyboard on mobile
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Messages area */}
            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                p: 2,
                "&::-webkit-scrollbar": {
                  width: "4px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "transparent",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "2px",
                  "&:hover": {
                    background: "rgba(255,255,255,0.3)",
                  },
                },
              }}
            >
              {chatStore.messages.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    flexDirection: "column",
                    color: "text.secondary",
                    opacity: 0.5,
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    💬
                  </Typography>
                  <Typography variant="body2">No messages yet</Typography>
                  <Typography variant="caption">
                    Start the conversation!
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  {chatStore.messages.map((message, index) => {
                    const isOwn = isCurrentUser(message.username);
                    const userColor = getUserColor(message.username);
                    const isFirstFromUser =
                      index === 0 ||
                      chatStore.messages[index - 1].username !==
                        message.username;

                    return (
                      <Box
                        key={message.id}
                        sx={{
                          display: "flex",
                          flexDirection: isOwn ? "row-reverse" : "row",
                          alignItems: "flex-end",
                          gap: 1,
                          opacity: 0,
                          animation: "fadeInUp 0.3s ease-out forwards",
                          animationDelay: `${index * 0.05}s`,
                          "@keyframes fadeInUp": {
                            from: {
                              opacity: 0,
                              transform: "translateY(10px)",
                            },
                            to: {
                              opacity: 1,
                              transform: "translateY(0)",
                            },
                          },
                        }}
                      >
                        {/* Avatar */}
                        {!isOwn && (
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              bgcolor: userColor,
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              visibility: isFirstFromUser
                                ? "visible"
                                : "hidden",
                            }}
                          >
                            {message.username.charAt(0).toUpperCase()}
                          </Avatar>
                        )}

                        <Box
                          sx={{
                            maxWidth: "75%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isOwn ? "flex-end" : "flex-start",
                          }}
                        >
                          {/* Username for others */}
                          {isFirstFromUser && !isOwn && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: userColor,
                                fontWeight: "600",
                                mb: 0.5,
                                ml: 0.5,
                              }}
                            >
                              {message.username}
                            </Typography>
                          )}

                          {/* Message bubble */}
                          <Box
                            sx={{
                              bgcolor: isOwn
                                ? "primary.main"
                                : "background.default",
                              color: isOwn
                                ? "primary.contrastText"
                                : "text.primary",
                              px: 2,
                              py: 1.5,
                              borderRadius: 2,
                              borderTopRightRadius: isOwn ? 0.5 : 2,
                              borderTopLeftRadius: isOwn ? 2 : 0.5,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                              border: isOwn
                                ? "none"
                                : "1px solid rgba(255,255,255,0.05)",
                              position: "relative",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                wordBreak: "break-word",
                                lineHeight: 1.4,
                                mb: 0.5,
                              }}
                            >
                              {message.message}
                            </Typography>

                            <Typography
                              variant="caption"
                              sx={{
                                color: isOwn
                                  ? "rgba(255,255,255,0.8)"
                                  : "text.secondary",
                                fontSize: "0.65rem",
                                display: "block",
                                textAlign: "right",
                              }}
                            >
                              {formatTime(message.timestamp)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                  {/* Invisible scroll target */}
                  <div ref={messagesEndRef} />
                </Box>
              )}
            </Box>

            {/* Message input separator */}
            <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />
          </Paper>

          {/* Clean message input */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              p: 2,
              bgcolor: "background.paper",
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <TextField
              fullWidth
              placeholder="Type a message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              onFocus={() => {
                // Scroll to bottom when input is focused (mobile keyboard appears)
                setTimeout(() => {
                  if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({
                      behavior: "smooth",
                    });
                  }
                }, 300); // Wait for keyboard animation
              }}
              variant="outlined"
              size="small"
              inputProps={{
                enterKeyHint: "send", // Shows "Send" button on mobile keyboards
                inputMode: "text",
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 1.5,
                  bgcolor: "background.default",
                  "& fieldset": {
                    borderColor: "rgba(255,255,255,0.1)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255,255,255,0.2)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "primary.main",
                    borderWidth: "1px",
                  },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!chatMessage.trim()}
              sx={{
                minWidth: "44px",
                height: "40px",
                borderRadius: 1.5,
                "&:disabled": {
                  bgcolor: "action.disabled",
                  color: "action.disabled",
                },
              }}
            >
              <SendIcon fontSize="small" />
            </Button>
          </Box>
        </Box>
      )}

      {activeTab === 2 && <RatingsTab />}

      {/* Leave confirmation dialog */}
      <Dialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        sx={dialogStyles}
      >
        <DialogTitle>Leave this show?</DialogTitle>
        <DialogContent>
          Leaving will remove any of your queued songs.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmLeave}>
            Leave Show
          </Button>
        </DialogActions>
      </Dialog>

      {/* Join toast */}
      <Snackbar
        open={joinToastOpen}
        autoHideDuration={3000}
        onClose={() => setJoinToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setJoinToastOpen(false)}
          severity="info"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {joinToastMessage}
        </Alert>
      </Snackbar>

      {/* Rating submission toast */}
      <Snackbar
        open={ratingSnackbarOpen}
        autoHideDuration={4000}
        onClose={() => setRatingSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setRatingSnackbarOpen(false)}
          severity={ratingSnackbarMessage.includes("❌") ? "error" : "success"}
          variant="filled"
          sx={{
            width: "100%",
            "& .MuiAlert-message": {
              fontSize: "0.9rem",
              fontWeight: 500,
            },
          }}
        >
          {ratingSnackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
});

export default ShowPage;
