import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

function SearchResults() {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q");

    useEffect(() => {
        const fetchSearchResults = async () => {
            try {
                const response = await axios.get("/api/products");
                const allProducts = Array.isArray(response.data) ? response.data : [];
                const filtered = allProducts.filter((product) =>
                    product.name.toLowerCase().includes(query.toLowerCase()) ||
                    product.description.toLowerCase().includes(query.toLowerCase())
                );
                setProducts(filtered);
            } catch (error) {
                setError(error.response?.data?.message || "Failed to load search results.");
            }
        };
        if (query) fetchSearchResults();
    }, [query]);

    return (
        <div className="search-results-container" style={{ padding: "20px" }}>
            <h2>Search Results for "{query}"</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {products.length === 0 ? (
                <p>No products found.</p>
            ) : (
                <ul style={{ listStyleType: "none", padding: 0 }}>
                    {products.map((product) => (
                        <li key={product._id} style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
                            <h3>{product.name}</h3>
                            <p>{product.description}</p>
                            <p><strong>Price:</strong> ${product.price.toFixed(2)}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SearchResults;