import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  IconButton,
  Autocomplete,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { managementApi } from '../../services/managementApi';
import { toast } from 'react-toastify';

const CreateUserDialog = ({ open, onClose, onUserCreated }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  const queryClient = useQueryClient();

  // Fetch organizations for selection
  const { data: orgsData } = useQuery(
    ['organizations-select'],
    () => managementApi.getOrganizations(1, 100),
    { enabled: open }
  );

  const organizations = orgsData?.data || [];

  // Create user mutation
  const createUserMutation = useMutation(
    managementApi.createEnhancedUser,
    {
      onSuccess: () => {
        toast.success('User created successfully');
        onUserCreated();
        handleClose();
      },
      onError: (error) => {
        toast.error('Failed to create user');
        console.error(error);
      }
    }
  );

  // Form validation schema
  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, 'Username must be at least 3 characters')
      .required('Username is required'),
    email: Yup.string()
      .email('Invalid email format')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Please confirm your password'),
    user_role: Yup.string()
      .required('User role is required'),
    first_name: Yup.string()
      .required('First name is required'),
    last_name: Yup.string()
      .required('Last name is required'),
    mobile_number: Yup.string()
      .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
      .required('Mobile number is required'),
  });

  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      user_role: '',
      first_name: '',
      last_name: '',
      mobile_number: '',
      user_experience_level: '',
      org: null,
      gender: '',
      user_status: 'APPROVED',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        let userData = { ...values };

        // Remove confirmPassword from submission
        delete userData.confirmPassword;

        // Handle organization selection
        if (userData.org) {
          userData.org = userData.org.id || userData.org;
        }

        // Handle profile image upload if present
        if (profileImage) {
          const uploadedImage = await managementApi.uploadFile(profileImage);
          userData.profile_photo = uploadedImage.id;
        }

        createUserMutation.mutate(userData);
      } catch (error) {
        toast.error('Failed to process user creation');
      }
    },
  });

  const steps = ['Basic Information', 'User Details', 'Profile & Organization'];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleClose = () => {
    setActiveStep(0);
    setProfileImage(null);
    setProfileImagePreview(null);
    formik.resetForm();
    onClose();
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const isStepValid = (step) => {
    switch (step) {
      case 0:
        return formik.values.username && formik.values.email && formik.values.password &&
          formik.values.confirmPassword && !formik.errors.username && !formik.errors.email &&
          !formik.errors.password && !formik.errors.confirmPassword;
      case 1:
        return formik.values.user_role && formik.values.first_name && formik.values.last_name &&
          formik.values.mobile_number && !formik.errors.first_name && !formik.errors.last_name &&
          !formik.errors.mobile_number;
      case 2:
        return true; // Optional fields
      default:
        return false;
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="username"
                label="Username"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.username && Boolean(formik.errors.username)}
                helperText={formik.touched.username && formik.errors.username}
                placeholder="Enter unique username"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="email"
                label="Email Address"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                placeholder="Enter email address"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="password"
                label="Password"
                type="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                placeholder="Min. 6 characters"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                placeholder="Repeat password"
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="first_name"
                label="First Name"
                value={formik.values.first_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.first_name && Boolean(formik.errors.first_name)}
                helperText={formik.touched.first_name && formik.errors.first_name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="last_name"
                label="Last Name"
                value={formik.values.last_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.last_name && Boolean(formik.errors.last_name)}
                helperText={formik.touched.last_name && formik.errors.last_name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="mobile_number"
                label="Mobile Number"
                value={formik.values.mobile_number}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.mobile_number && Boolean(formik.errors.mobile_number)}
                helperText={formik.touched.mobile_number && formik.errors.mobile_number}
                placeholder="10-digit mobile number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>User Role</InputLabel>
                <Select
                  name="user_role"
                  value={formik.values.user_role}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.user_role && Boolean(formik.errors.user_role)}
                >
                  <MenuItem value="STUDENT">Student</MenuItem>
                  <MenuItem value="TEACHER">Teacher</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="PARENT">Parent</MenuItem>
                </Select>
                {formik.touched.user_role && formik.errors.user_role && (
                  <FormHelperText error>{formik.errors.user_role}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Experience Level</InputLabel>
                <Select
                  name="user_experience_level"
                  value={formik.values.user_experience_level}
                  onChange={formik.handleChange}
                >
                  <MenuItem value="">Select Level</MenuItem>
                  <MenuItem value="SCHOOL">School</MenuItem>
                  <MenuItem value="COLLEGE">College</MenuItem>
                  <MenuItem value="PROFESSIONAL">Professional</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formik.values.gender}
                  onChange={formik.handleChange}
                >
                  <MenuItem value="">Select Gender</MenuItem>
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Profile & Organization
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  src={profileImagePreview}
                  sx={{ width: 80, height: 80, bgcolor: 'primary.light' }}
                >
                  <PersonIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-image-upload"
                    type="file"
                    onChange={handleImageChange}
                  />
                  <label htmlFor="profile-image-upload">
                    <IconButton color="primary" component="span">
                      <PhotoCameraIcon />
                    </IconButton>
                  </label>
                  <Typography variant="body2" color="text.secondary">
                    Upload profile picture (optional)
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={organizations}
                getOptionLabel={(option) => option.org_name || ''}
                value={formik.values.org}
                onChange={(event, newValue) => {
                  formik.setFieldValue('org', newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Organization (Optional)"
                    placeholder="Search and select organization"
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">Create New User</Typography>
        <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent sx={{ minHeight: 400 }}>
          {renderStepContent(activeStep)}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          {activeStep > 0 && (
            <Button onClick={handleBack}>Back</Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepValid(activeStep)}
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              variant="contained"
              disabled={createUserMutation.isLoading || !formik.isValid}
            >
              {createUserMutation.isLoading ? 'Creating...' : 'Create User'}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateUserDialog;