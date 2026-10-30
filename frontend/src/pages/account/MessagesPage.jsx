import { useEffect, useRef, useState } from 'react';
import { Box, Button, IconButton, List, ListItemButton, ListItemText, Paper, Stack, TextField, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SectionHeader from '../../components/common/SectionHeader';
import DesignIcon from '../../components/common/DesignIcon';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
export default function MessagesPage({
  id
}) {
  const {
    data,
    setData
  } = useMarketplace();
  const [message, setMessage] = useState('');
  const thread = data.messages.find(item => item.id === id) || data.messages[0];
  const end = useRef(null);
  useEffect(() => {
    end.current?.scrollIntoView({
      block: 'nearest'
    });
  }, [thread?.id, thread?.messages.length]);
  const send = event => {
    event.preventDefault();
    if (!message.trim()) return;
    const entry = {
      id: crypto.randomUUID(),
      incoming: false,
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
  return <><SectionHeader title="Mensajes" description="Consulta tus conversaciones antes y después de la compra." /><Box sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        lg: 'minmax(200px, 0.8fr) minmax(0, 1.2fr)'
      },
      gap: 3
    }}>
    <Paper variant="outlined" sx={{
        alignSelf: 'start',
        maxHeight: {
          xs: 180,
          lg: 650
        },
        overflowY: 'auto'
      }}><List>{data.messages.map(item => <ListItemButton selected={item.id === thread?.id} key={item.id} onClick={() => {
            setMessage('');
            navigate(`/mensajes/${item.id}`);
          }}><ListItemText primary={item.seller} secondary={item.context} slotProps={{
              primary: {
                fontWeight: 800
              }
            }} /></ListItemButton>)}</List></Paper>
    {thread ? <Box sx={{
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
            }}>{thread.seller}</Typography><Typography sx={{
              fontSize: 12
            }}>{thread.context}</Typography></Box></Stack>
      <Stack role="log" aria-label={`Conversación con ${thread.seller}`} aria-live="polite" spacing={2} sx={{
          p: 2.5,
          flex: 1,
          overflowY: 'auto'
        }}>{thread.messages.map(item => <Box key={item.id} sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
            maxWidth: '85%',
            alignSelf: item.incoming ? 'flex-start' : 'flex-end',
            minWidth: 120
          }}><Typography sx={{
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              fontSize: 14
            }}>{item.text}</Typography><Typography sx={{
              mt: 1,
              fontSize: 11,
              textAlign: 'right',
              color: 'text.secondary'
            }}>{item.time}</Typography></Box>)}<div ref={end} /></Stack>
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
    </Box> : <Box><Typography>No hay conversaciones.</Typography><Button onClick={() => navigate('/productos')}>Explorar productos</Button></Box>}
  </Box></>;
}
