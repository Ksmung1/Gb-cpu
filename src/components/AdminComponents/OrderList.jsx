import React, { useState } from "react";
import OrderCard from "./OrderCard";

const OrderList = ({ orders, filter, search }) => {
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Helper to parse "dd-mm-yyyy" and "hh:mm:ss AM/PM"
  const parseDateTime = (date, time = "00:00:00 AM") => {
    if (!date || !time) return 0;
    const [dd, mm, yyyy] = date.split("-");
    return new Date(`${yyyy}-${mm}-${dd} ${time}`).getTime();
  };

  const filteredOrders = orders
    .filter(order => {
      // Search filter
      const matchQuery =
        order.username?.toLowerCase().includes(search.toLowerCase()) ||
        order.id?.toLowerCase().includes(search.toLowerCase()) ||
        order.gameId?.toLowerCase().includes(search.toLowerCase()) ||
        order.user?.toLowerCase().includes(search.toLowerCase());

      // Type filter
      let matchType = true;
      if (filter === "true") {
        matchType = order.isTopup === true;
      } else if (filter === "false") {
        matchType = !order.isTopup || order.isTopup === false;
      } else if (filter === "genshin") {
        matchType =
          (order.game && order.game.toLowerCase().includes("genshin")) ||
          (order.productName && order.productName.toLowerCase().includes("genshin"));
      }

      return matchQuery && matchType;
    })
    .sort((a, b) =>
      parseDateTime(b.date, b.time) - parseDateTime(a.date, a.time)
    );

  const toggleExpand = (id) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-2 sm:space-y-0 grid sm:grid-cols-2 gap-3">
      {filteredOrders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          expanded={expandedOrderId === order.id}
          onClick={() => toggleExpand(order.id)}
        />
      ))}
    </div>
  );
};

export default OrderList;
