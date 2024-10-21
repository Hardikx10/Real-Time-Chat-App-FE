import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import axios from 'axios';
import { Container, Paper, TextField, Button, Typography, Box, Link } from '@mui/material';

const apiUrl = import.meta.env.VITE_BACKEND_URL;

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post(`${apiUrl}/api/auth/login`, {
                username: username,
                password: password
            });
            
            const { token, userId } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);
            localStorage.setItem('username', response.data.username);
            window.location.href = '/rooms';
        } catch (error) {
            console.error("Login failed:", error);
            
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Login
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        label="Username"
                        variant="outlined"
                        margin="normal"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
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
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Login
                    </Button>
                </Box>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="body2">
                         New User?{' '}
                        <Link component={RouterLink} to="/register">
                            Register
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}