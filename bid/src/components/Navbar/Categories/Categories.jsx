import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../Categories/Categories.css";

function Categories() {
    const [products, setProducts] = useState([]);
    const [biddingItem, setBiddingItem] = useState(null);
    const [bidAmount, setBidAmount] = useState(0);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [paymentMessage, setPaymentMessage] = useState(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get("q") || "";

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/products`);
                console.log("Fetched products:", response.data);
                let allProducts = Array.isArray(response.data) ? response.data : [];
                if (searchQuery) {
                    allProducts = allProducts.filter((product) =>
                        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        product.description.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                }
                setProducts(allProducts);
            } catch (error) {
                console.error("Error fetching products:", error.response?.data || error.message);
                setError("Failed to load categories. Please try again.");
            }
        };
        fetchProducts();
    }, [searchQuery]);

    const calculateTimeRemaining = (start, end) => {
        const now = new Date();
        const endDate = new Date(end);
        const diffMs = endDate - now;
        if (diffMs <= 0) return "Ended";
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `${days}d ${hours}h`;
    };

    const enrichedProducts = products.map((product) => ({
        ...product,
        auctionInfo: {
            ...product.auctionInfo,
            status: calculateTimeRemaining(product.startingDate, product.endingDate) === "Ended" ? "Closed" : product.auctionInfo.status,
            timeRemaining: calculateTimeRemaining(product.startingDate, product.endingDate),
            basePrice: parseFloat(product.price) || 0,
        },
    }));

    const handleBidClick = (item) => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Please log in to bid.");
            navigate("/signup");
            return;
        }
        setBiddingItem(item);
        setBidAmount(
            Math.max(parseFloat(item.auctionInfo.currentPrice || item.price) || 0, item.price) + Math.floor(Math.random() * 50) + 1
        );
        setError(null);
        setSuccessMessage(null);
    };

    const handlePlaceBid = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Please log in to place a bid.");
            navigate("/signup");
            return;
        }

        const basePrice = biddingItem.auctionInfo.basePrice;
        if (bidAmount < basePrice) {
            setError(`Bid must be at least $${basePrice.toFixed(2)} (base price).`);
            return;
        }

        console.log("Placing bid:", { productId: biddingItem._id, bidAmount });
        try {
            const response = await axios.put(
                `${API_URL}/api/products/${biddingItem._id}/bid`,
                { bidAmount },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Bid response:", response.data);
            setProducts(products.map((p) => (p._id === biddingItem._id ? response.data : p)));
            setBiddingItem(null);
            setError(null);
            setSuccessMessage(`Bid of $${bidAmount.toFixed(2)} placed successfully on ${biddingItem.name}!`);
        } catch (error) {
            console.error("Error placing bid:", error.response?.data || error.message);
            setError(error.response?.data?.message || "Failed to place bid.");
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async (product) => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Please log in to make a payment.");
            navigate("/signup");
            return;
        }

        const user = JSON.parse(localStorage.getItem("user"));
        if (product.auctionInfo.currentBidder?._id !== user.id) {
            setError("Only the winning bidder can make the payment.");
            return;
        }

        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
            setError("Razorpay SDK failed to load. Please try again.");
            return;
        }

        try {
            const response = await axios.post(
                `${API_URL}/api/create-order`,
                { amount: product.auctionInfo.currentPrice },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const { orderId } = response.data;

            const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_s1vs1QoPqB8xow";
            if (!RAZORPAY_KEY_ID) {
                throw new Error("Razorpay Key ID is not defined in environment variables.");
            }

            const options = {
                key: RAZORPAY_KEY_ID,
                amount: product.auctionInfo.currentPrice * 100,
                currency: "INR",
                name: "Auction Payment",
                description: `Payment for ${product.name}`,
                order_id: orderId,
                handler: async (response) => {
                    try {
                        const confirmResponse = await axios.post(
                            `${API_URL}/api/products/${product._id}/confirm-payment`,
                            { productId: product._id, paymentId: response.razorpay_payment_id },
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        setPaymentMessage(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
                        setProducts(products.map((p) => (p._id === product._id ? confirmResponse.data.product : p)));
                        setError(null);
                    } catch (error) {
                        console.error("Error confirming payment:", error.response?.data || error.message);
                        setError("Failed to confirm payment: " + (error.response?.data?.message || "Unknown error"));
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.contactNumber || "9999999999",
                },
                theme: { color: "#3399cc" },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error("Error initiating payment:", error.message);
            setError(error.message || "Failed to initiate payment.");
        }
    };

    return (
        <div className="categories-container">
            <h2>{searchQuery ? `Search Results for "${searchQuery}"` : "Categories"}</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
            {paymentMessage && <p style={{ color: "green" }}>{paymentMessage}</p>}
            <div className="categories-list">
                {enrichedProducts.length === 0 && !error ? (
                    <p>No {searchQuery ? "matching products" : "products"} found.</p>
                ) : (
                    enrichedProducts.map((product) => (
                        <div key={product._id} className="category-item">
                            <div className="category-image">
                                {product.image ? (
                                    <img src={`${product.image}`} alt={product.name} />
                                ) : (
                                    <p>No image available</p>
                                )}
                            </div>
                            <div style={{ padding: "15px" }}>
                                <h3>{product.name}</h3>
                                <p>{product.description}</p>
                                <p><strong>Base Price:</strong> ${product.auctionInfo.basePrice.toFixed(2)}</p>
                                <p><strong>Current Bid:</strong> ${product.auctionInfo.currentPrice.toFixed(2)}</p>
                                <p>
                                    <strong>{product.auctionInfo.status === "Closed" || product.auctionInfo.status === "Paid" ? "Winning Bidder" : "Highest Bidder"}:</strong>
                                    {product.auctionInfo.currentBidder ? product.auctionInfo.currentBidder.name : "None"}
                                </p>
                                <p><strong>Starting Date:</strong> {new Date(product.startingDate).toLocaleDateString()}</p>
                                <p><strong>Ending Date:</strong> {new Date(product.endingDate).toLocaleDateString()}</p>
                                <div>
                                    <p><strong>Seller Info:</strong></p>
                                    <p>Username: {product.sellerInfo?.username || "N/A"}</p>
                                    <p>Contact Number: {product.sellerInfo?.contactNumber || "N/A"}</p>
                                    <p>Email: {product.sellerInfo?.email || "N/A"}</p>
                                </div>
                                <div>
                                    <p><strong>Auction Status:</strong> {product.auctionInfo.status}</p>
                                    <p><strong>Time Remaining:</strong> {product.auctionInfo.timeRemaining}</p>
                                    {product.auctionInfo.status === "Open" && (
                                        <button onClick={() => handleBidClick(product)}>Bid Now</button>
                                    )}
                                    {product.auctionInfo.status === "Closed" && (
                                        <button onClick={() => handlePayment(product)}>Pay Now</button>
                                    )}
                                </div>
                                {biddingItem && biddingItem._id === product._id && (
                                    <div>
                                        <input
                                            type="number"
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(parseFloat(e.target.value) || 0)}
                                            min={(product.auctionInfo.currentPrice || product.auctionInfo.basePrice) + 1}
                                            step="1"
                                        />
                                        <button onClick={handlePlaceBid}>Place Bid</button>
                                        <button onClick={() => setBiddingItem(null)}>Cancel</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Categories;