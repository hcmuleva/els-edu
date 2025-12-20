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
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  MenuBook as BookIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { managementApi } from '../../services/managementApi';

const SubjectsTab = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Fetch subjects
  const { data, isLoading, refetch } = useQuery(
    ['subjects', page + 1, rowsPerPage, search],
    () => managementApi.getSubjects(page + 1, rowsPerPage, search),
    {
      keepPreviousData: true,
      refetchInterval: 30000
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

  const handleMenuOpen = (event, subject) => {
    setAnchorEl(event.currentTarget);
    setSelectedSubject(subject);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSubject(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const subjects = data?.data || [];
  const totalCount = data?.meta?.pagination?.total || 0;

  return (
    <Box>
      {/* Search and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder="Search subjects..."
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
            onClick={() => console.log('Create subject')}
          >
            Add Subject
          </Button>
        </Box>
      </Box>

      {/* Subjects Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>Subject</TableCell>
              <TableCell>Courses</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <BookIcon sx={{ color: 'secondary.main' }} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={500}>
                        {subject.name}
                      </Typography>
                      {subject.description && (
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 250 }}>
                          {subject.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box>
                    {subject.courses && subject.courses.length > 0 ? (
                      <>
                        <Typography variant="body2" fontWeight={500}>
                          {subject.courses[0].name}
                        </Typography>
                        {subject.courses.length > 1 && (
                          <Typography variant="body2" color="text.secondary">
                            +{subject.courses.length - 1} more
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No courses assigned
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                <TableCell>
                  <Chip
                    label={subject.subject_type || 'GENERAL'}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={subject.status || 'ACTIVE'}
                    size="small"
                    color={subject.status === 'ACTIVE' ? 'success' : 'default'}
                    variant="filled"
                  />
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {new Date(subject.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>

                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, subject)}
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
        <MenuItem onClick={() => console.log('Edit subject')}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => console.log('Delete subject')} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SubjectsTab;