import { json, redirect } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { prisma } from "~/db.server";

export const action: ActionFunction = async ({ params, request }) => {
  const { id } = params;

  if (!id) {
    return json({ error: "Order ID is required." }, { status: 400 });
  }

  const formData = await request.formData();
  const newStatus = formData.get("status");

  // Validate the new status
  if (!newStatus || !["PENDING", "IN_PROGRESS", "COMPLETED"].includes(newStatus)) {
    return json({ error: "Invalid status." }, { status: 400 });
  }

  // Fetch the current order to validate transitions
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return json({ error: "Order not found." }, { status: 404 });
  }

  // Validate allowed status transitions
  const validTransitions = {
    PENDING: ["IN_PROGRESS", "COMPLETED"],
    IN_PROGRESS: ["COMPLETED"],
    COMPLETED: [],
  };

  if (!validTransitions[order.status].includes(newStatus)) {
    return json(
      { error: `Invalid status transition from ${order.status} to ${newStatus}.` },
      { status: 400 }
    );
  }

  // Update the order's status and completed timestamp if applicable
  await prisma.order.update({
    where: { id },
    data: {
      status: newStatus,
      completedTimestamp: newStatus === "COMPLETED" ? new Date() : null,
    },
  });

  return redirect("/orders?success=true");
};
