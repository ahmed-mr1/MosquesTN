import { useEffect, useState } from 'react';
import { 
  Box, Grid, Paper, Typography, Button, Table, TableBody, TableCell, 
  TableHead, TableRow, Chip, IconButton, AppBar, Toolbar, Dialog, DialogContent,
  Tab, Tabs, Container, Card, CardContent, CircularProgress, Avatar,
  Stack, ToggleButton, ToggleButtonGroup, Tooltip, Badge, Collapse, Alert
} from '@mui/material';
import { 
  CheckCircle, Cancel, Logout, Refresh, Image as ImageIcon, 
  Mosque, RateReview, Edit as EditIcon, History
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { theme } from '../theme';

// --- Styled Components & Helpers ---
const StatusChip = ({ status }) => {
  const colors = {
    pending_approval: 'warning',
    approved: 'success',
    rejected: 'error',
    pending_ai_review: 'info'
  };
  return <Chip label={status.replace('_', ' ')} color={colors[status] || 'default'} size="small" variant="outlined" />;
};

const SectionHeader = ({ title, icon }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 4 }}>
    {icon}
    <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold', color: theme.primary }}>
      {title}
    </Typography>
  </Box>
);

export default function Dashboard() {
  const [tab, setTab] = useState(0); // 0: Mosques, 1: Reviews, 2: Edits
  const [filter, setFilter] = useState('pending_approval'); // pending_approval, approved, rejected
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  // --- Data Fetching ---
  const loadData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      let params = { status: filter };

      // API Logic Map
      if (tab === 0) {
        // Mosques: The backend endpoint /suggestions/mosques/pending filters hardcoded by pending.
        // We need to support fetching history if filter != pending.
        // Assuming you might add a generic search endpoint later, 
        // for now we stick to pending or show empty if filter is history (until backend update).
        endpoint = '/suggestions/mosques/pending'; 
        if(filter !== 'pending_approval') {
            // Placeholder: Backend might not support listing rejected yet. 
            // We'll handle this gracefully.
            endpoint = null; 
        }
      } else if (tab === 1) {
        endpoint = '/moderation/reviews'; // Supports ?status=...
      } else if (tab === 2) {
        endpoint = '/moderation/edits'; // Need to verify if this exists
      }

      if (endpoint) {
        const res = await api.get(endpoint, { params });
        setData(res.data);
      } else {
        setData([]); // Clear data if not supported yet
      }
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      } else {
        console.error("Fetch error", e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [tab, filter]);

  // --- Actions ---
  const handleAction = async (id, action, type) => {
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;
    try {
       // Assuming standard URL pattern: /moderation/{type}/{id}/{action}
       // type: 'suggestions' (mosques), 'reviews', 'edits'
       let urlType = '';
       if (tab === 0) urlType = 'suggestions';
       else if (tab === 1) urlType = 'reviews';
       else urlType = 'edits';

       await api.post(`/moderation/${urlType}/${id}/${action}`);
       
       // Optimistic UI update
       setData(prev => prev.filter(item => item.id !== id));
       
    } catch (e) {
      alert('Operation failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // --- Renderers ---
  const renderMosqueTable = () => (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Mosque</TableCell>
          <TableCell>Location</TableCell>
          <TableCell>Image</TableCell>
          <TableCell>AI Decision</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id} hover>
            <TableCell>
              <Typography variant="subtitle2" fontWeight="bold">{row.arabic_name}</Typography>
              <Typography variant="body2" color="textSecondary">{row.type}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{row.governorate}, {row.city}</Typography>
            </TableCell>
            <TableCell>
              {row.image_url ? (
                <Avatar 
                  variant="rounded" 
                  src={row.image_url} 
                  sx={{ cursor: 'pointer', border: '1px solid #eee' }}
                  onClick={()=>setPreviewImage(row.image_url)}
                />
              ) : <Typography variant="caption" color="textSecondary">No Image</Typography>}
            </TableCell>
            <TableCell>
               <StatusChip status={row.status} />
            </TableCell>
            <TableCell align="right">
              {filter === 'pending_approval' && (
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Tooltip title="Approve">
                        <IconButton color="success" onClick={()=>handleAction(row.id, 'approve')}>
                        <CheckCircle />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                        <IconButton color="error" onClick={()=>handleAction(row.id, 'reject')}>
                        <Cancel />
                        </IconButton>
                    </Tooltip>
                  </Stack>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderReviewTable = () => (
    <Table>
       <TableHead>
        <TableRow>
          <TableCell>Review Content</TableCell>
          <TableCell>Rating</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id} hover>
            <TableCell sx={{ maxWidth: 300 }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>"{row.comment}"</Typography>
            </TableCell>
            <TableCell>
               <Badge badgeContent={row.rating} color="primary" overlap="circular" />
            </TableCell>
            <TableCell><StatusChip status={row.status} /></TableCell>
            <TableCell align="right">
               {filter === 'pending_approval' && (
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <IconButton color="success" onClick={()=>handleAction(row.id, 'approve')}><CheckCircle /></IconButton>
                    <IconButton color="error" onClick={()=>handleAction(row.id, 'reject')}><Cancel /></IconButton>
                </Stack>
               )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.background }}>
      {/* Header */}
      <AppBar position="sticky" elevation={0} sx={{ backgroundColor: '#fff', color: theme.primary, borderBottom: '1px solid #ddd' }}>
        <Toolbar>
          <Mosque sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: '900', letterSpacing: -0.5 }}>
            MosquesTN <span style={{ fontWeight: 400, fontSize: '0.8em' }}>Admin Control</span>
          </Typography>
          <Button startIcon={<Refresh />} onClick={loadData} sx={{ mr: 2 }}>Refresh</Button>
          <Button startIcon={<Logout />} color="error" onClick={logout}>Logout</Button>
        </Toolbar>
        
        {/* Tabs */}
        <Container maxWidth="xl">
            <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="primary" indicatorColor="primary">
                <Tab icon={<Mosque />} label="Mosques" iconPosition='start' />
                <Tab icon={<RateReview />} label="Reviews" iconPosition='start' />
                {/* <Tab icon={<EditIcon />} label="Edits" iconPosition='start' /> */}
            </Tabs>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        
        {/* Filter Bar */}
        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>FILTER STATUS</Typography>
                <ToggleButtonGroup
                    color="primary"
                    value={filter}
                    exclusive
                    onChange={(e, v) => { if(v) setFilter(v); }}
                    size="small"
                >
                    <ToggleButton value="pending_approval">Pending</ToggleButton>
                    <ToggleButton value="approved">Approved</ToggleButton>
                    <ToggleButton value="rejected">Rejected</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h4" fontWeight="bold" color="primary">{data.length}</Typography>
                <Typography variant="caption" color="textSecondary">ITEMS FOUND</Typography>
            </Box>
        </Paper>

        {/* Dynamic Warning for not implemented history */}
        {(tab === 0 && filter !== 'pending_approval') && (
            <Alert severity="warning" sx={{ mb: 2 }}>
                Displaying history for Mosques is currently limited. 
            </Alert>
        )}

        {/* Data Table */}
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {loading ? (
                <Box sx={{ p: 5, textAlign: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                  {data.length === 0 && (
                      <Box sx={{ p: 5, textAlign: 'center', color: 'text.secondary' }}>
                          <History sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                          <Typography>No items found for this filter.</Typography>
                      </Box>
                  )}
                  {data.length > 0 && tab === 0 && renderMosqueTable()}
                  {data.length > 0 && tab === 1 && renderReviewTable()}
                </>
            )}
        </Paper>
      </Container>
      
      {/* Universal Image Preview */}
      <Dialog open={!!previewImage} onClose={()=>setPreviewImage(null)} maxWidth="lg">
        <DialogContent sx={{ p: 0, backgroundColor: '#000' }}>
            <img src={previewImage} style={{ width: '100%', display: 'block' }} alt="Proof" />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
