import {
  Star as StarIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React from "react";
import { rootStore } from "../stores/RootStore";
import { Rating } from "../stores/types";

const RatingsTab: React.FC = observer(() => {
  const { showsStore } = rootStore;

  if (!showsStore.currentShow) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h6">No show selected</Typography>
      </Box>
    );
  }

  const ratings = showsStore.currentShow.ratings;

  // Calculate statistics
  const totalRatings = ratings.length;
  const averageRating =
    totalRatings > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(
          1
        )
      : "0.0";

  // Rating distribution (1-10 scale)
  const ratingDistribution = Array.from({ length: 10 }, (_, i) => {
    const rating = i + 1;
    const count = ratings.filter((r) => r.rating === rating).length;
    const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
    return { rating, count, percentage };
  }).reverse(); // Show 10 to 1

  // Get unique performers with their average ratings
  const performerStats = ratings.reduce(
    (acc, rating) => {
      const key = `${rating.singer}-${rating.song}`;
      if (!acc[key]) {
        acc[key] = {
          singer: rating.singer,
          song: rating.song,
          ratings: [],
          totalRating: 0,
          count: 0,
        };
      }
      acc[key].ratings.push(rating);
      acc[key].totalRating += rating.rating;
      acc[key].count += 1;
      return acc;
    },
    {} as Record<string, any>
  );

  const performerList = Object.values(performerStats)
    .map((performer: any) => ({
      ...performer,
      averageRating: (performer.totalRating / performer.count).toFixed(1),
    }))
    .sort((a: any, b: any) => b.averageRating - a.averageRating);

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "#4caf50"; // Green
    if (rating >= 6) return "#ff9800"; // Orange
    if (rating >= 4) return "#f44336"; // Red
    return "#9e9e9e"; // Grey
  };

  const getRatingIcon = (current: number, previous?: number) => {
    if (!previous) return null;
    if (current > previous)
      return <TrendingUpIcon sx={{ fontSize: 16, color: "success.main" }} />;
    if (current < previous)
      return <TrendingDownIcon sx={{ fontSize: 16, color: "error.main" }} />;
    return null;
  };

  return (
    <Box>
      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: "center" }}>
            <CardContent>
              <Typography
                variant="h4"
                color="primary"
                sx={{ fontWeight: "bold" }}
              >
                {totalRatings}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Ratings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: "center" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.5,
                }}
              >
                <StarIcon sx={{ color: "#ffd700", fontSize: "1.5rem" }} />
                <Typography
                  variant="h4"
                  color="primary"
                  sx={{ fontWeight: "bold" }}
                >
                  {averageRating}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Average Rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: "center" }}>
            <CardContent>
              <Typography
                variant="h4"
                color="primary"
                sx={{ fontWeight: "bold" }}
              >
                {performerList.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Performances
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: "center" }}>
            <CardContent>
              <Typography
                variant="h4"
                color="primary"
                sx={{ fontWeight: "bold" }}
              >
                {performerList.length > 0
                  ? performerList[0].averageRating
                  : "0.0"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Top Rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Rating Distribution */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Rating Distribution
          </Typography>
          <Box sx={{ mt: 2 }}>
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <Box
                key={rating}
                sx={{ display: "flex", alignItems: "center", mb: 1 }}
              >
                <Box sx={{ minWidth: 30 }}>
                  <Typography variant="body2" color="text.secondary">
                    {rating}★
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, mx: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "rgba(255,255,255,0.1)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: getRatingColor(rating),
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 50 }}>
                  <Typography variant="body2" color="text.secondary">
                    {count} ({percentage.toFixed(0)}%)
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Top Performers */}
      {performerList.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Rankings
            </Typography>
            <Box sx={{ mt: 2 }}>
              {performerList.map((performer: any, index: number) => (
                <Box key={`${performer.singer}-${performer.song}`}>
                  <Box sx={{ display: "flex", alignItems: "center", py: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        minWidth: 60,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color:
                            index === 0
                              ? "#ffd700"
                              : index === 1
                                ? "#c0c0c0"
                                : index === 2
                                  ? "#cd7f32"
                                  : "text.secondary",
                          fontWeight: "bold",
                          mr: 1,
                        }}
                      >
                        #{index + 1}
                      </Typography>
                      {getRatingIcon(
                        performer.averageRating,
                        index > 0
                          ? performerList[index - 1].averageRating
                          : undefined
                      )}
                    </Box>

                    <Box sx={{ flex: 1, mx: 2 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold" }}
                      >
                        {performer.singer}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {performer.song}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        size="small"
                        label={`${performer.averageRating}★`}
                        sx={{
                          bgcolor: getRatingColor(performer.averageRating),
                          color: "white",
                          fontWeight: "bold",
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        ({performer.count} rating
                        {performer.count !== 1 ? "s" : ""})
                      </Typography>
                    </Box>
                  </Box>
                  {index < performerList.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Recent Ratings History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Ratings
          </Typography>
          {ratings.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ textAlign: "center", py: 3 }}
            >
              No ratings yet. Be the first to rate a performance!
            </Typography>
          ) : (
            <Box>
              {ratings
                .slice()
                .reverse()
                .slice(0, 20) // Show last 20 ratings
                .map((rating: Rating) => (
                  <Box key={rating.id} sx={{ mb: 2 }}>
                    <Box
                      sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}
                    >
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: "primary.main",
                          fontSize: "0.9rem",
                        }}
                      >
                        {rating.ratedBy.charAt(0).toUpperCase()}
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
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: "bold" }}
                          >
                            {rating.singer}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            •
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {rating.song}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Chip
                            size="small"
                            label={`${rating.rating}/10`}
                            sx={{
                              bgcolor: getRatingColor(rating.rating),
                              color: "white",
                              fontWeight: "bold",
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            by {rating.ratedBy}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            • {new Date(rating.createdAt).toLocaleString()}
                          </Typography>
                        </Box>

                        {rating.comment && (
                          <Paper
                            sx={{
                              p: 1.5,
                              bgcolor: "background.default",
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontStyle: "italic" }}
                            >
                              "{rating.comment}"
                            </Typography>
                          </Paper>
                        )}
                      </Box>
                    </Box>
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
});

export default RatingsTab;
