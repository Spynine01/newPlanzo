import React, { useState } from "react";
import { Container, TextField, Button, Typography, Box } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function SuperAdminLogin() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // For redirecting

  const handleLogin = async () => {
    if (!user || !password) {
      setError("Both fields are required.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:8000/api/superadmin", {
        user,
        password,
      });

      if (response.data.success) {
        localStorage.setItem("superadmin", response.data.user); // Store session manually
        navigate("/dashboard"); // Redirect after login
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Error logging in.");
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 10, p: 3, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Super Admin Login
        </Typography>

        {error && <Typography color="error">{error}</Typography>}

        <TextField
          fullWidth
          label="User"
          variant="outlined"
          margin="normal"
          value={user}
          onChange={(e) => setUser(e.target.value)}
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

export default SuperAdminLogin;
