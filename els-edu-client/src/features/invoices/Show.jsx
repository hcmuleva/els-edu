import React from 'react';
import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  FunctionField,
  TopToolbar,
  EditButton,
  DeleteButton
} from 'react-admin';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Button,
  Divider
} from '@mui/material';
import { Print, Download } from '@mui/icons-material';
import StatusChip from './StatusChip';
import LineItemsTable from './LineItemsTable';
import { formatCurrency } from '../../utils/currency';

const ShowActions = () => (
  <TopToolbar>
    <EditButton />
    <DeleteButton />
  </TopToolbar>
);

const InvoiceActions = ({ record }) => (
  <Box className="flex gap-2 mt-4">
    <Button
      variant="outlined"
      startIcon={<Print />}
      onClick={() => window.print()}
      className="print:hidden"
    >
      Print
    </Button>
    <Button
      variant="outlined"
      startIcon={<Download />}
      onClick={() => {
        const dataStr = JSON.stringify(record, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${record.number}.json`;
        link.click();
      }}
      className="print:hidden"
    >
      Download
    </Button>
  </Box>
);

export const InvoiceShow = () => (
  <Show actions={<ShowActions />}>
    <SimpleShowLayout>
      <FunctionField
        render={record => (
          <div className="space-y-6">
            {/* Header */}
            <Card className="mb-6">
              <CardContent>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Typography variant="h4" className="font-bold">
                      {record.number}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" className="mt-1">
                      Invoice Date: {new Date(record.date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Due Date: {new Date(record.dueDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6} className="text-right">
                    <StatusChip status={record.status} />
                    <Typography variant="h5" className="font-bold mt-2">
                      {formatCurrency(record.total, record.currency)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Billing Information */}
            <Card>
              <CardContent>
                <Typography variant="h6" className="font-semibold mb-3">
                  Billing Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" className="font-medium">
                      Bill To:
                    </Typography>
                    <Typography variant="body1" className="mt-1">
                      {record.targetName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {record.targetType}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" className="font-medium">
                      Category:
                    </Typography>
                    <Typography variant="body1" className="mt-1">
                      {record.categoryName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {record.categoryType}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardContent>
                <Typography variant="h6" className="font-semibold mb-3">
                  Line Items
                </Typography>
                <LineItemsTable 
                  lineItems={record.lineItems} 
                  currency={record.currency}
                />
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardContent>
                <Typography variant="h6" className="font-semibold mb-3">
                  Summary
                </Typography>
                <Grid container spacing={2} className="max-w-md ml-auto">
                  <Grid item xs={6}>
                    <Typography>Subtotal:</Typography>
                  </Grid>
                  <Grid item xs={6} className="text-right">
                    <Typography>{formatCurrency(record.subtotal, record.currency)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>Tax:</Typography>
                  </Grid>
                  <Grid item xs={6} className="text-right">
                    <Typography>{formatCurrency(record.tax, record.currency)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>Discount:</Typography>
                  </Grid>
                  <Grid item xs={6} className="text-right">
                    <Typography>{formatCurrency(record.discount, record.currency)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider className="my-2" />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h6" className="font-bold">
                      Total:
                    </Typography>
                  </Grid>
                  <Grid item xs={6} className="text-right">
                    <Typography variant="h6" className="font-bold">
                      {formatCurrency(record.total, record.currency)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Notes */}
            {record.notes && (
              <Card>
                <CardContent>
                  <Typography variant="h6" className="font-semibold mb-2">
                    Notes
                  </Typography>
                  <Typography variant="body1">
                    {record.notes}
                  </Typography>
                </CardContent>
              </Card>
            )}

            <InvoiceActions record={record} />
          </div>
        )}
      />
    </SimpleShowLayout>
  </Show>
);