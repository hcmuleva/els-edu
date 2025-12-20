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
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Button,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managementApi } from '../../services/managementApi';
import { toast } from 'react-toastify';

const StudentsTab = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const queryClient = useQueryClient();

  // Fetch students
  const { data, isLoading, refetch } = useQuery(
    ['students', page + 1, rowsPerPage, search],
    () => managementApi.getUsersByRole('student', page + 1, rowsPerPage, search),
    {
      keepPreviousData: true,
      refetchInterval: 30000
    }
  );

  // Update user status mutation
  const updateStatusMutation = useMutation(
    ({ userId, status }) => managementApi.updateUserStatus(userId, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['students']);
        toast.success('Student status updated successfully');
        handleMenuClose();
      },
      onError: (error) => {
        toast.error('Failed to update student status');
        console.error(error);
      }
    }
  );

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

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleStatusUpdate = (status) => {
    if (selectedUser) {
      updateStatusMutation.mutate({
        userId: selectedUser.id,
        status: status
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      case 'BLOCKED': return 'default';
      default: return 'default';
    }
  };

  const getExperienceLevel = (level) => {
    switch (level) {
      case 'SCHOOL': return { label: 'School', color: 'primary' };
      case 'COLLEGE': return { label: 'College', color: 'info' };
      case 'PROFESSIONAL': return { label: 'Professional', color: 'secondary' };
      default: return { label: 'Not Set', color: 'default' };
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const students = data?.data || [];
  const totalCount = data?.meta?.pagination?.total || 0;

  return (
    <Box>
      {/* Search and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder="Search students..."
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
        </Box>
      </Box>

      {/* Students Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>Student</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Experience</TableCell>
              <TableCell>Organization</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => {
              const experienceLevel = getExperienceLevel(student.user_experience_level);

              return (
                <TableRow key={student.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={student.profile_photo?.url}
                        sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}
                      >
                        {student.first_name?.[0] || student.username?.[0] || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={500}>
                          {student.first_name && student.last_name
                            ? `${student.first_name} ${student.last_name}`
                            : student.username
                          }
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          @{student.username}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box>
                      <Typography variant="body2">{student.email}</Typography>
                      {student.mobile_number && (
                        <Typography variant="body2" color="text.secondary">
                          {student.mobile_number}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label="STUDENT"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={experienceLevel.label}
                      size="small"
                      color={experienceLevel.color}
                      variant="outlined"
                    />
                  </TableCell>

                  <TableCell>
                    {student.org ? (
                      <Typography variant="body2">
                        {student.org.org_name}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No Organization
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={student.user_status || 'PENDING'}
                      size="small"
                      color={getStatusColor(student.user_status)}
                      variant="filled"
                    />
                  </TableCell>

                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, student)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
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
        <MenuItem onClick={() => console.log('View Profile')}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          View Profile
        </MenuItem>
        {selectedUser?.user_status !== 'APPROVED' && (
          <MenuItem onClick={() => handleStatusUpdate('APPROVED')}>
            <ApproveIcon sx={{ mr: 1, fontSize: 20 }} color="success" />
            Approve
          </MenuItem>
        )}
        {selectedUser?.user_status !== 'REJECTED' && (
          <MenuItem onClick={() => handleStatusUpdate('REJECTED')}>
            <RejectIcon sx={{ mr: 1, fontSize: 20 }} color="error" />
            Reject
          </MenuItem>
        )}
        {selectedUser?.user_status !== 'BLOCKED' && (
          <MenuItem onClick={() => handleStatusUpdate('BLOCKED')}>
            <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
            Block
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default StudentsTab;