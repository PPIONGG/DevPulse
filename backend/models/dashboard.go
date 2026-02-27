package models

type DashboardStats struct {
	Snippets  int `json:"snippets"`
	WorkLogs  int `json:"workLogs"`
	Articles  int `json:"articles"`
	Bookmarks int `json:"bookmarks"`
}

type DashboardRecent struct {
	RecentSnippets []Snippet `json:"recentSnippets"`
	RecentWorkLogs []WorkLog `json:"recentWorkLogs"`
	WeeklyHours    float64   `json:"weeklyHours"`
}
