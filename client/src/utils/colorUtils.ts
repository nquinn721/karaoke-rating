// Generate consistent colors for usernames with vibrant dark theme colors
export const getUserColor = (username: string): string => {
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
    "#88aaff", // Light blue
    "#aaff44", // Lime green
    "#ff4444", // Bright red
    "#44aaff", // Sky blue
    "#ffaa44", // Gold
    "#ff66cc", // Bright pink
    "#66ccff", // Light blue
    "#ccff66", // Light green
    "#ff6666", // Light red
    "#66ffcc", // Aqua green
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
