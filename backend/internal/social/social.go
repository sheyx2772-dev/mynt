// Package social is what happens around a profile: who looked at it, who
// follows it, who vouches for it, who said something, and what its owner
// posted.
//
// One package because they share a shape. Every read joins through `handles`,
// so who may see a thing and who may change it are decided in SQL rather than
// checked in Go afterwards — a comment on a profile with comments closed comes
// back as no rows, not as a row the page then hides.
package social

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/sheyx2772-dev/flex/backend/internal/store"
)

type Store struct {
	pool    *pgxpool.Pool
	queries *store.Queries
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool, queries: store.New(pool)}
}

// Visit is one look at a profile, as much of it as is worth keeping.
//
// The visitor is a hash rather than an address: the owner needs to know how
// many people rather than which, and a raw IP in a table is a record of where
// somebody was.
type Visit struct {
	Handle       string
	VisitorHash  string
	ReferrerHost string
	Source       string
}

// View records a look and bumps the counter the profile page shows.
//
// Two statements rather than one, and deliberately not in a transaction:
// analytics must never be the reason a profile fails to load, so each is
// allowed to fail on its own.
func (s *Store) View(ctx context.Context, v Visit) {
	_ = s.queries.RecordView(ctx, store.RecordViewParams{
		Handle:       v.Handle,
		VisitorHash:  optional(v.VisitorHash),
		ReferrerHost: optional(v.ReferrerHost),
		Source:       optional(v.Source),
	})
	_ = s.queries.BumpViewCount(ctx, &v.Handle)
}

// Click records a tap on one of the profile's links.
func (s *Store) Click(ctx context.Context, handle, label, visitorHash string) {
	_ = s.queries.RecordClick(ctx, store.RecordClickParams{
		Handle: handle, Label: label, VisitorHash: optional(visitorHash),
	})
}

// Obunalar -------------------------------------------------------------------

func (s *Store) IsFollowing(ctx context.Context, userID, handle string) bool {
	id, err := uuid.Parse(userID)
	if err != nil {
		return false
	}
	yes, err := s.queries.IsFollowing(ctx, store.IsFollowingParams{UserID: id, Handle: handle})
	return err == nil && yes
}

// SetFollowing turns following on or off and answers with the state it reached,
// so a client that pressed the button twice does not have to ask again.
func (s *Store) SetFollowing(ctx context.Context, userID, handle string, on bool) (bool, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return false, err
	}

	if on {
		err = s.queries.Follow(ctx, store.FollowParams{UserID: id, Handle: handle})
	} else {
		err = s.queries.Unfollow(ctx, store.UnfollowParams{UserID: id, Handle: handle})
	}
	return on, err
}

// FollowState is where a reader stands with a number: following it, waiting to
// be let in, or neither.
type FollowState string

const (
	FollowStateNone      FollowState = "yoq"
	FollowStateFollowing FollowState = "obuna"
	FollowStatePending   FollowState = "kutilmoqda"
)

// Ask follows an open number and asks to follow a closed one, and answers with
// where the reader now stands. The distinction is made here, from the stored
// row, so a client cannot follow a closed profile by calling the open path.
//
// A request that was refused stays refused: the insert reports `rad`, and
// that is answered as "none" — the asker is not told they were turned down,
// because being told is a nudge to try from another account.
func (s *Store) Ask(ctx context.Context, userID, handle string) (FollowState, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return FollowStateNone, err
	}

	private, err := s.queries.IsPrivate(ctx, optional(handle))
	if err != nil {
		// No claimed row: nothing to follow. Reported as none rather than as
		// an error, so an unclaimed number and a refused one read alike.
		return FollowStateNone, nil
	}
	if !private {
		if err := s.queries.Follow(ctx, store.FollowParams{UserID: id, Handle: handle}); err != nil {
			return FollowStateNone, err
		}
		return FollowStateFollowing, nil
	}

	holat, err := s.queries.RequestFollow(ctx, store.RequestFollowParams{UserID: id, Handle: handle})
	if err != nil {
		return FollowStateNone, err
	}
	switch holat {
	case "qabul":
		return FollowStateFollowing, nil
	case "kutilmoqda":
		return FollowStatePending, nil
	default:
		return FollowStateNone, nil
	}
}

// Leave stops following and withdraws any request still waiting.
func (s *Store) Leave(ctx context.Context, userID, handle string) error {
	id, err := uuid.Parse(userID)
	if err != nil {
		return err
	}
	if err := s.queries.Unfollow(ctx, store.UnfollowParams{UserID: id, Handle: handle}); err != nil {
		return err
	}
	return s.queries.WithdrawFollowRequest(ctx, store.WithdrawFollowRequestParams{UserID: id, Handle: handle})
}

// State answers where a reader stands, for the page that draws the button.
func (s *Store) State(ctx context.Context, userID, handle string) FollowState {
	if s.IsFollowing(ctx, userID, handle) {
		return FollowStateFollowing
	}
	id, err := uuid.Parse(userID)
	if err != nil {
		return FollowStateNone
	}
	holat, err := s.queries.FollowRequestState(ctx, store.FollowRequestStateParams{UserID: id, Handle: handle})
	if err == nil && holat == "kutilmoqda" {
		return FollowStatePending
	}
	return FollowStateNone
}

// FollowRequest is somebody waiting at the door of a closed profile.
type FollowRequest struct {
	UserID string    `json:"foydalanuvchi"`
	Handle string    `json:"raqam,omitempty"`
	Name   string    `json:"ism,omitempty"`
	Avatar string    `json:"rasm,omitempty"`
	Asked  time.Time `json:"sorlagan"`
}

// PendingRequests is the owner's inbox for one of their numbers. Ownership is
// in the query: somebody else's number yields nothing.
func (s *Store) PendingRequests(ctx context.Context, ownerID, handle string, limit int32) ([]FollowRequest, error) {
	id, err := uuid.Parse(ownerID)
	if err != nil {
		return nil, err
	}
	rows, err := s.queries.PendingFollowRequests(ctx, store.PendingFollowRequestsParams{
		OwnerID: &id, Handle: handle, PageSize: limit,
	})
	if err != nil {
		return nil, err
	}
	out := make([]FollowRequest, 0, len(rows))
	for _, r := range rows {
		out = append(out, FollowRequest{
			UserID: r.RequesterUserID.String(),
			Handle: deref(r.AskerHandle),
			Name:   deref(r.AskerName),
			Avatar: deref(r.AskerAvatar),
			Asked:  r.CreatedAt.Time,
		})
	}
	return out, nil
}

// CountPending is the badge on the owner's number.
func (s *Store) CountPending(ctx context.Context, ownerID, handle string) int64 {
	id, err := uuid.Parse(ownerID)
	if err != nil {
		return 0
	}
	n, err := s.queries.CountPendingFollowRequests(ctx, store.CountPendingFollowRequestsParams{OwnerID: &id, Handle: handle})
	if err != nil {
		return 0
	}
	return n
}

// Decide is the owner's answer to one request. Accepting writes the follow,
// which is what moves the follower count, in the same transaction as the mark
// — so a request cannot be accepted without the follow existing, or the
// follow exist without the request being closed.
func (s *Store) Decide(ctx context.Context, ownerID, handle, requesterID string, accept bool) (bool, error) {
	owner, err := uuid.Parse(ownerID)
	if err != nil {
		return false, err
	}
	asker, err := uuid.Parse(requesterID)
	if err != nil {
		return false, err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx)
	q := s.queries.WithTx(tx)

	holat := "rad"
	if accept {
		holat = "qabul"
	}
	n, err := q.DecideFollowRequest(ctx, store.DecideFollowRequestParams{
		Holat: holat, OwnerID: &owner, Handle: handle, RequesterID: asker,
	})
	if err != nil {
		return false, err
	}
	if n == 0 {
		// Not the owner, not pending, or never asked: the same nothing.
		return false, nil
	}
	if accept {
		if err := q.Follow(ctx, store.FollowParams{UserID: asker, Handle: handle}); err != nil {
			return false, err
		}
	}
	return true, tx.Commit(ctx)
}

func (s *Store) CountFollowing(ctx context.Context, userID string) int64 {
	id, err := uuid.Parse(userID)
	if err != nil {
		return 0
	}
	n, err := s.queries.CountFollowing(ctx, id)
	if err != nil {
		return 0
	}
	return n
}

// Tavsiyalar -----------------------------------------------------------------

// Recommender is somebody who vouched, by their own number.
type Recommender struct {
	Handle string `json:"raqam"`
	Name   string `json:"ism"`
}

func (s *Store) IsRecommended(ctx context.Context, userID, handle string) bool {
	id, err := uuid.Parse(userID)
	if err != nil {
		return false
	}
	yes, err := s.queries.IsRecommended(ctx, store.IsRecommendedParams{UserID: id, Handle: &handle})
	return err == nil && yes
}

// SetRecommended vouches or withdraws, and answers with the count so the page
// does not need a second request to redraw the number beside the button.
func (s *Store) SetRecommended(ctx context.Context, userID, handle string, on bool) (bool, int64, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return false, 0, err
	}

	if on {
		err = s.queries.Recommend(ctx, store.RecommendParams{UserID: id, Handle: &handle})
	} else {
		err = s.queries.Unrecommend(ctx, store.UnrecommendParams{UserID: id, Handle: &handle})
	}
	if err != nil {
		return false, 0, err
	}

	count, err := s.queries.CountRecommendations(ctx, &handle)
	return on, count, err
}

func (s *Store) Recommenders(ctx context.Context, handle string, limit int32) ([]Recommender, error) {
	rows, err := s.queries.Recommenders(ctx, store.RecommendersParams{Handle: &handle, PageSize: limit})
	if err != nil {
		return nil, err
	}

	out := make([]Recommender, 0, len(rows))
	for _, row := range rows {
		out = append(out, Recommender{
			Handle: deref(row.Normalized),
			Name:   firstNonEmpty(deref(row.OwnerName), deref(row.Normalized)),
		})
	}
	return out, nil
}

// Izohlar --------------------------------------------------------------------

// Comment is one thing somebody said on a profile.
type Comment struct {
	ID     int64     `json:"id"`
	Handle string    `json:"muallif_raqami,omitempty"`
	Name   string    `json:"muallif"`
	Body   string    `json:"matn"`
	At     time.Time `json:"vaqt"`
	// Whether the reader wrote it, so the client knows to offer a delete
	// without being told who the author is.
	Mine bool `json:"meniki"`
}

func (s *Store) Comments(ctx context.Context, handle, viewerID string, limit int32) ([]Comment, error) {
	rows, err := s.queries.Comments(ctx, store.CommentsParams{Handle: &handle, PageSize: limit})
	if err != nil {
		return nil, err
	}

	out := make([]Comment, 0, len(rows))
	for _, row := range rows {
		out = append(out, Comment{
			ID:     row.ID,
			Handle: deref(row.AuthorHandle),
			// A commenter with no profile of their own is shown as the brand
			// rather than as a blank or an id.
			Name: firstNonEmpty(deref(row.AuthorName), deref(row.AuthorHandle), "Flex"),
			Body: row.Body,
			At:   row.CreatedAt.Time,
			Mine: viewerID != "" && row.AuthorID.String() == viewerID,
		})
	}
	return out, nil
}

// AddComment writes one, or reports that the profile is not taking them.
func (s *Store) AddComment(ctx context.Context, handle, userID, body string) error {
	id, err := uuid.Parse(userID)
	if err != nil {
		return err
	}
	_, err = s.queries.AddComment(ctx, store.AddCommentParams{
		Handle: &handle, AuthorID: id, Body: body,
	})
	return err
}

// DeleteComment removes one if the reader is its author or the profile's owner.
// Returns whether a row went, so a request that matched nothing is not
// reported as success.
func (s *Store) DeleteComment(ctx context.Context, commentID int64, userID string) (bool, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return false, err
	}
	n, err := s.queries.DeleteComment(ctx, store.DeleteCommentParams{ID: commentID, UserID: id})
	return n > 0, err
}

// Postlar --------------------------------------------------------------------

// Post is something an owner wrote on their own profile.
type Post struct {
	ID     string    `json:"id"`
	Handle string    `json:"raqam"`
	Body   string    `json:"matn"`
	At     time.Time `json:"vaqt"`
	Name   string    `json:"ism,omitempty"`
	Avatar string    `json:"rasm,omitempty"`
}

func (s *Store) PostsFor(ctx context.Context, handle string, limit int32) ([]Post, error) {
	rows, err := s.queries.PostsForHandle(ctx, store.PostsForHandleParams{Handle: handle, PageSize: limit})
	if err != nil {
		return nil, err
	}

	out := make([]Post, 0, len(rows))
	for _, row := range rows {
		out = append(out, Post{
			ID: row.ID.String(), Handle: row.Handle, Body: row.Body,
			At: row.CreatedAt.Time, Name: deref(row.OwnerName), Avatar: deref(row.AvatarUrl),
		})
	}
	return out, nil
}

// Feed is what the numbers somebody follows have posted.
func (s *Store) Feed(ctx context.Context, userID string, limit int32) ([]Post, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, err
	}

	rows, err := s.queries.Feed(ctx, store.FeedParams{UserID: id, PageSize: limit})
	if err != nil {
		return nil, err
	}

	out := make([]Post, 0, len(rows))
	for _, row := range rows {
		out = append(out, Post{
			ID: row.ID.String(), Handle: row.Handle, Body: row.Body,
			At: row.CreatedAt.Time, Name: deref(row.OwnerName), Avatar: deref(row.AvatarUrl),
		})
	}
	return out, nil
}

func optional(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

// Writing a post, and taking one down.

// PostsPerHour is a generous ceiling that still stops a script filling the
// feed. Counted in the database rather than in memory, because a second server
// process would otherwise grant a second allowance.
const PostsPerHour = 20

var (
	// ErrNotOwned is a number that is not the writer's, or is not claimed yet.
	ErrNotOwned = errors.New("bu raqam sizniki emas")
	// ErrTooMany is the hourly ceiling.
	ErrTooMany = errors.New("juda ko'p post")
	// ErrEmpty is a post with nothing in it.
	ErrEmpty = errors.New("post bo'sh")
)

// The longest a post may be. Enforced here as well as in the form, because a
// form is not a limit.
const maxPostLength = 1000

// AddPost writes one post and answers with the number it was written on.
func (s *Store) AddPost(ctx context.Context, userID, handle, body string) (string, error) {
	author, err := uuid.Parse(userID)
	if err != nil {
		return "", ErrNotOwned
	}

	body = strings.TrimSpace(body)
	if body == "" {
		return "", ErrEmpty
	}
	if len(body) > maxPostLength {
		body = body[:maxPostLength]
	}

	recent, err := s.queries.CountRecentPosts(ctx, author)
	if err != nil {
		return "", err
	}
	if recent >= PostsPerHour {
		return "", ErrTooMany
	}

	row, err := s.queries.AddPost(ctx, store.AddPostParams{
		UserID: author, Handle: &handle, Body: body,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotOwned
	}
	if err != nil {
		return "", err
	}
	return row.Handle, nil
}

// DeletePost removes one, and answers with the number it was on so the caller
// knows which pages to refresh.
func (s *Store) DeletePost(ctx context.Context, userID, postID string) (string, error) {
	author, err := uuid.Parse(userID)
	if err != nil {
		return "", ErrNotOwned
	}
	id, err := uuid.Parse(postID)
	if err != nil {
		return "", ErrNotOwned
	}

	handle, err := s.queries.DeletePost(ctx, store.DeletePostParams{ID: id, UserID: author})
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotOwned
	}
	if err != nil {
		return "", err
	}
	return handle, nil
}
