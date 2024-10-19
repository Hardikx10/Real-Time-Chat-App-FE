import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useSocket from "../hooks/useSocket";
import axios from "axios";
import { Users, Send, ArrowLeft } from "lucide-react";
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Container,
    Paper,
    List,
    ListItem,
    ListItemText,
    TextField,
    Button,
    Drawer,
    Avatar,
    Box,
    useTheme,
  } from "@mui/material";


const apiUrl = import.meta.env.VITE_BACKEND_URL;
const userId = String(localStorage.getItem('userId'));
const username = localStorage.getItem('username');



const ChatRoom = () => {
    const { roomId } = useParams();
    const socket = useSocket(apiUrl);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const navigate = useNavigate();
    const [roomData, setRoomData] = useState();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [showUsersList, setShowUsersList] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const theme=useTheme()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const checkRoomMembership = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/room/${roomId}`, {
                    headers: {
                        Authorization: `${localStorage.getItem('token')}`,
                    },
                });

                const room = response.data.room;
                setRoomData(room);
                
                if (room.users.includes(userId)) {
                    setIsAuthorized(true);
                    if (socket) {
                        socket.emit('joinRoom', {
                            roomId: room._id,
                            userId,
                            username
                        });
                        socket.emit('viewRoom', { roomId: room._id });
                    }
                } else {
                    setIsAuthorized(false);
                    navigate("/rooms");
                }
            } catch (error) {
                console.error("Error fetching room data:", error);
                navigate("/rooms");
            }
        };

        if (socket) {
            checkRoomMembership();
        }
        
        return () => {
            if (socket) {
                socket.emit('leaveRoom', { roomId });
            }
        };
    }, [navigate, roomId, socket]);

    useEffect(() => {
        if (!socket) return;

        socket.on('chatMessage', (messageData) => {
            setMessages(prevMessages => {
                const messageExists = prevMessages.some(msg => msg._id === messageData.msgId);
                if (messageExists) return prevMessages;
                
                return [...prevMessages, {
                    _id: messageData.msgId,
                    room: messageData.roomId,
                    user: { _id: messageData.userId, username: messageData.username },
                    message: messageData.message,
                    timestamp: messageData.timestamp
                }];
            });
        });

        socket.on('roomHistory', ({ messages: historyMessages }) => {
            setMessages(historyMessages);
        });

        socket.on('roomUsers', (users) => {
            setOnlineUsers(users);
        });

        socket.on('userTyping', ({ userId, username }) => {
            setTypingUsers(prev => new Set([...prev, username]));
        });

        socket.on('userStoppedTyping', ({ userId, username }) => {
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(username);
                return newSet;
            });
        });

        return () => {
            socket.off('chatMessage');
            socket.off('roomHistory');
            socket.off('roomUsers');
            socket.off('userTyping');
            socket.off('userStoppedTyping');
        };
    }, [socket]);

    const handleTyping = () => {
        if (socket) {
            socket.emit('typing', { roomId, userId, username });

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stopTyping', { roomId, userId, username });
            }, 1000);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const messageData = {
            roomId,
            userId,
            message: newMessage.trim(),
            username,
        };

        socket.emit('sendMessage', messageData);
        socket.emit('stopTyping', { roomId, userId, username });
        setNewMessage('');
    };

    if (!isAuthorized || !socket) {
        return (
            <div >
                Loading...
                <div />
            </div>
        );
    }

    return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'grey.100' }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/rooms')}>
            <ArrowLeft />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            {roomData?.name}
          </Typography>
          <IconButton color="inherit" onClick={() => setShowUsersList(!showUsersList)}>
            <Users />
            <Typography variant="caption" sx={{ ml: 1 }}>
              {onlineUsers.length}
            </Typography>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container sx={{ flexGrow: 1, overflow: 'auto', py: 2, display: 'flex', flexDirection: 'column' }}>
        <Paper elevation={3} sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: 'background.paper' }}>
          <List>
            {messages.map((msg) => (
              <ListItem
                key={msg._id}
                sx={{
                  display: 'flex',
                  justifyContent: msg.user._id === userId ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    maxWidth: '70%',
                    bgcolor: msg.user._id === userId ? 'primary.light' : 'grey.200',
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    {msg.user.username} • {new Date(msg.timestamp).toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.primary', wordBreak: 'break-word' }}>
                    {msg.message}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
          <div ref={messagesEndRef} />
        </Paper>
      </Container>

      {typingUsers.size > 0 && (
        <Typography variant="caption" sx={{ p: 1, color: 'text.secondary' }}>
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </Typography>
      )}

      <Paper component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type your message..."
            sx={{ mr: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={!newMessage.trim()}
            endIcon={<Send />}
          >
            Send
          </Button>
        </Box>
      </Paper>

      <Drawer
        anchor="right"
        open={showUsersList}
        onClose={() => setShowUsersList(false)}
      >
        <Box sx={{ width: 250, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Online Users ({onlineUsers.length})
          </Typography>
          <List>
            {onlineUsers.map((user) => (
              <ListItem key={user.userId}>
                <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>{user.username[0].toUpperCase()}</Avatar>
                <ListItemText primary={user.username} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default ChatRoom;