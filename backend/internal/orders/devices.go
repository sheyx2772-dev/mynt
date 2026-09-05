package orders

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

// Buying the object, and getting it to the person who bought it.
//
// The same `orders` table as buying a number, because it is the same event:
// somebody owes money and something happens when they pay. What differs is what
// happens after. A number is handed over the moment the payment lands; a ring
// has to be made and posted, and `fulfilment` is where that has got to.
//
// Everything a courier or a maker needs is written on the order rather than
// read off the profile later. An owner may change the form factor on their card
// afterwards, and what was paid for must not change with it.

var (
	// ErrUnknownDevice is a form asking for something that is not sold.
	ErrUnknownDevice = errors.New("bunday qurilma yo'q")
	// ErrWrongState is the step being refused: the order is not where the
	// caller thought it was, usually because somebody else moved it first.
	ErrWrongState = errors.New("bu qadam mumkin emas")
)

// Device is one physical order and where it has got to.
type Device struct {
	ID         string     `json:"id"`
	Handle     string     `json:"raqam"`
	DeviceType string     `json:"qurilma"`
	Design     string     `json:"dizayn,omitempty"`
	Amount     int64      `json:"summa"`
	Status     string     `json:"holat"`
	Fulfilment string     `json:"bosqich"`
	Recipient  string     `json:"kimga,omitempty"`
	Phone      string     `json:"telefon,omitempty"`
	Region     string     `json:"viloyat,omitempty"`
	Address    string     `json:"manzil,omitempty"`
	Note       string     `json:"izoh,omitempty"`
	PaidAt     *time.Time `json:"tolangan,omitempty"`
	ShippedAt  *time.Time `json:"jonatilgan,omitempty"`
	CreatedAt  time.Time  `json:"vaqt"`
}

// Delivery is where a thing is to be sent.
//
// Asked for after payment rather than before: somebody who has not paid has no
// reason to type their address, and somebody who has will not abandon the form.
// It is separate from the profile because people buy these as presents — the
// recipient is not necessarily the account holder, and defaulting to the
// account's own details is how a card ends up at the wrong address.
type Delivery struct {
	Recipient string `json:"kimga" minLength:"2" maxLength:"80"`
	Phone     string `json:"telefon" minLength:"7" maxLength:"30"`
	Region    string `json:"viloyat" minLength:"2" maxLength:"60"`
	Address   string `json:"manzil" minLength:"5" maxLength:"300"`
	Note      string `json:"izoh,omitempty" maxLength:"300"`
}

func toDevice(o store.Order) Device {
	return Device{
		ID:         o.ID.String(),
		Handle:     o.Handle,
		DeviceType: deref(o.DeviceType),
		Design:     deref(o.Design),
		Amount:     o.Amount,
		Status:     o.Status,
		Fulfilment: deref(o.Fulfilment),
		Recipient:  deref(o.Recipient),
		Phone:      deref(o.Phone),
		Region:     deref(o.Region),
		Address:    deref(o.Address),
		Note:       deref(o.DeliveryNote),
		PaidAt:     optionalTime(o.PaidAt),
		ShippedAt:  optionalTime(o.ShippedAt),
		CreatedAt:  o.CreatedAt.Time,
	}
}

func toDevices(rows []store.Order) []Device {
	out := make([]Device, 0, len(rows))
	for _, row := range rows {
		out = append(out, toDevice(row))
	}
	return out
}

// Devices lists what one buyer is waiting for, newest first.
func (s *Store) Devices(ctx context.Context, userID string) ([]Device, error) {
	owner, err := uuid.Parse(userID)
	if err != nil {
		return nil, ErrNotFound
	}

	rows, err := s.queries.DeviceOrders(ctx, owner)
	if err != nil {
		return nil, err
	}
	return toDevices(rows), nil
}

// Device reads one order as its buyer. Ownership is a filter on the read rather
// than a check after it, so a guessed id is nothing rather than forbidden.
func (s *Store) Device(ctx context.Context, id, userID string) (Device, error) {
	orderID, err := uuid.Parse(id)
	if err != nil {
		return Device{}, ErrNotFound
	}
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Device{}, ErrNotFound
	}

	row, err := s.queries.OwnDeviceOrder(ctx, store.OwnDeviceOrderParams{ID: orderID, UserID: owner})
	if errors.Is(err, pgx.ErrNoRows) {
		return Device{}, ErrNotFound
	}
	if err != nil {
		return Device{}, err
	}
	return toDevice(row), nil
}

// PlaceDevice opens an order for a thing against a number the buyer owns.
//
// The price is read from the catalogue here, never from the request. Ownership
// is a condition of the insert, so a guessed handle writes nothing.
func (s *Store) PlaceDevice(ctx context.Context, userID, handle, deviceType, design string) (Device, error) {
	price, ok := DevicePrice(deviceType)
	if !ok {
		return Device{}, ErrUnknownDevice
	}

	owner, err := uuid.Parse(userID)
	if err != nil {
		return Device{}, ErrNotFound
	}

	row, err := s.queries.PlaceDeviceOrder(ctx, store.PlaceDeviceOrderParams{
		UserID:     owner,
		Handle:     &handle,
		Amount:     price,
		DeviceType: &deviceType,
		Design:     optional(design),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return Device{}, ErrNotFound
	}
	if err != nil {
		return Device{}, err
	}
	return toDevice(row), nil
}

// SetDelivery writes the address and moves the order into the queue.
//
// One write, not two: an order that has an address but is still marked as
// needing one sits in the wrong list forever.
func (s *Store) SetDelivery(ctx context.Context, id, userID string, in Delivery) (Device, error) {
	orderID, err := uuid.Parse(id)
	if err != nil {
		return Device{}, ErrNotFound
	}
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Device{}, ErrNotFound
	}

	row, err := s.queries.SetDeliveryAddress(ctx, store.SetDeliveryAddressParams{
		ID:           orderID,
		UserID:       owner,
		Recipient:    &in.Recipient,
		Phone:        &in.Phone,
		Region:       &in.Region,
		Address:      &in.Address,
		DeliveryNote: optional(in.Note),
	})
	if errors.Is(err, pgx.ErrNoRows) {
		// Either it is not theirs, or it has already left `address_needed`.
		// Both mean the form they are looking at is out of date.
		return Device{}, ErrNotFound
	}
	if err != nil {
		return Device{}, err
	}
	return toDevice(row), nil
}

// SettleDevice pays for a device where no provider is configured.
//
// The same concession the claim flow makes: without merchant keys the site has
// to stay usable, in development and in the window before certification
// finishes. It goes through the ordinary paid path, so nothing downstream has
// to know which of the two happened.
func (s *Store) SettleDevice(ctx context.Context, id, userID string) (Device, error) {
	if !s.paid.GiveAway(s.development) {
		return Device{}, ErrCannotSell
	}

	orderID, err := uuid.Parse(id)
	if err != nil {
		return Device{}, ErrNotFound
	}
	owner, err := uuid.Parse(userID)
	if err != nil {
		return Device{}, ErrNotFound
	}

	row, err := s.queries.SettleDeviceOrder(ctx, store.SettleDeviceOrderParams{ID: orderID, UserID: owner})
	if errors.Is(err, pgx.ErrNoRows) {
		return Device{}, ErrNotFound
	}
	if err != nil {
		return Device{}, err
	}
	return toDevice(row), nil
}

// Queue is what the maker works from: paid, unfinished, oldest first.
func (s *Store) Queue(ctx context.Context) ([]Device, error) {
	rows, err := s.queries.DeviceQueue(ctx)
	if err != nil {
		return nil, err
	}
	return toDevices(rows), nil
}

// QueueSize is how many orders are waiting on somebody here, for the badge.
func (s *Store) QueueSize(ctx context.Context) (int64, error) {
	return s.queries.CountDeviceQueue(ctx)
}

// Advance moves one order along.
//
// The step is checked against the state that was read, and the write repeats
// the condition, so two people clicking at once move it one step rather than
// two.
func (s *Store) Advance(ctx context.Context, id, to string) (Device, error) {
	orderID, err := uuid.Parse(id)
	if err != nil {
		return Device{}, ErrNotFound
	}
	if _, known := nextState[to]; !known {
		return Device{}, ErrWrongState
	}

	current, err := s.queries.DeviceOrder(ctx, orderID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Device{}, ErrNotFound
	}
	if err != nil {
		return Device{}, err
	}

	from := deref(current.Fulfilment)
	if !canAdvance(from, to) {
		return Device{}, ErrWrongState
	}

	row, err := s.queries.AdvanceDeviceOrder(ctx, store.AdvanceDeviceOrderParams{
		ID: orderID, Fulfilment: &to, FromState: &from,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return Device{}, ErrWrongState
	}
	if err != nil {
		return Device{}, err
	}
	return toDevice(row), nil
}
