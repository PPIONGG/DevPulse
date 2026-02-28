-- API Playground collections
CREATE TABLE IF NOT EXISTS api_collections (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_collections_user_id ON api_collections(user_id);

-- API Playground requests
CREATE TABLE IF NOT EXISTS api_requests (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collection_id  UUID REFERENCES api_collections(id) ON DELETE SET NULL,
    title          TEXT NOT NULL,
    method         TEXT NOT NULL DEFAULT 'GET',
    url            TEXT NOT NULL DEFAULT '',
    headers        JSONB NOT NULL DEFAULT '[]',
    query_params   JSONB NOT NULL DEFAULT '[]',
    body_type      TEXT NOT NULL DEFAULT 'none',
    body           TEXT NOT NULL DEFAULT '',
    env_vault_id   UUID REFERENCES env_vaults(id) ON DELETE SET NULL,
    sort_order     INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_requests_user_id ON api_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_api_requests_collection_id ON api_requests(collection_id);

-- API Playground request history
CREATE TABLE IF NOT EXISTS api_request_history (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id       UUID REFERENCES api_requests(id) ON DELETE SET NULL,
    method           TEXT NOT NULL,
    url              TEXT NOT NULL,
    request_headers  JSONB NOT NULL DEFAULT '[]',
    request_body     TEXT NOT NULL DEFAULT '',
    response_status  INT NOT NULL DEFAULT 0,
    response_headers JSONB NOT NULL DEFAULT '{}',
    response_body    TEXT NOT NULL DEFAULT '',
    response_size    BIGINT NOT NULL DEFAULT 0,
    response_time_ms INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_request_history_user_id ON api_request_history(user_id);
CREATE INDEX IF NOT EXISTS idx_api_request_history_request_id ON api_request_history(request_id);
CREATE INDEX IF NOT EXISTS idx_api_request_history_created_at ON api_request_history(created_at DESC);
