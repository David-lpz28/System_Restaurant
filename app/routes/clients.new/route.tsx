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
  const phoneNumber = formData.get("phone");
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
        phone: formattedPhoneNumber,
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
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="container mx-auto max-w-lg">
        <h1 className="text-3xl font-bold text-center mb-8">Create New Client</h1>

        {/* Success Message */}
        {displaySuccess && (
          <p className="text-green-500 bg-gray-800 p-2 rounded text-center mb-4">
            {displaySuccess}
          </p>
        )}

        {/* Error Message */}
        {displayError && (
          <p className="text-red-500 bg-gray-800 p-2 rounded text-center mb-4">
            {displayError}
          </p>
        )}

        {/* Client Creation Form */}
        <Form method="post" className="bg-gray-800 p-6 rounded shadow-md">
          <div className="mb-4">
            <label className="block text-lg font-medium mb-2">First Name:</label>
            <input
              type="text"
              name="firstName"
              required
              className="w-full p-2 rounded bg-gray-700 text-gray-100"
              placeholder="Enter first name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-lg font-medium mb-2">Last Name:</label>
            <input
              type="text"
              name="lastName"
              required
              className="w-full p-2 rounded bg-gray-700 text-gray-100"
              placeholder="Enter last name"
            />
          </div>
          <div className="mb-4">
            <label className="block text-lg font-medium mb-2">Phone Number:</label>
            <input
              type="tel"
              name="phone"
              required
              pattern="^\+?[1-9]\d{1,14}$"
              title="Please enter a valid phone number."
              className="w-full p-2 rounded bg-gray-700 text-gray-100"
              placeholder="+1234567890"
            />
          </div>
          <div className="mb-4">
            <label className="block text-lg font-medium mb-2">Address:</label>
            <input
              type="text"
              name="address"
              required
              className="w-full p-2 rounded bg-gray-700 text-gray-100"
              placeholder="Enter address"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-gray-100 font-bold rounded"
          >
            {isSubmitting ? "Creating..." : "Create Client"}
          </button>
        </Form>

        {/* Back to Client List Button */}
        <div className="mt-6 text-center">
          <Link
            to="/clients"
            className="inline-block px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded font-medium"
          >
            Back to Client List
          </Link>
        </div>
      </div>
    </div>
  );
}
