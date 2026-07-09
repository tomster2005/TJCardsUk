// TODO: This file contains temporary demo data for the dashboard.
// Replace with real database data when the backend is ready.

export const dashboardDemoData = {
  statCards: [
    { label: "Collection progress", value: "71%", detail: "Sets in progress and completion rate" },
    { label: "Cards owned", value: "321", detail: "Total cards currently tracked" },
    { label: "Missing cards", value: "24", detail: "Cards needed to complete tracked sets" },
  ],
  setsInProgress: [
    { title: "2024 Premier League Chrome", progress: 83, status: "15 of 18 cards owned" },
    { title: "2024 Topps Chrome", progress: 57, status: "8 of 14 cards owned" },
    { title: "2023 Prizm Premier", progress: 46, status: "7 of 15 cards owned" },
  ],
  recentCards: [
    { title: "2024 Premier League Chrome #21", subtitle: "Mohamed Salah", status: "Added 2 days ago" },
    { title: "2024 Topps Chrome #104", subtitle: "Kylian Mbappé", status: "Added 5 days ago" },
    { title: "2023 Panini Prizm #44", subtitle: "Marcus Rashford", status: "Added 1 week ago" },
  ],
  nextAction: {
    title: "Add your next missing card",
    description: "Your collection is close to completion—capture the missing card and keep the momentum going.",
    actionLabel: "Review missing cards",
  },
  overviewStats: [
    { label: "Cards owned", value: "321" },
    { label: "Missing cards", value: "24" },
    { label: "Wishlist count", value: "12" },
    { label: "Completed sets", value: "6" },
    { label: "Collection value", value: "GBP 9,240" },
  ],
  binderCompletion: 61,
};
