"use client";
import { useState } from "react";
import { Order } from "../../lib/types";
import { formatMoney } from "../../lib/money";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const res = await fetch(`/api/admin/orders?password=${encodeURIComponent(password)}`);
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Lỗi tải đơn hàng");
    setOrders(data.orders);
  }

  return (
    <main>
      <div className="container">
        <nav className="nav">
          <a className="logo" href="/">MinhWuan Store</a>
          <span className="badge">Admin</span>
        </nav>
        <section className="card" style={{ marginTop: 24 }}>
          <h1 style={{ fontSize: 42 }}>Quản lý đơn hàng</h1>
          <div className="form" style={{ maxWidth: 420 }}>
            <input type="password" placeholder="Nhập ADMIN_PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn" onClick={load}>Tải danh sách đơn</button>
          </div>
          {error && <p style={{ color: "#fecaca" }}>{error}</p>}
        </section>

        <section className="card" style={{ margin: "24px 0 56px", overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Sản phẩm</th>
                <th>Số tiền</th>
                <th>Khách</th>
                <th>Liên hệ</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.productName}</td>
                  <td>{formatMoney(order.amount)}</td>
                  <td>{order.customerName}</td>
                  <td>{order.customerContact}</td>
                  <td>{order.status}</td>
                  <td>{new Date(order.createdAt).toLocaleString("vi-VN")}</td>
                </tr>
              ))}
              {!orders.length && <tr><td colSpan={7}>Chưa có dữ liệu hoặc chưa nhập mật khẩu.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
