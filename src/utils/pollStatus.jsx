export const pollStatus = (orderId, timeoutMs = 120000) => {
  const baseURL = import.meta.env.VITE_BACKEND_URL;
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const interval = setInterval(async () => {
      if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        resolve(null); // timeout
        return;
      }

      try {
        const res = await axios.post(`${baseURL}/payment/check-order-status`, {
          order_id: orderId,
          // no need to send user_token from frontend if backend handles it securely
        });

        const result = res.data?.result;

        if (result?.txnStatus === "COMPLETED" || result?.txnStatus === "SUCCESS") {
          clearInterval(interval);
          resolve(result);
          return;
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 3000);
  });
};
