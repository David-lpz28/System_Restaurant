import { Form, Link, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { prisma } from "~/db.server";
import { parsePhoneNumberFromString } from "libphonenumber-js";

type Client = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string;
};

interface ActionData {
  formError?: string;
}

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;

  if (!id) {
    throw new Response("Client ID not provided", { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id } });

  if (!client) {
    throw new Response("Client not found", { status: 404 });
  }

  return json({ client });
};

export const action: ActionFunction = async ({ request, params }) => {
  const { id } = params;

  if (!id) {
    return json({ formError: "Client ID not provided." }, { status: 400 });
  }

  const formData = await request.formData();
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const phone = formData.get("phone");
  const address = formData.get("address");

  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    typeof phone !== "string" ||
    typeof address !== "string" ||
    !firstName.trim() ||
    !lastName.trim() ||
    !address.trim()
  ) {
    return json({ formError: "All fields are required." }, { status: 400 });
  }

  const phoneParsed = parsePhoneNumberFromString(phone, "US");
  if (!phoneParsed || !phoneParsed.isValid()) {
    return json({ formError: "Invalid phone number format." }, { status: 400 });
  }

  const formattedPhone = phoneParsed.formatInternational();

  try {
    await prisma.client.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone: formattedPhone,
        address,
      },
    });
    return redirect("/clients?success=Client updated successfully.");
  } catch (error) {
    console.error("Error updating client:", error);
    return json({ formError: "An error occurred. Please try again." }, { status: 500 });
  }
};

export default function EditClient() {
  const { client } = useLoaderData<{ client: Client }>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="p-8 max-w-4xl mx-auto bg-[#f7f8fa] rounded-lg shadow-lg">
      <h1 className="text-3xl font-semibold text-[#2c3e50] mb-6">Edit Client</h1>

      {actionData?.formError && (
        <div className="mb-4 p-3 text-sm text-white bg-[#c0392b] rounded-md">
          {actionData.formError}
        </div>
      )}

      <Form method="post" className="space-y-6">
        {/* First Name */}
        <div>
          <label className="block text-lg font-medium text-[#34495e]">First Name:</label>
          <input
            type="text"
            name="firstName"
            defaultValue={client.firstName}
            required
            className="w-full mt-2 px-4 py-2 border border-[#bdc3c7] rounded-md focus:ring-2 focus:ring-[#2980b9] focus:border-[#2980b9]"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-lg font-medium text-[#34495e]">Last Name:</label>
          <input
            type="text"
            name="lastName"
            defaultValue={client.lastName}
            required
            className="w-full mt-2 px-4 py-2 border border-[#bdc3c7] rounded-md focus:ring-2 focus:ring-[#2980b9] focus:border-[#2980b9]"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-lg font-medium text-[#34495e]">Phone Number:</label>
          <input
            type="tel"
            name="phone"
            defaultValue={client.phone || ""}
            required
            pattern="^\+?[1-9]\d{1,14}$"
            title="Please enter a valid phone number."
            className="w-full mt-2 px-4 py-2 border border-[#bdc3c7] rounded-md focus:ring-2 focus:ring-[#2980b9] focus:border-[#2980b9]"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-lg font-medium text-[#34495e]">Address:</label>
          <input
            type="text"
            name="address"
            defaultValue={client.address}
            required
            className="w-full mt-2 px-4 py-2 border border-[#bdc3c7] rounded-md focus:ring-2 focus:ring-[#2980b9] focus:border-[#2980b9]"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-5 py-2 text-lg font-semibold text-white rounded-md shadow ${
              isSubmitting
                ? "bg-[#95a5a6] cursor-not-allowed"
                : "bg-[#27ae60] hover:bg-[#229954]"
            }`}
          >
            {isSubmitting ? "Updating..." : "Update Client"}
          </button>
          <Link to="/clients">
            <button
              type="button"
              className="px-5 py-2 text-lg font-semibold text-white bg-[#7f8c8d] hover:bg-[#636e72] rounded-md shadow"
            >
              Back to Client List
            </button>
          </Link>
        </div>
      </Form>
    </div>
  );
}
