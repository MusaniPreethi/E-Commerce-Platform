import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function loadRazorpayScript(src) {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }

    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const dealId = useMemo(() => {
    return params.get("dealId") || location.state?.dealId || "";
  }, [location.state, params]);

  const [deal, setDeal] = useState(null);
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDeal() {
      if (!dealId) return;
      setStatus("loading");
      setErrorMsg("");

      try {
        const res = await api.get(`/deals/${dealId}`);
        if (!cancelled) {
          setDeal(res.data);
          setStatus("idle");
        }
      } catch (_err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg("Unable to load deal details.");
        }
      }
    }

    loadDeal();
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  const paymentAmount = deal
    ? Number(deal.discountPrice > 0 ? deal.discountPrice : deal.productId?.price ?? 0)
    : 0;

  const formattedAmount = paymentAmount.toFixed(2);
  const isDealReady = deal?.status === "completed";

  async function handlePay(e) {
    e.preventDefault();

    if (!dealId) {
      setStatus("error");
      setErrorMsg("Missing dealId.");
      return;
    }

    if (!address.trim()) {
      setStatus("error");
      setErrorMsg("Address is required.");
      return;
    }

    if (!deal) {
      setStatus("error");
      setErrorMsg("Deal details are not loaded yet.");
      return;
    }

    if (!isDealReady) {
      setStatus("error");
      setErrorMsg("This deal is not ready for payment yet.");
      return;
    }

    if (paymentAmount <= 0) {
      setStatus("error");
      setErrorMsg("Invalid payment amount.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const scriptLoaded = await loadRazorpayScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!scriptLoaded) {
      setStatus("error");
      setErrorMsg("Unable to load payment gateway. Please try again later.");
      return;
    }

    try {
      const createRes = await api.post("/payment/create-order", {
        dealId,
      });

      const order = createRes.data;
      if (order?.mock) {
        await api.post("/payment/verify-payment", {
          mock: true,
          dealId,
          address: address.trim(),
        });
        setStatus("success");
        navigate("/orders", { replace: true });
        return;
      }

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "E-COMMERCE",
        description: deal.productId?.name || "Order payment",
        order_id: order.id,
        handler: async (response) => {
          try {
            setStatus("loading");
            await api.post("/payment/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              dealId,
              address: address.trim(),
            });

            setStatus("success");
            navigate("/orders", { replace: true });
          } catch (err) {
            console.error("Payment verification error", err);
            setStatus("error");
            setErrorMsg("Payment completed but verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user?.email ?? "",
          email: user?.email ?? "",
        },
        theme: {
          color: "#3b82f6",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", function (response) {
        console.error("payment failed", response.error);
        setStatus("error");
        setErrorMsg("Payment failed. Please try again.");
      });

      paymentObject.open();
    } catch (err) {
      console.error("create-order error", err);
      setStatus("error");
      setErrorMsg(
        err?.response?.data?.message ||
          "Could not start payment. Please try again."
      );
    }
  }

  return (
    <section className="page">
      <h1 className="pageTitle">Payment</h1>
      <p className="pageSubtitle">Secure checkout powered by Razorpay.</p>

      <div className="card">
        {!deal ? (
          <div className="muted">Loading deal information…</div>
        ) : (
          <form className="form" onSubmit={handlePay}>
            <label className="dealLabel">
              Deal ID
              <input className="input" value={dealId} readOnly />
            </label>

            <label className="dealLabel">
              Product
              <input className="input" value={deal.productId?.name ?? ""} readOnly />
            </label>

            <label className="dealLabel">
              Total amount
              <input className="input" value={`₹${formattedAmount}`} readOnly />
            </label>

            <label className="dealLabel">
              Signed in as
              <input className="input" value={user?.email ?? ""} readOnly />
            </label>

            <label className="dealLabel">
              Address
              <input
                className="input"
                placeholder="House no, street, city…"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>

            <button className="btn btnPrimary" type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Processing…" : `Pay ₹${formattedAmount}`}
            </button>

            {status === "error" ? <div className="errorText">{errorMsg}</div> : null}
          </form>
        )}
      </div>
    </section>
  );
}

