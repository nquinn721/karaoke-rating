import { Close as CloseIcon, Star as StarIcon } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { rootStore } from "../stores/RootStore";

interface UserHistoryModalProps {
  open: boolean;
  onClose: () => void;
  username: string;
}

interface UserHistoryItem {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  singer: string;
  song: string;
  showName: string;
  ratedBy: string;
}

const UserHistoryModal: React.FC<UserHistoryModalProps> = observer(
  ({ open, onClose, username }) => {
    const { showsStore } = rootStore;
    const [history, setHistory] = useState<UserHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      if (open && username) {
        fetchUserHistory();
      }
    }, [open, username]);

    const fetchUserHistory = async () => {
      setLoading(true);
      try {
        const data = await showsStore.getUserHistory(username);
        // Ensure data is always an array
        const historyArray = Array.isArray(data) ? data : [];
        setHistory(historyArray);
      } catch (error) {
        console.error("Error fetching user history:", error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    const getRatingColor = (rating: number) => {
      if (rating >= 9) return "#4caf50"; // Green
      if (rating >= 7) return "#8bc34a"; // Light green
      if (rating >= 5) return "#ffc107"; // Yellow
      if (rating >= 3) return "#ff9800"; // Orange
      return "#f44336"; // Red
    };

    const getUserAvatar = (username: string) => {
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

      let hash = 0;
      for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    // Calculate statistics
    const historyArray = Array.isArray(history) ? history : [];
    const totalRatings = historyArray.length;

    const ratingsGiven = historyArray.filter(
      (item) => item.ratedBy === username
    ).length;
    const ratingsReceived = historyArray.filter(
      (item) => item.singer === username
    ).length;

    // Rating distribution for ratings given by this user
    const ratingDistribution = Array.from({ length: 10 }, (_, i) => {
      const rating = i + 1;
      const givenRatings = historyArray.filter(
        (item) => item.ratedBy === username
      );
      const count = givenRatings.filter((r) => r.rating === rating).length;
      const percentage = ratingsGiven > 0 ? (count / ratingsGiven) * 100 : 0;
      return { rating, count, percentage };
    }).reverse();

    const mostRatedSong = historyArray
      .filter((item) => item.singer === username)
      .reduce(
        (acc, item) => {
          acc[item.song] = (acc[item.song] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    const topSong = Object.entries(mostRatedSong).sort(
      ([, a], [, b]) => b - a
    )[0];

    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            border: "1px solid rgba(255,255,255,0.1)",
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: getUserAvatar(username),
                fontSize: "1.2rem",
                fontWeight: 600,
              }}
            >
              {username.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {username}'s Rating History
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalRatings} total ratings • {ratingsGiven} given •{" "}
                {ratingsReceived} received
              </Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {loading ? (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2, textAlign: "center" }}
              >
                Loading rating history...
              </Typography>
            </Box>
          ) : historyArray.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <StarIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No rating history found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {username} hasn't participated in any ratings yet
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* Statistics Cards */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Card
                  sx={{
                    bgcolor: "rgba(33, 150, 243, 0.1)",
                    border: "1px solid rgba(33, 150, 243, 0.3)",
                  }}
                >
                  <CardContent sx={{ py: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: "#2196f3", fontWeight: 600 }}
                    >
                      RATINGS GIVEN
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {ratingsGiven}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Avg:{" "}
                      {ratingsGiven > 0
                        ? (
                            historyArray
                              .filter((item) => item.ratedBy === username)
                              .reduce((sum, item) => sum + item.rating, 0) /
                            ratingsGiven
                          ).toFixed(1)
                        : "0.0"}
                      ★
                    </Typography>
                  </CardContent>
                </Card>

                {ratingsReceived > 0 && (
                  <Card
                    sx={{
                      bgcolor: "rgba(76, 175, 80, 0.1)",
                      border: "1px solid rgba(76, 175, 80, 0.3)",
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#4caf50", fontWeight: 600 }}
                      >
                        AVERAGE RECEIVED
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: "#4caf50" }}
                      >
                        {(
                          historyArray
                            .filter((item) => item.singer === username)
                            .reduce((sum, item) => sum + item.rating, 0) /
                          ratingsReceived
                        ).toFixed(1)}
                        ★
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        from {ratingsReceived} performances
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                {topSong && (
                  <Card
                    sx={{
                      bgcolor: "rgba(255, 215, 0, 0.1)",
                      border: "1px solid rgba(255, 215, 0, 0.3)",
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#ffd700", fontWeight: 600 }}
                      >
                        MOST PERFORMED
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      >
                        {topSong[0]}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {topSong[1]} time{topSong[1] !== 1 ? "s" : ""}
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                {ratingsGiven > 0 && (
                  <Card
                    sx={{
                      bgcolor: "rgba(33, 150, 243, 0.1)",
                      border: "1px solid rgba(33, 150, 243, 0.3)",
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#2196f3", fontWeight: 600 }}
                      >
                        AVERAGE GIVEN
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: "#2196f3" }}
                      >
                        {(
                          historyArray
                            .filter((item) => item.ratedBy === username)
                            .reduce((sum, item) => sum + item.rating, 0) /
                          ratingsGiven
                        ).toFixed(1)}
                        ★
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        from {ratingsGiven} ratings given
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Box>

              {/* Rating Distribution (if user has given ratings) */}
              {ratingsGiven > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Rating Distribution (Given)
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {ratingDistribution.map((dist) => (
                        <Box
                          key={dist.rating}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ width: 30, textAlign: "right", mr: 2 }}
                          >
                            {dist.rating}★
                          </Typography>
                          <Box sx={{ flex: 1, mr: 2 }}>
                            <LinearProgress
                              variant="determinate"
                              value={dist.percentage}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: "rgba(255,255,255,0.1)",
                                "& .MuiLinearProgress-bar": {
                                  bgcolor: getRatingColor(dist.rating),
                                },
                              }}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{ width: 40, color: "text.secondary" }}
                          >
                            {dist.count}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity
                  </Typography>
                  {historyArray
                    .slice()
                    .reverse()
                    .slice(0, 20)
                    .map((item, index) => (
                      <Box key={item.id}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 2,
                            py: 2,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor:
                                item.singer === username
                                  ? "#4caf50"
                                  : "#2196f3",
                              fontSize: "0.8rem",
                            }}
                          >
                            {item.singer === username ? "🎤" : "⭐"}
                          </Avatar>

                          <Box sx={{ flex: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              {item.singer === username ? (
                                <Typography variant="body2">
                                  <strong>Performed:</strong> {item.song}
                                </Typography>
                              ) : (
                                <Typography variant="body2">
                                  <strong>Rated:</strong> {item.singer} -{" "}
                                  {item.song}
                                </Typography>
                              )}
                              <Chip
                                size="small"
                                label={`${item.rating}/10`}
                                sx={{
                                  bgcolor: getRatingColor(item.rating),
                                  color: "white",
                                  fontWeight: "bold",
                                  fontSize: "0.7rem",
                                  height: 20,
                                }}
                              />
                            </Box>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {item.showName} •{" "}
                              {new Date(item.createdAt).toLocaleDateString()}
                              {item.singer === username &&
                                ` • Rated by ${item.ratedBy}`}
                            </Typography>

                            {item.comment && (
                              <Paper
                                sx={{
                                  p: 1,
                                  mt: 1,
                                  bgcolor: "background.default",
                                  border: "1px solid",
                                  borderColor: "divider",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontStyle: "italic",
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  "{item.comment}"
                                </Typography>
                              </Paper>
                            )}
                          </Box>
                        </Box>
                        {index < Math.min(historyArray.length - 1, 19) && (
                          <Divider />
                        )}
                      </Box>
                    ))}
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    );
  }
);

export default UserHistoryModal;
