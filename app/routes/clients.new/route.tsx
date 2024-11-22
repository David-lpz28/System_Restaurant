import {
  Form,
  Link,
  useNavigation,
  useLoaderData,
} from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/db.server";
import { getSession, commitSession } from "../../../sessions.server";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useEffect, useState } from "react";

// Types for action and loader data
interface LoaderData {
  successMessage?: string;
  errorMessage?: string;
}

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const successMessage = session.get("success");
  const errorMessage = session.get("error");

  return json<LoaderData>(
    { successMessage, errorMessage },
    {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    }
  );
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const formData = await request.formData();
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const phoneNumber = formData.get("phoneNumber");
  const address = formData.get("address");

  // Validate required fields
  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    typeof phoneNumber !== "string" ||
    typeof address !== "string" ||
    !firstName.trim() ||
    !lastName.trim() ||
    !phoneNumber.trim() ||
    !address.trim()
  ) {
    session.flash("error", "All fields are required.");
    return redirect("/clients/new", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  // Validate phone number format using libphonenumber-js
  const phoneNumberParsed = parsePhoneNumberFromString(phoneNumber, "US"); // Replace "US" with the appropriate country code
  if (!phoneNumberParsed || !phoneNumberParsed.isValid()) {
    session.flash("error", "Invalid phone number format.");
    return redirect("/clients/new", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  // Format phone number to international format
  const formattedPhoneNumber = phoneNumberParsed.formatInternational();

  // Create the new client in the database
  try {
    await prisma.client.create({
      data: {
        firstName,
        lastName,
        phoneNumber: formattedPhoneNumber,
        address,
      },
    });
    session.flash("success", "Client successfully created.");
    return redirect("/clients", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error) {
    console.error("Error creating client:", error);
    session.flash(
      "error",
      "Internal server error. Please try again later."
    );
    return redirect("/clients/new", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
};

export default function NewClient() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const { successMessage, errorMessage } = useLoaderData<LoaderData>();
  const [displaySuccess, setDisplaySuccess] = useState<string | null>(
    successMessage || null
  );
  const [displayError, setDisplayError] = useState<string | null>(
    errorMessage || null
  );

  useEffect(() => {
    if (successMessage) {
      setDisplaySuccess(successMessage);
      // Clear the message after showing it
      const timer = setTimeout(() => {
        setDisplaySuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }

    if (errorMessage) {
      setDisplayError(errorMessage);
      // Clear the message after showing it
      const timer = setTimeout(() => {
        setDisplayError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1>Create New Client</h1>

      {/* Success Message */}
      {displaySuccess && <p style={{ color: "green" }}>{displaySuccess}</p>}

      {/* Error Message */}
      {displayError && <p style={{ color: "red" }}>{displayError}</p>}

      {/* Client Creation Form */}
      <Form method="post">
        <div style={{ marginBottom: "10px" }}>
          <label>
            First Name:
            <input
              type="text"
              name="firstName"
              required
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              placeholder="Enter first name"
            />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Last Name:
            <input
              type="text"
              name="lastName"
              required
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              placeholder="Enter last name"
            />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Phone Number:
            <input
              type="tel"
              name="phoneNumber"
              required
              pattern="^\+?[1-9]\d{1,14}$"
              title="Please enter a valid phone number."
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              placeholder="+1234567890"
            />
          </label>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>
            Address:
            <input
              type="text"
              name="address"
              required
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              placeholder="Enter address"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: "10px 20px",
            backgroundColor: isSubmitting ? "#ccc" : "#28a745",
            color: "#fff",
            border: "none",
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Creating..." : "Create Client"}
        </button>
      </Form>

      {/* Back to Client List Button */}
      <div style={{ marginTop: "20px" }}>
        <Link to="/clients">
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Back to Client List
          </button>
        </Link>
      </div>
    </div>
  );
}

// Error Boundary to handle errors in this route
import { useRouteError, isRouteErrorResponse } from "@remix-run/react";

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>Error {error.status}</h1>
        <p>{error.statusText}</p>
        {error.data && <pre>{JSON.stringify(error.data, null, 2)}</pre>}
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>An unexpected error occurred</h1>
        <p>{error.message}</p>
        {process.env.NODE_ENV === "development" && (
          <pre>{error.stack}</pre>
        )}
      </div>
    );
  } else {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>Unknown error</h1>
      </div>
    );
  }
}