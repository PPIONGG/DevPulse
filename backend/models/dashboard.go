package models

type DashboardStats struct {
	Snippets int `json:"snippets"`
}

type DashboardRecent struct {
	RecentSnippets []Snippet `json:"recentSnippets"`
}
