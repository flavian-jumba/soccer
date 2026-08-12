import type { BillingFailure } from "@/domain/billing/types";
import { ErrorCode, type PurchaseError } from "expo-iap";

/**
 * Translates store error codes into something a user can act on.
 *
 * Play returns a flat list of codes with no notion of severity; the mapping here
 * decides which are silent (the user cancelled), which are worth a retry, and
 * which need the user to change something outside the app.
 */
export function toBillingFailure(error: unknown): BillingFailure {
  const purchaseError = error as
    | (Partial<PurchaseError> & {
        userCancelled?: boolean;
        underlyingErrorMessage?: string;
        readableErrorCode?: string;
      })
    | undefined;
  const code: string =
    typeof purchaseError?.code === "string" ? purchaseError.code : "";
  const debug =
    typeof purchaseError?.underlyingErrorMessage === "string"
      ? purchaseError.underlyingErrorMessage
      : typeof purchaseError?.message === "string"
        ? purchaseError.message
        : "";

  if (purchaseError?.userCancelled === true || code === "1") {
    return {
      kind: "cancelled",
      code,
      message: "Purchase cancelled.",
      recoverable: true,
    };
  }

  if (code === "4" || purchaseError?.readableErrorCode === "PurchaseInvalidError") {
    return {
      kind: "unavailable",
      code,
      message: debug || "Google Play rejected this purchase request.",
      recoverable: true,
    };
  }

  if (code === "5" || purchaseError?.readableErrorCode === "ProductNotAvailableForPurchaseError") {
    return {
      kind: "not-configured",
      code,
      message:
        "This plan is not available for purchase. Check RevenueCat, Play Console activation, and tester eligibility.",
      recoverable: false,
    };
  }

  if (code === "6" || purchaseError?.readableErrorCode === "ProductAlreadyPurchasedError") {
    return {
      kind: "already-owned",
      code,
      message:
        "You already own this subscription. Tap Restore purchases to sync it.",
      recoverable: true,
    };
  }

  if (code === "10" || code === "35") {
    return {
      kind: "network",
      code,
      message: "Connection problem. Check your network and try again.",
      recoverable: true,
    };
  }

  if (code === "20") {
    return {
      kind: "pending",
      code,
      message:
        "Your payment is being processed. Access unlocks as soon as Google Play confirms it.",
      recoverable: false,
    };
  }

  switch (code) {
    case ErrorCode.UserCancelled:
      return {
        kind: "cancelled",
        code,
        message: "Purchase cancelled.",
        recoverable: true,
      };

    case ErrorCode.AlreadyOwned:
    case ErrorCode.DuplicatePurchase:
      return {
        kind: "already-owned",
        code,
        message:
          "You already own this subscription. Tap Restore purchases to sync it.",
        recoverable: true,
      };

    case ErrorCode.Pending:
    case ErrorCode.DeferredPayment:
      return {
        kind: "pending",
        code,
        message:
          "Your payment is being processed. Access unlocks as soon as Google Play confirms it.",
        recoverable: false,
      };

    case ErrorCode.BillingUnavailable:
    case ErrorCode.IapNotAvailable:
    case ErrorCode.FeatureNotSupported:
      return {
        kind: "unavailable",
        code,
        message:
          "Google Play billing is not available on this device. Check that the Play Store is installed and up to date.",
        recoverable: false,
      };

    case ErrorCode.ItemUnavailable:
    case ErrorCode.SkuNotFound:
    case ErrorCode.SkuOfferMismatch:
    case ErrorCode.QueryProduct:
      return {
        kind: "not-configured",
        code,
        message:
          "This plan is not available right now. Please try again later or contact support.",
        recoverable: false,
      };

    case ErrorCode.NetworkError:
    case ErrorCode.ServiceDisconnected:
    case ErrorCode.ServiceTimeout:
    case ErrorCode.ServiceError:
    case ErrorCode.ConnectionClosed:
    case ErrorCode.RemoteError:
    case ErrorCode.Interrupted:
      return {
        kind: "network",
        code,
        message: "Connection problem. Check your network and try again.",
        recoverable: true,
      };

    case ErrorCode.TransactionValidationFailed:
    case ErrorCode.PurchaseVerificationFailed:
    case ErrorCode.ReceiptFailed:
      return {
        kind: "verification-failed",
        code,
        message:
          "We could not verify this purchase. If you were charged, tap Restore purchases or contact support.",
        recoverable: true,
      };

    // Play's DEVELOPER_ERROR (response code 5). The request itself was rejected,
    // so retrying it changes nothing — in practice this means the installed build
    // is not one Play will sell through: sideloaded, or signed with a key that is
    // not the Play app signing key. Product details still load in that state,
    // which is why prices look fine right up until the flow is launched.
    case ErrorCode.DeveloperError:
      if (__DEV__) {
        console.warn(
          "[billing] Play returned DEVELOPER_ERROR. The build cannot launch a " +
            "billing flow. Install it from a Play track (internal testing or " +
            "Internal App Sharing) so its signature matches the Play app " +
            "signing key, and buy with a licensed tester account.",
          debug,
        );
      }
      return {
        kind: "not-configured",
        code,
        message:
          "This build cannot process purchases. Install Titan Tips from Google Play to subscribe.",
        recoverable: false,
      };

    case ErrorCode.NotPrepared:
    case ErrorCode.InitConnection:
      return {
        kind: "unavailable",
        code,
        message: "Billing is not ready yet. Please try again in a moment.",
        recoverable: true,
      };

    default:
      if (__DEV__ && debug) console.warn("[billing] unmapped error:", code, debug);
      return {
        kind: "unknown",
        code: code || undefined,
        message: "Something went wrong. Please try again.",
        recoverable: true,
      };
  }
}

/** Cancellations are a normal outcome and should not surface as an error. */
export function isSilentFailure(failure: BillingFailure): boolean {
  return failure.kind === "cancelled";
}
