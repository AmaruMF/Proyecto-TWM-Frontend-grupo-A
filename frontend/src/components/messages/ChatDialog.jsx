import { useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DesignIcon from '../common/DesignIcon';
import useMarketplace from '../../hooks/useMarketplace';
import { isOwnMessage, isSystemMessage, messageRole, participantName, recipientName, roleLabel } from '../../utils/messages';
import { dateTimeLabel } from '../../utils/commerce';

export default function ChatDialog({ id, onClose }) {
  const { data, setData, session } = useMarketplace();
  const [message, setMessage] = useState('');
  const thread = data.messages.find(item => item.id === id);
  const role = session?.role || 'client';
  const recipient = thread ? recipientName(thread, role) : '';
  const end = useRef(null);
  useEffect(() => {
    end.current?.scrollIntoView({
      block: 'nearest'
    });
  }, [thread?.id, thread?.messages.length]);
  const send = event => {
    event.preventDefault();
    if (!thread || !message.trim()) return;
    const entry = {
      id: crypto.randomUUID(),
      senderRole: role,
      senderName: participantName(thread, role),
      incoming: role === 'seller',
      sentAt: new Date().toISOString(),
      text: message.trim(),
      time: new Intl.DateTimeFormat('es-CL', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date())
    };
    setData(current => ({
      ...current,
      messages: current.messages.map(item => item.id === thread.id ? {
        ...item,
        messages: [...item.messages, entry]
      } : item)
    }));
    setMessage('');
  };
  return <Dialog open={Boolean(thread)} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="chat-title">
    <DialogTitle id="chat-title">Conversación con {recipient}</DialogTitle>
    <DialogContent sx={{ p: { xs: 1, sm: 2 } }}>{thread && (<Box sx={{
        height: 650,
        maxHeight: {
          xs: '75dvh',
          lg: 650
        },
        bgcolor: 'secondary.light',
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
      <Stack direction="row" sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          p: 2,
          alignItems: "center",
          gap: 2
        }}><DesignIcon name="account" inverse /><Box><Typography sx={{
              fontWeight: 800
            }}>{recipient}</Typography><Typography sx={{
              fontSize: 12
            }}>{thread.context} · Estás escribiendo como {roleLabel(role).toLowerCase()}</Typography></Box></Stack>
      <Stack role="log" aria-label={`Conversación con ${recipient}`} aria-live="polite" spacing={2} sx={{
          p: 2.5,
          flex: 1,
          overflowY: 'auto'
        }}>{thread.messages.map(item => <Box key={item.id} sx={{
            p: 2,
            bgcolor: isOwnMessage(item, role) ? 'background.paper' : 'primary.light',
            borderRadius: 2,
            maxWidth: '85%',
            alignSelf: !messageRole(item) ? 'center' : isOwnMessage(item, role) ? 'flex-end' : 'flex-start',
            minWidth: 120
          }}><Typography sx={{ fontWeight: 800, fontSize: 12, mb: 0.5 }}>{!messageRole(item) ? 'Mensaje anterior · remitente no registrado' : `${isSystemMessage(item) ? 'Saludo inicial · ' : isOwnMessage(item, role) ? 'Tú · ' : ''}${roleLabel(messageRole(item))} · ${item.senderName || participantName(thread, messageRole(item))}`}</Typography><Typography sx={{
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              fontSize: 14
            }}>{item.text}</Typography><Typography sx={{
              mt: 1,
              fontSize: 11,
              textAlign: 'right',
              color: 'text.secondary'
            }}>{item.sentAt ? dateTimeLabel(item.sentAt) : item.time}</Typography></Box>)}<div ref={end} /></Stack>
      <Box component="form" onSubmit={send} sx={{
          p: 2,
          display: 'flex',
          gap: 1
        }}><TextField label="Escribe tu mensaje aquí" value={message} onChange={event => setMessage(event.target.value)} fullWidth slotProps={{
            htmlInput: {
              maxLength: 2000
            }
          }} /><IconButton aria-label="Enviar mensaje" type="submit" disabled={!message.trim()} sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}><SendIcon /></IconButton></Box>
    </Box>)}</DialogContent>
    <DialogActions><Button onClick={onClose}>Cerrar chat</Button></DialogActions>
  </Dialog>;
}
