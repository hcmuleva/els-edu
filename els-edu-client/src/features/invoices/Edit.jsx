import React, { useState } from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  DateInput,
  SelectInput,
  AutocompleteInput,
  ArrayInput,
  SimpleFormIterator,
  NumberInput,
  required,
  useNotify,
  useRedirect
} from 'react-admin';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';

const LineItemInput = () => {
  return (
    <Box className="border rounded-lg p-4 mb-4 bg-gray-50">
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextInput
            source="description"
            label="Description"
            validate={required()}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <NumberInput
            source="quantity"
            label="Quantity"
            validate={required()}
            min={1}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <NumberInput
            source="unitPrice"
            label="Unit Price"
            validate={required()}
            min={0}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <Typography variant="body2" className="mt-6">
            Total: Calculated
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export const InvoiceEdit = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  
  const [targetType, setTargetType] = useState('ORG');
  const [categoryType, setCategoryType] = useState('course');

  const transform = (data) => {
    // Calculate totals
    const subtotal = data.lineItems?.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0) || 0;
    
    const tax = subtotal * 0.18; // 18% GST for INR
    const discount = 0;
    const total = subtotal + tax - discount;

    return {
      ...data,
      subtotal,
      tax,
      discount,
      total,
      updatedAt: new Date().toISOString(),
    };
  };

  return (
    <div className="p-6">
      <Card>
        <CardContent>
          <Edit
            transform={transform}
            mutationOptions={{
              onSuccess: () => {
                notify('Invoice updated successfully', { type: 'success' });
                redirect('show', 'invoices');
              },
            }}
          >
            <SimpleForm>
              <Typography variant="h6" className="mb-4 font-semibold">
                Edit Invoice
              </Typography>
              
              {/* Basic Information */}
              <Box className="mb-6">
                <Typography variant="subtitle1" className="mb-3 font-medium">
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextInput
                      source="number"
                      label="Invoice Number"
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <DateInput
                      source="date"
                      label="Invoice Date"
                      validate={required()}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <DateInput
                      source="dueDate"
                      label="Due Date"
                      validate={required()}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Client Information */}
              <Box className="mb-6">
                <Typography variant="subtitle1" className="mb-3 font-medium">
                  Client Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <SelectInput
                      source="targetType"
                      label="Client Type"
                      choices={[
                        { id: 'ORG', name: 'Organization' },
                        { id: 'USER', name: 'User' },
                      ]}
                      validate={required()}
                      onChange={(e) => setTargetType(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextInput
                      source="targetName"
                      label="Client Name"
                      validate={required()}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Category Information */}
              <Box className="mb-6">
                <Typography variant="subtitle1" className="mb-3 font-medium">
                  Category Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <SelectInput
                      source="categoryType"
                      label="Category Type"
                      choices={[
                        { id: 'course', name: 'Course' },
                        { id: 'subject', name: 'Subject' },
                      ]}
                      validate={required()}
                      onChange={(e) => setCategoryType(e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextInput
                      source="categoryName"
                      label="Category Name"
                      validate={required()}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Status */}
              <Box className="mb-6">
                <SelectInput
                  source="status"
                  label="Status"
                  choices={[
                    { id: 'draft', name: 'Draft' },
                    { id: 'sent', name: 'Sent' },
                    { id: 'paid', name: 'Paid' },
                    { id: 'overdue', name: 'Overdue' },
                  ]}
                  validate={required()}
                  fullWidth
                  className="max-w-xs"
                />
              </Box>

              {/* Line Items */}
              <Box className="mb-6">
                <Typography variant="subtitle1" className="mb-3 font-medium">
                  Line Items
                </Typography>
                <ArrayInput source="lineItems" validate={required()}>
                  <SimpleFormIterator inline disableReordering>
                    <LineItemInput />
                  </SimpleFormIterator>
                </ArrayInput>
              </Box>

              {/* Notes */}
              <Box className="mb-6">
                <TextInput
                  source="notes"
                  label="Notes"
                  multiline
                  rows={3}
                  fullWidth
                />
              </Box>
            </SimpleForm>
          </Edit>
        </CardContent>
      </Card>
    </div>
  );
};