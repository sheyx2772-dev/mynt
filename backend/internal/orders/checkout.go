// Package orders sells a number.
//
// What it deliberately does not do is take the money. Payme and Click call
// back to `landing/api/payme` and `landing/api/click/*`, which are the
// endpoints registered in the merchant cabinets and the ones tested against
// Payme's sandbox certification — repeated calls returning identical
// timestamps, the twelve-hour transaction timeout, cancel-before-perform
// versus cancel-after-perform. A second implementation of that protocol would
// be a second place for money to be wrong, answering for the same merchant
// account.
//
// So this package reserves a number, records an order, and builds the address
// that sends a buyer to a provider's own checkout. The confirmation arrives the
// way it always has.
package orders

import (
	"encoding/base64"
	"fmt"
	"net/url"
	"strconv"
)

// Payme reads a base64 payload out of the path rather than taking query
// parameters. The field names are theirs: `m` the merchant, `ac.order_id` the
// account field this merchant is configured with, `a` the amount, `c` where to
// return the buyer.
func PaymeCheckoutURL(merchantID, orderID string, amountSum int64, returnURL string) string {
	parts := []string{
		"m=" + merchantID,
		"ac.order_id=" + orderID,
		// Payme counts in tiyin. Getting this wrong by a factor of a hundred is
		// the classic way to charge somebody the wrong amount, in either
		// direction.
		"a=" + strconv.FormatInt(amountSum*100, 10),
	}
	if returnURL != "" {
		parts = append(parts, "c="+returnURL)
	}

	payload := ""
	for i, part := range parts {
		if i > 0 {
			payload += ";"
		}
		payload += part
	}

	return "https://checkout.paycom.uz/" + base64.StdEncoding.EncodeToString([]byte(payload))
}

// Click takes ordinary query parameters, and counts in so'm rather than tiyin.
func ClickCheckoutURL(serviceID, merchantID, orderID string, amountSum int64, returnURL string) string {
	query := url.Values{
		"service_id":        {serviceID},
		"merchant_id":       {merchantID},
		"amount":            {strconv.FormatInt(amountSum, 10)},
		"transaction_param": {orderID},
	}
	if returnURL != "" {
		query.Set("return_url", returnURL)
	}

	return fmt.Sprintf("https://my.click.uz/services/pay?%s", query.Encode())
}
