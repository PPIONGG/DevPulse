package models

type DashboardStats struct {
	Snippets int `json:"snippets"`
	Expenses int `json:"expenses"`
	Habits   int `json:"habits"`
	Boards   int `json:"boards"`
}

type DashboardRecent struct {
	RecentSnippets []Snippet `json:"recentSnippets"`
}
