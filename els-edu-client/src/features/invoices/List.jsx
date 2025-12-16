import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  NumberField,
  FunctionField,
  TopToolbar,
  CreateButton,
  ExportButton,
  FilterButton,
  useRecordContext,
  EditButton,
  ShowButton
} from 'react-admin';
import { Card } from '@mui/material';
import StatusChip from './StatusChip';
import { invoiceFilters } from './filters';
import { formatCurrency } from '../../utils/currency';
import { Box, Typography, Grid, Chip, Divider } from '@mui/material';

const ListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

const InvoiceExpand = () => {
  const record = useRecordContext();
  
  if (!record) return null;
  
  return (
    <Box sx={{ 
      p: 3, 
      bgcolor: 'grey.50', 
      borderLeft: 4, 
      borderColor: 'primary.main',
      mx: 1,
      borderRadius: 1
    }}>
      {/* Header with basic info and actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">CLIENT</Typography>
              <Typography variant="body1" fontWeight="medium">{record.org?.org_name || 'N/A'}</Typography>
              <Chip 
                label={record.invoice_type === 'ORG_INVOICE' ? 'Organization' : 'User'} 
                size="small" 
                variant="outlined"
                sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">CATEGORY</Typography>
              <Typography variant="body1" fontWeight="medium">{record.course?.name || 'N/A'}</Typography>
              <Chip 
                label={record.course?.category || 'N/A'} 
                size="small" 
                color="primary"
                variant="outlined"
                sx={{ mt: 0.5, fontSize: '0.7rem', height: 20 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">DUE DATE</Typography>
              <Typography variant="body1" fontWeight="medium">
                {record.due_date ? new Date(record.due_date).toLocaleDateString() : 'N/A'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <EditButton size="small" variant="outlined" />
              <ShowButton size="small" variant="outlined" />
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Line Items Table */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Line Items
          <Chip 
            label={`${record.invoice_items?.length || 0} items`} 
            size="small" 
            color="info" 
            sx={{ fontSize: '0.7rem', height: 18 }}
          />
        </Typography>
        
        <Box sx={{ 
          bgcolor: 'background.paper', 
          borderRadius: 1, 
          overflow: 'hidden',
          border: 1,
          borderColor: 'divider'
        }}>
          {/* Table Header */}
          <Box sx={{ 
            bgcolor: 'grey.100', 
            p: 1.5, 
            display: 'grid', 
            gridTemplateColumns: '1fr 80px 100px 100px',
            gap: 2,
            fontSize: '0.875rem',
            fontWeight: 'medium'
          }}>
            <Typography variant="caption" fontWeight="bold">DESCRIPTION</Typography>
            <Typography variant="caption" fontWeight="bold" textAlign="center">QTY</Typography>
            <Typography variant="caption" fontWeight="bold" textAlign="right">UNIT PRICE</Typography>
            <Typography variant="caption" fontWeight="bold" textAlign="right">TOTAL</Typography>
          </Box>
          
          {/* Table Body */}
          {record.invoice_items?.map((item, index) => (
            <Box key={index} sx={{ 
              p: 1.5, 
              display: 'grid', 
              gridTemplateColumns: '1fr 80px 100px 100px',
              gap: 2,
              borderBottom: index < record.invoice_items.length - 1 ? 1 : 0,
              borderColor: 'divider',
              '&:hover': { bgcolor: 'grey.25' }
            }}>
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {item.item_description || item.item_name}
              </Typography>
              <Typography variant="body2" textAlign="center" fontWeight="medium">
                {item.quantity}
              </Typography>
              <Typography variant="body2" textAlign="right">
                {formatCurrency(item.unit_price, record.currency)}
              </Typography>
              <Typography variant="body2" textAlign="right" fontWeight="bold" color="primary.main">
                {formatCurrency(item.line_total, record.currency)}
              </Typography>
            </Box>
          )) || (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No line items available
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Financial Summary */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Notes */}
        <Box sx={{ flex: 1, mr: 4 }}>
          {record.notes && (
            <>
              <Typography variant="subtitle2" gutterBottom>Notes</Typography>
              <Box sx={{ 
                bgcolor: 'background.paper', 
                p: 2, 
                borderRadius: 1, 
                border: 1, 
                borderColor: 'divider'
              }}>
                <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                  {record.notes}
                </Typography>
              </Box>
            </>
          )}
        </Box>
        
        {/* Financial Summary */}
        <Box sx={{ 
          minWidth: 280,
          bgcolor: 'background.paper', 
          p: 2, 
          borderRadius: 1,
          border: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="subtitle2" gutterBottom>Summary</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">
                {formatCurrency(record.subtotal, record.currency)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Tax (18%):</Typography>
              <Typography variant="body2">
                {formatCurrency(record.tax_amount, record.currency)}
              </Typography>
            </Box>
            {record.discount_amount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Discount:</Typography>
                <Typography variant="body2" color="success.main">
                  -{formatCurrency(record.discount_amount, record.currency)}
                </Typography>
              </Box>
            )}
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
              <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                {formatCurrency(record.total_amount, record.currency)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export const InvoicesList = () => (
  <div className="p-6">
    <Card className="overflow-hidden">
      <List
        filters={invoiceFilters}
        actions={<ListActions />}
        sort={{ field: 'createdAt', order: 'DESC' }}
        perPage={25}
      >
        <Datagrid
          expand={<InvoiceExpand />}
          rowClick={false}
          className="min-w-full"
        >
          <TextField source="invoice_number" label="Invoice #" />
          <DateField source="createdAt" label="Date" />
          <TextField source="org.org_name" label="Client" />
          <FunctionField
            label="Status"
            render={record => <StatusChip status={record.invoice_status} />}
          />
          <FunctionField
            label="Total"
            render={record => (
              <span className="font-semibold">
                {formatCurrency(record.total_amount, record.currency)}
              </span>
            )}
          />
        </Datagrid>
      </List>
    </Card>
  </div>
);