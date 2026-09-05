package venues

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Changing a venue and its menu.
//
// Every statement carries the owner's id and the number, so there is no
// version of any of these that reaches a row somebody else holds. The ones
// that report `:execrows` return ErrNotFound for zero — a write that matched
// nothing is not a write that succeeded.

// Text is one field in the three languages it may be typed in. Only the first
// is required: a cafe types its menu once, in the language it thinks in.
type Text struct {
	Uz string `json:"uz" maxLength:"120"`
	Ru string `json:"ru,omitempty" maxLength:"120"`
	En string `json:"en,omitempty" maxLength:"120"`
}

type VenueInput struct {
	Name         string `json:"nom" minLength:"1" maxLength:"80"`
	Kind         string `json:"turi" enum:"cafe,hotel,shop,other"`
	Hours        string `json:"ish_vaqti,omitempty" maxLength:"120"`
	Address      string `json:"manzil,omitempty" maxLength:"200"`
	Wifi         string `json:"wifi,omitempty" maxLength:"60"`
	WifiPassword string `json:"wifi_paroli,omitempty" maxLength:"60"`
}

type ItemInput struct {
	Category string `json:"bolim,omitempty" format:"uuid"`
	Name     Text   `json:"nom"`
	Note     Text   `json:"izoh,omitempty"`
	Price    int64  `json:"narx" minimum:"0" maximum:"100000000"`
}

func (s *Store) Create(ctx context.Context, handle, userID, name, kind string) (Venue, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Venue{}, ErrNotFound
	}

	row, err := s.queries.CreateVenue(ctx, store.CreateVenueParams{
		Handle: &handle, UserID: &owner, Name: name, Kind: kind,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return Venue{}, ErrNotFound
	}
	if err != nil {
		return Venue{}, err
	}
	return toVenue(row, true), nil
}

func (s *Store) Save(ctx context.Context, handle, userID string, in VenueInput) (Venue, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Venue{}, ErrNotFound
	}

	row, err := s.queries.SaveVenue(ctx, store.SaveVenueParams{
		Handle: &handle, UserID: &owner,
		Name: in.Name, Kind: in.Kind,
		Hours: optional(in.Hours), Address: optional(in.Address),
		WifiName: optional(in.Wifi), WifiPassword: optional(in.WifiPassword),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return Venue{}, ErrNotFound
	}
	if err != nil {
		return Venue{}, err
	}
	return toVenue(row, true), nil
}

func (s *Store) SetPoints(ctx context.Context, handle, userID string, points []string) (Venue, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Venue{}, ErrNotFound
	}

	row, err := s.queries.SavePoints(ctx, store.SavePointsParams{
		Handle: &handle, UserID: &owner, Points: points,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return Venue{}, ErrNotFound
	}
	if err != nil {
		return Venue{}, err
	}
	return toVenue(row, true), nil
}

// RotateStaffToken issues a new counter link and kills the old one.
//
// One statement, because the two halves of that sentence must not be able to
// happen separately: a rotation that wrote the new token and failed to drop
// the old leaves two working links, and only one of them is known about.
func (s *Store) RotateStaffToken(ctx context.Context, handle, userID string) (string, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return "", ErrNotFound
	}

	token, err := NewStaffToken()
	if err != nil {
		return "", err
	}

	issued, err := s.queries.RotateStaffToken(ctx, store.RotateStaffTokenParams{
		Handle: &handle, UserID: &owner, Token: &token,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", err
	}
	return deref(issued), nil
}

// Menyu ----------------------------------------------------------------------

func (s *Store) AddCategory(ctx context.Context, handle, userID string, name Text) (string, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return "", ErrNotFound
	}

	row, err := s.queries.AddCategory(ctx, store.AddCategoryParams{
		Handle: &handle, UserID: &owner,
		Name: name.Uz, NameRu: optional(name.Ru), NameEn: optional(name.En),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", err
	}
	return row.ID.String(), nil
}

func (s *Store) EditCategory(ctx context.Context, id uuid.UUID, userID string, name Text) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}
	return rowsOrNotFound(s.queries.EditCategory(ctx, store.EditCategoryParams{
		ID: id, UserID: &owner,
		Name: name.Uz, NameRu: optional(name.Ru), NameEn: optional(name.En),
	}))
}

func (s *Store) RemoveCategory(ctx context.Context, id uuid.UUID, userID string) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}
	return rowsOrNotFound(s.queries.RemoveCategory(ctx, store.RemoveCategoryParams{ID: id, UserID: &owner}))
}

func (s *Store) MoveCategory(ctx context.Context, id uuid.UUID, userID string, position int32) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}
	return rowsOrNotFound(s.queries.MoveCategory(ctx, store.MoveCategoryParams{
		ID: id, UserID: &owner, Position: position,
	}))
}

func (s *Store) AddItem(ctx context.Context, handle, userID string, in ItemInput) (string, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return "", ErrNotFound
	}

	row, err := s.queries.AddItem(ctx, store.AddItemParams{
		Handle: &handle, UserID: &owner,
		CategoryID: optionalUUID(in.Category),
		Name:       in.Name.Uz, NameRu: optional(in.Name.Ru), NameEn: optional(in.Name.En),
		Note: optional(in.Note.Uz), NoteRu: optional(in.Note.Ru), NoteEn: optional(in.Note.En),
		Price: in.Price,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", err
	}
	return row.ID.String(), nil
}

func (s *Store) EditItem(ctx context.Context, id uuid.UUID, userID string, in ItemInput) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}
	return rowsOrNotFound(s.queries.EditItem(ctx, store.EditItemParams{
		ID: id, UserID: &owner,
		CategoryID: optionalUUID(in.Category),
		Name:       in.Name.Uz, NameRu: optional(in.Name.Ru), NameEn: optional(in.Name.En),
		Note: optional(in.Note.Uz), NoteRu: optional(in.Note.Ru), NoteEn: optional(in.Note.En),
		Price: in.Price,
	}))
}

func (s *Store) SetItemAvailable(ctx context.Context, id uuid.UUID, userID string, available bool) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}
	return rowsOrNotFound(s.queries.SetItemAvailable(ctx, store.SetItemAvailableParams{
		ID: id, UserID: &owner, Available: available,
	}))
}

func (s *Store) SetItemPhoto(ctx context.Context, id uuid.UUID, userID, url string) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}
	return rowsOrNotFound(s.queries.SetItemPhoto(ctx, store.SetItemPhotoParams{
		ID: id, UserID: &owner, PhotoUrl: optional(url),
	}))
}

func (s *Store) MoveItem(ctx context.Context, id uuid.UUID, userID string, position int32) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}
	return rowsOrNotFound(s.queries.MoveItem(ctx, store.MoveItemParams{
		ID: id, UserID: &owner, Position: position,
	}))
}

func (s *Store) RemoveItem(ctx context.Context, id uuid.UUID, userID string) error {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return ErrNotFound
	}
	return rowsOrNotFound(s.queries.RemoveItem(ctx, store.RemoveItemParams{ID: id, UserID: &owner}))
}

// rowsOrNotFound turns "changed nothing" into an answer rather than a success.
// A write that matched no row is a write to something the caller does not own,
// or to something that is gone; both are the same 404.
func rowsOrNotFound(rows int64, err error) error {
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

func optionalUUID(raw string) *uuid.UUID {
	id, err := uuid.Parse(raw)
	if err != nil {
		return nil
	}
	return &id
}

// Item is one row, read as its owner. The join is the authorisation.
//
// Every translation comes back rather than one, because this feeds the screen
// that edits them: an editor shown one language would overwrite the other two
// with blanks the first time somebody saved.
func (s *Store) Item(ctx context.Context, id uuid.UUID, userID string) (Item, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Item{}, ErrNotFound
	}

	row, err := s.queries.MenuItem(ctx, store.MenuItemParams{ID: id, UserID: &owner})
	if errors.Is(err, pgx.ErrNoRows) {
		return Item{}, ErrNotFound
	}
	if err != nil {
		return Item{}, err
	}

	item := Item{
		ID: row.ID.String(), Name: row.Name, Note: deref(row.Note),
		Price: row.Price, Available: row.Available,
		Photo: deref(row.PhotoUrl), Position: row.Position,
		NameRu: deref(row.NameRu), NameEn: deref(row.NameEn),
		NoteRu: deref(row.NoteRu), NoteEn: deref(row.NoteEn),
	}
	if row.CategoryID != nil {
		item.Category = row.CategoryID.String()
	}
	return item, nil
}

func (s *Store) Category(ctx context.Context, id uuid.UUID, userID string) (Category, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Category{}, ErrNotFound
	}

	row, err := s.queries.MenuCategoryOwned(ctx, store.MenuCategoryOwnedParams{ID: id, UserID: &owner})
	if errors.Is(err, pgx.ErrNoRows) {
		return Category{}, ErrNotFound
	}
	if err != nil {
		return Category{}, err
	}

	return Category{
		ID: row.ID.String(), Name: row.Name, Position: row.Position,
		NameRu: deref(row.NameRu), NameEn: deref(row.NameEn),
	}, nil
}
