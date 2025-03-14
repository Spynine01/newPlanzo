import React, { useState } from "react";
import { Container, TextField, Button, Typography, Box } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Checkbox from "@mui/material/Checkbox";

function MainUserRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState({
    Comedy: false,
    Sports: false,
    Music: false,
  });

  //Comedy, Sports, Music

  const handleChange = (event) => {
    setState({
      ...state,
      [event.target.name]: event.target.checked,
    });
  };

  const { Comedy, Sports, Music } = state;
  const error = [Comedy, Sports, Music].filter((v) => v).length < 1;

  function registerUser() {
    // Registration logic goes here
    console.log("Register button clicked!");
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 10, p: 3, boxShadow: 3, borderRadius: 2 }}>
        <Typography variant="h5" align="center" gutterBottom>
          User Login
        </Typography>

        {/* {error && <Typography color="error">Please select at least one option</Typography>} this is an error for not selecting */}

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
        
        <br />

    <Typography variant="h5" align="center" gutterBottom sx={{ mt: 4 }}>
          Preferences
        </Typography>

        <FormControl required error={error} component="fieldset" sx={{ m: 0.5 }} variant="standard">
          {/* <FormLabel component="legend">Choose at least one preference</FormLabel> */}
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={Comedy} onChange={handleChange} name="Comedy" />}
              label="Comedy"
            />
            <FormControlLabel
              control={<Checkbox checked={Sports} onChange={handleChange} name="Sports" />}
              label="Sports"
            />
            <FormControlLabel
              control={<Checkbox checked={Music} onChange={handleChange} name="Music" />}
              label="Music"
            />
          </FormGroup>
          <FormHelperText>Choose at least one preference</FormHelperText>
        </FormControl>

        <Button fullWidth variant="contained" color="primary" sx={{ mt: 2 }} onClick={registerUser}>
          Register
        </Button>
      </Box>
    </Container>
  );
}

export default MainUserRegister;
