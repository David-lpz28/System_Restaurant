import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { prisma } from "~/db.server";
import { useState } from "react";

// Loader to fetch clients and restaurants for dropdown options
export const loader: LoaderFunction = async () => {
  const clients = await prisma.client.findMany({
    select: { id: true, firstName: true, lastName: true },
  });
  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true },
  });

  return json({
    clients: clients.map((client) => ({
      id: client.id,
      name: `${client.firstName} ${client.lastName}`,
    })),
    restaurants,
  });
};

// Action to handle order creation
export const action: ActionFunction = async ({ request }) => {
  try {
    const formData = await request.formData();
    const clientId = formData.get("clientId");
    const restaurantId = formData.get("restaurantId");
    const items = JSON.parse(formData.get("items") as string);

    // Validate required fields
    if (!clientId || !restaurantId || !items || !Array.isArray(items)) {
      return json(
        { error: "Invalid data: Missing required fields." },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (
        !item.quantity ||
        !item.description ||
        !item.unitPrice ||
        parseInt(item.quantity) <= 0 ||
        parseFloat(item.unitPrice) <= 0
      ) {
        return json(
          { error: "Invalid data: Each item must have quantity > 0 and unit price > 0." },
          { status: 400 }
        );
      }
    }

    // Create the order with associated items
    const newOrder = await prisma.order.create({
      data: {
        clientId: clientId as string,
        restaurantId: restaurantId as string,
        items: {
          create: items.map((item: any) => ({
            quantity: parseInt(item.quantity),
            description: item.description,
            unitPrice: parseFloat(item.unitPrice),
          })),
        },
      },
    });

    // Redirect to orders list with success message
    return redirect(`/orders?success=true&orderId=${newOrder.id}`);
  } catch (error) {
    console.error("Error creating order:", error);

    return json(
      { error: "An unexpected error occurred while creating the order." },
      { status: 500 }
    );
  }
};

// New Order Form Component
export default function NewOrder() {
  const { clients, restaurants } = useLoaderData();
  const navigation = useNavigation();
  const [items, setItems] = useState([{ quantity: "", description: "", unitPrice: "" }]);

  // Add new item row
  const addItem = () => {
    setItems([...items, { quantity: "", description: "", unitPrice: "" }]);
  };

  // Update item field
  const handleItemChange = (index: number, field: string, value: string) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  // Remove item row
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h1>Create New Order</h1>
      <Form
        method="post"
        onSubmit={(e) => {
          const itemsData = JSON.stringify(items);
          const hiddenInput = document.createElement("input");
          hiddenInput.type = "hidden";
          hiddenInput.name = "items";
          hiddenInput.value = itemsData;
          e.currentTarget.appendChild(hiddenInput);
        }}
      >
        {/* Client Selection */}
        <label>
          Client:
          <select name="clientId" required>
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>

        {/* Restaurant Selection */}
        <label>
          Restaurant:
          <select name="restaurantId" required>
            <option value="">Select a restaurant</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </label>

        {/* Order Items */}
        <h2>Order Items</h2>
        {items.map((item, index) => (
          <div key={index}>
            <input
              type="number"
              placeholder="Quantity"
              value={item.quantity}
              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={item.description}
              onChange={(e) => handleItemChange(index, "description", e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Unit Price"
              value={item.unitPrice}
              onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
              required
            />
            <button type="button" onClick={() => removeItem(index)}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addItem}>
          Add Item
        </button>

        {/* Submit */}
        <button type="submit" disabled={navigation.state === "submitting"}>
          {navigation.state === "submitting" ? "Creating..." : "Create Order"}
        </button>
      </Form>
    </div>
  );
}