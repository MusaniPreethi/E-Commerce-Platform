function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
async function handlePayment() {
  const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
  if (!res) {
    alert("Razorpay SDK failed to load");
    return;
  }

  // Call backend to create order
  const order = await fetch("/api/payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 900, currency: "INR" }),
  }).then((res) => res.json());

  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    name: "My E-Commerce",
    description: "Test Transaction",
    order_id: order.id,
    handler: function (response) {
      alert(response.razorpay_payment_id);
      alert(response.razorpay_order_id);
      alert(response.razorpay_signature);
    },
  };

  const paymentObject = new window.Razorpay(options);
  paymentObject.open();
}