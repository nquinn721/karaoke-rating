// Generate consistent colors for usernames
export const getUserColor = (username: string): string => {
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

// Format time for chat messages
export const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Check if a username is the current user
export const isCurrentUser = (
  username: string,
  currentUsername: string
): boolean => {
  return username === currentUsername;
};
