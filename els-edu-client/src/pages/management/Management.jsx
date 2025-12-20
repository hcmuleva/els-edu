import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import StudentsTab from '../../components/management/StudentsTab';
import TeachersTab from '../../components/management/TeachersTab';
import OrganizationsTab from '../../components/management/OrganizationsTab';
import CoursesTab from '../../components/management/CoursesTab';
import SubjectsTab from '../../components/management/SubjectsTab';
import CreateUserDialog from '../../components/management/CreateUserDialog';
import { managementApi } from '../../services/managementApi';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`management-tabpanel-${index}`}
    aria-labelledby={`management-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const Management = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreateUser = () => {
    setCreateDialogOpen(true);
  };

  const handleUserCreated = () => {
    setCreateDialogOpen(false);
    // Trigger refetch for active tab based on activeTab
  };

  const tabs = [
    { label: 'Students', icon: '👨‍🎓' },
    { label: 'Teachers', icon: '👨‍🏫' },
    { label: 'Organizations', icon: '🏢' },
    { label: 'Courses', icon: '📚' },
    { label: 'Subjects', icon: '📖' },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            ELS Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateUser}
              sx={{ borderRadius: 2 }}
            >
              Add User
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="management tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                py: 2,
                minHeight: 64,
                fontSize: '1rem',
                fontWeight: 500
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
                    {tab.label}
                  </Box>
                }
                id={`management-tab-${index}`}
                aria-controls={`management-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <StudentsTab />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <TeachersTab />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <OrganizationsTab />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <CoursesTab />
        </TabPanel>
        <TabPanel value={activeTab} index={4}>
          <SubjectsTab />
        </TabPanel>
      </Paper>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </Container>
  );
};

export default Management;