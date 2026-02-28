package models

type DashboardStats struct {
	Snippets        int     `json:"snippets"`
	Expenses        int     `json:"expenses"`
	Habits          int     `json:"habits"`
	Boards          int     `json:"boards"`
	MonthlyExpenses float64 `json:"monthlyExpenses"`
	HabitsToday     int     `json:"habitsToday"`
	HabitsCompleted int     `json:"habitsCompleted"`
}

type DashboardRecent struct {
	RecentSnippets []Snippet      `json:"recentSnippets"`
	UpcomingTasks  []KanbanCard   `json:"upcomingTasks"`
	TodayHabits    []Habit        `json:"todayHabits"`
	DailyChallenge *SqlChallenge  `json:"dailyChallenge,omitempty"`
}
