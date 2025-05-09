import React, { useState } from "react";
import { Container, TextField, Button, Typography, Box } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function EventOrgLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // For redirecting

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Both fields are required.");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/eventorg", {
        email,
        password,
      });

      if (response.data.success) {
        // Store token and user role
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userRole", "organizer");
        localStorage.setItem("eventorg", response.data.email);
        navigate("/eventDashboard");
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error logging in.");
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 10, p: 3, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Event Organisor Login
        </Typography>

        {error && <Typography color="error">{error}</Typography>}

        <TextField
          fullWidth
          label="Email"
          variant="outlined"
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <TextField
          fullWidth
          label="Password"
          type="password"
          variant="outlined"
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          fullWidth
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={handleLogin}
        >
          Login
        </Button>
      </Box>
    </Container>
  );
}

export default EventOrgLogin;
