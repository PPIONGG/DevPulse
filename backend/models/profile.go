package models

import "github.com/google/uuid"

type Profile struct {
	ID          uuid.UUID `json:"id"`
	DisplayName *string   `json:"display_name"`
	AvatarURL   *string   `json:"avatar_url"`
	Email       *string   `json:"email"`
}

type ProfileUpdate struct {
	DisplayName *string `json:"display_name"`
	AvatarURL   *string `json:"avatar_url"`
}
