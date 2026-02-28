CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    duration INTEGER NOT NULL,
    target_duration INTEGER NOT NULL,
    task_label TEXT NOT NULL DEFAULT '',
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_completed_at ON pomodoro_sessions(completed_at DESC);
