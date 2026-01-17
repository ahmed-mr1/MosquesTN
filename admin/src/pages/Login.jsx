import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';
import api from '../api';
import { theme } from '../theme';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Current dev stub requires password only for admin/moderator roles
      const { data } = await api.post('/auth/login', { 
        username, 
        password // Send password for admin/moderator validation
      });
      
      localStorage.setItem('token', data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: theme.background
    }}>
      <Paper sx={{ p: 4, width: 350 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: theme.primary }}>
          MosquesTN Admin
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Username (e.g. admin)"
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
            fullWidth 
            variant="contained" 
            type="submit" 
            sx={{ mt: 3, backgroundColor: theme.primary, '&:hover': { backgroundColor: '#0c4a2d' } }}
          >
            Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
