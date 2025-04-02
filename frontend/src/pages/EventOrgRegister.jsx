import { useState } from "react";
import { Container, Box, Typography, TextField, Button } from "@mui/material";
import axios from "axios";

function EventOrgRegister() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [pdfFile, setPdfFile] = useState(null);
    const [error, setError] = useState("");

    // Handle text input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle file selection
    const handleFileChange = (e) => {
        setPdfFile(e.target.files[0]); // Store selected file
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Clear previous error

        // Ensure a file is selected
        if (!pdfFile) {
            setError("Please upload a PDF file.");
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("name", formData.name);
            formDataToSend.append("email", formData.email);
            formDataToSend.append("password", formData.password);
            formDataToSend.append("pdf_file", pdfFile); // Attach file

            const response = await axios.post(
                "http://localhost:8000/api/eventOrgRegister",
                formDataToSend,
                {
                    headers: { "Content-Type": "multipart/form-data" }, // Important for file upload
                }
            );

            console.log("Event Organizer Created:", response.data);
            alert("Organizer added successfully!");
        } catch (error) {
            setError("Failed to register. Please try again.");
            console.error("Error adding organizer:", error);
        }
    };

    return (
        <Container maxWidth="xs">
            <Box sx={{ mt: 10, p: 3, boxShadow: 3, borderRadius: 2 }}>
                <Typography variant="h5" align="center" gutterBottom>
                    Event Organizer Registration
                </Typography>

                {error && <Typography color="error">{error}</Typography>}

                <TextField
                    fullWidth
                    label="Name"
                    variant="outlined"
                    margin="normal"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />

                <TextField
                    fullWidth
                    label="Email"
                    variant="outlined"
                    margin="normal"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    variant="outlined"
                    margin="normal"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                {/* File Upload Input */}
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    style={{ marginTop: "10px" }}
                />

                <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={handleSubmit}
                >
                    Register
                </Button>
            </Box>
        </Container>
    );
}

export default EventOrgRegister;
