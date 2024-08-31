import Order  from "../../models/order.js";
import { Branch } from "../../models/branch.js";
import { Customer, DeliveryPartner } from "../../models/users.js";

export const createOrder = async (req, reply) => {
  try {
    const { userId } = req.user;
    const { items, branch, totalPrice } = req.body;
    const customerData = await Customer.findById(userId);
    const branchData = await Branch.findById(branch);
    if (!customerData) {
      return reply.status(404).send({ message: "Customer not found" });
    }
    const newOrder = new Order({
      customer: userId,
      items: items.map((item) => ({
        id: item.id,
        item: item.item,
        count: item.count,
      })),
      branch,
      totalPrice,
      totalPrice,
      deliveryLocation: {
        latitude: customerData.liveLocation.latitude,
        longitude: customerData.liveLocation.longitude,
        address: customerData.address || "No address provided",
      },
      pickUpLocation: {
        latitude: branchData.location.latitude,
        longitude: branchData.location.longitude,
        address: branchData.address || "No address provided",
      },
    });

    const savedOrder = await newOrder.save();
    return reply
      .status(201)
      .send({ message: "Order created successfully", order: savedOrder });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to create order", error });
  }
};

export const confirmOrder = async (req, reply) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.user;
    const { deliveryPersonLocation } = req.body;

    const deliveryaPerson = await DeliveryPartner.findById(userId);
    if (!deliveryPerson) {
      return reply.status(404).send({ message: "Delivery Person not found" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return reply.status(404).send({ message: "Order not found" });
    }
    if (order.status !== "available") {
      return reply.status(400).send({ message: "Order not available" });
    }
    order.status = "confirmed";
    order.DeliveryPartner = userId;
    order.deliveryPersonLocation = {
      latitude: deliveryPersonLocation.latitude,
      longitude: deliveryPersonLocation.longitude,
      address: deliveryPersonLocation.address || "",
    };

    req.server.io.to(orderId).emit('orderConfirmed', order);

    await order.save();
    return reply.send({ message: "Order confirmed successfully", order });
  } catch (error) {
    return reply
      .status(500)
      .send({ message: "Failed to confirm order", error });
  }
};

export const updateOrderStatus = async (req, reply) => {
  try {
    const { orderId } = req.params;
    const { status, deliveryPersonLocation } = req.body;
    const { userId } = req.user;
    const deliveryPerson = await DeliveryPartner.findById(userId);
    if (!deliveryPerson) {
      return reply.status(404).send({ message: "Delivery Person not found" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return reply.status(404).send({ message: "Order not found" });
    }
    if (["cancelled", "delivered"].includes(order.status)) {
      return reply
        .status(400)
        .send({ message: "Order already cancelled or delivered" });
    }
    if (order.DeliveryPartner.toString() !== userId) {
      return reply
        .status(403)
        .send({ message: "You are not assigned to this order" });
    }
    order.status = status;
    order.deliveryPersonLocation = deliveryPersonLocation;
    await order.save();

    req.server.io.to(orderId).emit('liveTrackingUpdates', order);
    return reply.send({ message: "Order status updated successfully", order });
  } catch (error) {
    return reply
      .status(500)
      .send({ message: "Failed to update order status", error });
  }
};

export const getOrders = async (req, reply) => {
  try {
    const { status, customerId, deliveryPartnerId, branchId } = req.query;
    let query = {};
    if (status) {
      query.status = status;
    }
    if (customerId) {
      query.customer = customerId;
    }
    if (deliveryPartnerId) {
      query.deliveryPartner = deliveryPartnerId;
      query.branch = branchId;
    }
    const orders = await Order.find(query).populate(
      "customer branch items.item deliveryPartner"
    );
    return reply.send({ orders });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch orders", error });
  }
};

export const getOrderbyId = async (req, reply) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(order).populate(
      "customer branch items.item deliveryPartner"
    );
    if (!order) {
      return reply.status(404).send({ message: "Order not found" });
    }
    return reply.send({ order });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch order", error });
  }
};
