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
  School as SchoolIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { managementApi } from '../../services/managementApi';

const CoursesTab = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Fetch courses
  const { data, isLoading, refetch } = useQuery(
    ['courses', page + 1, rowsPerPage, search],
    () => managementApi.getCourses(page + 1, rowsPerPage, search),
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

  const handleMenuOpen = (event, course) => {
    setAnchorEl(event.currentTarget);
    setSelectedCourse(course);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCourse(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const courses = data?.data || [];
  const totalCount = data?.meta?.pagination?.total || 0;

  return (
    <Box>
      {/* Search and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder="Search courses..."
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
            onClick={() => console.log('Create course')}
          >
            Add Course
          </Button>
        </Box>
      </Box>

      {/* Courses Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>Course</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Organization</TableCell>
              <TableCell>Privacy</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SchoolIcon sx={{ color: 'info.main' }} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={500}>
                        {course.name}
                      </Typography>
                      {course.description && (
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 250 }}>
                          {course.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {course.category}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {course.subcategory}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  {course.organization ? (
                    <Typography variant="body2">
                      {course.organization.org_name}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No Organization
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  <Chip
                    label={course.privacy || 'PUBLIC'}
                    size="small"
                    color={course.privacy === 'PUBLIC' ? 'success' : 'default'}
                    variant="outlined"
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={course.condition || 'DRAFT'}
                    size="small"
                    color={course.condition === 'PUBLISH' ? 'success' : 'warning'}
                    variant="filled"
                  />
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>

                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, course)}
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
        <MenuItem onClick={() => console.log('Edit course')}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => console.log('Delete course')} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CoursesTab;