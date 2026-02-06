import React, { useState } from "react";
import { useUser } from "../../context/UserContext";

const ApiDocs = () => {
          const {user} = useUser()
          const canViewRealDomain = user?.role === 'admin' || user?.role === 'api'
  // Real backend domain
  const REAL_DOMAIN = "https://api.gamebar.in/api/gamebar/";
  // Demo / placeholder domain shown to non-api / non-admin users
  const DEMO_DOMAIN = "https://need-to-be-a-api-user/";

  const domain = canViewRealDomain ? REAL_DOMAIN : DEMO_DOMAIN;

  return (
    <div className="mt-10 px-4 text-black max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">Gamebar API Documentation</h1>
      <p className="text-sm text-gray-600 mb-6">
        Base URL: <span className="font-mono">{domain}</span>
        {!canViewRealDomain && (
          <span className="text-red-600 ml-1">
            (demo only, contact for live access)
          </span>
        )}
      </p>

      {/* GET API KEY */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Getting Your API Key</h2>
        <p>
          To access the Gamebar API, you must first obtain an API key.
          Please contact me directly on WhatsApp to request one:
        </p>

        <a
          href="https://wa.me/6009099196"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline block mt-2"
        >
          👉 Contact via WhatsApp to request your API key
        </a>
      </section>

      {/* HEADERS */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">Required Headers</h2>
        <p>All API requests must include the following headers:</p>

        <div className="bg-gray-100 p-4 rounded mt-3">
          <pre>{`
gamebar-api-key: YOUR_API_KEY
gamebar-uid: YOUR_ACCOUNT_UID
          `}</pre>
        </div>

        <p className="mt-2 text-gray-700">
          Without these headers, API requests will be rejected.
        </p>
      </section>

      {/* ENDPOINTS */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>

        {/* PRODUCTS */}
        <div className="mb-8">
          <h3 className="text-xl font-bold">1. GET /products</h3>
          <p className="mt-1">
            Fetches the full list of available top-up products.
          </p>

          <div className="bg-gray-100 p-4 rounded mt-3">
            <pre>{`GET ${domain}products
Headers: 
  gamebar-api-key
  gamebar-uid
            `}</pre>
          </div>

          <p className="text-red-600 mt-2">
            ⚠️ Product prices may change frequently. Always refetch before placing
            orders to avoid mismatched pricing.
          </p>
        </div>

        {/* BALANCE */}
        <div className="mb-8">
          <h3 className="text-xl font-bold">2. GET /balance</h3>
          <p className="mt-1">
            Returns the current Gamebar wallet balance of your account.
          </p>

          <div className="bg-gray-100 p-4 rounded mt-3">
            <pre>{`GET ${domain}balance
Headers:
  gamebar-api-key
  gamebar-uid
            `}</pre>
          </div>
        </div>

        {/* USERNAME */}
        <div className="mb-8">
          <h3 className="text-xl font-bold">3. POST /username</h3>
          <p className="mt-1">
            Fetches the in-game username based on user ID, zone ID, and product.
          </p>

          <div className="bg-gray-100 p-4 rounded mt-3">
            <pre>{`POST ${domain}username

Headers:
  gamebar-api-key
  gamebar-uid

Body (JSON):
{
  "userId": "123456",
  "zoneId": "8888",
  "product": "Mobile Legends"
}
            `}</pre>
          </div>
        </div>

        {/* ORDER */}
        <div className="mb-8">
          <h3 className="text-xl font-bold">4. POST /order</h3>
          <p className="mt-1">
            Creates an order and processes top-up for the selected product.
          </p>

          <div className="bg-gray-100 p-4 rounded mt-3">
            <pre>{`POST ${domain}order

Headers:
  gamebar-api-key
  gamebar-uid

Body (JSON):
{
  "userId": "123456",
  "zoneId": "8888",
  "product": "Mobile Legends",
  "productId": "ML5PH",
  "mobile": "1234567890",
  "orderId": "YOUR_OWN_ORDER_ID"
}
            `}</pre>
          </div>

          <p className="mt-2">
            <strong>orderId</strong> must be a unique identifier created by your
            system. It will be used to track the order status in your database.
          </p>
        </div>
      </section>

      <footer className="mt-12 text-gray-700 text-center">
        For additional help, feel free to contact via WhatsApp.
      </footer>
    </div>
  );
};

export default ApiDocs;
