import { Box, Button, Stack, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import PagePanel from '../../components/common/PagePanel';
import EmptyState from '../../components/common/EmptyState';
import ChatDialog from '../../components/messages/ChatDialog';
import useMarketplace from '../../hooks/useMarketplace';
import { sentMessages, legacyMessages, recipientName, roleLabel } from '../../utils/messages';
import { dateTimeLabel } from '../../utils/commerce';
import { navigate } from '../../hooks/useNavigation';

export default function MessagesPage({ id, embedded = false }) {
  const { data, session, openConversation } = useMarketplace();
  const role = session?.role || 'client';
  const sent = [...sentMessages(data.messages, role), ...legacyMessages(data.messages)].sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || ''));
  return <>
    {embedded ? <Typography component="h2" variant="h3" sx={{ mb: 2 }}>Historial de mensajes enviados</Typography> : <SectionHeader title="Historial de mensajes enviados" description="Revisa tus mensajes y abre una conversación en una ventana emergente." />}
    <Typography variant="body2" sx={{ mb: 2 }}>Mensajes enviados como {roleLabel(role).toLowerCase()}.</Typography>
    <Stack spacing={2}>{sent.map(message => <PagePanel key={`${message.thread.id}-${message.id}`}>
      <Typography sx={{ fontWeight: 800 }}>{message.legacy ? 'Mensaje anterior · remitente no registrado' : `Para ${recipientName(message.thread, role)}`} · {message.thread.context}</Typography>
      <Typography sx={{ my: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.text}</Typography>
      <Typography variant="body2" color="text.secondary">{message.sentAt ? dateTimeLabel(message.sentAt) : message.time || 'Hora no registrada'}</Typography>
      <Button sx={{ mt: 1 }} variant="outlined" onClick={() => openConversation(message.thread.id)}>Abrir chat</Button>
    </PagePanel>)}</Stack>
    {!sent.length && <EmptyState title="Aún no has enviado mensajes" description="Abre una conversación para contactar al vendedor." />}
    {data.messages.length > 0 && <Box sx={{ mt: 3 }}><Typography component="h3" sx={{ fontWeight: 700, mb: 1 }}>Conversaciones</Typography><Stack spacing={1}>{data.messages.map(thread => <Button key={thread.id} variant="outlined" onClick={() => openConversation(thread.id)}>{recipientName(thread, role)} · {thread.context}</Button>)}</Stack></Box>}
    {id && <ChatDialog key={id} id={id} onClose={() => navigate('/mensajes')} />}
  </>;
}
