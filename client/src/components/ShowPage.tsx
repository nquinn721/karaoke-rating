import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Paper,
  Slider,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { rootStore } from "../stores/RootStore";
import CurrentPerformance from "./CurrentPerformance";
import RatingsTab from "./RatingsTab";

const ShowPage: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showsStore, chatStore, userStore } = rootStore;
  const [activeTab, setActiveTab] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [chatMessage, setChatMessage] = useState("");

  useEffect(() => {
    if (id) {
      showsStore.fetchShow(id);
      chatStore.initializeSocket();
      chatStore.joinShow(id, userStore.username);
    }

    return () => {
      if (id) {
        chatStore.leaveShow(id);
      }
    };
  }, [id]);

  const handleSubmitRating = async () => {
    if (
      !showsStore.currentShow ||
      !showsStore.currentShow.currentSinger ||
      !showsStore.currentShow.currentSong
    ) {
      return;
    }

    try {
      await showsStore.ratePerformance(
        showsStore.currentShow.id,
        showsStore.currentShow.currentSinger,
        showsStore.currentShow.currentSong,
        rating,
        comment,
        userStore.username
      );
      setRating(5);
      setComment("");
    } catch (error) {
      console.error("Failed to submit rating:", error);
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
          <IconButton
            onClick={() => navigate("/")}
            sx={{ mr: 1, flexShrink: 0 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
            }}
          >
            {showsStore.currentShow.name}
          </Typography>
        </Box>

        {/* User info - always horizontal */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <Avatar
            sx={{
              width: { xs: 24, sm: 28 },
              height: { xs: 24, sm: 28 },
              bgcolor: getUserColor(userStore.username),
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
              mr: 1,
            }}
          >
            {userStore.username.charAt(0).toUpperCase()}
          </Avatar>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              whiteSpace: "nowrap",
            }}
          >
            {userStore.username}
          </Typography>
        </Box>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        sx={{
          mb: 3,
          "& .MuiTab-root": {
            fontWeight: "600",
            fontSize: { xs: "0.8rem", sm: "0.9rem" },
            textTransform: "none",
            minHeight: { xs: "44px", sm: "48px" },
            "&.Mui-selected": {
              color: "primary.main",
            },
          },
          "& .MuiTabs-indicator": {
            height: "2px",
            borderRadius: "1px",
            backgroundColor: "primary.main",
          },
        }}
      >
        <Tab label="Rating" />
        <Tab label="Chat" />
        <Tab label="Ratings History" />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          {/* Current Performance Section */}
          <CurrentPerformance showId={id || ""} />

          {/* Rating Section - only show if there's a current performance */}
          {showsStore.currentShow.currentSinger && (
            <Card
              sx={{
                mb: 3,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Rate This Performance
                </Typography>
                <Box sx={{ mt: 2 }}>
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
                    sx={{
                      borderRadius: 2,
                    }}
                  >
                    Submit Rating
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {/* Clean chat container */}
          <Paper
            sx={{
              height: "450px",
              mb: 2,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              bgcolor: "background.paper",
              border: "1px solid rgba(255,255,255,0.1)",
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
              variant="outlined"
              size="small"
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
    </Box>
  );
});

export default ShowPage;
