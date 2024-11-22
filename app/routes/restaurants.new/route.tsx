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
    const name = formData.get("name");
    const phoneNumber = formData.get("phone");
    const address = formData.get("address");
  
    // Validate required fields
    if (
      typeof name !== "string" ||
      typeof phoneNumber !== "string" ||
      typeof address !== "string" ||
      !name.trim() ||
      !phoneNumber.trim() ||
      !address.trim()
    ) {
      session.flash("error", "All fields are required.");
      return redirect("/restaurants/new", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }
  
    // Validate phone number format using libphonenumber-js
    const phoneNumberParsed = parsePhoneNumberFromString(phoneNumber, "US");
    if (!phoneNumberParsed || !phoneNumberParsed.isValid()) {
      session.flash("error", "Invalid phone number format.");
      return redirect("/restaurants/new", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }
  
    // Format phone number to international format
    const formattedPhoneNumber = phoneNumberParsed.formatInternational();
  
    // Create the new restaurant in the database
    try {
      await prisma.restaurant.create({
        data: {
          name,
          phone: formattedPhoneNumber,
          address,
        },
      });
      session.flash("success", "Restaurant successfully created.");
      return redirect("/restaurants", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    } catch (error) {
      console.error("Error creating restaurant:", error);
      session.flash(
        "error",
        "Internal server error. Please try again later."
      );
      return redirect("/restaurants/new", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    }
  };
  
  export default function NewRestaurant() {
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
        const timer = setTimeout(() => {
          setDisplaySuccess(null);
        }, 5000);
        return () => clearTimeout(timer);
      }
  
      if (errorMessage) {
        setDisplayError(errorMessage);
        const timer = setTimeout(() => {
          setDisplayError(null);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }, [successMessage, errorMessage]);
  
    return (
      <div className="p-8 max-w-3xl mx-auto bg-gray-100 rounded-lg shadow-lg">
        <header className="mb-6">
          <h1 className="text-4xl font-bold text-gray-800">Create New Restaurant</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in the details to add a new restaurant.
          </p>
        </header>
  
        {/* Success Message */}
        {displaySuccess && (
          <p className="text-green-600 font-semibold mb-4">
            {displaySuccess}
          </p>
        )}
  
        {/* Error Message */}
        {displayError && (
          <p className="text-red-600 font-semibold mb-4">
            {displayError}
          </p>
        )}
  
        <Form method="post" className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Name:</label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              placeholder="Enter restaurant name"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Phone Number:</label>
            <input
              type="tel"
              name="phone"
              required
              pattern="^\+?[1-9]\d{1,14}$"
              title="Please enter a valid phone number."
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Address:</label>
            <input
              type="text"
              name="address"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
              placeholder="Enter restaurant address"
            />
          </div>
  
          <div className="flex items-center justify-between mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 font-medium text-white rounded-md shadow-md ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Creating..." : "Create Restaurant"}
            </button>
            <Link to="/restaurants">
              <button className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md shadow-md">
                Back to Restaurant List
              </button>
            </Link>
          </div>
        </Form>
      </div>
    );
  }
  