import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useSocket from "../hooks/useSocket";
import axios from "axios";
import {
    Container,
    Typography,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    Paper,
    Box,
    CircularProgress,
    Alert,
  } from "@mui/material";

const apiUrl = import.meta.env.VITE_BACKEND_URL;
const userId = String(localStorage.getItem('userId'));
const username = localStorage.getItem('username');

export default function Rooms() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const socket = useSocket(apiUrl);
    const navigate = useNavigate();
    const [createRoomName, setRoomName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const fetchRooms = async () => {
        try {
            const response = await axios.get(`${apiUrl}/api/room/getRooms`, {
                headers: {
                    Authorization: `${localStorage.getItem('token')}`
                }
            });
            // Ensure rooms is always an array
            setRooms(Array.isArray(response.data.rooms) ? response.data.rooms : []);
        } catch (err) {
            console.error("Error fetching rooms:", err);
            setError("Failed to fetch rooms");
            setRooms([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();

        if (socket) {
            
            socket.on('newRoomCreated', (newRoom) => {
                    setRooms(prevRooms => [...prevRooms, newRoom]);
            });
        }

        return () => {
            if (socket) {
                    socket.off('newRoomCreated');
            }
        };
    }, [socket]);

    const handleJoinRoom = (roomId) => {
        if (!socket || !roomId) return;

        socket.emit("joinRoom", {
            roomId,
            userId,
            username,
        });
        
        setRooms((prevRooms) =>
            prevRooms.map((room) =>
                room?._id === roomId 
                    ? { ...room, users: [...(room.users || []), userId] } 
                    : room
            )
        );
    };

    const handleViewRoom = (roomId) => {
        if (!roomId) return;
        navigate(`/chat/${roomId}`);
    };

    const handleRoomCreation = async (event) => {
        event.preventDefault();
        
        if (!createRoomName?.trim()) {
            setError("Room name cannot be empty");
            return;
        }

        setIsCreating(true);
        
        try {
            const roomBody = {
                name: createRoomName,
                users: userId
            };

            const response = await axios.post(
                `${apiUrl}/api/room/createRoom`,
                roomBody,
                {
                    headers: {
                        Authorization: `${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data) {
                const newRoom = response.data[0];
                // Emit a socket event to notify all clients about the new room
                socket.emit('createRoom', newRoom);
                setRoomName('');
                setError('');
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            console.error("Error creating room:", err);
            setError("Failed to create room");
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) {
        return (
            <div>
                <div></div>
            </div>
        );
    }

    return (
        <Container maxWidth="md">
            <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4 }}>
                Available Rooms
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Box component="form" onSubmit={handleRoomCreation} sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Enter room name"
                        value={createRoomName}
                        onChange={(e) => setRoomName(e.target.value)}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isCreating}
                    >
                        {isCreating ? 'Creating...' : 'Create Room'}
                    </Button>
                </Box>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <List>
                    {Array.isArray(rooms) && rooms.length > 0 ? (
                        rooms.map((room) => (
                            room && room._id ? (
                                <ListItem
                                    key={room._id}
                                    secondaryAction={
                                        Array.isArray(room.users) && room.users.includes(userId) ? (
                                            <Button
                                                variant="outlined"
                                                onClick={() => handleViewRoom(room._id)}
                                            >
                                                View
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="contained"
                                                onClick={() => handleJoinRoom(room._id)}
                                            >
                                                Join
                                            </Button>
                                        )
                                    }
                                >
                                    <ListItemText primary={room.name || 'Unnamed Room'} />
                                </ListItem>
                            ) : null
                        ))
                    ) : (
                        <Typography variant="body1">No Rooms Available</Typography>
                    )}
                </List>
            )}
        </Container>
    );
}