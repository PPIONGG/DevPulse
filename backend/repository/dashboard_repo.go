package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/thammasornlueadtaharn/devpulse-backend/models"
)

type DashboardRepo struct {
	snippets    *SnippetRepo
	expenses    *ExpenseRepo
	habits      *HabitRepo
	kanban      *KanbanRepo
	sqlPractice *SqlPracticeRepo
}

func NewDashboardRepo(s *SnippetRepo, e *ExpenseRepo, h *HabitRepo, k *KanbanRepo, sql *SqlPracticeRepo) *DashboardRepo {
	return &DashboardRepo{snippets: s, expenses: e, habits: h, kanban: k, sqlPractice: sql}
}

func (r *DashboardRepo) Stats(ctx context.Context, userID uuid.UUID) (*models.DashboardStats, error) {
	sc, _ := r.snippets.CountByUser(ctx, userID)
	ec, _ := r.expenses.CountByUser(ctx, userID)
	hc, _ := r.habits.CountByUser(ctx, userID)
	bc, _ := r.kanban.CountBoards(ctx, userID)
	mt, _ := r.expenses.MonthlyTotal(ctx, userID)
	ht, hcomp, _ := r.habits.GetTodayStats(ctx, userID)

	return &models.DashboardStats{
		Snippets:        sc,
		Expenses:        ec,
		Habits:          hc,
		Boards:          bc,
		MonthlyExpenses: mt,
		HabitsToday:     ht,
		HabitsCompleted: hcomp,
	}, nil
}

func (r *DashboardRepo) Recent(ctx context.Context, userID uuid.UUID) (*models.DashboardRecent, error) {
	snippets, _ := r.snippets.RecentByUser(ctx, userID, 5)
	tasks, _ := r.kanban.GetUpcomingTasks(ctx, userID, 5)
	todayHabits, _ := r.habits.ListTodayActive(ctx, userID)
	dailyChallenge, _ := r.sqlPractice.GetChallengeByDay(ctx)

	return &models.DashboardRecent{
		RecentSnippets: snippets,
		UpcomingTasks:  tasks,
		TodayHabits:    todayHabits,
		DailyChallenge: dailyChallenge,
	}, nil
}
