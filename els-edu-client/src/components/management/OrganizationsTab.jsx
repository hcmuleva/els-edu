import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managementApi } from '../../services/managementApi';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const OrganizationsTab = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Fetch organizations
  const { data, isLoading, refetch } = useQuery(
    ['organizations', page + 1, rowsPerPage, search],
    () => managementApi.getOrganizations(page + 1, rowsPerPage, search),
    {
      keepPreviousData: true,
      refetchInterval: 30000
    }
  );

  // Create organization mutation
  const createOrgMutation = useMutation(
    managementApi.createOrganization,
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['organizations']);
        toast.success('Organization created successfully');
        setCreateDialogOpen(false);
        createFormik.resetForm();
      },
      onError: (error) => {
        toast.error('Failed to create organization');
        console.error(error);
      }
    }
  );

  // Update organization mutation
  const updateOrgMutation = useMutation(
    ({ id, data }) => managementApi.updateOrganization(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['organizations']);
        toast.success('Organization updated successfully');
        setEditDialogOpen(false);
        editFormik.resetForm();
      },
      onError: (error) => {
        toast.error('Failed to update organization');
        console.error(error);
      }
    }
  );

  // Delete organization mutation
  const deleteOrgMutation = useMutation(
    managementApi.deleteOrganization,
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['organizations']);
        toast.success('Organization deleted successfully');
        handleMenuClose();
      },
      onError: (error) => {
        toast.error('Failed to delete organization');
        console.error(error);
      }
    }
  );

  // Form validation schema
  const orgSchema = Yup.object().shape({
    org_name: Yup.string().required('Organization name is required'),
    contact_email: Yup.string().email('Invalid email').required('Email is required'),
    contact_phone: Yup.string().required('Phone number is required'),
    org_status: Yup.string().required('Status is required'),
  });

  // Create form
  const createFormik = useFormik({
    initialValues: {
      org_name: '',
      contact_email: '',
      contact_phone: '',
      org_status: 'ACTIVE',
      description: '',
    },
    validationSchema: orgSchema,
    onSubmit: (values) => {
      createOrgMutation.mutate(values);
    },
  });

  // Edit form
  const editFormik = useFormik({
    initialValues: {
      org_name: '',
      contact_email: '',
      contact_phone: '',
      org_status: 'ACTIVE',
      description: '',
    },
    validationSchema: orgSchema,
    onSubmit: (values) => {
      if (selectedOrg) {
        updateOrgMutation.mutate({
          id: selectedOrg.id,
          data: values
        });
      }
    },
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleMenuOpen = (event, org) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrg(org);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrg(null);
  };

  const handleEdit = () => {
    if (selectedOrg) {
      editFormik.setValues({
        org_name: selectedOrg.org_name || '',
        contact_email: selectedOrg.contact_email || '',
        contact_phone: selectedOrg.contact_phone || '',
        org_status: selectedOrg.org_status || 'ACTIVE',
        description: selectedOrg.description || '',
      });
      setEditDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleDelete = () => {
    if (selectedOrg && window.confirm('Are you sure you want to delete this organization?')) {
      deleteOrgMutation.mutate(selectedOrg.id);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const organizations = data?.data || [];
  const totalCount = data?.meta?.pagination?.total || 0;

  return (
    <Box>
      {/* Search and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder="Search organizations..."
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Organization
          </Button>
        </Box>
      </Box>

      {/* Organizations Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>Organization</TableCell>
              <TableCell>Contact Information</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <BusinessIcon sx={{ color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={500}>
                        {org.org_name}
                      </Typography>
                      {org.description && (
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                          {org.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box>
                    <Typography variant="body2">{org.contact_email}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {org.contact_phone}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Chip
                    label={org.org_status || 'ACTIVE'}
                    size="small"
                    color={org.org_status === 'ACTIVE' ? 'success' : 'default'}
                    variant="filled"
                  />
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>

                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, org)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Organization Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Organization</DialogTitle>
        <form onSubmit={createFormik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="org_name"
                  label="Organization Name"
                  value={createFormik.values.org_name}
                  onChange={createFormik.handleChange}
                  error={createFormik.touched.org_name && Boolean(createFormik.errors.org_name)}
                  helperText={createFormik.touched.org_name && createFormik.errors.org_name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="contact_email"
                  label="Email"
                  type="email"
                  value={createFormik.values.contact_email}
                  onChange={createFormik.handleChange}
                  error={createFormik.touched.contact_email && Boolean(createFormik.errors.contact_email)}
                  helperText={createFormik.touched.contact_email && createFormik.errors.contact_email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="contact_phone"
                  label="Phone"
                  value={createFormik.values.contact_phone}
                  onChange={createFormik.handleChange}
                  error={createFormik.touched.contact_phone && Boolean(createFormik.errors.contact_phone)}
                  helperText={createFormik.touched.contact_phone && createFormik.errors.contact_phone}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="description"
                  label="Description"
                  multiline
                  rows={3}
                  value={createFormik.values.description}
                  onChange={createFormik.handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createOrgMutation.isLoading}
            >
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Organization</DialogTitle>
        <form onSubmit={editFormik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="org_name"
                  label="Organization Name"
                  value={editFormik.values.org_name}
                  onChange={editFormik.handleChange}
                  error={editFormik.touched.org_name && Boolean(editFormik.errors.org_name)}
                  helperText={editFormik.touched.org_name && editFormik.errors.org_name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="contact_email"
                  label="Email"
                  type="email"
                  value={editFormik.values.contact_email}
                  onChange={editFormik.handleChange}
                  error={editFormik.touched.contact_email && Boolean(editFormik.errors.contact_email)}
                  helperText={editFormik.touched.contact_email && editFormik.errors.contact_email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="contact_phone"
                  label="Phone"
                  value={editFormik.values.contact_phone}
                  onChange={editFormik.handleChange}
                  error={editFormik.touched.contact_phone && Boolean(editFormik.errors.contact_phone)}
                  helperText={editFormik.touched.contact_phone && editFormik.errors.contact_phone}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="description"
                  label="Description"
                  multiline
                  rows={3}
                  value={editFormik.values.description}
                  onChange={editFormik.handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updateOrgMutation.isLoading}
            >
              Update
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default OrganizationsTab;