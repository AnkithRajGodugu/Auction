import React, { useState, useEffect } from "react";
import axios from "axios";
import "../item/Products.css";

function Products() {
    const [products, setProducts] = useState([]);
    const [newProduct, setNewProduct] = useState({
        name: "",
        description: "",
        price: "",
        sellerInfo: { username: "", contactNumber: "", email: "" },
        startingDate: "",
        endingDate: "",
        image: null,
    });
    const [editProduct, setEditProduct] = useState(null);
    const [editData, setEditData] = useState({});
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    useEffect(() => {
        const fetchProducts = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Please log in to view your products.");
                return;
            }

            try {
                const response = await axios.get(`${API_URL}/api/user-products`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProducts(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                setError(error.response?.data?.message || "Failed to load your products.");
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user")) || {};
        setNewProduct((prev) => ({
            ...prev,
            sellerInfo: {
                username: user.name || "",
                contactNumber: user.contactNumber || "",
                email: user.email || "",
            },
        }));
    }, []);

    const handleNewInputChange = (e) => {
        const { name, value } = e.target;
        setNewProduct({ ...newProduct, [name]: value });
    };

    const handleNewImageChange = (e) => {
        setNewProduct({ ...newProduct, image: e.target.files[0] });
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditData((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditImageChange = (e) => {
        setEditData((prev) => ({ ...prev, image: e.target.files[0] }));
    };

    const addProduct = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Please log in to add a product.");
            return;
        }

        const formData = new FormData();
        for (const key in newProduct) {
            if (key === "sellerInfo") {
                formData.append(key, JSON.stringify(newProduct[key]));
            } else if (key === "image" && newProduct[key]) {
                formData.append(key, newProduct[key]);
            } else {
                formData.append(key, newProduct[key]);
            }
        }

        try {
            const response = await axios.post(`${API_URL}/api/products`, formData, {
                headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
            });
            setProducts([...products, response.data]);
            setNewProduct({
                name: "",
                description: "",
                price: "",
                sellerInfo: newProduct.sellerInfo,
                startingDate: "",
                endingDate: "",
                image: null,
            });
            setSuccessMessage("Product added successfully!");
            setError(null);
        } catch (error) {
            setError(error.response?.data?.message || "Failed to add product.");
        }
    };

    const deleteProduct = async (id) => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Please log in to delete a product.");
            return;
        }

        try {
            await axios.delete(`${API_URL}/api/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProducts(products.filter((p) => p._id !== id));
            setSuccessMessage("Product deleted successfully!");
            setError(null);
        } catch (error) {
            setError(error.response?.data?.message || "Failed to delete product.");
        }
    };

    const updateProduct = async (id) => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Please log in to update a product.");
            return;
        }

        const formData = new FormData();
        for (const key in editData) {
            if (key === "sellerInfo" && editData[key]) {
                formData.append(key, JSON.stringify(editData[key]));
            } else if (key === "image" && editData[key]) {
                formData.append(key, editData[key]);
            } else if (editData[key] !== undefined) {
                formData.append(key, editData[key]);
            }
        }

        try {
            const response = await axios.put(`${API_URL}/api/products/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
            });
            setProducts(products.map((p) => (p._id === id ? response.data : p)));
            setEditProduct(null);
            setEditData({});
            setSuccessMessage("Product updated successfully!");
            setError(null);
        } catch (error) {
            setError(error.response?.data?.message || "Failed to update product.");
        }
    };

    const startEditing = (product) => {
        setEditProduct(product);
        setEditData({
            name: product.name,
            description: product.description,
            price: product.price,
            startingDate: new Date(product.startingDate).toISOString().split("T")[0],
            endingDate: new Date(product.endingDate).toISOString().split("T")[0],
            sellerInfo: product.sellerInfo,
        });
    };

    return (
        <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "800px", margin: "0 auto", padding: "20px", color: "rgb(20, 91, 91)" }}>
            <h2 className="header">Your Products</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
            <div>
                <h3 className="header2">Add New Product</h3>
                <div style={{ marginBottom: "20px" }}>
                    <input type="text" name="name" placeholder="Name" value={newProduct.name} onChange={handleNewInputChange} style={{ marginRight: "10px", padding: "5px", width: "150px" }} />
                    <input type="text" name="description" placeholder="Description" value={newProduct.description} onChange={handleNewInputChange} style={{ marginRight: "10px", padding: "5px", width: "150px" }} />
                    <input type="number" name="price" placeholder="Price" value={newProduct.price} onChange={handleNewInputChange} style={{ marginRight: "10px", padding: "5px", width: "100px" }} />
                    <input
                        type="date"
                        name="startingDate"
                        value={newProduct.startingDate}
                        onChange={handleNewInputChange}
                        style={{ marginRight: "10px", padding: "5px", width: "120px" }}
                    />
                    <input
                        type="date"
                        name="endingDate"
                        value={newProduct.endingDate}
                        onChange={handleNewInputChange}
                        style={{ marginRight: "10px", padding: "5px", width: "120px" }}
                    />
                    <input type="file" onChange={handleNewImageChange} style={{ marginRight: "10px", padding: "5px" }} />
                    <button className="button" onClick={addProduct} style={{ padding: "5px 10px" }}>Add Product</button>
                </div>
            </div>
            <div>
                <h3 className="header3">Your Products List</h3>
                {products.length === 0 && !error && <p>No products found.</p>}
                <ul style={{ listStyleType: "none", padding: 0 }}>
                    {products.map((product) => (
                        <li key={product._id} style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px", borderRadius: "5px", boxShadow: "0 0 5px rgba(0, 0, 0, 0.1)" }}>
                            <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                                {product.image && <img src={`${product.image}`} alt={product.name} style={{ marginRight: "15px", width: "100px", height: "auto", borderRadius: "5px" }} />}
                                <div>
                                    <strong className="inside">Name:</strong> {product.name}<br />
                                    <strong className="inside">Description:</strong> {product.description}<br />
                                    <strong className="inside">Price:</strong> ${product.price}<br />
                                    <strong className="inside">Starting Date:</strong> {new Date(product.startingDate).toLocaleDateString()}<br />
                                    <strong className="inside">Ending Date:</strong> {new Date(product.endingDate).toLocaleDateString()}<br />
                                    <strong className="inside">Seller Info:</strong><br />
                                    {product.sellerInfo ? (
                                        <>
                                            Username: {product.sellerInfo.username}<br />
                                            Contact Number: {product.sellerInfo.contactNumber}<br />
                                            Email: {product.sellerInfo.email}
                                        </>
                                    ) : (
                                        "Seller info not available"
                                    )}
                                </div>
                            </div>
                            <div>
                                {editProduct && editProduct._id === product._id ? (
                                    <>
                                        <input
                                            type="text"
                                            name="name"
                                            value={editData.name || ""}
                                            onChange={handleEditInputChange}
                                            style={{ marginRight: "10px", padding: "5px", width: "150px" }}
                                        />
                                        <input
                                            type="text"
                                            name="description"
                                            value={editData.description || ""}
                                            onChange={handleEditInputChange}
                                            style={{ marginRight: "10px", padding: "5px", width: "150px" }}
                                        />
                                        <input
                                            type="number"
                                            name="price"
                                            value={editData.price || ""}
                                            onChange={handleEditInputChange}
                                            style={{ marginRight: "10px", padding: "5px", width: "100px" }}
                                        />
                                        <input
                                            type="date"
                                            name="startingDate"
                                            value={editData.startingDate || ""}
                                            onChange={handleEditInputChange}
                                            style={{ marginRight: "10px", padding: "5px", width: "120px" }}
                                        />
                                        <input
                                            type="date"
                                            name="endingDate"
                                            value={editData.endingDate || ""}
                                            onChange={handleEditInputChange}
                                            style={{ marginRight: "10px", padding: "5px", width: "120px" }}
                                        />
                                        <input type="file" onChange={handleEditImageChange} style={{ marginRight: "10px", padding: "5px" }} />
                                        <button onClick={() => updateProduct(product._id)} style={{ padding: "5px 10px", marginRight: "10px" }}>Update</button>
                                        <button onClick={() => setEditProduct(null)} style={{ padding: "5px 10px" }}>Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => startEditing(product)} style={{ padding: "5px 10px", marginRight: "10px" }}>Edit</button>
                                        <button onClick={() => deleteProduct(product._id)} style={{ padding: "5px 10px" }}>Delete</button>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default Products;